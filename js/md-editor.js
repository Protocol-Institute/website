// md-editor.js — the site's one markdown editor, and the unsaved-changes guard
// every edit page shares (Session 56). Requires /js/markdown.js first.
//
// Deliberately raw markdown: a plain textarea with a live preview beside it
// (below it on narrow screens). Session 54 removed EasyMDE at Venkat's request
// after its toolbar never rendered; don't reintroduce an editor library or a
// formatting toolbar without asking.
//
//   const ed = PIMdEditor.attach(textarea, opts)
//     opts.inline    preview as an inline one-liner (bylines)
//     opts.wide      break out of the 760px column on wide screens (long pages)
//     opts.pageKey   managed_pages key — enables "Insert image" (editors of that page only)
//     opts.onSave    called on Cmd/Ctrl-S
//   ed.setValue(md)  set text and refresh the preview (use instead of .value =)
//
//   const guard = PIMdEditor.guard(container, saveButton?)
//     Snapshots every input/textarea/select in container; warns before leaving
//     with unsaved changes and marks saveButton while anything differs.
//   guard.snapshot()  call after loading values and after each successful save
(function () {
  if (!window.PIMarkdown) { console.error('md-editor.js: /js/markdown.js must load first'); return; }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html) e.innerHTML = html;
    return e;
  }

  function attach(ta, opts) {
    opts = opts || {};
    if (ta._mde) return ta._mde;

    var wrap = el('div', 'mde' + (opts.inline ? ' mde--inline' : '') + (opts.wide ? ' mde--wide' : ''));
    var bar = el('div', 'mde-bar');
    bar.appendChild(el('span', 'mde-label', 'Markdown'));
    var status = el('span', 'mde-status');
    status.setAttribute('aria-live', 'polite');
    if (opts.pageKey) {
      var up = el('label', 'mde-upload', 'Insert image<input type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden>');
      bar.appendChild(up);
      up.querySelector('input').addEventListener('change', function () { upload(this); });
    }
    bar.appendChild(status);
    bar.appendChild(el('a', 'mde-help', 'Markdown help'));
    bar.lastChild.href = 'https://www.markdownguide.org/basic-syntax/';
    bar.lastChild.target = '_blank';
    bar.lastChild.rel = 'noopener noreferrer';

    var panes = el('div', 'mde-panes');
    var preview = el('div', 'mde-preview md');
    preview.setAttribute('aria-label', 'Preview');
    ta.parentNode.insertBefore(wrap, ta);
    wrap.appendChild(bar);
    wrap.appendChild(panes);
    panes.appendChild(ta);
    panes.appendChild(preview);
    ta.classList.add('mde-input');
    ta.spellcheck = true;

    var timer = null;
    function refresh() {
      var md = ta.value;
      preview.innerHTML = md.trim()
        ? (opts.inline ? PIMarkdown.inline(md) : PIMarkdown.html(md))
        : '<span class="mde-empty">Preview</span>';
      grow();
    }
    function grow() {
      if (opts.inline) return;
      ta.style.height = 'auto';
      ta.style.height = (ta.scrollHeight + 2) + 'px';
    }
    ta.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(refresh, 120);
    });
    ta.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && opts.onSave) { e.preventDefault(); opts.onSave(); }
    });
    PIMarkdown.load().then(refresh);

    function upload(input) {
      var file = input.files && input.files[0];
      input.value = '';
      if (!file) return;
      var fd = new FormData();
      fd.append('image', file, file.name || 'upload.jpg');
      fd.append('page_key', opts.pageKey);
      status.textContent = 'Uploading image…';
      fetch('/api/pages/upload-image', { method: 'POST', body: fd })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) {
          if (!r.ok || !d.url) throw new Error(d.error || 'Upload failed');
          return d.url;
        }); })
        .then(function (url) {
          var s = ta.selectionStart, e = ta.selectionEnd, text = '\n![](' + url + ')\n';
          ta.value = ta.value.slice(0, s) + text + ta.value.slice(e);
          ta.selectionStart = ta.selectionEnd = s + text.length;
          ta.focus();
          ta.dispatchEvent(new Event('input', { bubbles: true }));
          status.textContent = 'Image inserted.';
        })
        .catch(function (err) { status.textContent = 'Image upload failed: ' + err.message; });
    }

    ta._mde = {
      setValue: function (md) { ta.value = md || ''; PIMarkdown.load().then(refresh); },
      refresh: refresh,
    };
    return ta._mde;
  }

  // ── Unsaved-changes guard ────────────────────────────────────────────────
  var guards = [];
  window.addEventListener('beforeunload', function (e) {
    if (guards.some(function (g) { return g.dirty(); })) { e.preventDefault(); e.returnValue = ''; }
  });

  function guard(container, saveBtn) {
    var base = null;
    function fields() {
      return Array.prototype.slice.call(container.querySelectorAll('input, textarea, select'))
        .filter(function (f) { return f.type !== 'file' && !f.closest('[data-guard-skip]'); });
    }
    function state() {
      return fields().map(function (f) { return (f.type === 'checkbox' || f.type === 'radio') ? f.checked : f.value; }).join('\u0000');
    }
    var g = {
      snapshot: function () { base = state(); update(); },
      dirty: function () { return base !== null && state() !== base; },
    };
    function update() {
      if (saveBtn) saveBtn.classList.toggle('form-btn--dirty', g.dirty());
    }
    container.addEventListener('input', update);
    container.addEventListener('change', update);
    guards.push(g);
    return g;
  }

  window.PIMdEditor = { attach: attach, guard: guard };
}());
