'use strict';

let slides = [];
let currentIndex = 0;
let meta = {};

const SVG_EXPAND = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1,4.5 1,1 4.5,1"/><polyline points="8.5,1 12,1 12,4.5"/><polyline points="12,8.5 12,12 8.5,12"/><polyline points="1,8.5 1,12 4.5,12"/></svg>`;
const SVG_COLLAPSE = `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="1,4.5 4.5,4.5 4.5,1"/><polyline points="8.5,1 8.5,4.5 12,4.5"/><polyline points="12,8.5 8.5,8.5 8.5,12"/><polyline points="4.5,12 4.5,8.5 1,8.5"/></svg>`;

// ── Entry point ─────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  try {
    const el = document.getElementById('deck-content');
    if (!el) throw new Error('deck-content element missing from deck.html');
    const text = el.textContent.trim();
    if (!text) throw new Error('deck-content is empty');
    ({ meta, slides } = parseDeck(text));
    renderDeck();
    goTo(0);
    setupNav();
    setupKeyboard();
    setupFullscreen();
  } catch (err) {
    document.getElementById('slides-wrapper').innerHTML =
      `<div class="slide slide-error active" style="opacity:1">
         <div class="slide-inner center">
           <p>Deck error — ${err.message}</p>
         </div>
       </div>`;
  }
});

// ── Parser ───────────────────────────────────────────────

function parseDeck(text) {
  let meta = {};
  let body = text;

  const fmMatch = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (fmMatch) {
    fmMatch[1].split('\n').forEach(line => {
      const colon = line.indexOf(':');
      if (colon > 0) {
        const k = line.slice(0, colon).trim();
        const v = line.slice(colon + 1).trim().replace(/^["']|["']$/g, '');
        meta[k] = v;
      }
    });
    body = fmMatch[2];
  }

  const parts = body.split(/<!--\s*slide:\s*([\w-]+)\s*-->/);
  const slides = [];
  for (let i = 1; i < parts.length; i += 2) {
    slides.push({ type: parts[i].trim(), content: (parts[i + 1] || '').trim() });
  }

  return { meta, slides };
}

// ── Renderer ─────────────────────────────────────────────

function renderDeck() {
  const wrapper = document.getElementById('slides-wrapper');
  wrapper.innerHTML = '';

  slides.forEach((slide, i) => {
    const el = document.createElement('div');
    el.className = `slide slide-${slide.type}`;
    el.dataset.index = i;
    el.setAttribute('role', 'region');
    el.setAttribute('aria-label', `Slide ${i + 1} of ${slides.length}`);
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML = buildSlideHTML(slide, i);
    wrapper.appendChild(el);
  });

  if (meta.version) document.getElementById('deck-version').textContent = `v${meta.version}`;
  updateCounter();
}

function buildSlideHTML(slide, index) {
  const { type, content } = slide;

  switch (type) {
    case 'cover':
      return buildCover(content, index === 0);
    case 'section':
      return `<div class="slide-inner center">${md(content)}</div>`;
    case 'big-point':
      return `<div class="slide-inner">${md(content)}</div>`;
    case 'quote':
      return `<div class="slide-inner">${md(content)}</div>`;
    case 'big-image':
      return buildBigImage(content);
    case 'two-column':
      return buildTwoColumn(content);
    case 'two-bullets':
      return buildTwoBullets(content);
    default:
      return `<div class="slide-inner">${md(content)}</div>`;
  }
}

function buildCover(content, isTitle) {
  const bodyHtml = md(content);
  const versionHtml = (isTitle && meta.version)
    ? `<span class="cover-version">v${meta.version}</span>`
    : '';
  return `<div class="slide-inner center">${bodyHtml}${versionHtml}</div>`;
}

function buildBigImage(content) {
  // Extract optional heading from the start of content
  const headingRe = /^(#{1,3} [^\n]+)\n/;
  const hm = content.match(headingRe);
  let titleHtml = '';
  let body = content;

  if (hm) {
    titleHtml = `<div class="big-image-title">${md(hm[1])}</div>`;
    body = content.slice(hm[0].length).trim();
  }

  // Isolate the image line and caption line
  const lines = body.split('\n');
  const imgLine  = lines.find(l => /^\s*!\[/.test(l));
  const capLine  = lines.find(l => /^\s*\*[^*\s]/.test(l) || /^\s*_[^_\s]/.test(l));

  const imgHtml = imgLine
    ? md(imgLine.trim()).replace(/^<p>|<\/p>\s*$/g, '')
    : '';
  const capHtml = capLine
    ? md(capLine.trim()).replace(/^<p>|<\/p>\s*$/g, '')
    : '';

  return `<div class="slide-inner big-image-inner">
    ${titleHtml}
    <div class="big-image-body">
      ${imgHtml ? `<div class="big-image-img">${imgHtml}</div>` : ''}
      ${capHtml ? `<p class="big-image-cap">${capHtml}</p>` : ''}
    </div>
  </div>`;
}

function buildTwoColumn(content) {
  return buildSplit(content, 'two-col');
}

function buildTwoBullets(content) {
  return buildSplit(content, 'two-bullets-grid');
}

function buildSplit(content, gridClass) {
  const splitRe = /<!--\s*split\s*-->/;
  const splitMatch = content.match(splitRe);

  if (!splitMatch) {
    return `<div class="slide-inner">${md(content)}</div>`;
  }

  const splitIdx = content.search(splitRe);
  const left  = content.slice(0, splitIdx).trim();
  const right = content.slice(splitIdx + splitMatch[0].length).trim();

  // Hoist h1/h2 from the left side above the grid
  const headingRe = /^(#{1,2} .+)(\r?\n|$)/;
  const hm = left.match(headingRe);
  let heading = '';
  let leftBody = left;

  if (hm) {
    heading = `<div class="two-col-heading">${md(hm[1])}</div>`;
    leftBody = left.slice(hm[0].length).trim();
  }

  return `<div class="slide-inner">
    ${heading}
    <div class="${gridClass}">
      <div class="col-left">${md(leftBody)}</div>
      <div class="col-right">${md(right)}</div>
    </div>
  </div>`;
}

function md(text) {
  return marked.parse(text);
}

// ── Navigation ───────────────────────────────────────────

function goTo(index) {
  document.querySelectorAll('.slide').forEach((el, i) => {
    const active = i === index;
    el.classList.toggle('active', active);
    el.setAttribute('aria-hidden', String(!active));
  });
  currentIndex = index;
  updateCounter();
  updateButtons();
}

function updateCounter() {
  document.getElementById('slide-counter').textContent =
    slides.length ? `${currentIndex + 1} / ${slides.length}` : '— / —';
}

function updateButtons() {
  document.getElementById('btn-prev').disabled = currentIndex <= 0;
  document.getElementById('btn-next').disabled = currentIndex >= slides.length - 1;
}

function setupNav() {
  document.getElementById('btn-prev').addEventListener('click', () => {
    if (currentIndex > 0) goTo(currentIndex - 1);
  });
  document.getElementById('btn-next').addEventListener('click', () => {
    if (currentIndex < slides.length - 1) goTo(currentIndex + 1);
  });
}

function setupKeyboard() {
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      if (currentIndex > 0) goTo(currentIndex - 1);
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
      if (currentIndex < slides.length - 1) goTo(currentIndex + 1);
      if (e.key === ' ') e.preventDefault();
    } else if (e.key === 'f' || e.key === 'F') {
      toggleFullscreen();
    }
  });
}

// ── Fullscreen ───────────────────────────────────────────

function setupFullscreen() {
  updateFullscreenBtn();
  document.getElementById('btn-fullscreen').addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', updateFullscreenBtn);
  document.addEventListener('webkitfullscreenchange', updateFullscreenBtn);
}

function toggleFullscreen() {
  const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
  if (!isFS) {
    const el = document.documentElement;
    (el.requestFullscreen || el.webkitRequestFullscreen).call(el).catch(() => {});
  } else {
    (document.exitFullscreen || document.webkitExitFullscreen).call(document).catch(() => {});
  }
}

function updateFullscreenBtn() {
  const isFS = !!(document.fullscreenElement || document.webkitFullscreenElement);
  const btn = document.getElementById('btn-fullscreen');
  if (!btn) return;
  btn.innerHTML = isFS ? SVG_COLLAPSE : SVG_EXPAND;
  btn.setAttribute('aria-label', isFS ? 'Exit fullscreen' : 'Enter fullscreen');
  btn.title = isFS ? 'Exit fullscreen (Esc)' : 'Enter fullscreen (F)';
}
