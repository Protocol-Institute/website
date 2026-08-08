// Shared logic for /research — used by both the Challenges and Projects views
// so the value formula and the "watching" mechanism stay identical across
// both entity types rather than drifting as two copies.
window.PI_RESEARCH = (function () {
  const VALUE_A = 1, VALUE_B = 3;

  function value(seed, anon, member) {
    return (seed ?? 1) + VALUE_A * (anon || 0) * (anon || 0) + VALUE_B * (member || 0) * (member || 0);
  }

  const SIG_LABELS = {
    sigfpt:    'Formal Protocol Theory',
    mrg:       'Memory Research Group',
    sigpfb:    'Protocols for Business',
    protfisig: 'Protocol Fiction',
    drg:       'Distributed Robotics Group',
    sigpsy:    'Psychohistory',
  };

  function escHtml(s) {
    return String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
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

  return { value, SIG_LABELS, escHtml, anonVotedSet, watchButtonHtml, attachWatchHandlers };
}());
