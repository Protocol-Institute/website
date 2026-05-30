# CLAUDE.md — Protocol Institute Website

> **PI key registry & security policy:** see [`../admin/keys.md`](../admin/keys.md) and [`../admin/security.md`](../admin/security.md) . Do not register PI keys in `Code/.env.keys`.

This file provides guidance for LLMs working on this codebase.

## What this is

A plain HTML/CSS/JS website for the Protocol Institute at **protocol-institute.org**. No build step, no framework, no dependencies — just static files served directly by Netlify.

**Do not confuse this with `protocolized-website/`**, which is the separate Astro site for Protocolized magazine at protocolized.io.

### Two branches, two purposes

| Branch | Purpose | Deployed at |
|--------|---------|-------------|
| `main` | Live production site — plain HTML, edit and push directly | protocol-institute.org via Netlify |
| `feat/cloudflare-migration` | Future rebuild as a static site for Cloudflare Pages — development only, do not merge | (not yet live) |

All content work happens on `main`. The `feat/cloudflare-migration` branch is a long-running dev branch; never merge it into main and never push main work there.

## File structure

All pages use clean URLs: `about/index.html` is served at `/about`, etc.

```
index.html          Landing page
about/              /about
contact/            /contact
programs/           /programs
sigs/               /sigs — SIG index; see sigs/CONVENTIONS.md
  sigfpt/           /sigs/sigfpt — each SIG has a sub-index + one dir per session
  mrg/
  sigpfb/
  protfisig/
network/            /network — PIN member directory (data from Google Form)
consulting/         /consulting — consultant directory (data from Google Form)
workshops/          /workshops — Corporate Workshops offering
symposium-2025/     /symposium-2025 — 2025 symposium archive
symposium-2026/     /symposium-2026
programs/
  protocol-school/  /programs/protocol-school — biennial Protocol School program
support/            /support (embeds pitchdeck iframe)
pitchdeck/          Support deck (deck.html, deck.js, deck.css)
license/            /license — CC+ license for SoP23 outputs
members/            /members — member directory (D1-backed, PIN auth)
  join/             /members/join — login + registration flow
  edit/             /members/edit — authenticated profile editor
admin/              /admin/members — admin review panel (CF Access gated)
functions/          Cloudflare Pages Functions (API endpoints)
  _shared/tags.js   Canonical tag definitions — imported by all Workers
  api/              /api/* endpoints (members, auth, membership, admin)
db/                 D1 schema and migrations
data/
  devlog.json       Build log source of truth
  alumni.json       SoP23–25 alumni reference data (70 entries)
assets/
  logo-animated.svg   Animated logo — used only on index.html
  logo-static.png     Static logo — used on all other pages
  beings/             Profile photos (people and AI team members)
  network/            Logos for PIN member cards
css/
  style.css           All styles — single stylesheet for the whole site
js/
  main.js             Nav injection, mobile toggle, CF Analytics beacon
  tags.js             Canonical tag labels/lists for client-side pages
fetch_form_data.py  Fetch and display current Google Form responses (network + consulting)
SHEETS.md           Documents the Google Sheets update workflow and field mappings
_redirects          Legacy URL redirects (works on both Netlify and CF Pages)
```

## SIG session pages

Session URL scheme and HTML structure are specified in **[`sigs/CONVENTIONS.md`](sigs/CONVENTIONS.md)**. That file is also the reference for the c3po automated ingestion pipeline when writing new session pages.

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

## Keys

No keys are currently in use for this repo. When CF Workers are added (Phase 1+), keys will be provisioned via `../.env.keys` and inventoried in `../admin/keys.md`. Do not use `Code/.env.keys` for PI keys.

## Deployment

The site is deployed via Netlify, connected to this GitHub repo. Pushes to `main` deploy automatically. No build command — publish directory is `.`.

## At Session Start

1. Read `status-vgr.md` — review active and upcoming items from the last session.
2. Confirm you are on `main` (`git branch --show-current`). Never work on `feat/cloudflare-migration` during content sessions.
3. Briefly summarize to Venkat: any active items from `status-vgr.md` that are ready to work on.

---

## After Each Session

**Documentation (always):**
1. `status-vgr.md` — add a dated log entry with PT start–end times and a one-line summary of what changed.
2. `CLAUDE.md` — update roadmap status or file structure notes if anything changed.

**Verify (if HTML/CSS/JS changed):**
3. No build step — open the changed pages in a browser and verify before committing. Check mobile nav on narrow viewport.

**Repo:**
4. `git add` relevant files; `git commit`; `git push origin main`. Always push to `origin main` — never to the fork or the CF branch.

**Memory:**
5. Update Claude memory (`/Users/Venkat/.claude/projects/.../memory/`) — save anything non-obvious about site structure, CF migration state, or workflow preferences that would help future sessions. Do not duplicate what's in CLAUDE.md or recoverable from code.
