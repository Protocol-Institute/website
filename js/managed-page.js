// managed-page.js — viewer for managed content pages (D1 managed_pages).
//
// Requires PAGE_KEY to be defined as a global, and /js/main.js and
// /js/markdown.js loaded first. Shell HTML must contain these elements by id:
//   page-loading, page-content, page-body
//
// This module only displays. Editing happens in the program editor
// (/programs/edit?slug=<slug>#about), which holds the markdown editor alongside
// the program's blurb, byline, links and editions — one edit page per program
// (Session 55; before that the About page had its own inline editor and the
// two editors linked to each other). Admins and hosts of the page's program
// (hosted_programs from /api/members/me) get the site-wide Edit link
// (PI.editLink) pointing there; the server re-checks on every write.
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
    return window.PIMarkdown.render(md).then(function (html) {
      el('page-body').innerHTML = html;
      el('page-loading').style.display = 'none';
      el('page-content').style.display = '';
      if (canEdit && programSlug) window.PI.editLink('/programs/edit?slug=' + encodeURIComponent(programSlug) + '#about');
    });
  });
}());
