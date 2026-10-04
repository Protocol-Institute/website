// markdown.js — shared markdown renderer for D1-managed page content.
//
// Exposes window.PIMarkdown.render(md) -> Promise<string> of sanitized HTML.
// Used by managed-page.js (viewing an About page) and programs/edit (the
// editor's Preview tab), so both surfaces render the same way.
//
// marked parses, DOMPurify sanitizes: hosts are not admins and the site CSP
// allows inline script, so raw HTML in markdown must never reach the DOM.
// If either CDN script fails to load, the markdown is shown as escaped
// paragraphs rather than nothing.
(function () {
  var MARKED = 'https://cdn.jsdelivr.net/npm/marked@9/marked.min.js';
  var PURIFY = 'https://cdn.jsdelivr.net/npm/dompurify@3/dist/purify.min.js';

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
    return escapeHtml(md).split(/\n\n+/).filter(Boolean)
      .map(function (b) { return '<p>' + b.replace(/\n/g, '<br>') + '</p>'; }).join('\n');
  }

  function render(md) {
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

  window.PIMarkdown = { render: render };
}());
