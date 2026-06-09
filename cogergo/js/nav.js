// Cogergo — nav + footer injection (mirrors PI main.js pattern)

var PERSON_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/></svg>';

var NAV_HTML =
  '<nav class="site-nav" aria-label="Site navigation">' +
    '<a href="/" class="nav-brand">' +
      '<img src="https://protocol-institute.org/assets/logo-static.png" alt="" class="nav-logo">' +
      'Cognitive Ergonomics' +
    '</a>' +
    '<a href="https://protocol-institute.org/members/join" class="nav-member-link" id="nav-member-link">' + PERSON_ICON + 'Log in</a>' +
    '<button class="nav-toggle" id="nav-toggle" aria-controls="nav-links" aria-expanded="false" aria-label="Toggle navigation">&#8801;</button>' +
    '<ul class="nav-links" id="nav-links" role="list">' +
      '<li><a href="/submit" id="nav-submit-link" style="display:none">Submit entry</a></li>' +
      '<li><a href="/admin" id="nav-admin-link" style="display:none">Admin</a></li>' +
      '<li><a href="https://protocol-institute.org" target="_blank" rel="noopener noreferrer">Protocol Institute ↗</a></li>' +
    '</ul>' +
  '</nav>';

var FOOTER_HTML =
  '<nav class="footer-nav" aria-label="Footer navigation">' +
    '<a href="/">Index</a>' +
    '<a href="/submit">Submit entry</a>' +
    '<a href="https://protocol-institute.org/projects/project?slug=cognitive-ergonomics">Project page</a>' +
    '<a href="https://protocol-institute.org">Protocol Institute</a>' +
  '</nav>' +
  '<p>&copy; 2025 The Protocol Institute · Cognitive Ergonomics project</p>';

(function () {
  var header = document.getElementById('site-header');
  if (header) {
    header.innerHTML = NAV_HTML;

    // Session check
    fetch('/api/me')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data || !data.member) return;
        var memberLink = document.getElementById('nav-member-link');
        var submitLink = document.getElementById('nav-submit-link');
        var adminLink  = document.getElementById('nav-admin-link');

        // Swap login link for member name dropdown
        if (memberLink) {
          var safeName = data.member.name.replace(/[&<>"]/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
          });
          var wrapper = document.createElement('div');
          wrapper.className = 'nav-member-menu';
          wrapper.innerHTML =
            '<button class="nav-member-link nav-member-link--authed nav-member-toggle" id="nav-member-toggle" aria-expanded="false" aria-haspopup="true">' +
              PERSON_ICON + safeName + '<span class="nav-member-caret">&#9662;</span>' +
            '</button>' +
            '<ul class="nav-member-dropdown" id="nav-member-dropdown" hidden>' +
              '<li><a href="https://protocol-institute.org/members/edit">Edit profile</a></li>' +
              '<li><button id="nav-logout-btn">Log out</button></li>' +
            '</ul>';
          memberLink.replaceWith(wrapper);

          document.getElementById('nav-member-toggle').addEventListener('click', function (e) {
            e.stopPropagation();
            var dd = document.getElementById('nav-member-dropdown');
            dd.hidden = !dd.hidden;
            this.setAttribute('aria-expanded', String(!dd.hidden));
          });
          document.addEventListener('click', function () {
            var dd = document.getElementById('nav-member-dropdown');
            if (dd && !dd.hidden) { dd.hidden = true; document.getElementById('nav-member-toggle').setAttribute('aria-expanded', 'false'); }
          });
          document.getElementById('nav-logout-btn').addEventListener('click', function () {
            fetch('/api/auth/logout', { method: 'POST' })
              .then(function () { window.location.reload(); })
              .catch(function () { window.location.reload(); });
          });
        }

        if (submitLink) submitLink.style.display = '';
        if (adminLink && data.member.is_admin) adminLink.style.display = '';
      })
      .catch(function () {});

    // Set return URL on login link
    var loginLink = document.getElementById('nav-member-link');
    if (loginLink && window.location.pathname.indexOf('/members') !== 0) {
      loginLink.href = 'https://protocol-institute.org/members/join?return=' + encodeURIComponent(window.location.href);
    }

    // Active link
    var path = window.location.pathname.replace(/\/$/, '') || '/';
    header.querySelectorAll('.nav-links a').forEach(function (a) {
      var href = a.getAttribute('href');
      if (!href || href.startsWith('http')) return;
      var h = href.replace(/\/$/, '') || '/';
      if (h === '/' ? path === '/' : path === h || path.startsWith(h + '/')) {
        a.classList.add('active');
      }
    });
  }

  var footer = document.querySelector('.site-footer');
  if (footer) footer.innerHTML = FOOTER_HTML;

  // Mobile toggle
  var toggle = document.getElementById('nav-toggle');
  var links  = document.getElementById('nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? '✕' : '≡';
    });
  }
}());
