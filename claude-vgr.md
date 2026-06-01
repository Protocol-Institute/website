# Claude Notes — vgr (Venkat)

> **SoP migration tasks for this site:** see [`sop-migration.md`](sop-migration.md) —
> content from summerofprotocols.com that belongs on protocol-institute.org once the
> domain redirects. Check this file before starting any About, Consulting, or Programs work.
> **Environment rules, keys & safety policies:** see [Code/CLAUDE.md](../../CLAUDE.md) — read before starting work.

Venkat is org admin (owner) on Protocol-Institute and has admin on all repos. Direct push to `main` is fine for this repo.

## Repo: website
Static HTML/CSS/JS site. No build step — edit files directly.

Key pages: `index.html`, `about.html`, `projects.html`, `sigs.html`, `worldbuilding.html`, `contact.html`, `support.html`, `team.html`, `c3po.html`, `network.html`
Assets in `assets/`, styles in `css/style.css`, scripts in `js/main.js`.

## CSS Notes
- Single stylesheet: `css/style.css`. Two nav contexts: `.site-nav` (interior pages) and `.landing-nav` (homepage).
- Both navs must share `max-width: 760px; margin: 0 auto` to keep link positions consistent across pages.
- Interior pages use `.interior-wrapper`. Landing uses `.landing-wrapper`.
- Draft pages use `.draft-banner` (yellow/amber background, `#FFF8E7`).

## Team Page
- 4 members: Timber Stinson-Schroff (`#timber`), Venkatesh Rao (`#venkat`), James Langdon (`#james`), Tim Beiko (`#tim`).
- `.team-photo` boxes: 240×300px (4:5 portrait). Replace `.team-photo-placeholder` with `<img>` when photo is ready.
- Venkat's photo: `https://venkateshrao.com/headshotVGR800.JPG`

## Footer Nav
All interior pages share a `<nav class="footer-nav">` with links: Team · Network · Contact.
Landing page footer uses the inline `·` separator pattern.

## Adding a new page
Copy structure from an existing interior page (e.g., `about.html`). Use `.interior-wrapper`, standard `<nav class="site-nav">` with all nav links, `class="active"` on the correct link, `.page-header > h1`, link to `css/style.css` and `js/main.js`.

## Adding a new initiative
Add `<li class="project-item">` to `projects.html`. Use `status-active` class for the badge on live initiatives; no extra class for "In Development".

## Workflow Notes
- **Default: commit directly to `main`** on Protocol-Institute/website.
- **Fork (vgururao/website) is only for changes that need review** — push branch, PR to upstream, delete branch after merge.
- Deployment: Cloudflare Pages auto-deploys on push to `main`. API endpoints via CF Pages Functions (`functions/`). D1 database and R2 bucket configured in `wrangler.toml`.
