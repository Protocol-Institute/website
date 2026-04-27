# Claude Notes — vgr (Venkat)

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
- Commit small changes directly to `main`; use PRs for larger work.
