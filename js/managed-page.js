// managed-page.js — shared module for managed content pages.
//
// Requires PAGE_KEY to be defined as a global before this script loads.
// Shell HTML must contain these elements by id:
//   page-loading, page-content, page-body, edit-bar, edit-btn,
//   page-editor, editor-mount, save-btn, cancel-btn

(function () {
  if (typeof PAGE_KEY === 'undefined') {
    console.error('managed-page.js: PAGE_KEY not defined');
    return;
  }

  var currentMd = '';
  var editor = null;
  var canEdit = false;

  function el(id) { return document.getElementById(id); }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (document.querySelector('script[src="' + src + '"]')) { resolve(); return; }
      var s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function loadStylesheet(href) {
    return new Promise(function (resolve) {
      if (document.querySelector('link[href="' + href + '"]')) { resolve(); return; }
      var l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = href; l.onload = resolve;
      document.head.appendChild(l);
    });
  }

  function renderMarkdown(md) {
    var p = window.marked
      ? Promise.resolve()
      : loadScript('https://cdn.jsdelivr.net/npm/marked@9/marked.min.js');
    return p.then(function () {
      // marked v9 exports parse as a named export; handle both calling styles
      var parse = (window.marked && window.marked.parse) || window.marked;
      if (typeof parse !== 'function') throw new Error('marked not loaded');
      var result = parse(md || '');
      // marked v9+ may return a Promise in async mode
      return (result && typeof result.then === 'function') ? result : Promise.resolve(result);
    });
  }

  function plainFallback(md) {
    // Minimal inline fallback: paragraphs + headings + links, no CDN needed
    var html = (md || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/^#{1,6}\s+(.+)$/gm, '<strong>$1</strong>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
      .split(/\n\n+/)
      .filter(Boolean)
      .map(function (b) { return '<p>' + b.replace(/\n/g, '<br>') + '</p>'; })
      .join('\n');
    return Promise.resolve(html);
  }

  function checkEditPermission() {
    return fetch('/api/members/me')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !data.member) return false;
        if (data.member.is_admin) return true;
        if (data.member.is_sig_host && data.member.sig_host_slugs) {
          try {
            var slugs = JSON.parse(data.member.sig_host_slugs);
            var parts = PAGE_KEY.split('/');
            if (parts[0] === 'sigs' && slugs.indexOf(parts[1]) !== -1) return true;
          } catch (e) {}
        }
        return false;
      })
      .catch(function () { return false; });
  }

  function fetchContent() {
    return fetch('/api/pages/' + PAGE_KEY)
      .then(function (r) { return (r.status === 404) ? null : r.ok ? r.json() : null; })
      .catch(function () { return null; });
  }

  function showContent(md) {
    function reveal(html) {
      el('page-body').innerHTML = html;
      el('page-loading').style.display = 'none';
      el('page-content').style.display = '';
      if (canEdit) el('edit-bar').style.display = '';
    }
    renderMarkdown(md)
      .then(reveal)
      .catch(function () { return plainFallback(md).then(reveal); });
  }

  function mountTextarea(mount, md) {
    var ta = document.createElement('textarea');
    ta.value = md || '';
    ta.style.cssText = 'width:100%;height:420px;font-family:monospace;font-size:0.88rem;' +
      'padding:0.75rem;border:1px solid #D8D5CF;border-radius:4px;box-sizing:border-box;resize:vertical;';
    mount.appendChild(ta);
    editor = { getMarkdown: function () { return ta.value; }, _isTextarea: true };
  }

  function showEditor(md) {
    var TOAST_VER = '3.2.2';
    var TOAST_BASE = 'https://uicdn.toast.com/editor/' + TOAST_VER + '/';
    var ready = (window.toastui && window.toastui.Editor)
      ? Promise.resolve()
      : Promise.all([
          loadStylesheet(TOAST_BASE + 'toastui-editor.min.css'),
          loadScript(TOAST_BASE + 'toastui-editor-all.min.js'),
        ]);

    function openEditor() {
      el('page-content').style.display = 'none';
      el('page-editor').style.display = '';
      var mount = el('editor-mount');
      mount.innerHTML = '';

      if (!window.toastui || !window.toastui.Editor) {
        mountTextarea(mount, md);
        return;
      }
      try {
        editor = new toastui.Editor({
          el: mount,
          height: '600px',
          initialEditType: 'wysiwyg',
          previewStyle: 'vertical',
          initialValue: md,
          hooks: {
            addImageBlobHook: function (blob, callback) {
              var fd = new FormData();
              fd.append('image', blob, blob.name || 'upload.jpg');
              fd.append('page_key', PAGE_KEY);
              fetch('/api/pages/upload-image', { method: 'POST', body: fd })
                .then(function (r) { return r.json(); })
                .then(function (d) { callback(d.url || '', ''); })
                .catch(function () { callback('', 'Upload failed'); });
            },
          },
        });
      } catch (e) {
        console.error('Toast UI Editor failed:', e);
        mount.innerHTML = '';
        mountTextarea(mount, md);
      }
    }

    ready.then(openEditor).catch(function () { openEditor(); });
  }

  function save() {
    if (!editor) return;
    var md = editor.getMarkdown();
    var saveBtn = el('save-btn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';

    fetch('/api/pages/' + PAGE_KEY, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content_md: md }),
    })
      .then(function (r) {
        return r.ok
          ? r.json()
          : r.json().then(function (d) { throw new Error(d.error || ('HTTP ' + r.status)); });
      })
      .then(function () {
        currentMd = md;
        editor = null;
        el('page-editor').style.display = 'none';
        showContent(md);
      })
      .catch(function (e) { alert('Save failed: ' + e.message); })
      .finally(function () {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save';
      });
  }

  function cancelEdit() {
    editor = null;
    el('page-editor').style.display = 'none';
    el('page-content').style.display = '';
    if (canEdit) el('edit-bar').style.display = '';
  }

  // Wire buttons
  var editBtn = el('edit-btn');
  var saveBtn = el('save-btn');
  var cancelBtn = el('cancel-btn');
  if (editBtn) editBtn.addEventListener('click', function () { showEditor(currentMd); });
  if (saveBtn) saveBtn.addEventListener('click', save);
  if (cancelBtn) cancelBtn.addEventListener('click', cancelEdit);

  // Init
  Promise.all([fetchContent(), checkEditPermission()])
    .then(function (results) {
      var content = results[0];
      canEdit = results[1];

      if (!content) {
        if (canEdit) {
          el('page-loading').style.display = 'none';
          showEditor('');
        } else {
          el('page-loading').textContent = 'No content yet.';
        }
        return;
      }

      currentMd = content.content_md || '';
      showContent(currentMd);
    })
    .catch(function () {
      el('page-loading').textContent = 'Error loading page content.';
    });
}());
