// GET /api/sprints/<program>/<edition> — public leaderboard for a sprint, ranked by total with
//     active days as the tiebreak, plus the caller's own declared project when signed in.
// GET ...?check_repo=<url> — signed in: whether that repo can be declared.
// Only the github_commits metric exists so far; logging arrives when PiBoWriMo moves over.

import { getSession } from '../../../_shared/session.js';
import { sessionVaryingJson } from '../../../_shared/response.js';
import { loadSprint, registeredProjects, windowState } from '../../../_shared/sprints.js';
import { resolveClaims, refreshStale, checkRepo } from '../../../_shared/github-commits.js';

export async function onRequestGet({ request, env, params, waitUntil }) {
  const sprint = await loadSprint(env, params.program, params.edition);
  if (!sprint) return Response.json({ error: 'No such sprint' }, { status: 404 });

  const projects = resolveClaims(sprint, await registeredProjects(env, sprint));
  const email = await getSession(request, env);
  const member = email
    ? await env.DB.prepare('SELECT slug FROM members WHERE email = ?').bind(email).first()
    : null;

  const repoUrl = new URL(request.url).searchParams.get('check_repo');
  if (repoUrl !== null) {
    if (!member) return Response.json({ error: 'Sign in to declare a project' }, { status: 401 });
    return sessionVaryingJson(await checkRepo(env, sprint, repoUrl, member.slug, projects));
  }

  const [progress, sync] = await Promise.all([
    env.DB.prepare('SELECT project_id, entry_date, value FROM sprint_progress WHERE edition_id = ? ORDER BY entry_date').bind(sprint.id).all(),
    env.DB.prepare('SELECT project_id, repo, branch, state, etag, synced_at FROM sprint_repo_sync WHERE edition_id = ?').bind(sprint.id).all(),
  ]);
  const syncRows = new Map((sync.results || []).map(s => [s.project_id, s]));
  const dailyOf = new Map();
  for (const d of progress.results || []) {
    if (!dailyOf.has(d.project_id)) dailyOf.set(d.project_id, []);
    dailyOf.get(d.project_id).push({ date: d.entry_date, value: d.value });
  }

  waitUntil(refreshStale(env, sprint, projects, syncRows));

  const leaderboard = projects.map(p => {
    const s = syncRows.get(p.id);
    const daily = p.claim === 'ok' ? (dailyOf.get(p.id) || []) : [];
    return {
      project_id: p.id, slug: p.slug, title: p.title, lead_slug: p.lead_slug, lead_name: p.lead_name,
      repo: p.repo, branch: p.branch,
      state: p.claim !== 'ok' ? p.claim : (s && s.repo === p.repo ? s.state : 'pending'),
      total: daily.reduce((sum, d) => sum + d.value, 0), days: daily.length,
      last_date: daily.length ? daily[daily.length - 1].date : null, daily,
    };
  }).sort((a, b) => b.total - a.total || b.days - a.days || a.title.localeCompare(b.title));

  const syncedAt = (sync.results || []).map(s => s.synced_at).filter(Boolean).sort().pop() || null;
  const mine = member ? projects.find(p => p.lead_slug === member.slug && p.claim === 'ok') : null;
  return sessionVaryingJson({
    title: sprint.title, unit: sprint.unit, strong_at: sprint.strong_at,
    window: windowState(sprint), edition_id: sprint.id, synced_at: syncedAt, leaderboard,
    mine: member ? { project: mine ? { slug: mine.slug, title: mine.title } : null } : null,
  });
}
