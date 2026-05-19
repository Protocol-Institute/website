// Protocol Institute — Shared footer + navigation

// Edit NAV_LINKS to add or reorder footer links across the whole site.
var NAV_LINKS = [
  { href: 'team.html',       label: 'Team' },
  { href: 'network.html',    label: 'Network' },
  { href: 'consulting.html', label: 'Consulting' },
  { href: 'contact.html',    label: 'Contact' },
];

(function () {
  var page = window.location.pathname.split('/').pop() || 'index.html';

  var siteFt = document.querySelector('.site-footer');
  if (siteFt) {
    var items = NAV_LINKS.map(function (l) {
      var curr = l.href === page ? ' aria-current="page"' : '';
      return '<a href="' + l.href + '"' + curr + '>' + l.label + '</a>';
    }).join('\n      ');
    siteFt.innerHTML =
      '<nav class="footer-nav" aria-label="Footer navigation">\n      ' +
      items + '\n    </nav>\n    <p>&copy; 2025 The Protocol Institute</p>';
  }

  var landingFt = document.querySelector('.landing-footer');
  if (landingFt) {
    var parts = NAV_LINKS.map(function (l) {
      var curr = l.href === page ? ' aria-current="page"' : '';
      return '<a href="' + l.href + '"' + curr + '>' + l.label + '</a>';
    });
    landingFt.innerHTML =
      '<p>' + parts.join('&nbsp;&nbsp;&middot;&nbsp;&nbsp;') +
      '&nbsp;&nbsp;&middot;&nbsp;&nbsp;&copy; 2025 The Protocol Institute</p>';
  }
}());

// Navigation toggle for mobile

(function () {
  var toggle = document.getElementById('nav-toggle');
  var links = document.getElementById('nav-links');

  if (!toggle || !links) return;

  toggle.addEventListener('click', function () {
    var isOpen = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    toggle.textContent = isOpen ? '✕' : '≡';
  });

  // Close nav when a link is clicked
  links.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      links.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.textContent = '≡';
    });
  });
}());
