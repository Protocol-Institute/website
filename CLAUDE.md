# CLAUDE.md — Protocol Institute Website

> **PI key registry & security policy:** see [`../admin/keys.md`](../admin/keys.md) and [`../admin/security.md`](../admin/security.md) . Do not register PI keys in `Code/.env.keys`.

This file provides guidance for LLMs working on this codebase.

## What this is

A plain HTML/CSS/JS website for the Protocol Institute at **protocol-institute.org**. No build step, no framework, no dependencies — just static files served by Cloudflare Pages.

**Do not confuse this with `protocolized-website/`**, which is the separate Astro site for Protocolized magazine at protocolized.io.

### One branch

All content work happens on `main`. Pushes to `main` deploy automatically via Cloudflare Pages.

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
  drg/              Distributed Robotics Group — coming soon
  sigpsy/           Special Interest Group in Psychohistory — coming soon
network/            /network — PIN member directory (data from Google Form)
consulting/         /consulting — consultant directory (data from Google Form)
workshops/          /workshops — Corporate Workshops offering
symposium-2025/     /symposium-2025 — 2025 symposium archive
programs/
  protocol-school/  /programs/protocol-school — biennial Protocol School program
support/            /support (embeds pitchdeck iframe)
pitchdeck/          Support deck (deck.html, deck.js, deck.css, marked.min.js)
license/            /license — CC+ license for SoP23 outputs
members/            /members — member directory (D1-backed, PIN auth)
  join/             /members/join — login + registration flow
  edit/             /members/edit — authenticated profile editor
admin/              /admin/members — admin review panel (CF Access gated)
functions/          Cloudflare Pages Functions (API endpoints)
  assets/[[path]].js  R2 proxy — intercepts ALL /assets/* requests, serves from pi-assets R2 bucket
  _shared/tags.js   Canonical tag definitions — imported by all Workers
  api/              /api/* endpoints (members, auth, membership, admin)
db/                 D1 schema and migrations
data/
  devlog.json       Build log source of truth
  alumni.json       SoP23–25 alumni reference data (70 entries)
assets/             SVG files only — binary assets (PNG/JPG/WEBP) are in R2, not git
  logo-animated.svg   Animated logo — used only on index.html
inbox/              Local staging for new assets before R2 upload — gitignored
css/
  style.css           All styles — single stylesheet for the whole site
js/
  main.js             Nav injection, mobile toggle, CF Analytics beacon
  tags.js             Canonical tag labels/lists for client-side pages
fetch_form_data.py  Fetch and display current Google Form responses (network + consulting)
SHEETS.md           Documents the Google Sheets update workflow and field mappings
_redirects          Legacy URL redirects (CF Pages native support)
```

## Binary assets (images)

Binary assets (PNG, JPG, WEBP) are **not committed to git**. They live in the R2 bucket `pi-assets` and are served at `/assets/<filename>` via `functions/assets/[[path]].js`.

**To add a new image:**
1. Drop the file into `inbox/` (gitignored)
2. Upload to R2: `npx wrangler r2 object put pi-assets/<filename> --file inbox/<filename> --content-type image/png --remote`
3. Reference in HTML as `/assets/<filename>`
4. Do not `git add` the image file

SVG files (logo, icons) are the exception — they stay in `assets/` and are tracked in git.

## SIG session pages

Session URL scheme and HTML structure are specified in **[`sigs/CONVENTIONS.md`](sigs/CONVENTIONS.md)**. That file is also the reference for the c3po automated ingestion pipeline when writing new session pages.

## Design conventions

- **Fonts**: Cormorant Garamond (headings) and DM Sans (body), loaded from Google Fonts
- **Colors**: Off-white background `#FAFAF7`, dark text `#1A1A1A`, teal accent `#2A6B6B`
- **Max content width**: 760px, centered
- **All interior pages** share the same nav, footer, and `.interior-wrapper` layout
- **Landing page** (`index.html`) uses a distinct fullscreen centered layout with `.landing-wrapper`
- **CSS**: single stylesheet `css/style.css`. Both nav contexts (`.site-nav` interior, `.landing-wrapper` nav) must share `max-width: 760px; margin: 0 auto` to keep layout consistent.
- **Draft pages** use `.draft-banner` (yellow/amber, `#FFF8E7`) until ready to publish

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

Keys for D1, R2, Resend, and CF Access are set as CF Pages secrets in the Cloudflare dashboard — not in `.env` files in this repo. See `../admin/keys.md` for the inventory. Do not use `Code/.env.keys` for PI keys.

## Governance & workflow

The primary maintainer has org admin on Protocol-Institute and direct push access to `main`. Use the fork (`vgururao/website`) only for changes that need review — push a branch there, open a PR to upstream, delete the branch after merge.

## Deployment

The site is deployed via Cloudflare Pages, connected to this GitHub repo. Pushes to `main` deploy automatically. No build command — publish directory is `.` (configured in `wrangler.toml`). CF Pages Functions in `functions/` handle all API endpoints. D1 database binding: `DB` (`pi-members`). R2 bucket binding: `ASSETS_BUCKET` (`pi-assets`).

## At Session Start

1. Read `status.md` — review active and upcoming items from the last session.
2. Confirm you are on `main` (`git branch --show-current`).
3. Briefly summarize: any active items from `status.md` that are ready to work on.

---

## After Each Session

**Before starting wrap-up:** Do not initiate wrap-up unilaterally. Wait until Venkat says to wrap up or asks "what did we do."

**Checklist — complete in order:**

1. **`status.md`** — add a dated entry (format: `**YYYY-MM-DD** — Session N: one-line summary`) to the Done section. Move any completed Upcoming items to Done.
2. **`CLAUDE.md`** — update file structure, deployment notes, or governance info if anything changed.
3. **`data/devlog.json`** — append a new session record (see schema below). **Never skip.** This is the load-bearing architectural record.
4. **`DEVLOG.md`** — regenerate: `python3 devlog_render.py` from the repo root.
5. **Repo** — `git add` relevant files; `git commit`; `git push origin main`. Always push to `origin main`.
6. **Memory** — save anything non-obvious about site structure or workflow preferences. Do not duplicate what's in CLAUDE.md or recoverable from code.

**Devlog JSON schema** (append to `data/devlog.json` → `sessions` array):

```json
{
  "id": <integer>,
  "sort_key": <session_number as float>,
  "label": "Session N",
  "title": "Short descriptive title",
  "date": "YYYY-MM-DD",
  "time_pt": "",
  "tracks": ["static-site" | "cloudflare-migration" | "member-directory" | "content" | "operations"],
  "costs_usd": {},
  "vector_counts": {},
  "deployed": true,
  "items": [
    { "title": "Component or decision name", "html": "Explanation in HTML." }
  ]
}
```

**Devlog writing standard** — write `items` as if briefing a future engineer on architectural decisions, not just changes. Explain *why*, name the current state of the affected subsystem, and note anything that closes off alternatives or locks in a direction.

**Wrap-up report (never skip):**

After completing the checklist, report to Venkat with a table:

| # | Item | Status | Notes |
|---|------|--------|-------|
| 1 | status.md | ✅ / ❌ | |
| 2 | CLAUDE.md | ✅ / ❌ / n/a | |
| 3 | devlog.json | ✅ / ❌ | |
| 4 | DEVLOG.md regenerated | ✅ / ❌ | |
| 5 | git commit + push | ✅ / ❌ | |
| 6 | Memory updated | ✅ / ❌ / n/a | |
