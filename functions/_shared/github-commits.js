// The github_commits sprint metric: a project's figure is its commits in the window, read from
// the public repo named by projects.url. Rules and test cases in programs/SPRINTS-PLAN.md.
//
// Pages has no cron, so this runs on page views: anything stale is refreshed in waitUntil, a
// few repos at a time. A refresh recomputes a project's rows outright, so a force-push or a
// retry can't double-count.

const API = 'https://api.github.com';
const STALE_MS = 10 * 60 * 1000;
const REPOS_PER_RUN = 20;
const REQUESTS_PER_RUN = 40;   // Cloudflare's free tier allows 50 subrequests per invocation
const MAX_PAGES = 10;          // 1,000 commits per listing

class RateLimited extends Error {}
class OutOfRequests extends Error {}

// { repo: 'owner/name', branch } from a GitHub URL, or null. Only /tree/<branch> changes what is
// tracked; any other path below the repo is ignored.
export function parseRepoUrl(url) {
  let u;
  try { u = new URL(String(url || '').trim()); } catch { return null; }
  if (!/^(www\.)?github\.com$/i.test(u.hostname)) return null;
  const parts = u.pathname.split('/').filter(Boolean);
  if (parts.length < 2) return null;
  const name = parts[1].replace(/\.git$/i, '');
  if (!/^[\w.-]+$/.test(parts[0]) || !/^[\w.-]+$/.test(name)) return null;
  const branch = parts[2] === 'tree' && parts.length > 3 ? parts.slice(3).join('/') : null;
  return { repo: `${parts[0]}/${name}`, branch };
}

// A sprint's shared upstream repos, by owner. Declaring one would collect everyone's commits.
function isExcluded(sprint, repo) {
  const owners = String(sprint.excluded_owners || '').toLowerCase().split(',').map(o => o.trim());
  return owners.includes(repo.split('/')[0].toLowerCase());
}

// One repo per participant: each repo counts for one project and each lead for one project.
// projects must be earliest tag first; the first claim stands. An excluded repo claims nothing,
// so its lead can still declare their own. Adds repo, branch and claim ('ok' | 'no_repo' |
// 'excluded_owner' | 'duplicate_repo' | 'second_project') to each project.
export function resolveClaims(sprint, projects) {
  const repos = new Set(), leads = new Set();
  return projects.map(p => {
    const parsed = parseRepoUrl(p.url);
    if (!parsed) return { ...p, repo: null, branch: null, claim: 'no_repo' };
    if (isExcluded(sprint, parsed.repo)) return { ...p, ...parsed, claim: 'excluded_owner' };
    const key = parsed.repo.toLowerCase();
    const claim = repos.has(key) ? 'duplicate_repo' : (leads.has(p.lead_slug) ? 'second_project' : 'ok');
    if (claim === 'ok') { repos.add(key); leads.add(p.lead_slug); }
    return { ...p, ...parsed, claim };
  });
}

async function gh(env, path, budget, etag) {
  if (budget.left <= 0) throw new OutOfRequests();
  budget.left--;
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'protocol-institute-website',
  };
  if (env.GITHUB_READ_TOKEN) headers.Authorization = `Bearer ${env.GITHUB_READ_TOKEN}`;
  if (etag) headers['If-None-Match'] = etag;
  const res = await fetch(path.startsWith('http') ? path : API + path, { headers });
  if (res.status === 429 || (res.status === 403 && (res.headers.get('x-ratelimit-remaining') === '0' || res.headers.get('retry-after')))) {
    throw new RateLimited();
  }
  return res;
}

const nextPage = res => (/<([^>]+)>;\s*rel="next"/.exec(res.headers.get('link') || '') || [])[1] || null;

// Shas in a fork that its parent doesn't have, so upstream work isn't credited to the fork.
async function aheadOfParent(env, meta, branch, budget) {
  const owner = meta.owner.login;
  let url = `/repos/${meta.parent.full_name}/compare/${encodeURIComponent(meta.parent.default_branch)}...${owner}:${encodeURIComponent(branch)}?per_page=100`;
  const shas = new Set();
  for (let page = 0; url && page < MAX_PAGES; page++) {
    const res = await gh(env, url, budget);
    if (!res.ok) break;     // unrelated histories have no comparison, and share nothing upstream
    (await res.json()).commits.forEach(c => shas.add(c.sha));
    url = nextPage(res);
  }
  return shas;
}

function isBot(c) {
  return (c.author && (c.author.type === 'Bot' || /\[bot\]$/.test(c.author.login || '')))
    || /\[bot\]/.test(c.commit.author.name || '');
}

// One project's commits per day, or null if GitHub says nothing has changed since etag.
async function countCommits(env, sprint, p, meta, etag, budget) {
  const branch = p.branch || meta.default_branch;
  let url = `/repos/${p.repo}/commits?sha=${encodeURIComponent(branch)}&since=${encodeURIComponent(sprint.starts_at)}&per_page=100`;
  const commits = [];
  let newEtag = null;
  for (let page = 0; url && page < MAX_PAGES; page++) {
    const res = await gh(env, url, budget, page === 0 ? etag : null);
    if (res.status === 304) return null;
    if (res.status === 409) return { days: new Map(), etag: null };   // an empty repo
    if (!res.ok) return { unreadable: true };
    if (page === 0) newEtag = res.headers.get('etag');
    commits.push(...await res.json());
    url = nextPage(res);
  }

  // A commit the owner made stays theirs once the parent has merged it, when it is no longer "ahead".
  const ahead = meta.fork && meta.parent ? await aheadOfParent(env, meta, branch, budget) : null;
  const dayOf = new Intl.DateTimeFormat('en-CA', { timeZone: sprint.timezone });
  const from = Date.parse(sprint.starts_at), to = Date.parse(sprint.ends_at);
  const days = new Map();
  for (const c of commits) {
    const at = Date.parse(c.commit.committer.date);
    if (at < from || at >= to || c.parents.length > 1 || isBot(c)) continue;
    if (ahead && !ahead.has(c.sha) && !(c.author && c.author.login === meta.owner.login)) continue;
    const day = dayOf.format(at);
    days.set(day, (days.get(day) || 0) + 1);
  }
  return { days, etag: newEtag };
}

async function syncProject(env, sprint, p, prev, budget) {
  const moved = !prev || prev.repo !== p.repo || prev.branch !== p.branch;
  const syncRow = (state, etag) => env.DB.prepare(`
    INSERT INTO sprint_repo_sync (edition_id, project_id, repo, branch, state, etag, synced_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (edition_id, project_id) DO UPDATE SET repo = excluded.repo, branch = excluded.branch,
      state = excluded.state, etag = excluded.etag, synced_at = excluded.synced_at
  `).bind(sprint.id, p.id, p.repo, p.branch, state, etag, new Date().toISOString());
  const clear = () => env.DB.prepare('DELETE FROM sprint_progress WHERE edition_id = ? AND project_id = ?').bind(sprint.id, p.id);

  // A repo that goes away keeps its last figures, unless they came from a different repo.
  const unreadable = () => env.DB.batch([...(moved ? [clear()] : []), syncRow('unreadable', moved ? null : prev.etag)]);

  const metaRes = await gh(env, `/repos/${p.repo}`, budget);
  if (!metaRes.ok) return unreadable();
  const meta = await metaRes.json();
  const result = await countCommits(env, sprint, p, meta, moved || prev.state !== 'ok' ? null : prev.etag, budget);
  if (result === null) return syncRow('ok', prev.etag).run();
  if (result.unreadable) return unreadable();
  await env.DB.batch([
    clear(),
    ...[...result.days].map(([day, n]) => env.DB.prepare(
      "INSERT INTO sprint_progress (edition_id, project_id, entry_date, value, source) VALUES (?, ?, ?, ?, 'github')"
    ).bind(sprint.id, p.id, day, n)),
    syncRow('ok', result.etag),
  ]);
}

// Refresh the stalest claimed repos. Nothing to read before kickoff, and after the end each
// repo needs just one sync later than the close.
export async function refreshStale(env, sprint, projects, syncRows, now = Date.now()) {
  const started = now >= Date.parse(sprint.starts_at);
  if (!started) return;
  const endsAt = Date.parse(sprint.ends_at);
  const stale = projects.filter(p => {
    if (p.claim !== 'ok') return false;
    const s = syncRows.get(p.id);
    if (!s || !s.synced_at || s.repo !== p.repo || s.branch !== p.branch) return true;
    const at = Date.parse(s.synced_at);
    return now >= endsAt ? at < endsAt : now - at > STALE_MS;
  }).sort((a, b) => ((syncRows.get(a.id) || {}).synced_at || '').localeCompare((syncRows.get(b.id) || {}).synced_at || ''));

  const budget = { left: REQUESTS_PER_RUN };
  try {
    for (const p of stale.slice(0, REPOS_PER_RUN)) await syncProject(env, sprint, p, syncRows.get(p.id), budget);
  } catch (e) {
    if (e instanceof RateLimited) console.warn('sprint sync: GitHub rate limit hit');
    else if (!(e instanceof OutOfRequests)) console.error('sprint sync failed', e);
  }
}

// For the add-project form: can this URL be declared? { ok } or { error }. An unreachable
// GitHub doesn't block anyone; the sync reports a bad repo on the row later.
export async function checkRepo(env, sprint, url, leadSlug, claimed) {
  const parsed = parseRepoUrl(url);
  if (!parsed) return { error: 'Enter a GitHub repository URL, like https://github.com/you/your-project' };
  if (isExcluded(sprint, parsed.repo)) {
    return { error: `Repos owned by ${parsed.repo.split('/')[0]} are shared, so they can't be declared. Fork it and use your fork.` };
  }
  if (claimed.some(p => p.claim === 'ok' && p.lead_slug === leadSlug)) {
    return { error: 'You have already declared a project. It is one repo per participant.' };
  }
  if (claimed.some(p => p.claim === 'ok' && p.repo.toLowerCase() === parsed.repo.toLowerCase())) {
    return { error: 'Another project has already declared that repo. Fork it and use your fork.' };
  }
  try {
    const res = await gh(env, `/repos/${parsed.repo}`, { left: 1 });
    if (res.status === 404) return { error: 'That repo could not be read. It needs to be public.' };
  } catch (e) {
    if (!(e instanceof RateLimited)) console.error('repo check failed', e);
  }
  return { ok: true };
}
