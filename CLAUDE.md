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

## Keys

No keys are currently in use for this repo. When CF Workers are added (Phase 1+), keys will be provisioned via `../.env.keys` and inventoried in `../admin/keys.md`. Do not use `Code/.env.keys` for PI keys.

## Deployment

The site is deployed via Netlify, connected to this GitHub repo. Pushes to `main` deploy automatically. No build command — publish directory is `.`.

## At Session Start

**Always do this first before any other work:**

1. Run `python3 devlog_session.py start` — records session start time to `/tmp/pi_website_devlog_session_start.txt`.
2. Run `python3 ../admin/expenses/track.py status` — shows all active PI project sessions and flags any overlap. If another project session is already running, no action needed; overlap is tracked automatically.
3. Read `status-vgr.md` — review active and upcoming items from the last session.
4. Confirm you are on `main` (`git branch --show-current`). Never work on `feat/cloudflare-migration` during content sessions.
5. Briefly summarize to Venkat: any active items from `status-vgr.md` that are ready to work on.

---

## After Each Session

**Documentation (always):**
1. `data/devlog.json` — add session entry with items in HTML. Run `python3 devlog_session.py end` for the timestamp. Run `python3 devlog_render.py` to regenerate `DEVLOG.md`. The devlog is the primary record of architectural decisions and infrastructure choices — write for a public technical audience.
2. `status-vgr.md` — add a dated log entry with PT start–end times and a one-line summary of what changed.
3. `CLAUDE.md` — update roadmap status or file structure notes if anything changed.

**Verify (if HTML/CSS/JS changed):**
4. No build step — open the changed pages in a browser and verify before committing. Check mobile nav on narrow viewport.

**Repo:**
5. `git add` relevant files; `git commit`; `git push origin main`. Always push to `origin main` — never to the fork or the CF branch.

**Expenses (always):**
6. `python3 ../admin/expenses/track.py end` — computes billable hours from all active session start files; detects overlap; prints a pre-filled log entry.
7. Paste the entry into `../admin/expenses/log-{your-id}.json` sessions array; fill in `api_costs` (any API charges incurred this session) and `notes`.
8. `python3 ../admin/expenses/render.py` — regenerates `EXPENSES.md` and `expenses.csv`.

**Memory:**
9. Update Claude memory (`/Users/Venkat/.claude/projects/.../memory/`) — save anything non-obvious about site structure, CF migration state, or workflow preferences that would help future sessions. Do not duplicate what's in CLAUDE.md or recoverable from code.
