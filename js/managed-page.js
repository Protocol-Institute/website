// managed-page.js — shared module for managed content pages (D1 managed_pages).
//
// Requires PAGE_KEY to be defined as a global before this script loads.
// Shell HTML must contain these elements by id:
//   page-loading, page-content, page-body, edit-bar, edit-btn,
//   page-editor, editor-mount, save-btn, cancel-btn
//
// Editing is a plain markdown textarea with a preview toggle and an image
// upload button — deliberately no WYSIWYG/markdown-editor library (Session 54:
// EasyMDE's toolbar icons never rendered, and the dependency wasn't worth it).
//
// Who may edit: admins, and hosts of the program the page belongs to
// (sigs/<slug>/… or programs/<slug>/…), via /api/members/me's hosted_programs.
// The server enforces the same rule in functions/api/pages/[[path]].js.
//
// Rendered markdown is sanitized with DOMPurify: hosts are not admins, and the
// site CSP allows inline script, so raw HTML in markdown must not reach the DOM.
(function () {
  if (typeof PAGE_KEY === 'undefined') {
    console.error('managed-page.js: PAGE_KEY not defined');
    return;
  }

  var MARKED = 'https://cdn.jsdelivr.net/npm/marked@9/marked.min.js';
  var PURIFY = 'https://cdn.jsdelivr.net/npm/dompurify@3/dist/purify.min.js';

  var currentMd = '';
  var canEdit = false;
  var textarea = null;

  function el(id) { return document.getElementById(id); }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[src="' + src + '"]')) { resolve(); return; }
      var s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function escapeHtml(s) {
    return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function plainFallback(md) {
    // CDN unavailable: show the markdown as escaped paragraphs rather than nothing.
    return escapeHtml(md).split(/\n\n+/).filter(Boolean)
      .map(function (b) { return '<p>' + b.replace(/\n/g, '<br>') + '</p>'; }).join('\n');
  }

  function renderMarkdown(md) {
    return Promise.all([
      window.marked ? null : loadScript(MARKED),
      window.DOMPurify ? null : loadScript(PURIFY),
    ]).then(function () {
      var parse = (window.marked && window.marked.parse) || window.marked;
      if (typeof parse !== 'function' || !window.DOMPurify) throw new Error('renderer not loaded');
      return Promise.resolve(parse(md || '')).then(function (html) {
        return window.DOMPurify.sanitize(html);
      });
    }).catch(function () { return plainFallback(md); });
  }

  function checkEditPermission() {
    return fetch('/api/members/me')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !data.member) return false;
        if (data.member.is_admin) return true;
        var parts = PAGE_KEY.split('/');
        if (parts[0] !== 'sigs' && parts[0] !== 'programs') return false;
        return (data.hosted_programs || []).some(function (p) { return p.slug === parts[1]; });
      })
      .catch(function () { return false; });
  }

  function fetchContent() {
    return fetch('/api/pages/' + PAGE_KEY)
      .then(function (r) { return r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  function showContent(md) {
    renderMarkdown(md).then(function (html) {
      el('page-body').innerHTML = html;
      el('page-loading').style.display = 'none';
      el('page-editor').style.display = 'none';
      el('page-content').style.display = '';
      if (canEdit) el('edit-bar').style.display = '';
    });
  }

  function insertAtCursor(text) {
    var start = textarea.selectionStart, end = textarea.selectionEnd;
    textarea.value = textarea.value.slice(0, start) + text + textarea.value.slice(end);
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
    textarea.focus();
  }

  function showEditor(md) {
    el('page-content').style.display = 'none';
    el('page-editor').style.display = '';
    var mount = el('editor-mount');
    mount.innerHTML =
      '<div class="md-editor-bar">' +
        '<button type="button" class="md-tab md-tab--active" data-mode="write">Write</button>' +
        '<button type="button" class="md-tab" data-mode="preview">Preview</button>' +
        '<label class="md-upload">Insert image<input type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden></label>' +
        '<a class="md-help" href="https://www.markdownguide.org/basic-syntax/" target="_blank" rel="noopener noreferrer">Markdown help</a>' +
      '</div>' +
      '<textarea class="md-textarea" spellcheck="true"></textarea>' +
      '<div class="md-preview about-body" style="display:none;"></div>' +
      '<p class="md-status" aria-live="polite"></p>';
    textarea = mount.querySelector('.md-textarea');
    textarea.value = md || '';
    var preview = mount.querySelector('.md-preview');
    var status = mount.querySelector('.md-status');

    mount.querySelectorAll('.md-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        mount.querySelectorAll('.md-tab').forEach(function (t) { t.classList.remove('md-tab--active'); });
        tab.classList.add('md-tab--active');
        var previewing = tab.dataset.mode === 'preview';
        textarea.style.display = previewing ? 'none' : '';
        preview.style.display = previewing ? '' : 'none';
        if (previewing) renderMarkdown(textarea.value).then(function (html) { preview.innerHTML = html; });
      });
    });

    mount.querySelector('.md-upload input').addEventListener('change', function () {
      var file = this.files && this.files[0];
      if (!file) return;
      var fd = new FormData();
      fd.append('image', file, file.name || 'upload.jpg');
      fd.append('page_key', PAGE_KEY);
      status.textContent = 'Uploading image…';
      fetch('/api/pages/upload-image', { method: 'POST', body: fd })
        .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          if (!res.ok || !res.d.url) throw new Error(res.d.error || 'Upload failed');
          insertAtCursor('\n![](' + res.d.url + ')\n');
          status.textContent = 'Image inserted.';
        })
        .catch(function (e) { status.textContent = 'Image upload failed: ' + e.message; });
      this.value = '';
    });

    textarea.focus();
  }

  function save() {
    var md = textarea ? textarea.value : currentMd;
    var btn = el('save-btn');
    btn.disabled = true;
    btn.textContent = 'Saving…';
    fetch('/api/pages/' + PAGE_KEY, {
      method: 'POST', // not PUT: the CF WAF blocks PUT on Pages
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_md: md }),
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (!res.ok) throw new Error(res.d.error || 'Save failed');
        currentMd = md;
        showContent(md);
      })
      .catch(function (e) { alertInline('Could not save: ' + e.message); })
      .then(function () { btn.disabled = false; btn.textContent = 'Save'; });
  }

  function alertInline(msg) {
    var status = document.querySelector('#editor-mount .md-status');
    if (status) status.textContent = msg;
  }

  Promise.all([fetchContent(), checkEditPermission()]).then(function (res) {
    currentMd = (res[0] && res[0].content_md) || '';
    canEdit = res[1];
    showContent(currentMd);
    if (!canEdit) return;
    el('edit-btn').addEventListener('click', function () { showEditor(currentMd); });
    el('cancel-btn').addEventListener('click', function () { showContent(currentMd); });
    el('save-btn').addEventListener('click', save);
  });
}());
