// Shared logic for /research — used by both the Challenges and Projects views
// so the value formula and the "watching" mechanism stay identical across
// both entity types rather than drifting as two copies.
window.PI_RESEARCH = (function () {
  const VALUE_A = 1, VALUE_B = 3;

  function value(seed, anon, member) {
    return (seed ?? 1) + VALUE_A * (anon || 0) * (anon || 0) + VALUE_B * (member || 0) * (member || 0);
  }

  function escHtml(s) {
    return String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  }

  function profileHref(slug) {
    return '/members/profile?slug=' + encodeURIComponent(slug || '');
  }

  // Program affiliation tags for a project (programs/PLAN.md). `programs` is the
  // API's [{title, short_title, href, status, edition}] list; pending ones only
  // reach the client for the lead or an admin, and are marked as such.
  function programTagsHtml(programs) {
    if (!programs || !programs.length) return '<span class="project-category">Independent</span>';
    return programs.map(a => {
      const pending = a.status && a.status !== 'approved';
      const tip = [a.edition ? a.edition.title : a.title, pending ? 'awaiting approval by the program\'s hosts' : '']
        .filter(Boolean).join(' — ');
      return `<a class="project-theme-tag${pending ? ' project-theme-tag--pending' : ''}" href="${escHtml(a.href)}" title="${escHtml(tip)}">` +
        escHtml(a.short_title || a.title) + (pending ? ' (pending)' : '') + `</a>`;
    }).join('');
  }

  function anonVotedSet(cookieName) {
    const m = document.cookie.match(new RegExp(cookieName + '=([^;]+)'));
    if (!m) return new Set();
    try { return new Set(decodeURIComponent(m[1]).split(',').map(Number).filter(Boolean)); }
    catch { return new Set(); }
  }

  // entityType: 'challenge' | 'project'. id: numeric challenge id, or project slug.
  function watchButtonHtml(entityType, id, votedByMe, anon, member) {
    const total = (anon || 0) + (member || 0);
    const label = entityType === 'challenge' ? 'Watch this challenge' : 'Watch this project';
    return `<button class="watch-btn${votedByMe ? ' voted' : ''}"
              data-entity="${entityType}" data-id="${escHtml(id)}" ${votedByMe ? 'disabled' : ''}
              title="${label}">👀 <span class="watch-count">${total}</span></button>`;
  }

  function attachWatchHandlers(root) {
    root.querySelectorAll('.watch-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', async function () {
        const entity = this.dataset.entity;
        const id = this.dataset.id;
        const endpoint = entity === 'challenge'
          ? `/api/challenges/${id}/interesting`
          : `/api/projects/${id}/watching`;
        this.disabled = true;
        try {
          const res = await fetch(endpoint, { method: 'POST' });
          if (res.ok) {
            const data = await res.json();
            const anon = data.anon_interesting || 0;
            const member = data.member_interesting || 0;
            const seed = data.seed_interesting ?? 1;
            this.querySelector('.watch-count').textContent = anon + member;
            this.classList.add('voted');
            const card = this.closest('[data-entity-card]');
            if (card) {
              const valEl = card.querySelector('.entity-value strong');
              if (valEl) valEl.textContent = value(seed, anon, member).toLocaleString();
            }
          } else if (res.status !== 409) {
            this.disabled = false;
          } else {
            this.classList.add('voted');
          }
        } catch {
          this.disabled = false;
        }
      });
    });
  }

  return { value, escHtml, profileHref, programTagsHtml, anonVotedSet, watchButtonHtml, attachWatchHandlers };
}());
