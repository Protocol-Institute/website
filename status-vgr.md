# Status — vgr (Venkat)

## Active
- **pitchdeck/** v0.1.0 live. 11-slide "New Nature" deck on support.html. Review PDF export and then test version bump workflow. Images are SVG placeholders — replace with real assets later.

## Upcoming
<!-- planned changes or features -->
- Promote Network page to main nav once member content is added
- Migrate hosting from Netlify to Cloudflare Pages (see GitHub Issue #1/#2); migrate assets to R2 under same /assets/* paths (proxy via Pages Function so no HTML changes needed)
- Add Events page with Google Calendar embed (calendar location TBD — hold until calendar is finalized)
- Symposium page: add Google Form URL when ready; set submission deadline and exact dates
- Add Sachin Benny photo to assets/beings/ and wire up on consulting page
- Future: consolidated beings directory database (R2 assets keyed by slug, roles as DB relations)

## Done
<!-- completed items, reverse chronological -->
- **2026-05-28** — Session 9: major site restructure. Clean URLs (pagename/index.html). SIG session pages split into individual detail pages with date-based slugs (YYYY-MM-DD-title); CONVENTIONS.md added as spec for c3po ingestion. /projects → /programs rename; "Initiatives" → "Programs" nav label; page restructured as program bundles with track lists (Protocolized: Substack/archive/YouTube/Books/Worldbuilding; AI Infrastructure: C3PO+Humboldt; SIGs; Long Now). "Magazine" nav → "Protocolized". Nav refactored to single shared source in main.js (injected, active link computed from URL). Team page: all photos added (James, Tim, Rafa), Venkat's photo localized, C3PO and Humboldt added as full team members (titles: Corpus Orchestrator, Artificial Researcher). "the new nature" → "New Nature" throughout. Profile photos consolidated into assets/beings/.
- **2026-05-28** — Session 8: created `pitchdeck/` scaffolding — embeddable HTML presentation system for support.html. Slide types: cover, big-point, section, bullets, numbered, quote, big-image, table, two-column. PDF export, keyboard nav, semantic versioning with `archive/`. Content is placeholder v0.1.0.
- **2026-05-26** — Session 7 (~3:05–3:20 PT): diagnosed iPad "Site not found" issue — fixed by enabling HTTPS enforcement in GitHub Pages settings. Merged main into feat/cloudflare-migration (17 commits, 36 files, clean). Reviewed symposium page status.
- **2026-05-19** — Session 6: updated C3PO to live/beta — `projects.html` status badge → "Live · Beta", description updated (RAG, 12k+ vectors, MCP, Claude Sonnet), direct "Open C3PO →" link added; `c3po.html` Status and Technical sections rewritten present-tense, corpus size updated, MCP server paragraph added, "Try it →" link at top.
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
