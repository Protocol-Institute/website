// managed-page.js — viewer for managed content pages (D1 managed_pages).
//
// Requires PAGE_KEY to be defined as a global, and /js/main.js and
// /js/markdown.js loaded first. Shell HTML must contain #page-body; #page-loading
// and #page-content are optional (SIG About pages use them to hide the body
// until the fetch returns).
//
// If the page has stored markdown it replaces #page-body; if not, whatever HTML
// #page-body already holds stays as the fallback (static/about and
// static/support ship their text in the HTML, so they read fine even if the
// fetch fails).
//
// This module only displays. Program About pages (sigs/<slug>/…, programs/<slug>/…)
// are edited in the program editor (/programs/edit?slug=<slug>#about), so admins
// and that program's hosts get the site-wide Edit link (PI.editLink) pointing
// there. Every other page key — static/about, static/support — is admin-only and
// edited at /pages/edit?key=<key> (Session 57). The server re-checks every write.
(function () {
  if (typeof PAGE_KEY === 'undefined') {
    console.error('managed-page.js: PAGE_KEY not defined');
    return;
  }
  if (!window.PIMarkdown) {
    console.error('managed-page.js: /js/markdown.js must load first');
    return;
  }

  function el(id) { return document.getElementById(id); }

  var parts = PAGE_KEY.split('/');
  var programSlug = (parts[0] === 'sigs' || parts[0] === 'programs') ? parts[1] : null;

  function checkEditPermission() {
    return fetch('/api/members/me')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !data.member) return false;
        if (data.member.is_admin) return true;
        if (!programSlug) return false;
        return (data.hosted_programs || []).some(function (p) { return p.slug === programSlug; });
      })
      .catch(function () { return false; });
  }

  function fetchContent() {
    return fetch('/api/pages/' + PAGE_KEY)
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  Promise.all([fetchContent(), checkEditPermission()]).then(function (res) {
    var md = (res[0] && res[0].content_md) || '';
    var canEdit = res[1];
    return (md.trim() ? window.PIMarkdown.render(md) : Promise.resolve(null)).then(function (html) {
      if (html !== null) el('page-body').innerHTML = html;
      if (el('page-loading')) el('page-loading').style.display = 'none';
      if (el('page-content')) el('page-content').style.display = '';
      if (!canEdit) return;
      window.PI.editLink(programSlug
        ? '/programs/edit?slug=' + encodeURIComponent(programSlug) + '#about'
        : '/pages/edit?key=' + encodeURIComponent(PAGE_KEY));
    });
  });
}());
