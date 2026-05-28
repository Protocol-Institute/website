'use strict';

let slides = [];
let currentIndex = 0;
let meta = {};

// ── Entry point ─────────────────────────────────────────

document.addEventListener('DOMContentLoaded', init);

async function init() {
  try {
    const res = await fetch('deck.md');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    ({ meta, slides } = parseDeck(text));
    renderDeck();
    goTo(0);
    setupNav();
    setupKeyboard();
  } catch (err) {
    document.getElementById('slides-wrapper').innerHTML =
      `<div class="slide slide-error active" style="opacity:1">
         <div class="slide-inner center">
           <p>Could not load deck.md — ${err.message}</p>
           <p style="font-size:0.8rem;margin-top:0.5rem">
             The deck must be served over HTTP/HTTPS, not opened as a local file.
           </p>
         </div>
       </div>`;
  }
}

// ── Parser ───────────────────────────────────────────────

function parseDeck(text) {
  // Extract YAML frontmatter between opening and closing ---
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

  // Split on <!-- slide: TYPE --> markers
  // Parts: ['pre', 'type1', 'content1', 'type2', 'content2', ...]
  const parts = body.split(/<!--\s*slide:\s*([\w-]+)\s*-->/);

  const slides = [];
  for (let i = 1; i < parts.length; i += 2) {
    slides.push({
      type: parts[i].trim(),
      content: (parts[i + 1] || '').trim(),
    });
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
    el.innerHTML = buildSlideHTML(slide);
    wrapper.appendChild(el);
  });

  const versionEl = document.getElementById('deck-version');
  if (meta.version) versionEl.textContent = `v${meta.version}`;

  updateCounter();
}

function buildSlideHTML(slide) {
  const { type, content } = slide;

  switch (type) {
    case 'cover':
    case 'section':
    case 'big-point':
    case 'quote':
      return `<div class="slide-inner center">${md(content)}</div>`;

    case 'big-image':
      return `<div class="slide-inner big-image-inner center">${md(content)}</div>`;

    case 'two-column':
      return buildTwoColumn(content);

    default:
      // bullets, numbered, table, and any unknown type
      return `<div class="slide-inner">${md(content)}</div>`;
  }
}

function buildTwoColumn(content) {
  const splitRe = /<!--\s*split\s*-->/;
  const splitMatch = content.match(splitRe);

  if (!splitMatch) {
    return `<div class="slide-inner">${md(content)}</div>`;
  }

  const splitIdx = content.search(splitRe);
  const left  = content.slice(0, splitIdx).trim();
  const right = content.slice(splitIdx + splitMatch[0].length).trim();

  // If the left side starts with a heading, hoist it above the grid
  const headingRe = /^(#{1,3} .+)(\r?\n|$)/;
  const headingMatch = left.match(headingRe);
  let heading = '';
  let leftBody = left;

  if (headingMatch) {
    heading = `<div class="two-col-heading">${md(headingMatch[1])}</div>`;
    leftBody = left.slice(headingMatch[0].length).trim();
  }

  return `<div class="slide-inner">
    ${heading}
    <div class="two-col">
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
  const all = document.querySelectorAll('.slide');
  all.forEach((el, i) => {
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
    }
  });
}
