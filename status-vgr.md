# Status — vgr (Venkat)

## Active
- **pitchdeck/** v0.1.0 live. 11-slide "New Nature" deck on support.html. Review PDF export and then test version bump workflow. Images are SVG placeholders — replace with real assets later.

## Upcoming
<!-- planned changes or features -->
- Symposium banner: replace CSS placeholder with final artwork from artist (1520×400px, 2× retina)
- Promote Network page to main nav once member content is added
- Migrate assets to R2 under same /assets/* paths (proxy via Pages Function so no HTML changes needed)
- Add Events page with Google Calendar embed (calendar location TBD — hold until calendar is finalized)
- Future: consolidated beings directory database (R2 assets keyed by slug, roles as DB relations)
- **SoP migration — Program History:** Expand `about/index.html` with a "Program History" / "Origins" section covering SoP23–25: research tracks, participant counts, $2.5M EF funding, 70+ alumni, 100+ outputs, 358-page proto-textbook, 1,800+ subscribers, conference history (Seattle, Singapore, Healdsburg, Chiang Mai, Devconnect Buenos Aires). Source: summerofprotocols.com/about. Blocked on writing/editing time.
- **SoP migration — CC+ License:** New page at `/license`. Content is 404 on live SoP site — needs recovery from internal records or Wayback Machine. Link from About page and any content pages that reference reuse terms.
- **SoP migration — Teaching Fellows list:** Add to `/programs/protocol-school` — 11 names/affiliations from SoP25. Page exists, stub placeholder in place. Source page is 404 on live SoP site; recover from internal records.

### SIG Mailing Lists (planned, not started)

Opt-in email lists for each SIG, managed through member profiles. Substack covers broad PI outreach; this is SIG-only.

**Sending address:** `sigs@protocol-institute.org` — single From address for all SIG emails. Not yet created; needs to be added as a verified sender in Resend (domain already verified). No inbound needed — sending only.

**Stack:** Resend Audiences (one per SIG) + D1 subscription prefs + CF Worker for broadcast. No new service.

**Prerequisites before building:**
1. Create `sigs@protocol-institute.org` in Resend as a verified sender (or confirm domain-level send covers it)
2. Create 4 Resend Audiences: SIGFPT, MRG, SIGPfB, ProtFiSIG — note the audience IDs
3. Add audience IDs as CF Pages secrets (`RESEND_AUD_SIGFPT`, etc.) or hardcode in Worker

**D1 migration (008):**
- Add to `members` table: `sub_sigfpt`, `sub_mrg`, `sub_sigpfb`, `sub_protfisig` — INTEGER DEFAULT 0
- Add `is_sig_host` INTEGER DEFAULT 0
- Add `sig_host_slugs` TEXT (JSON array, e.g. `["sigfpt","mrg"]`)

**Profile edit — new "Lists" tab:**
- 4 checkboxes (one per SIG), visible to all members after login
- Save: updates D1 sub_* columns + syncs to Resend audience (add/remove contact)
- Endpoint: extend `/api/members/update` to handle sub_* fields and call Resend

**SIG host send UI:**
- New section in `/members/edit`, visible only when `is_sig_host = 1`
- Shows only the SIGs listed in `sig_host_slugs`
- Fields: subject (text), body (textarea, plain text)
- Submit → POST `/api/sigs/send` → Worker verifies host role → calls Resend broadcast API
- From: `sigs@protocol-institute.org`, Reply-To: host's member email
- Endpoint: `functions/api/sigs/send.js` — session-gated, checks is_sig_host + sig_host_slugs

**What is NOT in scope:**
- Global PI mailing list (Substack)
- Inbound email alias (sigfpt@... forwarding) — web UI only for sending
- Digest or scheduling features — sends immediately on submit

## Done
<!-- completed items, reverse chronological -->
- **2026-06-01** — Session 13: Events history system — data/events.json (7 events), /events/ index (JS-rendered from JSON), 7 detail pages. "Events" added to main nav. CF migration cleanup: deleted netlify.toml, MIGRATION.md, feat/cloudflare-migration branch (local + remote). Updated CLAUDE.md, claude-vgr.md, README.md, status-vgr.md, memory to reflect CF Pages as the live host.
- **2026-05-30** — Session 12: site architecture review. CF Zero Trust Access on /admin/* (zero code, CDN-layer auth). Tag definitions consolidated into shared module (fixed silent tag_protocolized_writer drop on member approval). CSP tightened. SIG mailing list plan documented (Resend Audiences + D1 + web compose UI, blocked on sigs@protocol-institute.org setup). Member Login/Register topbar added site-wide. SoP migration: built /symposium-2025, /programs/protocol-school (with 11 teaching fellows), /workshops, /license. Alumni data saved to data/alumni.json. summerofprotocols.com redirect plan documented in admin repo. Devlog backfilled sessions 6–12.
- **2026-05-30** — Session 11: member directory continued. Join form: added team job title/description fields under team checkbox, fixed conditional field visibility (team-fields, photo), wired fields through to backend. Admin review cards now show city, discord, team fields, photo URL. Admin edit: added `is_admin` flag (Venkat + Timber), new `/api/admin/member-list` endpoint, edit page shows full all-member dropdown and admin-only toggles (is_team, team_title, is_consultant, is_public) for admins. Migration 007 applied to live D1.
- **2026-05-29** — Session 10: updated /network cards from Google Form data (ProSoDiAC lab / Giovanni Merlino with logo; Protopolis Lab / Helena Rong with website); updated /consulting card for Rafael Fernandez (full expertise, rafael.fyi contact). Added assets/network/ for logos. Added fetch_form_data.py script and SHEETS.md to document the Google Sheets update workflow. Symposium page: wired in Google Form, added June 14 submission deadline to blurb and CTA box, removed boxed submission-type blurbs. Added symposium promo banner to landing page (placeholder CSS; artist brief: 1520×400px 2×). Merged main → feat/cloudflare-migration.
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
