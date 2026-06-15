# Status — Protocol Institute Website

## Active
- **pitchdeck/** v0.1.0 live. 11-slide "New Nature" deck on support.html. Review PDF export and then test version bump workflow. Images are SVG placeholders — replace with real assets later.

## Upcoming
<!-- planned changes or features -->
- Promote Network page to main nav once member content is added
- Link SIG organizer names to member profiles as remaining organizers (Kei Kreutler, Spencer Nitkey) get onboarded — Patrick Nast, Anuraj R., Aneesh Sathe now linked
- Open symposium voting to all members (remove is_admin gate from /submissions/ pages)
- SIG mailing lists (blocked on creating sigs@protocol-institute.org in Resend first)
- Afeez Oladimeji (dimejibusiness) needs photo before appearing in consultant view
- Fill in detail pages for external projects: worldmachines, jamverse, protocolized-dev, longnow, humboldt — currently minimal stubs
- Future: consolidated beings directory database (R2 assets keyed by slug, roles as DB relations)
- **SoP migration — Program History:** Expand `about/index.html` with a "Program History" / "Origins" section covering SoP23–25: research tracks, participant counts, $2.5M EF funding, 70+ alumni, 100+ outputs, 358-page proto-textbook, 1,800+ subscribers, conference history (Seattle, Singapore, Healdsburg, Chiang Mai, Devconnect Buenos Aires). Source: summerofprotocols.com/about. Blocked on writing/editing time.
- **SoP migration — Alumni Directory:** Build a `/alumni` page listing SoP23–25 fellows from `data/alumni.json` (70 entries). Design TBD.
- **Events history pages:** Add `resources_url` links once protocolized.io/resources URL scheme is confirmed. Add images once R2 is set up.

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
- **2026-06-14** — Session 23: Member tier system (Team/Community Lead/Member); photos migrated to R2; rich card views; /team+/consulting consolidated into filtered /members views; CRM import (165 contacts) + auto-approve; admin member editor tab; new tags (symposium_25, guest_speaker); startup backup ritual; Symposium 2026 submissions page with quadratic voting, comments system, Total Effective Weight display; voting deadline June 30.
- **2026-06-14** — Session 22: SIG schedule: fixed DST bug — sync_sig_meetings.py now pre-expands RRULE to 30 concrete UTC ISO datetimes per SIG; main.js simplified to list lookup. Programs page: Hierarchical View / Flattened View tabs; /projects redirects to /programs?view=flattened. Nav: fixed layout shift from member link swap (button reset) and beta badge line-height. Site-wide link underline styling (global a{}, class overrides preserved). 404 page. Members page: full bios, DETAIL_PAGES map for internal links. Member signups: 10 pending reviewed and approved; Aneesh's slug fixed; check_members.py startup ritual; D1 migration 013 (welcome_sent column); delayed welcome emails sent to Timber, Tim, James, Sachin, Rafael; James email corrected to james@protocolized.io. Join page copy improvements: spam guidance, eligibility paragraph split, Members link, hint text. Welcome email template updated.
- **2026-06-13** — Session 21: Symposium page: New Nature theme paragraph + Protocolized link, deadline date bold+red, countdown ticker (expires 2026-06-15T07:00Z). Home page: banner carousel system (carousel/banners.md, weighted random, JS fetch), Explore PI's activities bullet list, removed About link. Calendar page: built from stub — merged Google Calendar iframe (Community calendar orange, Institute calendar teal), CSP fixed (frame-src), compact key + subscribe links + instructions for adding community events. SIG meeting sync: sync_sig_meetings.py fetches iCal, generates data/sig-meetings.json; JS in main.js populates [data-sig] elements with UTC + local time + bolded next-meeting date in tinted box; all 6 SIG index pages + individual SIG pages updated. MRG manually set (not yet on calendar). SIG organizer names linked to /team#slug or /members#slug for Venkatesh Rao, Rafael Fernandez, Sachin Benny; member cards given id="${slug}" for hash-linking. DRG meeting time corrected to 4:30pm UTC throughout.
- **2026-06-12** — Session 20: Programs page redesigned with 4-category hierarchy (Programs/Tracks/Projects/Infrastructure); Research program created (SIGs as tracks, Challenges as infra, solo projects); AI Infrastructure → AI Ops; Events program replacing Protocol Symposium; Collaborations program (Long Now as track); detail pages for all external-domain projects (worldmachines, jamverse, protocolized-dev, longnow, humboldt); nav: Projects+Events removed, SIGs+Calendar added, About moved to footer; home page standardized to interior-wrapper layout; c3po generate_sig_pages.py fixed (injected nav/footer, no flat files, DRG two-paragraph description); legacy flat SIG HTML files removed from git; all SIG index pages regenerated; DRG+SIGPSY Active badges added; c3po website-interface.md plan authored.
- **2026-06-09** — Session 19: DRG blurb expanded (third person, two paragraphs) on SIG index + DRG page; stale DRG nav/footer fixed. 8 membership applications reviewed: 6 approved directly via D1 (welcome email flow now built), 2 declined (Alexandra Braslasu, Javier Chavez — no evidence of qualifying participation). Admin approval flow now sends welcome email with 3-day PIN via Resend; rejection sends standard ineligibility notice. Join page eligibility description updated. Key management failure: RESEND_API_KEY + WEBSITE_ADMIN_KEY not in ../.env.keys; strong warning added to CLAUDE.md. Emails pending key retrieval from CF dashboard.
- **2026-06-08** — Session 18: Challenges page (D1-backed, dual-track quadratic voting, Fibonacci difficulty labels, posed-by/communicated-by split, seed interest, beta badge, collapsible add form, permalink anchors, PLAN.md). Symposium 2026 copy fixes + Special Sessions line. SIG future-dated session handling (Scheduled badge, CONVENTIONS.md). Nav: profile icon, session-aware member link, return-to login, member dropdown (Edit profile + Log out). Venkat and Timber both set to is_admin=1. Challenges added to top nav and Programs page. Formula: seed + A×anon² + B×member².
- **2026-06-03** — Session 17: Jamverse added to Programs/Protocolized (jamverse.protocolized.io, coming soon, TODO description in 1–2 weeks). Comprehensive CSS whitespace compaction — line-height, p margins, page-header, footer, project/team/event/member item paddings all reduced 30–50%. Member Login link moved inline with nav brand (removed separate topbar row; hidden on mobile). Stale untracked SIG flat HTML files deleted.
- **2026-06-01** — Session 16: Consolidated symposium 2026 to canonical /events/protocol-symposium-2026/ — removed /symposium-2026 and /protocol-symposium-2026, redirects added, footer and homepage banner links updated. Programs index: removed Protocol School item (page stays up), added Protocol Symposium item linking all 3 editions. SIGs: added DRG (Distributed Robotics Group, Anuraj R. + Rafael Fernandez) and SIGPSY (psychohistory, Venkatesh Rao + Aneesh Sathe) stub pages with Coming Soon status; CONVENTIONS.md updated for c3po. Pitchdeck fix: vendored marked.min.js — cdn.jsdelivr.net was blocked by CSP script-src.
- **2026-06-01** — Session 15: Banner replaced with corrected version (nn_banner.png → R2 as nn_banner6.png). Date fixed site-wide: Sep 21–24 → Sep 21–25 (4 occurrences across index.html and symposium-2026/index.html). Protocol Symposium 2026 added to events.json with "upcoming" status and amber badge on events index. Art banner (nn_artbanner.png) uploaded to R2 and used for events card thumbnail. Symposium 2024/2025 thumbnails (symposium24.webp, symposium25.webp) uploaded to R2 and wired into events.json. Nav trimmed to 4 items (Programs, Events, Protocolized, About); footer now globally injected from main.js — Contact, Members, Support Us moved to footer.
- **2026-06-01** — Session 13 (continued): SoP event ingestion complete — added 3 events (Researcher Retreat Seattle 2023, Datus and Nusas Singapore 2024, Khlongs and Subaks Bangkok 2025); events.json now 10 events; Healdsburg location updated to "Edge Esmeralda, Healdsburg, CA"; TYPE_LABELS updated with "retreat"; deleted sop-migration.md.
- **2026-06-01** — Session 13: Events history system — data/events.json (7 events), /events/ index (JS-rendered from JSON), 7 detail pages. "Events" added to main nav. CF migration cleanup: deleted netlify.toml, MIGRATION.md, feat/cloudflare-migration branch (local + remote). Consolidated claude-vgr.md → CLAUDE.md, status-vgr.md → status.md. All docs now reflect CF Pages as live host.
- **2026-05-30** — Session 12: site architecture review. CF Zero Trust Access on /admin/* (zero code, CDN-layer auth). Tag definitions consolidated into shared module (fixed silent tag_protocolized_writer drop on member approval). CSP tightened. SIG mailing list plan documented (Resend Audiences + D1 + web compose UI, blocked on sigs@protocol-institute.org setup). Member Login/Register topbar added site-wide. SoP migration: built /symposium-2025, /programs/protocol-school (with 11 teaching fellows), /workshops, /license. Alumni data saved to data/alumni.json. summerofprotocols.com redirect plan documented in admin repo. Devlog backfilled sessions 6–12.
- **2026-05-30** — Session 11: member directory continued. Join form: added team job title/description fields under team checkbox, fixed conditional field visibility (team-fields, photo), wired fields through to backend. Admin review cards now show city, discord, team fields, photo URL. Admin edit: added `is_admin` flag (Venkat + Timber), new `/api/admin/member-list` endpoint, edit page shows full all-member dropdown and admin-only toggles (is_team, team_title, is_consultant, is_public) for admins. Migration 007 applied to live D1.
- **2026-05-29** — Session 10: updated /network cards from Google Form data (ProSoDiAC lab / Giovanni Merlino with logo; Protopolis Lab / Helena Rong with website); updated /consulting card for Rafael Fernandez (full expertise, rafael.fyi contact). Added assets/network/ for logos. Added fetch_form_data.py script and SHEETS.md to document the Google Sheets update workflow. Symposium page: wired in Google Form, added June 14 submission deadline to blurb and CTA box, removed boxed submission-type blurbs. Added symposium promo banner to landing page (placeholder CSS; artist brief: 1520×400px 2×).
- **2026-05-28** — Session 9: major site restructure. Clean URLs (pagename/index.html). SIG session pages split into individual detail pages with date-based slugs (YYYY-MM-DD-title); CONVENTIONS.md added as spec for c3po ingestion. /projects → /programs rename; "Initiatives" → "Programs" nav label; page restructured as program bundles with track lists. "Magazine" nav → "Protocolized". Nav refactored to single shared source in main.js (injected, active link computed from URL). Team page: all photos added, C3PO and Humboldt added as full team members. Profile photos consolidated into assets/beings/.
- **2026-05-28** — Session 8: created `pitchdeck/` scaffolding — embeddable HTML presentation system for support.html. Slide types: cover, big-point, section, bullets, numbered, quote, big-image, table, two-column. PDF export, keyboard nav, semantic versioning with `archive/`. Content is placeholder v0.1.0.
- **2026-05-26** — Session 7: diagnosed iPad "Site not found" issue — fixed HTTPS enforcement. Reviewed symposium page status.
- **2026-05-19** — Session 6: updated C3PO to live/beta — status badge, description, corpus size, MCP server paragraph, direct link.
- **2026-05-19** — Session 5: built Network, Consulting, and Symposium pages; redesigned nav; restructured Initiatives page; standardized landing page nav/footer; added Magazine → protocolized.io to nav.
- **2026-05-14** — Sessions 1–4: devlog system, Team page, Support page, C3PO page, Network page (draft), GitHub org profile README, nav consistency fixes.
