// markdown.js — the site's single markdown renderer.
//
// Every user-written text field is markdown (Session 56): member bios, project
// and challenge descriptions, program blurbs and bylines, and managed pages
// (About pages). All of them render through here, so a field looks the same
// in the editor's preview, on its own page and in listing cards.
//
//   PIMarkdown.load()      -> Promise, resolves once the libraries are in (never rejects)
//   PIMarkdown.render(md)  -> Promise<html>  (loads first; for one-off use)
//   PIMarkdown.html(md)    -> html, sync     (call after load())
//   PIMarkdown.inline(md)  -> html, sync     (no <p> wrapper — bylines, one-liners)
//   PIMarkdown.text(md)    -> plain text     (for clamped excerpts and titles)
//
// marked parses, DOMPurify sanitizes: editors are ordinary members and the
// site CSP allows inline script, so raw HTML in markdown must never reach the
// DOM. `breaks: true` keeps single newlines as line breaks — these fields were
// plain text until Session 56 and were written that way. If either CDN script
// fails to load, text is shown escaped, with its line breaks, rather than not
// at all.
(function () {
  var MARKED = 'https://cdn.jsdelivr.net/npm/marked@9/marked.min.js';
  var PURIFY = 'https://cdn.jsdelivr.net/npm/dompurify@3/dist/purify.min.js';
  var ready = false;
  var loading = null;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing) {
        if (src === MARKED ? window.marked : window.DOMPurify) { resolve(); return; }
        existing.addEventListener('load', resolve);
        existing.addEventListener('error', reject);
        return;
      }
      var s = document.createElement('script');
      s.src = src; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function plainFallback(md) {
    return escapeHtml(md).split(/\n\n+/).filter(Boolean)
      .map(function (b) { return '<p>' + b.replace(/\n/g, '<br>') + '</p>'; }).join('\n');
  }

  function load() {
    if (!loading) {
      loading = Promise.all([
        window.marked ? null : loadScript(MARKED),
        window.DOMPurify ? null : loadScript(PURIFY),
      ]).then(function () {
        if (!window.marked || !window.DOMPurify) return;
        window.marked.setOptions({ gfm: true, breaks: true });
        // Links leaving the site open in a new tab.
        window.DOMPurify.addHook('afterSanitizeAttributes', function (node) {
          if (node.tagName === 'A' && /^https?:\/\//i.test(node.getAttribute('href') || '') &&
              node.hostname !== location.hostname) {
            node.setAttribute('target', '_blank');
            node.setAttribute('rel', 'noopener noreferrer');
          }
        });
        ready = true;
      }).catch(function () {});
    }
    return loading;
  }

  function html(md) {
    if (!md) return '';
    if (!ready) return plainFallback(md);
    return window.DOMPurify.sanitize(window.marked.parse(String(md)));
  }

  function inline(md) {
    if (!md) return '';
    if (!ready) return escapeHtml(md);
    return window.DOMPurify.sanitize(window.marked.parseInline(String(md)));
  }

  function text(md) {
    if (!md) return '';
    // DOMParser, not a detached div: a div's innerHTML would start fetching any images.
    var doc = new DOMParser().parseFromString(html(md), 'text/html');
    return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function render(md) {
    return load().then(function () { return html(md); });
  }

  window.PIMarkdown = { load: load, render: render, html: html, inline: inline, text: text };
}());
