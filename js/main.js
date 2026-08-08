// Protocol Institute — Shared nav injection + mobile toggle

// CF Web Analytics beacon
(function () {
  var s = document.createElement('script');
  s.defer = true;
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  s.setAttribute('data-cf-beacon', '{"token": "5d26701bc38c4ee38a6d2c82a7c0c8a4"}');
  document.head.appendChild(s);
}());

var PERSON_ICON = '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="currentColor" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H3zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/></svg>';

var NAV_HTML =
  '<nav class="site-nav" aria-label="Site navigation">' +
    '<a href="/" class="nav-brand"><img src="/assets/logo-static.png" alt="" class="nav-logo">The Protocol Institute</a>' +
    '<a href="/members/join" class="nav-member-link" id="nav-member-link">' + PERSON_ICON + 'Member Login / Register</a>' +
    '<button class="nav-toggle" id="nav-toggle" aria-controls="nav-links" aria-expanded="false" aria-label="Toggle navigation">&#8801;</button>' +
    '<ul class="nav-links" id="nav-links" role="list">' +
      '<li><a href="/programs">Programs</a></li>' +
      '<li><a href="/sigs">SIGs</a></li>' +
      '<li><a href="/events">Events</a></li>' +
      '<li><a href="/research">Research <span class="beta-badge">Beta</span></a></li>' +
      '<li><a href="https://protocolized.io" target="_blank" rel="noopener noreferrer">Protocolized</a></li>' +
      '<li class="nav-more-menu" id="nav-more-menu">' +
        '<button class="nav-more-toggle" id="nav-more-toggle" aria-expanded="false" aria-haspopup="true">More <span class="nav-member-caret">&#9662;</span></button>' +
        '<ul class="nav-more-dropdown" id="nav-more-dropdown">' +
          '<li><a href="/about">About</a></li>' +
          '<li><a href="/network">Network</a></li>' +
          '<li><a href="/events/protocol-symposium-2026">Symposium</a></li>' +
          '<li><a href="/contact">Contact</a></li>' +
          '<li><a href="/members">Members</a></li>' +
          '<li><a href="/support">Support Us</a></li>' +
        '</ul>' +
      '</li>' +
      '<li class="nav-mobile-auth" id="nav-mobile-auth"><a href="/members/join" id="nav-mobile-login-link">' + PERSON_ICON + ' Member Login / Register</a></li>' +
    '</ul>' +
  '</nav>';

var FOOTER_HTML =
  '<nav class="footer-nav" aria-label="Footer navigation">' +
    '<a href="/about">About</a>' +
    '<a href="/network">Network</a>' +
    '<a href="/events/protocol-symposium-2026">Symposium</a>' +
    '<a href="/contact">Contact</a>' +
    '<a href="/members">Members</a>' +
    '<a href="/support">Support Us</a>' +
  '</nav>' +
  '<p>&copy; 2025 The Protocol Institute</p>';

(function () {
  // Inject nav
  var header = document.getElementById('site-header');
  if (header) {
    header.innerHTML = NAV_HTML;

    // Set ?return= on all /members/join links (nav + mobile + in-page gates)
    var memberLink = document.getElementById('nav-member-link');
    if (window.location.pathname.indexOf('/members/join') !== 0) {
      var returnHref = '/members/join?return=' + encodeURIComponent(window.location.pathname + window.location.search);
      document.querySelectorAll('a[href^="/members/join"]').forEach(function (a) {
        if (a.getAttribute('href').indexOf('return=') === -1) {
          a.href = returnHref;
        }
      });
    }

    function doLogout() {
      fetch('/api/auth/logout', { method: 'POST' })
        .then(function () { window.location.reload(); })
        .catch(function () { window.location.reload(); });
    }

    // Session check — swap login link for member dropdown if authenticated
    fetch('/api/members/me')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) {
        if (!data) return;
        var mobileAuth = document.getElementById('nav-mobile-auth');
        var label, editItem, mobileHTML;

        if (data.member) {
          label = data.member.name.replace(/[&<>"]/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
          });
          var adminItem = data.member.is_admin
            ? '<li><a href="/admin/">Admin</a></li>' : '';
          editItem = '<li><a href="/members/dashboard/">My Dashboard</a></li>' +
            '<li><a href="/members/edit">Edit profile</a></li>' +
            adminItem;
          mobileHTML = '<a href="/members/dashboard/">My Dashboard</a>' +
            '<a href="/members/edit">Edit profile</a>' +
            (data.member.is_admin ? '<a href="/admin/">Admin</a>' : '') +
            '<button class="nav-mobile-logout" id="nav-mobile-logout-btn">Log out</button>';
        } else if (data.pending) {
          label = 'Pending Approval';
          editItem = '';
          mobileHTML = '<span class="nav-mobile-pending">Pending Approval</span>' +
            '<button class="nav-mobile-logout" id="nav-mobile-logout-btn">Log out</button>';
        } else {
          return;
        }

        // Desktop dropdown
        if (memberLink) {
          var wrapper = document.createElement('div');
          wrapper.className = 'nav-member-menu';
          wrapper.innerHTML =
            '<button class="nav-member-link nav-member-link--authed nav-member-toggle" id="nav-member-toggle" aria-expanded="false" aria-haspopup="true">' +
              PERSON_ICON + label + '<span class="nav-member-caret">&#9662;</span>' +
            '</button>' +
            '<ul class="nav-member-dropdown" id="nav-member-dropdown" hidden>' +
              editItem +
              '<li><button id="nav-logout-btn">Log out</button></li>' +
            '</ul>';
          memberLink.replaceWith(wrapper);

          var toggle = document.getElementById('nav-member-toggle');
          var dropdown = document.getElementById('nav-member-dropdown');
          toggle.addEventListener('click', function (e) {
            e.stopPropagation();
            var isOpen = !dropdown.hidden;
            dropdown.hidden = isOpen;
            toggle.setAttribute('aria-expanded', String(!isOpen));
          });
          document.addEventListener('click', function () {
            if (!dropdown.hidden) {
              dropdown.hidden = true;
              toggle.setAttribute('aria-expanded', 'false');
            }
          });
          document.getElementById('nav-logout-btn').addEventListener('click', doLogout);
        }

        // Mobile hamburger auth item
        if (mobileAuth) {
          mobileAuth.innerHTML = mobileHTML;
          var mobileLogout = document.getElementById('nav-mobile-logout-btn');
          if (mobileLogout) mobileLogout.addEventListener('click', doLogout);
        }
      })
      .catch(function () {});

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

    // More dropdown
    var moreToggle = document.getElementById('nav-more-toggle');
    var moreDropdown = document.getElementById('nav-more-dropdown');
    if (moreToggle && moreDropdown) {
      if (moreDropdown.querySelector('a.active')) {
        moreToggle.classList.add('active');
      }
      moreToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = moreDropdown.classList.toggle('is-open');
        moreToggle.setAttribute('aria-expanded', String(isOpen));
      });
      document.addEventListener('click', function () {
        if (moreDropdown.classList.contains('is-open')) {
          moreDropdown.classList.remove('is-open');
          moreToggle.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }

  // Inject footer
  var footer = document.querySelector('.site-footer');
  if (footer) footer.innerHTML = FOOTER_HTML;

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

// SIG meeting schedule — populates [data-sig] elements from /data/sig-meetings.json
(function () {
  var els = document.querySelectorAll('[data-sig]');
  if (!els.length) return;

  var MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
  var DOW = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

  function fmt(sig, slug) {
    if (!sig.occurrences || !sig.occurrences.length) return '';
    var now = new Date();
    var next = null;
    for (var i = 0; i < sig.occurrences.length; i++) {
      var d = new Date(sig.occurrences[i]);
      if (d >= now) { next = d; break; }
    }
    if (!next) return '';

    var chan = window.PI_SIGS && window.PI_SIGS[slug];

    var freq = sig.interval_weeks === 1 ? 'weekly' : 'biweekly';
    var days = sig.day + 's';

    // UTC time from the actual occurrence (correct across DST boundaries)
    var utcH = String(next.getUTCHours()).padStart(2, '0');
    var utcM = String(next.getUTCMinutes()).padStart(2, '0');
    var utcTime = utcH + ':' + utcM;

    // Local time via browser timezone
    var localTime = next.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', timeZoneName: 'short'});

    // Append local day name only when the meeting crosses midnight for this viewer
    var localDow = DOW[next.getDay()];
    var utcDow = DOW[next.getUTCDay()];
    var dayNote = localDow !== utcDow ? ' ' + localDow : '';

    var nextStr = MONTHS[next.getUTCMonth()] + ' ' + next.getUTCDate();

    var discordLink = chan ?
      '<a href="https://discord.com/channels/' + window.PI_DISCORD_GUILD_ID + '/' + chan.channelId + '" target="_blank" rel="noopener">#' + chan.channelName + '</a> (Discord voice channel)' :
      'Discord voice channel';

    return 'Meets ' + freq + ' on ' + days + ' at ' + utcTime +
           ' UTC (' + localTime + dayNote + ' your local time) on ' + discordLink + '.' +
           ' Next meeting on ' + nextStr + ', <a href="/events#sig-' + slug + '">view calendar entry</a>.';
  }

  fetch('/data/sig-meetings.json')
    .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
    .then(function (data) {
      els.forEach(function (el) {
        var slug = el.getAttribute('data-sig');
        var sig = data.sigs && data.sigs[slug];
        if (sig) el.innerHTML = fmt(sig, slug);
      });
    })
    .catch(function () {});
}());
