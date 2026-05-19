# Status — vgr (Venkat)

## Active
<!-- current tasks or in-progress work -->

## Upcoming
<!-- planned changes or features -->
- Promote Network page to main nav once member content is added
- Add actual team photos for James Langdon, Tim Beiko, Timber
- Migrate hosting from Netlify to Cloudflare Pages (see GitHub Issue #1/#2)
- Add Events page with Google Calendar embed (calendar location TBD — hold until calendar is finalized)

## Done
<!-- completed items, reverse chronological -->
- **2026-05-19** — Session 5: built Network, Consulting, and Symposium pages; redesigned nav (stacked two-row with separator); restructured Initiatives page to inline category tags; standardized landing page nav/footer to match interior pages; updated landing blurb; added Magazine → protocolized.io to nav on all pages.
- **2026-05-14** — Added devlog system (data/devlog.json, devlog_session.py, devlog_render.py). Backfilled Sessions 1–2 from git history. Added startup and wrap-up rituals to CLAUDE.md. CLAUDE.md now references PI admin repo (Protocol-Institute/admin) for key and security policy.
- **2026-05-14** — Added Protocol Institute Network page (`network.html`, DRAFT) with stub text and contact links. Improved footer nav across all pages to include Team, Network, and Contact links. Added `.draft-banner` CSS.
- **2026-05-14** — Added C3PO page (`c3po.html`) with description, intended uses, status, and technical approach. Added C3PO entry to initiatives listing in `projects.html`.
- **2026-05-14** — Added GitHub org profile README (`Protocol-Institute/.github/profile/README.md`) describing the Institute, repos, and maintainers.
- **2026-05-14** — Created Cloudflare Pages migration branch (`feat/cloudflare-migration`) with `wrangler.toml`, `MIGRATION.md`, and GitHub Issues #1 (discussion) and #2 (Timber task) covering Netlify → CF Pages migration.
- **2026-05-14** — Added Team page (`team.html`) with anchor-linked bios for Timber Stinson-Schroff, Venkatesh Rao, James Langdon, Tim Beiko. Photo boxes at 4:5 portrait ratio; Venkat's photo loaded from venkateshrao.com. Added responsive team member CSS. Footer link to Team page added.
- **2026-05-14** — Fixed Timber's location: "Whitehorse, Alaska" → "Whitehorse, Yukon".
- **2026-05-14** — Added Support Us page (`support.html`) with donor/partner contact details. Added Support Us link to nav on all pages.
- **2026-04-27** — Fixed nav jump between landing and interior pages. Added `max-width: 760px; margin: 0 auto; width: 100%` to `.landing-nav` in `css/style.css` to match `.site-nav` constraint.
