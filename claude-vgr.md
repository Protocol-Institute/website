# Claude Notes — vgr (Venkat)
> **Environment rules, keys & safety policies:** see [Code/CLAUDE.md](../CLAUDE.md) — read before starting work.


Venkat is a contributing member of Protocol-Institute, not the primary maintainer.
Working on the `main` branch for small updates; PRs or forks for larger features.

## Repo: website
Static HTML/CSS/JS site. No build step — edit files directly.

Key pages: `index.html`, `about.html`, `projects.html`, `sigs.html`, `worldbuilding.html`, `contact.html`
Assets in `assets/`, styles in `css/`, scripts in `js/`.

## CSS Notes
- Single stylesheet: `css/style.css`. Two nav contexts: `.site-nav` (interior pages) and `.landing-nav` (homepage).
- Both navs must share `max-width: 760px; margin: 0 auto` to keep link positions consistent across pages.

## Workflow Notes
- No `.gitignore` exists in this repo.
- Primary maintainer's CLAUDE.md not yet present; expected to be added.
- **Default: commit directly to `main` on the upstream repo** (Protocol-Institute/website).
- **Fork (vgururao/website) is only for changes that require review** — push a branch there and open a PR to upstream. Delete the branch after merge.
- Do not use the fork as a general working copy; keep it in sync with upstream when it's needed.
