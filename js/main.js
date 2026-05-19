// Protocol Institute — Navigation toggle for mobile

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
