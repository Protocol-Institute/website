// A sprint's page (programs/SPRINTS-PLAN.md): about text, standings with an expandable daily
// strip, and the add-project form. Everything comes from /api/sprints/<program>/<edition>; the page
// names its sprint on the #sprint element. PiBoWriMo's page still has its own copy of the strip
// until it moves onto this after its month ends.
(function () {
  const root = document.getElementById('sprint');
  const program = root.dataset.program, editionSlug = root.dataset.edition;
  const api = `/api/sprints/${program}/${editionSlug}`;
  const R = window.PI_RESEARCH;
  const esc = R.escHtml;
  const $ = id => document.getElementById(id);
  const fmt = n => Number(n).toLocaleString('en-US');
  const shortDate = d => new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  const loginHref = () => '/members/join?return=' + encodeURIComponent(location.pathname);
  const json = url => fetch(url).then(r => r.ok ? r.json() : null).catch(() => null);
  const localToday = () => {
    const now = new Date();
    return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  };

  let state = null, me = null;
  const expanded = new Set();

  Promise.all([
    json(`/api/programs/${program}`),
    PIMarkdown.load(),
    json(`/api/pages/programs/${program}/about`),
    json('/api/members/me'),
  ]).then(([data, , about, who]) => {
    me = who;
    if (about && String(about.content_md || '').trim()) $('sprint-about').innerHTML = PIMarkdown.html(about.content_md);
    if (!data) return;
    if (data.program.byline) {
      const byline = $('sprint-byline');
      byline.innerHTML = PIMarkdown.inline(data.program.byline);
      PI.linkPeople(byline, data.hosts);
      byline.hidden = false;
    }
    if (me && me.member && (me.member.is_admin || (me.hosted_programs || []).some(h => h.slug === program))) {
      PI.editLink(`/programs/edit?slug=${program}#about`);
    }
  });

  const unitWord = (n, unit) => (Math.abs(n) === 1 ? unit.replace(/s$/, '') : unit);

  function strip(r) {
    const w = state.window, unit = state.unit, today = localToday();
    const byDate = new Map(r.daily.map(d => [d.date, d.value]));
    const end = Date.parse(w.end), total = Math.round((end - Date.parse(w.start)) / 86400000) + 1;
    const step = total <= 14 ? 2 : 7;
    const cells = [], labels = [];
    for (let t = Date.parse(w.start), i = 0; t <= end; t += 86400000, i++) {
      const date = new Date(t).toISOString().slice(0, 10);
      const value = byDate.get(date);
      const kind = value ? (value >= state.strong_at ? 'strong' : 'weak') : (date > today ? 'future' : 'empty');
      const text = value ? `${shortDate(date)}: ${fmt(value)} ${unitWord(value, unit)}` : (date > today ? shortDate(date) : `${shortDate(date)}: no ${unit}`);
      cells.push(`<span class="lb-day lb-day--${kind}" role="img" title="${esc(text)}" aria-label="${esc(text)}" data-text="${esc(text)}"></span>`);
      if (i % step === 0 && t + (step - 1) * 86400000 <= end) labels.push(`<span style="grid-column: span ${step}">${shortDate(date)}</span>`);
    }
    return `
      <div class="lb-strip" style="--days:${total}">${cells.join('')}</div>
      <div class="lb-strip-labels" style="--days:${total}">${labels.join('')}</div>
      <p class="lb-strip-readout" aria-hidden="true">&nbsp;</p>
      <ul class="lb-strip-legend">
        <li><span class="lb-day lb-day--strong"></span>${fmt(state.strong_at)}+ ${esc(unit)}</li>
        <li><span class="lb-day lb-day--weak"></span>Under ${fmt(state.strong_at)}</li>
        <li><span class="lb-day lb-day--empty"></span>No ${esc(unit)}</li>
      </ul>`;
  }

  const STATE_NOTES = {
    no_repo: 'needs a GitHub repo as its project link',
    excluded_owner: 'not counted: this is a shared repo, so use your own fork',
    duplicate_repo: 'another project declared this repo first',
    second_project: 'not counted: one repo per participant',
    unreadable: 'repo could not be read, so it needs to be public',
  };

  function repoLink(r) {
    if (!r.repo) return '';
    const href = `https://github.com/${r.repo}${r.branch ? '/tree/' + r.branch : ''}`;
    return ` &middot; <a href="${esc(href)}" rel="noopener noreferrer">${esc(r.repo)}${r.branch ? ' (' + esc(r.branch) + ')' : ''}</a>`;
  }

  function render() {
    const { window: w, leaderboard, unit } = state;
    const updated = state.synced_at ? Math.max(0, Math.round((Date.now() - Date.parse(state.synced_at)) / 60000)) : null;
    $('sprint-window').textContent = !w.started ? 'The leaderboard starts counting at kickoff.'
      : (w.ended ? 'The hackathon has ended. Final standings below.'
        : `Counts refresh about every 10 minutes.${updated === null ? '' : ` Last updated ${updated} min ago.`}`);
    $('sprint-count').textContent = '(' + leaderboard.length + ')';
    $('sprint-unit').textContent = unit[0].toUpperCase() + unit.slice(1);
    $('sprint-body').innerHTML = leaderboard.length
      ? leaderboard.map((r, i) => {
        const note = STATE_NOTES[r.state];
        return `
          <tr class="${r.days ? 'lb-row--expandable' : ''}" data-project="${r.project_id}">
            <td>${i + 1}</td>
            <td><a href="/projects/project?slug=${encodeURIComponent(r.slug)}">${esc(r.title)}</a>
                <div class="entity-meta">by <a href="${R.profileHref(r.lead_slug)}">${esc(r.lead_name || r.lead_slug)}</a>${repoLink(r)}${note ? ` &middot; ${note}` : ''}${r.days ? ` &middot; <button type="button" class="lb-toggle" aria-expanded="${expanded.has(r.project_id)}" aria-controls="lb-detail-${r.project_id}">Daily progress</button>` : ''}</div></td>
            <td class="lb-num">${fmt(r.total)}</td>
            <td class="lb-num">${r.days}</td>
            <td class="lb-num lb-hide-sm">${r.last_date ? shortDate(r.last_date) : '&mdash;'}</td>
          </tr>${r.days ? `
          <tr class="lb-detail" id="lb-detail-${r.project_id}"${expanded.has(r.project_id) ? '' : ' hidden'}>
            <td colspan="5">${strip(r)}</td>
          </tr>` : ''}`;
      }).join('')
      : '<tr><td colspan="5" class="entity-empty">No projects declared yet. Yours could be the first.</td></tr>';
  }

  $('sprint-body').addEventListener('click', ev => {
    const row = ev.target.closest('.lb-row--expandable');
    if (!row || (ev.target.closest('a') && !ev.target.closest('.lb-toggle'))) return;
    const id = Number(row.dataset.project);
    const open = !expanded.has(id);
    if (open) expanded.add(id); else expanded.delete(id);
    $('lb-detail-' + id).hidden = !open;
    row.querySelector('.lb-toggle').setAttribute('aria-expanded', open);
  });
  const showDay = ev => {
    const cell = ev.target.closest('.lb-strip .lb-day');
    if (cell) cell.closest('td').querySelector('.lb-strip-readout').textContent = cell.dataset.text;
  };
  $('sprint-body').addEventListener('mouseover', showDay);
  $('sprint-body').addEventListener('click', showDay);

  function load() {
    return fetch(api).then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => { state = data; render(); })
      .catch(() => { $('sprint-body').innerHTML = '<tr><td colspan="5" class="entity-empty">The standings could not be loaded. Please try again later.</td></tr>'; });
  }

  // ── Add a project ──────────────────────────────────────────────────────────
  const modal = $('add-modal');
  modal.querySelector('[data-close]').addEventListener('click', () => modal.close());
  modal.addEventListener('click', ev => { if (ev.target === modal) modal.close(); });
  function setMsg(el, text, err) { el.textContent = text; el.classList.toggle('lb-msg--err', !!err); }

  $('sprint-add').addEventListener('click', () => {
    let gate = null;
    if (!me || !me.member) gate = me && me.pending ? 'Your membership request is still awaiting approval.' : `<a href="${loginHref()}">Log in or join</a> to declare your project.`;
    else if (state && state.mine && state.mine.project) gate = `You have declared <a href="/projects/project?slug=${encodeURIComponent(state.mine.project.slug)}">${esc(state.mine.project.title)}</a>. It is one repo per participant. To change repos, edit that project&rsquo;s link.`;
    $('add-gate').hidden = !gate; $('add-form').hidden = !!gate;
    if (gate) $('add-gate').innerHTML = gate;
    $('add-github').hidden = true;
    setMsg($('add-msg'), '');
    modal.showModal();
  });

  const checkRepo = url => fetch(`${api}?check_repo=${encodeURIComponent(url)}`).then(r => r.json());

  // A personal repo's owner is usually the member, so offer it for their profile if they
  // have no GitHub username yet (migration 066). Editable, and saved only if ticked.
  $('add-repo').addEventListener('change', async () => {
    const url = $('add-repo').value.trim();
    $('add-github').hidden = true;
    if (!url || !me || !me.member || me.member.github_username) return;
    const check = await checkRepo(url).catch(() => ({}));
    if (url !== $('add-repo').value.trim()) return;
    setMsg($('add-msg'), check.error || '', !!check.error);
    if (check.ok && check.owner_is_user) {
      $('add-github-user').value = check.owner;
      $('add-github-save').checked = true;
      $('add-github').hidden = false;
    }
  });

  async function saveGithub() {
    const username = $('add-github-user').value.trim();
    if ($('add-github').hidden || !$('add-github-save').checked || !username) return '';
    const res = await fetch('/api/members/update', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { github_username: username } }),
    }).catch(() => null);
    const out = res ? await res.json().catch(() => ({})) : {};
    if (res && res.ok) { me.member.github_username = username; return ''; }
    return ` Your GitHub username was not saved (${out.error || 'network error'}); you can add it from Edit Profile.`;
  }

  $('add-form').addEventListener('submit', async ev => {
    ev.preventDefault();
    const btn = $('add-submit'), title = $('add-name').value.trim(), url = $('add-repo').value.trim();
    btn.disabled = true; setMsg($('add-msg'), '');
    try {
      const check = await checkRepo(url);
      if (check.error) throw new Error(check.error);
      const res = await fetch('/api/projects', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, url, description: $('add-desc').value.trim(), state: 'beta',
          lead_slug: me.member.slug, type: 'accretive', artifact_type: 'code',
          affiliations: [{ program_slug: program, edition_id: state.edition_id }],
        }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(res.status === 401 ? 'Your session has expired. Please log in again.' : (out.error || 'Could not save'));
      const githubNote = await saveGithub();
      $('add-form').reset();
      $('add-github').hidden = true;
      modal.close();
      $('sprint-flash').innerHTML = `Added <a href="/projects/project?slug=${encodeURIComponent(out.slug)}">${esc(title)}</a>. Commits to your repo will count from kickoff.${esc(githubNote)}`;
      await load();
    } catch (e) {
      setMsg($('add-msg'), e.message, true);
    } finally { btn.disabled = false; }
  });

  load();
}());
