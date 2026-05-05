# CLAUDE.md — Protocol Institute Website

This file provides guidance for LLMs working on this codebase.

## What this is

A simple static website for the Protocol Institute, an independent research organization focused on protocol technologies. It is plain HTML, CSS, and JavaScript — no build step, no framework.

## File structure

```
index.html          Landing page
about.html          About the Institute
contact.html        Contact page
projects.html       Initiatives listing page
sigs.html           Special Interest Groups page
worldbuilding.html  Worldbuilding initiative (stub)
assets/
  logo-animated.svg   Animated logo — used only on index.html
  logo-static.png     Static logo — used on all other pages
  logo.svg            Original logo (favicon fallback)
css/
  style.css           All styles — single stylesheet for the whole site
js/
  main.js             Minimal JS for mobile nav toggle
_redirects          Netlify redirect rules
```

## Design conventions

- **Fonts**: Cormorant Garamond (headings) and DM Sans (body), loaded from Google Fonts
- **Colors**: Off-white background `#FAFAF7`, dark text `#1A1A1A`, teal accent `#2A6B6B`
- **Max content width**: 760px, centered
- **All interior pages** share the same nav, footer, and `.interior-wrapper` layout
- **Landing page** (`index.html`) uses a distinct fullscreen centered layout with `.landing-wrapper`

## Logos

- The animated SVG (`assets/logo-animated.svg`) is used **only** on the landing page (`index.html`) as the `.landing-mark`
- All other pages use the static PNG (`assets/logo-static.png`) in the nav and as the favicon

## Adding a new page

Copy the structure of an existing interior page (e.g. `about.html`). Make sure to:
- Use `<div class="interior-wrapper">` as the root
- Include the standard `<nav class="site-nav">` with all four nav links
- Add `class="active"` to the correct nav link
- Use `<div class="page-header"><h1>Page Title</h1></div>` for the page heading
- Link to `css/style.css` and `js/main.js`
- Update the favicon to `assets/logo-static.png`

## Adding a new initiative

Add a new `<li class="project-item">` block to `projects.html`. Use `status-active` or `status-completed` on the status badge. Link to a dedicated subpage rather than putting outlinks directly on the initiatives listing.

## Tone and copy

Writing should be measured, institutional, and precise. Avoid marketing language. The Institute's work is interdisciplinary — references to organizational theory, infrastructure, governance, and protocol research are appropriate and expected.

## Key links

- Protocolized magazine: https://protocolized.io
- Protocolized Substack: https://protocolized.summerofprotocols.com
- Summer of Protocols archive: https://web.archive.org/web/20260421142108/https://summerofprotocols.com/
- Community Discord: https://discord.gg/Aj5FbGsNYV
- Contact email: team@protocol-institute.org

## Deployment

The site is deployed via Netlify, connected to this GitHub repo. Pushes to `main` deploy automatically. No build command — publish directory is `.`.
