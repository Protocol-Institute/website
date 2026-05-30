// Protocol Institute — Shared nav injection + mobile toggle

// CF Web Analytics beacon
(function () {
  var s = document.createElement('script');
  s.defer = true;
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  s.setAttribute('data-cf-beacon', '{"token": "5d26701bc38c4ee38a6d2c82a7c0c8a4"}');
  document.head.appendChild(s);
}());

var NAV_HTML =
  '<nav class="site-nav" aria-label="Site navigation">' +
    '<a href="/" class="nav-brand"><img src="/assets/logo-static.png" alt="" class="nav-logo">The Protocol Institute</a>' +
    '<button class="nav-toggle" id="nav-toggle" aria-controls="nav-links" aria-expanded="false" aria-label="Toggle navigation">&#8801;</button>' +
    '<ul class="nav-links" id="nav-links" role="list">' +
      '<li><a href="/programs">Programs</a></li>' +
      '<li><a href="https://protocolized.io" target="_blank" rel="noopener noreferrer">Protocolized</a></li>' +
      '<li><a href="/about">About</a></li>' +
      '<li><a href="/support">Support Us</a></li>' +
      '<li><a href="/contact">Contact</a></li>' +
    '</ul>' +
  '</nav>';

(function () {
  // Inject nav
  var header = document.getElementById('site-header');
  if (header) {
    header.innerHTML = NAV_HTML;

    // Mark active link based on current path
    var path = window.location.pathname.replace(/\/$/, '') || '/';
    header.querySelectorAll('.nav-links a').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href || href.startsWith('http')) return;
      var hrefNorm = href.replace(/\/$/, '') || '/';
      if (hrefNorm === '/' ? path === '/' : path === hrefNorm || path.startsWith(hrefNorm + '/')) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  // Mobile toggle
  var toggle = document.getElementById('nav-toggle');
  var links = document.getElementById('nav-links');

  if (!toggle || !links) return;

  toggle.addEventListener('click', function () {
    var isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    toggle.textContent = isOpen ? '✕' : '≡';
  });

  links.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = '≡';
    });
  });
}());
