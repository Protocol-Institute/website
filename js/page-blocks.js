// page-blocks.js — admin-editable markdown blocks on otherwise hand-built pages
// (Session 58). Requires /js/main.js and /js/markdown.js first.
//
//   <div data-page-key="static/contact" data-edit="header"> fallback HTML </div>
//
// Each [data-page-key] element is filled from managed_pages (GET /api/pages/<key>)
// when that key has stored markdown; otherwise its HTML stays as the fallback, so a
// failed fetch never blanks the page. Keys are static/<name>: admin-only, edited at
// /pages/edit?key=<key> (the server re-checks every write). Admins get an Edit
// link: data-edit="header" puts it in the page header (PI.editLink, for a page
// that is one block); otherwise a small link sits at the top right of the block.
//
// After markdown replaces a block it fires 'pageblock:render' on the element, for
// pages that restyle the rendered HTML (network cards). PIPageBlocks.render(el)
// re-runs one block — e.g. after changing its data-page-key (members filters).
//
// Program About pages (sigs/<slug>/about, programs/<slug>/about) use
// managed-page.js instead: they are host-editable, through the program editor.
(function () {
  if (!window.PIMarkdown) { console.error('page-blocks.js: /js/markdown.js must load first'); return; }

  var adminPromise = null;
  function isAdmin() {
    if (!adminPromise) {
      adminPromise = fetch('/api/members/me')
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (d) { return !!(d && d.member && d.member.is_admin); })
        .catch(function () { return false; });
    }
    return adminPromise;
  }

  function editHref(key) { return '/pages/edit?key=' + encodeURIComponent(key); }

  function render(el) {
    var key = el.getAttribute('data-page-key');
    if (!key) return Promise.resolve();
    el.setAttribute('data-page-rendering', key);
    return Promise.all([
      fetch('/api/pages/' + key).then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; }),
      window.PIMarkdown.load(),
      isAdmin(),
    ]).then(function (res) {
      if (el.getAttribute('data-page-rendering') !== key) return;   // key changed meanwhile
      var md = (res[0] && res[0].content_md) || '';
      if (md.trim()) {
        el.innerHTML = window.PIMarkdown.html(md);
        el.classList.add('md');
        el.dispatchEvent(new CustomEvent('pageblock:render'));
      }
      if (!res[2]) return;
      if (el.getAttribute('data-edit') === 'header') { window.PI.editLink(editHref(key)); return; }
      var old = el.querySelector(':scope > .block-edit-link');
      if (old) old.remove();
      var a = document.createElement('a');
      a.className = 'block-edit-link';
      a.href = editHref(key);
      a.textContent = 'Edit';
      el.classList.add('page-block--editable');
      el.insertBefore(a, el.firstChild);
    });
  }

  function renderAll() {
    document.querySelectorAll('[data-page-key]').forEach(render);
  }

  window.PIPageBlocks = { render: render };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', renderAll);
  else renderAll();
}());
