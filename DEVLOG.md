# Protocol Institute Website — Build Log

A build log for protocol-institute.org — how the static site was built, what infrastructure decisions were made, and where things stand. Written for contributors curious about the process and for future maintainers.

---

## Session 1: Initial Site Build

*2026-04-26*

**Tracks:** static-site, content

- **Starting point:** The Protocol Institute had no web presence. The goal was a minimal, credible static HTML site at `protocol-institute.org` — not a CMS, not a framework, just well-structured HTML/CSS/JS that any contributor could read and edit without a build step.

- **Initial commit (2026-04-26):** `index.html` with landing page — hero section, initiative categories, footer nav. Substack newsletter link. The landing page uses a sticky nav that hides on interior pages (different scroll behavior needed for a longer landing vs short interior pages).

- **Nav alignment fix (2026-04-27):** Landing page nav position was misaligned with interior pages — the sticky behavior was scoping incorrectly. Fixed by separating the landing-page nav rule from the interior nav rule. The landing nav keeps all links visible (no collapse); interior nav hides on scroll down, reveals on scroll up.

- **README and CLAUDE.md (2026-05-05):** Added contributor onboarding docs. `README.md` is public-facing (for GitHub visitors). `CLAUDE.md` is LLM-facing — explains the owner/contributor workflow, links to `Code/CLAUDE.md` for environment and key management policy. A second personal file `claude-vgr.md` tracks VGR-specific context (fork policy, PR workflow) that does not belong in the org-visible CLAUDE.md.

- **Initiative categories (2026-05-05):** Added structured initiative listings to `index.html` — four categories: Research SIGs, Publications, Events, and Infrastructure. Added *Protocols for the Long Now* collaboration under Research. The category structure is loose enough to absorb new initiatives without redesign.

- **Mobile nav fix (2026-05-05):** The landing page nav was hiding on mobile when the viewport was narrow enough to trigger the interior-nav collapse logic. Fixed by scoping the hide-on-scroll behavior to a `.interior-page` class that is not present on the landing page.

---

## Session 2: Pages Build-Out and Cloudflare Migration

*2026-05-14*

**Tracks:** static-site, cloudflare-migration, content

- **Support Us page:** `support.html` — donor contact info and partner contact info. Intentionally minimal: no payment buttons yet (those come in Phase 1c of the CF roadmap, once Stripe Payment Links are wired up). The page establishes the URL and nav slot; content will be upgraded when the donation infrastructure is ready.

- **Team page:** `team.html` — bios and photo boxes for Venkat Rao (founder) and Timber Stinson-Schroff (co-editor/co-founder). Photo boxes are placeholder boxes (no photos yet) using CSS aspect-ratio to reserve space. Timber's location was corrected to Whitehorse, Yukon in a follow-up fix — had been set to Vancouver from an earlier draft.

- **Network page:** `network.html` — a draft directory of network participants, collaborators, and affiliated individuals. Marked as draft; the authoritative member directory will be built in Phase 2 (CF Workers + D1 + PIN auth). This page is a static placeholder that establishes the URL and nav structure.

- **C3PO initiative page:** `c3po.html` — describes C3PO as a Protocol Institute initiative; explains what it is (RAG research assistant), what corpus it covers, and how it will eventually be accessible. Added entry to `projects.html`. The page intentionally does not link to the C3PO Worker endpoint yet — that comes when the Worker is deployed in Phase 2 of the C3PO roadmap.

- **Cloudflare Pages migration branch (`feat/cloudflare-migration`):** Added `wrangler.toml` (no-build static config, `pages_build_output_dir = "."`) and `MIGRATION.md`. The site is pure static HTML — no build step, so CF Pages treats the repo root as the output directory. `_redirects` already in repo root; CF Pages reads it identically to Netlify. No code changes were needed for the migration itself.

- **Migration path — personal → PI account:** The CF Pages project was created under VGR's personal CF account (the only CF account currently active). `MIGRATION.md` now includes the explicit migration path: once a Protocol Institute CF org account is created, transfer the Pages project and the `protocol-institute.org` DNS zone to it. This is a future step — the site goes live on the personal account first.

- **Branch sync strategy:** `MIGRATION.md` documents the branch relationship: `feat/cloudflare-migration` is kept up to date with `main` via periodic merges (not rebases). CF Pages deploys only from `feat/cloudflare-migration` until the migration is verified — at that point the branch is merged to `main` and CF Pages is switched to track `main`.

- **Feature roadmap:** `ROADMAP.md` — five-phase plan for CF-powered features: Phase 0 (CF Pages migration), Phase 1 (quick wins: symposium page, events calendar, donation buttons), Phase 2 (member directory — D1 + KV + R2 + PIN email auth), Phase 3 (Stripe + ETH donations), Phase 4 (SIWE — Sign-In with Ethereum), Phase 5 (Protocol Symposium system). CF resources needed: D1, KV, R2, Resend, Stripe, and optionally Dynamic.xyz or Privy for wallet auth.

- **Open questions logged in ROADMAP.md:** Which CF account currently holds the `protocol-institute.org` DNS zone (Timber's personal account or a PI org account)? This blocks Phase 0. Resend vs Mailgun for PIN emails (Phase 2). Dynamic.xyz vs Privy vs DIY ethers.js for SIWE (Phase 4). Whether PI member data should live in a unified D1 database shared between .org and .io.

---

## Session 3: Devlog System, Session Rituals, and Org Admin Infrastructure

*2026-05-14 · 14:30–18:56 PT*

**Tracks:** operations

- **Devlog system:** Added `data/devlog.json` (source of truth), `devlog_session.py` (writes ISO timestamp to `/tmp/pi_website_devlog_session_start.txt`), and `devlog_render.py` (renders `DEVLOG.md` from JSON). Backfilled Sessions 1 and 2 from git history and status log. The JSON-first approach keeps the record machine-readable and consistent with the C3PO and Protocolized devlog pattern.

- **Session rituals (added to CLAUDE.md):** Startup: timestamp → `track.py status` → read status-vgr.md → check CF migration branch divergence → check GitHub Issues #1/#2 → summarize. Wrap-up: devlog entry + devlog_render.py → status-vgr.md → CLAUDE.md updates → verify HTML in browser → git commit/push → `track.py end` → fill log-{id}.json → expenses render → Claude memory.

- **PI admin repo reference:** CLAUDE.md updated to point to `../admin/keys.md` and `../admin/security.md` for key and security policy. When CF Workers are added (Phase 1+), all PI keys will be provisioned via `../.env.keys` and registered in `../admin/keys.md` — not in `Code/.env.keys`, which is personal scope only. The admin repo (`Protocol-Institute/admin`, private) holds the expense tracker, key registry, and security policy for all PI contributors.

---

## Session 4: Timber Headshot on Team Page

*2026-05-15*

**Tracks:** content

- **Timber headshot on /team:** Replaced the placeholder photo box in `team.html` with `assets/timber.jpg` (480×600 JPEG, ~67 KB). Source was a 4284×5712 portrait, cropped to 4:5 from the top to keep the face well-positioned and resized with Lanczos. The team page now shows two of four headshots — James Langdon and Tim Beiko remain placeholders.

---

## Session 5: Network, Consulting, Symposium, Nav Redesign, Landing Page Overhaul

*2026-05-19*

**Tracks:** static-site, content

- **Network page (`network.html`):** Built out from stub. Member data lives in `protocol-institute-network/partners.md` (Markdown source of truth); page copy in `protocol-institute-network/intro.md`. Single-column card grid, alphabetical order, variable-aspect-ratio logos rendered with `max-height: 56px; width: auto` to handle rectangular and square logos consistently. Contact prefix and links configurable per-member. Google Form link for directory applications. This establishes the pattern used for consulting and symposium: per-section folders with `intro.md` (copy) and a data file (member/directory/submissions), editable in Markdown with HTML synced on request.

- **Consulting page (`consulting.html`):** Individual consultant cards with headshot, name, expertise tags (dot-separated), and contact link (mailto or external). Data in `protocol-institute-consulting/directory.md`. Four entries: Benny, Fernandez, Rao, Stinson-Schroff (alphabetical by last name). Photos: placeholders for Benny and Fernandez; live photos for Rao (external URL) and Stinson-Schroff (`assets/timber.jpg`). No Role field — expertise only. Google Form for directory applications.

- **Protocol Symposium 2026 page (`symposium-2026.html`):** Announces the September 2026 symposium with CFP for 20-min presentations (200–400 word abstracts) and 60–90 min workshops (400–600 word proposals). Submission form placeholder pending Google Form URL. Empty accepted submissions index at bottom — will be populated as program is confirmed. Data in `protocol-symposium-2026/`.

- **Nav redesign:** Replaced the inline single-row nav with a two-row stacked layout — logo/brand on top row, nav links on the bottom row separated by a hairline border. Achieved entirely in CSS using `flex-wrap: wrap` + `flex-basis: 100%` on `.nav-links`, no HTML changes across the 12 pages. Left-justified links create room for additional nav items. Compacted whitespace between nav bottom border and page title by reducing `.page-header` padding.

- **Initiatives page restructure (`projects.html`):** Removed In-House / Sponsored / Collaboration section dividers (`h2.initiative-category`). Dropped the empty Sponsored section entirely. Merged all five initiatives into a single flat `ul.project-list`. Each item now carries both a status badge (`.project-status`) and a category tag (`.project-category`) as inline pills. Worldbuilding re-tagged from Active to In Development.

- **Landing page overhaul (`index.html`):** Replaced the bespoke `.landing-nav` (right-justified links, no logo, no mobile toggle) and `.landing-footer` (inline dot-separated paragraph) with the standard `.site-nav` header and `.site-footer` used on all interior pages. The landing page now has the logo in the nav, the mobile hamburger toggle, and the same footer nav structure as every other page. Removed all `.landing-nav` and `.landing-footer` CSS. Updated the landing blurb to: *The Protocol Institute is a research, education, media, and scene-making organization dedicated to advancing protocols and protocolization worldwide.* with a link to the About page.

- **Magazine nav link:** Added Magazine → `https://protocolized.io` (opens in new tab) to the primary nav on all 12 pages, positioned after Initiatives. One perl one-liner across all HTML files.

---

## Session 6: SIG Meeting Archive, Humboldt, C3PO Live

*2026-05-19*

**Tracks:** static-site, content

- **SIG meeting archive — 78 sessions:** Added individual HTML pages for all four SIGs (`sigfpt`, `mrg`, `sigpfb`, `protfisig`) with meeting summaries sourced from Discord transcripts via c3po. Each SIG got an index page listing all sessions and individual detail pages per meeting. A second pass (2026-05-20) recovered 10 additional sessions that had been missed. The c3po pipeline began running automatically after this, committing new session pages as meetings occur.

- **Humboldt project page and lab notebook (2026-05-20):** Added `humboldt/index.html` — describes Humboldt as an AI research agent investigating the New Nature using the c3po Pinecone index. Added `humboldt-notebook/index.html` — a running research log with dated entries. Added entry to initiatives listing. Title corrected from 'research agent' to 'Artificial Researcher' to match the AI team member framing. `/humboldt-notebook.html` redirect added to preserve any hash-anchor deep links.

- **C3PO updated to live/beta:** `projects.html` status badge changed from In Development to Live · Beta. `c3po.html` Status and Technical sections rewritten present-tense: RAG assistant over 12k+ vectors, MCP server integration, Claude Sonnet backend. Corpus size updated. Direct 'Open C3PO →' link added from the initiatives listing; 'Try it →' link at top of the c3po page. The page now accurately reflects the deployed tool rather than the original forward-looking description.

---

## Session 7: HTTPS Enforcement Fix, CF Branch Sync

*2026-05-26 · ~15:05–15:20 PT*

**Tracks:** cloudflare-migration, operations

- **iPad HTTPS enforcement fix:** Site was showing 'Site not found' on iPad (and likely other iOS clients). Root cause: GitHub Pages HTTPS enforcement was not enabled in the repository settings. The site was accessible over HTTP but iOS WebKit was refusing the non-HTTPS connection. Fixed by enabling 'Enforce HTTPS' in the GitHub Pages settings. CNAME record was also confirmed correct at this time.

- **Merged main → feat/cloudflare-migration:** 17 commits, 36 files. Clean merge with no conflicts — the CF migration branch had been diverging as content work accumulated on main. The branch is kept in sync periodically so the CF Pages deploy preview tracks current content.

---

## Session 8: Pitchdeck Scaffolding

*2026-05-28*

**Tracks:** static-site

- **Pitchdeck system (`pitchdeck/`):** Built an embeddable HTML presentation system for `support.html`. Slide types implemented: cover, big-point, section, bullets, numbered, quote, big-image, table, two-column. Features: keyboard nav (arrow keys, space), PDF export via print dialog, fullscreen toggle, semantic versioning with `archive/` subfolder. Deck content is inline in `deck.html` (no fetch required). A fetch-based approach was tried first but caused loading failures when the page was embedded in an iframe — fixed by embedding content directly. Added public-facing `README.md` and renamed the technical guide to `EDITING.md`.

- **New Nature deck v0.1.0:** 11-slide placeholder deck covering the Protocol Institute's New Nature research thesis. All slide types exercised. Images are SVG placeholders — real assets to replace later. The deck is live and embedded on `/support`. Version bump workflow (editing `deck.html`, archiving old version, updating `support.html` embed) is documented in `EDITING.md` but not yet tested end-to-end.

---

## Session 9: Major Site Restructure: Clean URLs, SIG Detail Pages, Programs Rename, Nav Refactor

*2026-05-28*

**Tracks:** static-site, content

- **Clean URLs:** All pages migrated from `pagename.html` to `pagename/index.html` — so `/about.html` becomes `/about`, etc. Every internal link across the site updated. This is the standard pattern for static sites on both Netlify and CF Pages and removes the `.html` extension from all URLs.

- **SIG session detail pages:** Each SIG session became its own page at `/sigs/{sig}/{YYYY-MM-DD}-{slug}/`. SIG index pages now list sessions with short abstracts and link out to detail pages (rather than displaying full summaries inline). URL naming convention and HTML structure documented in `sigs/CONVENTIONS.md`, which also serves as the spec for the c3po automated ingestion pipeline.

- **/projects → /programs rename:** The Initiatives listing was renamed — URL changed from `/projects` to `/programs`, nav label changed from 'Initiatives' to 'Programs', page title updated. The old `/projects` URL gets a 301 redirect via `_redirects`. The page content was restructured as program bundles with track lists: Protocolized (Substack, archive, YouTube, Books, Worldbuilding), AI Infrastructure (C3PO, Humboldt), SIGs, Long Now.

- **Nav refactored to shared JS injection:** All pages previously had the full `&lt;nav&gt;` HTML duplicated inline. Replaced with a single `NAV_HTML` constant in `main.js` injected into a `&lt;header id='site-header'&gt;&lt;/header&gt;` placeholder. Active link computed from `window.location.pathname` rather than hardcoded `class='active'` per page. Magazine nav link renamed from 'Magazine' to 'Protocolized'.

- **Team page overhaul:** Added photos for James Langdon, Tim Beiko, and Rafael Fernandez. Venkat's photo localized to `assets/beings/` rather than pulling from an external URL. C3PO and Humboldt added as full team members with titles 'Corpus Orchestrator' and 'Artificial Researcher' respectively. All profile photos consolidated into `assets/beings/`.

- **'New Nature' capitalization:** 'the new nature' (lowercase) replaced with 'New Nature' (title case) throughout the site — copy, headings, and alt text. Treated as a proper noun / named research area rather than a generic description.

---

## Session 10: Network and Consulting Updates, Symposium Form, Landing Banner

*2026-05-29*

**Tracks:** static-site, content, operations

- **Network and consulting updated from Google Form data:** Added ProSoDiAC Lab (Giovanni Merlino, University of Messina) with SVG logo to the PIN network page. Added Protopolis Lab (Helena Rong, NYU Shanghai) with website link. Updated Rafael Fernandez's consulting card with full expertise list and `rafael.fyi` contact link. Logos stored in `assets/network/`. Added `fetch_form_data.py` script for pulling current Google Sheets data and `SHEETS.md` documenting the update workflow and field mappings.

- **Symposium 2026 page updates:** Wired in the Google Form for abstract submissions. Added June 14 submission deadline to the body copy and the CTA box. Removed the boxed submission-type blurbs that were creating redundant structure. The page now has a clear single CTA.

- **Symposium banner on landing page:** Added a promotional banner for the 2026 symposium to `index.html`. Currently a CSS placeholder — final artwork from the commissioned artist is pending (brief: 1520×400px at 2× retina). The slot and CSS are in place; swapping in the real image requires one file replacement.

---

## Session 11: Member Directory Phase 2 — D1 Backend, PIN Auth, Admin Tools

*2026-05-30*

**Tracks:** member-directory, cloudflare-migration

- **D1-backed member directory:** Replaced static HTML on `/members`, `/team`, and `/consulting` with dynamic pages backed by Cloudflare D1 (`pi-members` database). `/api/members` serves a filtered public listing; `/api/members/me` returns authenticated user data. Members table holds profile fields, role flags (`is_team`, `is_consultant`, `is_public`, `is_admin`), 10 event tags, and consulting fields.

- **PIN email auth flow:** Email → Resend sends 6-digit PIN → verify → 24h session cookie. Implemented across `/api/auth/send-pin` and `/api/auth/verify-pin`. Works for both new applicants (proceeds to join form) and existing members (redirects to edit page). Resend API key and domain (`protocol-institute.org`) confirmed live.

- **Join form (`/members/join`):** 3-step flow: email → PIN verification → application form. Fields: name, bio, website, city, Discord handle, 10 qualifying event checkboxes, optional consulting listing (expertise, contact, portfolio), optional team listing (job title, role description), profile photo URL. Submitted to `/api/membership/request` as a pending request for admin review.

- **Profile edit page (`/members/edit`):** Session-gated edit form. Features: photo thumbnail preview, R2 upload from computer, editable event tag checkboxes, city and Discord handle fields. Admin users see a member selector dropdown (via `/api/admin/member-list`) and can toggle `is_team`, `team_title`, `is_consultant`, `is_public` for any member.

- **Admin review panel (`/admin/members`):** Displays pending membership requests. Each card shows all submitted fields including city, Discord handle, team fields, and photo URL. Approve/reject actions with optional admin notes and slug override. `is_admin` flag added to members table (migration 007); Venkat and Timber are admins.

---

## Session 12: Architecture Review, SoP Migration Pages, Domain Redirect Plan

*2026-05-30*

**Tracks:** cloudflare-migration, member-directory, static-site, content, operations

- **Member Login/Register topbar:** Added a site-wide 'Member Login / Register' link injected above the nav on every page via `main.js`. Styled as a small uppercase link in the upper right corner. The `/members/join` page copy updated to clarify it handles both cases — existing members are routed to their edit profile, new applicants complete the join form.

- **CF Zero Trust Access for `/admin/*`:** Configured Cloudflare Access (Zero Trust free tier) to gate the admin panel at the CDN layer — unauthenticated requests never reach the page. Policy: email allowlist (Venkat + Timber), one-time PIN to email. Zero application code changes required. The existing Bearer token auth remains as a second layer. Previously, the admin page was publicly visible and the only protection was a password field sending a key from JavaScript.

- **Tag consolidation and bug fix:** `VALID_TAGS` / `TAG_COLUMNS` was duplicated across three Worker function files and two HTML inline scripts, with a silent drift: `admin/members.js` was missing `tag_protocolized_writer` from `TAG_COLUMNS`, so approving a member who applied with that tag silently dropped it from their record. Fixed by creating `functions/_shared/tags.js` (ES module, imported by all Workers) and `js/tags.js` (global for HTML pages). Adding a new event tag now requires editing one file.

- **CSP cleanup:** Removed `cdn.jsdelivr.net` from the `script-src` directive in `_headers` — it was allowlisted but never loaded. Tightening the CSP reduces the attack surface for script injection.

- **SIG mailing list plan documented:** Designed a SIG-only opt-in mailing list system using Resend Audiences + D1 subscription prefs + CF Worker for broadcast. Single sending address: `sigs@protocol-institute.org` (not yet created). Four SIG lists (sigfpt, mrg, sigpfb, protfisig). New `is_sig_host` role. Members opt in via a new Lists tab in their profile. SIG hosts compose and send via a web UI (no inbound email alias for now). Plan documented in `status-vgr.md`. Implementation blocked pending Resend sender setup and Audience creation.

- **SoP migration — new pages:** Migrated content from `summerofprotocols.com` to this site. `/symposium-2025`: archive of the 2025 Protocol Symposium (Sept 12–19, theme *Accelerating Order*) — Foundations Workshop, Protocol School, Hackathons. `/programs/protocol-school`: stub for the biennial Protocol School program with 2025 edition details and full list of 11 teaching fellows. Added Protocol School entry to `/programs`. `/workshops`: Corporate Workshops offering — virtual seminar + in-person format, Venkat/Timber facilitator split by sector, contact updated to PI email. `/license`: CC+ License page documenting the SoP23 dual-licensing model (CC BY-NC 4.0 → CC BY 4.0 on Dec 13, 2026); linked from About page. `data/alumni.json`: 70 alumni from SoP23–25 saved locally as reference for future directory work.

- **summerofprotocols.com redirect plan:** Domain migrating to Cloudflare; will redirect different paths to `protocol-institute.org` (institutional pages) and `protocolized.io` (content/research). Catch-all goes to protocolized.io. Specific path rules documented in `../admin/sop-domain-migration.md` as an ordered CF Redirect Rules list. Protocolized CLAUDE.md updated to note the incoming catch-all traffic. Implementation ready to execute once DNS zone is in CF.

---

## Session 13: Events History System, CF Cleanup, File Consolidation, SoP Ingestion

*2026-06-01*

**Tracks:** static-site, content, operations

- **Events history system:** Built a database-driven events index at `/events/`. `data/events.json` is the canonical source of truth — fetched at runtime by the index page, which sorts and renders event cards via JS. Individual event detail pages are static HTML at `/events/{slug}/`. Initial set: 7 events covering 2023–2025. 'Events' added to main nav. Events index uses a `TYPE_LABELS` map for human-readable type badges; mobile layout switches to single-column below 580px.

- **SoP event ingestion — 3 additional events:** Added three pre-existing events sourced from summerofprotocols.com: Researcher Retreat, St. Edward State Park, Seattle (August 2023); Datus and Nusas Workshop, Singapore (March 26–29, 2024); Khlongs and Subaks Workshop, CMKL University, Bangkok (April 21–25, 2025). Events.json now covers 10 events. Healdsburg location updated to 'Edge Esmeralda, Healdsburg, CA' for both Healdsburg entries. `sop-migration.md` deleted after remaining items were ported to `status.md`.

- **CF migration cleanup:** Deleted `netlify.toml`, `MIGRATION.md`, and `feat/cloudflare-migration` branch (local + remote). All docs updated to reflect Cloudflare Pages as the live host. The migration branch had been 4,854 lines behind main — an obsolete early exploration with nothing to merge.

- **File consolidation:** Merged `claude-vgr.md` into `CLAUDE.md` and `status-vgr.md` into `status.md`. Both `-vgr` files deleted. The primary maintainer now owns both files directly; the split was an artifact of the earlier multi-contributor setup. `CLAUDE.md` updated with CF Pages deployment details, governance section, and session rituals referencing the consolidated files.

---

## Session 14: Symposium 2026 Banner, Event Merges, Asset Policy

*2026-06-01*

**Tracks:** static-site, content, operations

- **Symposium 2026 banner (`nn_banner6.png`):** Replaced the CSS text placeholder on the homepage with the commissioned artwork (1208×278px PNG, teal background, 'Protocol Symposium September 21–24, 2026 / Abstracts due June 14'). Image also added to the `/symposium-2026` page header. Symposium kicker and meta description updated with confirmed dates (Sep 21–24). The banner was initially committed to git but failed to load — root cause: all `/assets/*` requests are intercepted by `functions/assets/[[path]].js` and served from R2, not from the static file tree. Fixed by uploading to R2 via `wrangler r2 object put` and removing from git.

- **Protocol Symposium 2025 event merge:** Replaced the two separate events (Protocol Foundations Workshop 2025, Protocol School 2025) with a single Protocol Symposium 2025 entry covering the full Sep 12–19 week. New detail page at `/events/protocol-symposium-2025/` covers both components as subsections. Old URLs redirect to new via `_redirects`.

- **R2 asset policy formalised:** Binary assets (PNG, JPG, WEBP) are not committed to git — they live in R2 bucket `pi-assets` and are served at `/assets/*` via `functions/assets/[[path]].js`. This was already the de facto practice (all profile photos, logos, etc. are R2-only); `.gitignore` now enforces it for `assets/*.png` and subdirectories. `inbox/` is the local staging folder (also gitignored). Upload command and workflow documented in `CLAUDE.md`.

- **ROADMAP: member pre-population added as major backlog item:** Documents the plan to bulk-import a few hundred existing community members from the PI spreadsheet into D1. Key design: `claimed` flag, invite-first approach (mass-email via Resend to route people to pre-populated profiles), admin merge endpoint as fallback. Field mapping from spreadsheet to D1 is the main open prerequisite.

---

## Session 15: Banner Refresh, Date Fix, Events Thumbnails, Nav Restructure

*2026-06-01*

**Tracks:** static-site, content, operations

- Updated `nn_banner6.png` in R2 with a revised version of the artwork. Simultaneously corrected the symposium date from Sep 21–24 to Sep 21–25 across all four occurrences: meta description, visible kicker, and both `alt` attributes in `index.html` and `symposium-2026/index.html`.

- Added Protocol Symposium 2026 to `data/events.json` as the first entry (sorts to top by `date_start: 2026-09-21`). Added a `status: "upcoming"` field and updated `events/index.html` JS to render an amber 'Upcoming' badge for entries with that status. CSS for `.event-upcoming-badge` added to `style.css` using the site's existing draft-banner amber palette.

- Uploaded `nn_artbanner.png` to R2 and wired it as the Symposium 2026 events card thumbnail — the wide banner aspect ratio is inappropriate for the card layout, so a separate square-ish art image is used there. Uploaded `symposium24.webp` and `symposium25.webp` to R2 and wired into the 2024 and 2025 events entries respectively. All three wired via `image` field in `data/events.json`.

- Top nav reduced from 7 items to 4: Programs, Events, Protocolized, About. Contact, Members, and Support Us moved to the footer. Rather than editing ~100 individual HTML files, the footer is now injected globally from `main.js` via `document.querySelector('.site-footer').innerHTML = FOOTER_HTML` — the same pattern already used for the header. The footer's existing `.site-footer` element in every page serves as the injection target. Footer links: Team, Network, Consulting, Symposium, Contact, Members, Support Us.

---

## Session 16: URL Consolidation, Programs Restructure, New SIGs, Pitchdeck Fix

*2026-06-01*

**Tracks:** static-site, content, operations

- Removed two orphaned top-level directories (`symposium-2026/` and the empty `protocol-symposium-2026/`) and established `events/protocol-symposium-2026/index.html` as the single canonical page, matching the naming convention of the 2024 and 2025 editions. The page serves the active CFP and will be updated in-place to show the program after the June 14 submission deadline, then converted to a historical archive post-event. Redirects added to `_redirects` for both old URLs. Homepage banner link and footer Symposium link updated to the canonical path.

- Removed Protocol School from the Programs index — it is a component of the Symposium, not a standalone program, and its dedicated page at `/programs/protocol-school` remains. Added a Protocol Symposium entry linking all three editions (2024, 2025, 2026 upcoming) in a single item.

- Created `sigs/drg/index.html` (Distributed Robotics Group — onchain robotics protocols, led by Anuraj R. and Rafael Fernandez) and `sigs/sigpsy/index.html` (SIGPSY — Special Interest Group in Psychohistory, long-range historical modeling, led by Venkatesh Rao and Aneesh Sathe; links worldmachines.org). Both appear in the SIG index with an amber 'Coming Soon' badge (`status-draft` CSS class added). `sigs/CONVENTIONS.md` updated with `drg` and `sigpsy` slugs so c3po's ingestion pipeline knows where to write sessions when they begin.

- The pitchdeck was throwing 'Deck error — marked is not defined' because `deck.html` loaded the marked markdown parser from `cdn.jsdelivr.net`, which is blocked by the site's `Content-Security-Policy: script-src 'self'` header (set in `_headers`). Fixed by downloading marked v15 (~40kb) into `pitchdeck/marked.min.js` and updating the script tag to load from the same origin.

---

## Session 17: Jamverse, Whitespace Compaction, Nav Member Link

*2026-06-03*

**Tracks:** static-site, content

- The placeholder 'Worldbuilding (coming soon)' item in the Protocolized section of `programs/index.html` was replaced with a named entry: **Jamverse**, described as a near-future protocol fiction extended universe, linking to `jamverse.protocolized.io`. Still marked coming soon. A TODO comment in the HTML marks it for a description update in a week or two once copy is ready.

- A broad pass over `css/style.css` reduced vertical spacing throughout: `body line-height` 1.7→1.6; `p margin-bottom` 1.4rem→1rem globally; `.page-header` padding and margin roughly halved; `.site-footer margin-top` 6rem→3.5rem; `.project-item` padding 2.5rem→1.5rem; `.team-member` padding 3rem→2rem; event, member, network, consulting, and symposium section margins all reduced 30–50%. Landing page padding and logo margin also tightened. No structural changes — all visual.

- Previously the 'Member Login / Register' link lived in a separate `.site-topbar` div rendered above the `.site-nav`, adding a full extra row. Restructured so the link is now a `.nav-member-link` inside `.site-nav`, sitting on the same flex row as the logo/brand. Since `.nav-brand` has `flex: 1`, the member link naturally aligns right. The topbar div and its CSS rules were removed. On mobile the link is hidden (`display: none`) since the footer already has a Members link. Net effect: one fewer row of chrome at the top of every page.

- Four untracked files — `sigs/mrg.html`, `sigs/protfisig.html`, `sigs/sigfpt.html`, `sigs/sigpfb.html` — were old pre-clean-URL flat files that kept reappearing. Deleted. The canonical pages live at `sigs/mrg/index.html`, etc.

---

## Session 18: Challenges Page, Nav Dropdown, Symposium Fixes

*2026-06-08*

**Tracks:** static-site, member-directory, content

- New page at `/challenges` backed by a `challenges` D1 table (migrations 008 + 009). Each challenge has title, description (server-sanitized HTML with safe links), Fibonacci planning-poker difficulty with descriptive labels (Trivial → Whitehead advance), free-text *Posed By* field, and a *Communicated By* field auto-set to the submitting member. Two-track interest voting: anonymous votes deduped via `pi_chal_voted` cookie; member votes deduped in a `challenge_votes` join table. Raw anon and member counts stored separately for reweighted scoring. Challenge value formula: `seed + A×anon² + B×member²` (A=1, B=3), sorted by value descending. Admin-only seed adjustment via PATCH `/api/challenges/:id/seed`. Venkat and Timber set to `is_admin=1`.

- Add-challenge form is collapsed by default behind a teal *▶ Add a challenge* toggle; grayed out and inactive when not logged in. After submit, form is replaced by a confirmation box with *Add another →*. Each challenge card has `id="challenge-{id}"` permalink anchor with hash-scroll after async load. Orange-rust beta badge (`#D85A30`, matching C3PO) on page heading and nav item. Challenges added to top nav (between Events and Protocolized) and to Programs page. `challenges/PLAN.md` documents planned features: individual pages, annotations system, and ingestion/clustering/auto-tagging pipeline.

- The static *Member Login / Register* nav link is now session-aware. After page load, `/api/members/me` is fetched: if authenticated, the link is replaced with a dropdown toggle showing a person-silhouette icon and the member's name (▾). Dropdown contains *Edit profile* → `/members/edit` and *Log out*. Logout hits new endpoint `POST /api/auth/logout`, which deletes the session record from D1 and clears the `HttpOnly` `pi_session` cookie server-side, then reloads. Unauthenticated link now carries `?return=&lt;current_path&gt;` so the auth flow redirects back to the originating page after login (replaces the previous hardcoded redirect to `/members/edit`).

- SIGFPT index had two future-dated stub entries (June 12 and June 26, 2026) pre-created for agenda posting. New CSS class `.meeting-upcoming` adds an amber *Scheduled* badge next to the date and mutes the entry. `sigs/CONVENTIONS.md` updated to specify the correct handling pattern for c3po's ingestion pipeline: use `meeting-upcoming` class, placeholder summary, and re-ingest after the session occurs.

- Short presentations corrected to 25 min + 5 min Q&A (was 20 min). Workshop format updated to 4 Zoom sessions over 2 days, Sept 21–22 (was 60–90 min). Word counts and form-level details stripped — let the Google Form handle them. Special Sessions line added: contact link points to `/team#venkatesh-rao` (team cards already had `id` attributes). Link to Challenges page added above the submission CTA.

---

## Session 19: Membership approvals, welcome emails, DRG blurb

*2026-06-09*

**Tracks:** member-directory, content, operations

- Reviewed 8 pending `membership_requests` records directly via D1. Six were approved (Sean Stevenson, Patrick Atwater, Giovanni Merlino, Nai-Chi Cheng, Johann Richard, Will Abramson) and inserted into `members` via `wrangler d1 execute --remote` with correct schema — fixing a pre-existing bug in the admin API where `request_consultant` was used as a column name instead of `is_team`, and adding `city`, `discord_handle`, and `owner_email` fields that the old code omitted. Two applications (Alexandra Braslasu, Javier Chavez) were rejected: Braslasu explicitly stated no prior event or SIG participation; Chavez selected `tag_sig` only with no corroborating bio or notes evidence.

- Rewrote `functions/api/admin/members.js` to send emails on approval and rejection. On approve: generates a PIN with 72-hour TTL (vs. 15 min for standard login), stores hash in `auth_pins`, sends a welcome email via Resend with the code and a link to `/members/join`. On reject: sends the standard ineligibility notice referencing the join page. New `resend_welcome` action allows retroactively sending welcome emails to already-approved members without requiring a new application. Shares all Resend infrastructure with `send-pin.js` — no new service dependency. The 8 emails from this session are pending until `RESEND_API_KEY` and `WEBSITE_ADMIN_KEY` are retrieved from CF dashboard and saved locally.

- The intro paragraph on `/members/join` previously said only 'qualifying Protocol Institute events' — too vague to set expectations accurately. Replaced with an explicit list: Summer of Protocols cohorts, Protocol School, PI symposium events, active SIG participation, Protocol Kit recipients, Protocolized contributors. The qualifying events checkbox section now notes that applications are reviewed against actual participation records, to deter applicants who select boxes without qualifying.

- Discovered that `RESEND_API_KEY` and `WEBSITE_ADMIN_KEY`, both set as CF Pages secrets in May 2026, were never saved to `../.env.keys` per the PI security policy. This blocked programmatic email sending and required retrieval from the CF dashboard. A mandatory protocol callout was added to `CLAUDE.md` and a persistent memory entry recorded, specifying that any new CF secret must be saved locally and registered in `../admin/keys.md` before the task is considered complete.

- The Distributed Robotics Group description was updated on both the SIG index and the DRG detail page with the full two-paragraph third-person blurb supplied by the team: onchain robotics / decentralized coordination framing in paragraph 1; applied research group with equal protocol design and robot-building focus in paragraph 2. The DRG page also had a stale hardcoded nav with dead `.html` links from a pre-migration era — replaced with the standard `&lt;header id="site-header"&gt;` injection pattern and a `&lt;footer class="site-footer"&gt;` element populated by `main.js`.

---

## Session 20: Programs hierarchy, nav overhaul, SIG page fixes, c3po interface plan

*2026-06-12*

**Tracks:** static-site, content, operations

- Redesigned the Programs page around a formal 4-category taxonomy. Each program item now has a left-bordered `.program-body` section with typed sub-items labeled **Tracks**, **Projects**, or **Infrastructure**. Added a taxonomy intro line explaining the three sub-categories. Key structural changes: (1) *Research* program created, bundling SIGs (tracks), Challenges (infrastructure), and solo projects; (2) *AI Infrastructure* renamed *AI Ops*; C3PO and Humboldt reclassified as Infrastructure; (3) *Events* program replaces the standalone Protocol Symposium item, listing all 10 events from `data/events.json` as Projects; (4) *Collaborations* program added with Long Now as a Track; (5) Research SIGs listed individually with descriptions rather than via the /sigs index. All items now have phrase-length descriptions and link to internal detail pages — no direct external links at program-page level.

- Five new stub detail pages created: `/worldmachines`, `/jamverse`, `/protocolized-dev`, `/longnow`, `/humboldt`. Each has a short description and a link to the external site with an `.external-badge` label. This enforces the pattern that all items on the Programs page link internally; external destinations are one click deeper. The `.external-badge` CSS class was added to `style.css`. protocolized.dev description: "AI adoption protocols for orgs".

- Main nav links updated in `js/main.js`: removed *Projects* (was a dead URL) and *Events*; added *SIGs* (links to /sigs) and *Calendar* (links to /calendar stub); moved *About* from main nav to footer as first footer link. Calendar stub page created at `/calendar/index.html` with draft banner.

- The landing page (`index.html`) previously used a special `.landing-wrapper` / `.landing-center` fullscreen layout with an animated SVG logo. Replaced with the standard `.interior-wrapper` / `.interior-main` / `.container` structure used by all other pages — injected nav, injected footer, 760px container, `page-header` h1. The animated logo is no longer used anywhere on the site.

- The c3po ingestion script was generating full HTML pages including a hardcoded stale nav (still referencing `/projects.html` and `Initiatives`), causing the DRG and other SIG pages to revert on every ingest run. Three fixes: (1) `nav_html()` and `footer_html()` now emit the empty injection placeholders (`&lt;header id="site-header"&gt;`, `&lt;footer class="site-footer"&gt;`) rather than hardcoded markup; (2) generator no longer writes legacy `sigs/{slug}.html` flat files — only `sigs/{slug}/index.html`; (3) DRG `SIG_INFO` entry updated with correct two-paragraph description using a new `description_extra` field rendered as a second `&lt;p&gt;`. The two tracked legacy flat files (`sigs/drg.html`, `sigs/sigpsy.html`) were removed from git. All six SIG `index.html` pages were regenerated clean.

- Authored `plans/website-interface.md` in the c3po repo documenting the approved division of labor: c3po's output boundary is JSON (never HTML); the website owns all rendering. The plan specifies the handoff location (`website/data/sigs/meetings/`), JSON schema, what changes in each repo, and how the pattern extends to future content areas (cogergo writeups, event summaries). The c3po `CLAUDE.md` now prominently references this plan with a one-line rule: c3po writes JSON only. `generate_sig_pages.py` is marked as pending refactor per the plan.

---

## Session 21: Calendar, SIG schedule sync, symposium improvements, banner carousel

*2026-06-13*

**Tracks:** static-site, content, operations

- Three additions to `/events/protocol-symposium-2026/index.html`: (1) new paragraph naming the *New Nature* theme with link to the Protocolized essay, and a pointer to the Challenges page for submission ideas; (2) the June 14 deadline text made bold and red (`style="color:#c0392b"`) in both the opener and the CTA box; (3) a live countdown ticker in the CTA box, updated every minute, expiring at `2026-06-15T07:00:00Z` (midnight PDT). The duplicate challenges reference in the Call for Submissions section was removed.

- Two changes to `index.html`: (1) the hardcoded symposium banner replaced with a `&lt;div id="banner-carousel"&gt;` populated at load time by an inline script that fetches `/carousel/banners.md`, parses a Markdown table of `file | weight | link | alt` rows, picks a banner by weighted random, and injects the image. Adding a new banner requires uploading to R2 and adding a row to `carousel/banners.md` — no code changes. Currently one banner. (2) "Learn more on our About page" link removed; replaced with an "Explore PI's activities" bullet list (Challenges, SIGs, Protocolized, Discord) below the banner.

- Built `/calendar/index.html` from its Coming Soon stub. The page shows a merged Google Calendar iframe in AGENDA mode displaying both the PI Community Calendar (`sigs@protocol-institute.org`, orange `#C17F24`) and the PI Institute Calendar (curated events, teal `#2A6B6B`). Above the iframe: two inline bullet items with colored dots, calendar names, and Subscribe links; a note explaining how to add events to the community calendar (invite `sigs@protocol-institute.org`, make a Discord event, contact Timber). The `_headers` CSP was missing `https://calendar.google.com` in `frame-src`, causing the iframe to be blocked — fixed by adding it.

- Three-layer system for keeping SIG meeting times accurate: **sync_sig_meetings.py** fetches the SIGs iCal feed (`sigs@protocol-institute.org/public/basic.ics`), parses VEVENT blocks and RRULEs (using `zoneinfo` for UTC conversion), and writes `data/sig-meetings.json` with per-SIG anchor date, interval, day, and UTC time. MRG is not yet on the calendar and is manually set. **Client-side JS** in `main.js` fetches the JSON on any page containing `[data-sig]` elements, computes the next meeting date by advancing from anchor, formats the schedule string including browser-local time (via `toLocaleTimeString()` — detects day-shift for UTC+12 etc.), and writes it as innerHTML. The "Next meeting on DATE" phrase is wrapped in `&lt;strong&gt;`. **HTML**: all six SIG index pages and individual SIG pages updated — `.sig-meta` now contains only the leader names; a new `&lt;p class="sig-schedule" data-sig="SLUG"&gt;` element is populated by JS. CSS: `.sig-schedule` styled as a tinted teal box (`#F0F5F3` background, `#BFCFCC` border) to make next-meeting prominent.

- Organizer names in `.sig-meta` on both the SIG index and all individual SIG pages are now hyperlinked where a profile exists: Venkatesh Rao links to `/team#venkatesh-rao` (public); Rafael Fernandez and Sachin Benny link to `/members#rafael-fernandez` and `/members#sachin-benny` respectively (PIN-gated). The remaining organizers (Patrick Nast, Kei Kreutler, Spencer Nitkey, Anuraj R., Aneesh Sathe) have no link until they are onboarded. Member cards in `members/index.html` were given `id="${m.slug}"` so hash links resolve correctly.

---

## Session 22: SIG DST fix, Programs tabs, site-wide links, member onboarding

*2026-06-14*

**Tracks:** static-site, member-directory, operations

- The prior approach stored a single `time_utc` string derived from the iCal DTSTART anchor. For meetings specified in a local timezone (e.g. 10am Pacific), this UTC time was correct for the anchor date's DST state but wrong for future occurrences across DST boundaries — a November meeting would display one hour off.Fix: `sync_sig_meetings.py` now steps the RRULE forward as a naive datetime in the source timezone, converts each occurrence to UTC individually (so DST is applied per-date), and stores 30 pre-expanded ISO 8601 timestamps per SIG in `data/sig-meetings.json`. `main.js` is reduced to a list lookup: find the first entry &ge; now, extract UTC time from the Date object directly, call `toLocaleTimeString()` for browser-local time. MRG (not yet on the SIGs calendar) handled via `MANUAL_SIGS` dict in the script.

- Added a two-tab system to `programs/index.html`. The Hierarchical View is the existing program-by-program layout unchanged. The Flattened View is generated lazily on first click by `buildFlatList()`, which walks the Hierarchical View DOM — every `.category-items li` across all programs and category groups — and renders a flat list with program name (`project-status` badge) and category type (`project-category` badge) as tags. Tab state is mirrored to the URL via `history.replaceState` using `?view=flattened`. `/projects` and `/projects/` redirect 301 to `/programs?view=flattened`. Verified isomorphism: 28 leaf items in both views.

- Two sources of nav jump identified. (1) The authenticated member dropdown replaces an `&lt;a class="nav-member-link"&gt;` with a `&lt;button class="nav-member-toggle nav-member-link"&gt;`. The button carried browser-default padding/border not reset by the shared class, making it slightly larger than the link it replaced and causing a layout shift on every authenticated page load. Fix: `.nav-member-toggle { background: none; border: none; padding: 0; }`. (2) The Challenges beta badge had `line-height: 1.5`, creating a taller box than necessary. Reduced to `line-height: 1`.

- Global `a {}` updated to show teal underline at rest with 30% opacity (`text-decoration-color: rgba(42,107,107,0.3)`) and full opacity on hover, with `text-underline-offset: 0.12em`. All existing nav exclusions (`.nav-links a`, `.footer-nav a`, `.nav-brand`, `.nav-member-link`, `.project-name-link`) already had class-level `text-decoration: none` overrides that win over the element selector — no changes needed to those. Added `text-decoration: none` to `.form-btn` (the one button-styled `&lt;a&gt;` that lacked it). Removed redundant `color: inherit; text-decoration: none` from `.member-name a`.

- Added `404.html` at repo root. Cloudflare Pages serves this automatically for unmatched routes. Standard interior-wrapper layout with injected nav/footer, terse two-line message, and a small `.error-nav` return link set to the main site sections.

- Root cause analysis: the approval Worker sometimes terminated between the `INSERT INTO members` and `sendWelcomeEmail()` calls (CF Worker transient error / cold start), leaving members approved but without a welcome email. Previously undetectable.Fix: D1 migration 013 adds `welcome_sent INTEGER DEFAULT 0` to `members`. The last line of `sendWelcomeEmail()` sets it to 1 — only reachable if both the auth_pins write and the Resend call succeeded. The `resend_welcome` action also sets it.`check_members.py` is the session startup ritual: queries pending `membership_requests` and categorises them as APPROVE (any strong qualifying tag: SIG, SoP cohort, workshop) or REVIEW (weaker tags only); checks `members WHERE welcome_sent = 0` and prints `--resend` commands; prints a summary. Run: `python3 check_members.py`.Also resolved: initial query checked `members WHERE is_public = 0` rather than `membership_requests WHERE status = 'pending'` — the two tables are distinct (requests live in membership_requests until approved). Fixed the query approach and documented in the script.

- 10 pending applications approved in bulk via the admin panel. 3 of 10 (Afeez, Anuraj, Randy) had no welcome email sent due to the Worker failure mode above — resent via the admin API. Founding members (Timber, Tim, James, Sachin, Rafael) were manually inserted before the email system existed and had never received welcome emails — sent with a custom delayed-welcome template explaining the reason. James Langdon's email corrected from `james@protocol-institute.org` (bounced) to `james@protocolized.io`; orphaned auth_pins entry for old address cleaned up. Aneesh Sathe's slug corrected from `mail` (derived from email prefix) to `aneesh-sathe`. Note: Resend API calls from local Python urllib are blocked by Cloudflare bot detection on resend.com — use subprocess + curl instead.

- Join page: intro split into two paragraphs; eligibility paragraph gains closing sentence linking to the Members page. Added bold spam-guidance paragraph (PIN instant, approval days-to-a-week, sender address, check spam, mark not-spam) followed by an unbolded Discord #bugs-and-tests fallback. Email hint under input simplified to 'We'll send you a 6-digit code to log on.'Welcome email template: 'Welcome!' added to first paragraph; new paragraph before sign-off mentions Challenges as a members-only feature and asks recipients to mark not-spam if it landed there.

---

## Session 23: Member tier system, CRM auto-approve, symposium voting

*2026-06-14*

**Tracks:** static-site, member-directory, operations

- Replaced the flat `is_team`/`is_consultant` flag model with a three-tier hierarchy: **team**, **community_lead**, **member**. New columns `tier TEXT DEFAULT 'member'` and `community_lead_title TEXT` added to `members`. All `is_team=1` records backfilled to `tier='team'`. Aneesh Sathe corrected from team to `community_lead / SIG Host`; Patrick Nast, Rafael Fernandez, Sachin Benny, Anuraj R. also promoted to community_lead. `is_team` and `is_consultant` flags retained for backward compatibility but `tier` is now the authoritative classification.Team badge: white on filled teal. SIG Host badge: white on deep crimson (#8A1F2E). Members page filters: All / Team / Community Leads / Consultants / event tags. /team and /consulting deleted and redirected (301) to /members?filter=team and /members?filter=consultant. Filter blurbs show contextual descriptions per filter. URL param `?filter=X` is bookmarkable.

- Team and Consultant filtered views render styled card boxes (border, background, padding) with 96px profile photos. All member photos previously stored as external URLs (aneesh, anuraj, kaliya, amber) were downloaded and uploaded to R2 as `beings/slug.ext`, then `photo_r2_key` updated in D1. All photos now served via the R2 proxy — no external image dependencies remain. Consultants without photos are silently excluded from the consultant card view; Afeez Oladimeji remains excluded until he adds a photo. Consultant cards show expertise chips and contact/portfolio links. Members page is alphabetically sorted (name ASC) across all views.

- 165 CRM contacts (email + affiliation string) imported into new `crm_contacts` table. On every join form submission, `/api/membership/request` queries `crm_contacts` for the email; if matched, the member record is created immediately (CRM affiliation tags merged with form tags), the request is marked approved, and a welcome email is sent — bypassing the admin queue entirely. Falls back gracefully to pending review if the CRM check errors.Affiliation → tag mapping: SoP23/24/25, 2025 Protocol School, 2025 Foundations Workshop (→ tag_symposium_25), Protocolized Writer, Guest Speaker (→ tag_guest_speaker). Two new event tags added to `members`, `membership_requests`, join form, and members filter bar.Shared modules extracted: `functions/_shared/welcome.js` (PIN generation, Resend call, welcome_sent flag update) and `functions/_shared/session.js` (pi_session cookie validator). Previously duplicated inline in multiple handlers.check_members.py: new section 0 exports members, membership_requests, and crm_contacts to `backups/pi-members-YYYY-MM-DD.json` on every startup run. Directory gitignored.

- Admin panel at `/admin/members` gained a second tab: **Member Directory**. Loads all members via `GET /api/admin/members?view=all` (ADMIN_KEY gated). Each row is click-to-expand, opening an inline edit form with all profile fields (name, bio, website, city, discord, photo_r2_key), role fields (tier, community_lead_title, team_title), flag checkboxes (is_consultant, is_public, is_admin, welcome_sent), and all event tag checkboxes. Save calls new `PATCH /api/admin/members` endpoint which builds a whitelisted `UPDATE members SET … WHERE email = ?`. The approval tab is unchanged.

- New page at `/events/protocol-symposium-2026/submissions/` (currently gated to `is_admin=1`; opens to all members when voting launches). 36 proposals imported from the call-for-abstracts CSV: 27 talks + 3 workshops shortlisted; Ashton Keys (5 submissions) and Varun Adibhatla (1) not shortlisted. Missing titles for early submissions extracted from abstract text or set manually (Nathan Schneider: "Virtues for a Protocol Society").Voting model: each member gets a budget of 30 votes (50 for team). Allocating *n* votes to a proposal contributes *tier_weight × √n* to its aggregate score (team=3×, community_lead=2×, member=1×). Scores computed in SQL via a single correlated GROUP BY with SQRT(). Budget bar shows votes remaining, Total Effective Weight (Σ√n across all allocations), and ratio of votes cast. Voting closes June 30 UTC — the API rejects saves after the deadline and the UI disables inputs.Three workshop detail pages generated statically from D1 data, each with full abstract, organizer bios, audience, takeaways, and activities. All pages share the same is_admin session gate.Comment system (migration 017): any logged-in member can post comments on any shortlisted proposal. `symposium_comments` table stores member_email, member_name, body. Comments are loaded on-demand per card; count badge updates after posting. Intended for suggestions to speakers/organizers.

- All six SIG index pages updated: organizer names in `.sig-meta` now link to `/members#slug` for members in the directory. Kei Kreutler (MRG) and Spencer Nitkey (ProtFiSIG) still not linked — not yet in the member directory.New stub page `/consulting/policies/` documenting consulting network eligibility, conduct standards, and removal policy. Linked from the consultant checkbox note on the join form.

---

## Session 24: Symposium 2026: Submissions Pipeline, Special Sessions, Inline Editing

*2026-06-15*

**Tracks:** static-site, member-directory, content

- Submission deadline (June 14) passed. Symposium page updated: call-for-submissions section replaced with post-deadline blurb, countdown ticker removed, form link removed. Two new banner images (newnature_dates_1333x1000 and newnature_dates_1000x1000) resized to WebP via Pillow (1440×1080 at 500KB for banners, 400×400 at 66KB for events index thumbnail) and uploaded to R2 as `nn_dates_banner.webp` and `nn_dates_square.webp`. Carousel config and events.json updated. The old `nn_banner6.png` had the deadline text baked in — new images are date-only.

- Final Google Form export (57 rows) processed via Python/openpyxl: Ayse Demir duplicate removed (same abstract, two email addresses 1 min apart — kept outlook.com); titles manually extracted for 6 early submissions where the Title of talk column was blank (submitted before the field was added to the form); track names normalised (SIGP4B→SIGPfB, SIGFIC→ProtFiSIG, etc.). 55 proposals inserted into `symposium_proposals` via `db/seed_proposals.sql`. 47-address email list exported to inbox for personal outreach. Varun Adibhatla and Ashton Keys' proposals pre-marked `is_shortlisted=0` (preserved from prior session).Migration 018 added `session TEXT DEFAULT 'General'` to symposium_proposals. Migration 019 added `type='interactive'` to the CHECK constraint via table recreation (positional SELECT * column-order bug hit; fixed with UPDATE swap). Migration 020 created `symposium_sessions` table (slug, name, owner_email, date, start_time, end_time, description, agenda).

- Four special sessions defined: Memory (MRG-track talks), Protocol Fiction (Spencer Nitkey entry, split — see below), Psychohistory (Aneesh Sathe, Sean Stevenson, Florian Lohse), Southeast Asia (Samuel Chua as owner). Each has a page at `/events/protocol-symposium-2026/sessions/{slug}/` fetching session metadata and proposals from D1 in parallel. GET/PATCH `/api/symposium/sessions/:slug` handles metadata; session owners and admins see an 'Edit session details' form for description and agenda (date/time fields hidden — to be added via backend later). Draft banner auto-hides when description and agenda are both filled.Session colors applied to proposal cards: Memory #EBF2FF, Protocol Fiction #F5EEFF, Psychohistory #FEF9EC, Southeast Asia #E8F5EE. Double-class specificity in style.css beats inline .proposal-card rules. Submissions index gains a Session filter dropdown and alphabetical sort by first name.

- Spencer Nitkey's original submission was a special session proposal disguising 3 separate items within the abstract paragraphs. Split into: (1) *Myth-Making in New Nature* — talk by Liz Maher (lizmaherland@gmail.com), (2) *Story-Shaping in New Nature* — talk by Spencer Nitkey, (3) *Creating New Genres for New Nature* — interactive component by Spencer + Sachin Benny. Migration 019 added 'interactive' as a valid type via table recreation. All three tagged session='Protocol Fiction', is_shortlisted=1. Original ID 31 deleted.

- PATCH `/api/symposium/proposals/:id`: owners (speaker_email/organizer_email match) can update title and abstract; admins can update all 19 fields. GET on same endpoint returns full row (admin only) for form pre-fill.On session pages and submissions index: proposal owners see a red 'You own this item — edit details' button that reveals an inline title+abstract form. Admins see the same button as a link to `/events/protocol-symposium-2026/submissions/edit-proposal.html?id=N` — the admin proposals form in edit mode, which pre-fills all fields and PATCHes on submit. Form was moved from `/admin/proposals.html` to this path to avoid requiring Cloudflare Zero Trust authentication in addition to the site's own is_admin check.

- Welcome email previously sent a PIN, but navigating to the login page to enter it would first trigger a new-PIN request on step 1, invalidating the welcome-email PIN. Fixed by removing the PIN from welcome.js entirely — the email now just says 'approved, go to /members/join and request a code.'Pre-approval gate: `send-pin.js` (join flow) now checks `membership_requests` before issuing a PIN. If the email has a pending application and no members row, returns 400 with 'Your application is being reviewed' — the user sees this inline on step 1 and never reaches the PIN entry step.

- Samuel Chua (samuelthechua@gmail.com) added directly to `members` table (tier=member, welcome_sent=1, pre-approved). Stub talk proposal 'Seapunk Worlds' created with abstract 'An overview talk about protocols research and exploration in Southeast Asia', session=Southeast Asia, is_shortlisted=1. Samuel set as owner_email on the southeast-asia symposium_sessions row, giving him the red edit button for both the session metadata and his own talk.

- A duplicate member account was created with email vgururao@gmail.com (slug 'vgururao') while trying to associate Venkat's personal email with the Humboldt AI agent profile. Resolved: duplicate member record and its active auth_pin session deleted; existing Humboldt profile (humboldt@protocol-institute.org) updated to owner_email=vgururao@gmail.com; Humboldt's proposal speaker_email left as vgururao@gmail.com (manageable via admin account's is_admin flag until humboldt@protocol-institute.org is set up as a full member).

- Added `VOTE_START = 2026-06-18T07:00:00Z` (midnight PDT Wednesday) alongside the existing `VOTE_DEADLINE`. `votingOpen` now requires both conditions; a new `votingPending` flag drives button text ('Voting not yet open') and the budget-bar sub-label ('Voting opens Wednesday, June 18.'). All proposal cards and the full UI display normally; only the vote inputs and Save button are disabled.

---

## Session 25: Pre-invite hardening, voting window, Draft Agenda, proposal cleanup

*2026-06-15*

**Tracks:** member-directory, static-site

- 49 symposium proposer emails inserted into `crm_contacts` with affiliation '2026 Symposium', excluding Ashton Keys. Anika Meier (co-organizer) added separately. D1 migration 021 adds `tag_symposium_26` column to `members` and `membership_requests`. `EVENT_TAGS`, `CRM_TAG_MAP`, `js/tags.js`, and the join form checkbox were all updated. Proposers who sign up at /members/join will be auto-approved and tagged.

- Four bugs found in audit and fixed before inviting proposers: (1) `proposals/[id].js` owner check was case-sensitive — server used raw DB email, client lowercased; affected Sean Stevenson, Kei Kreutler, Kaliya Young, Florian Lohse. Fixed with `LOWER(TRIM())` on comparison. (2) Patrick Atwater's email stored with trailing space in DB — normalized. (3) Vote budget was 30/50 (member/team split); changed to flat 50 for everyone, tier multiplier (1×/2×/3×) is the only differentiation. (4) Non-authenticated visitors saw 'Voting not yet open' gate message — now shows a login link instead.

- Voting window changed to June 17, 7 AM PDT → June 20, 7 AM PDT (72 hours). VOTE_START/DEADLINE updated in `votes.js` (server-side enforcement) and `submissions/index.html` (client-side display). 'Accepted Submissions' page retitled 'Draft Agenda' (title, h1, meta). Countdown boxes added: a prominent yellow-background box on the main symposium page (shows time-to-open, time-to-close with 'Vote now' link, or 'Voting closed'), and a smaller inline bar on the Draft Agenda page. Both refresh every 30s.

- Main symposium page restructured: removed theme blurb and subheadings; lead text is now just the submissions-closed paragraph. Banner image reduced to 380px (half content width), centered. Countdown box moved to top, image to middle, blurb to bottom. Box background changed from teal-tinted white to light yellow (#FFF8E7) for better contrast; 'View draft agenda' CTA always inside the box.

- Added `timeZoneName: 'short'` to the `toLocaleTimeString` call in `main.js`. SIG pages now show e.g. '17:00 WEST your local time' instead of '17:00 your local time', allowing users to self-diagnose timezone mismatches. Prompted by a Portugal (WEST) user reporting 1-hour offset — root cause was likely OS timezone set to WET instead of WEST, not a code bug.

- Three talks moved from Memory special session back to General: Venkatesh Rao ('Artisanal Bots'), Stanislav Lvovsky ('Provenance Against Fluency'), Daniel Schmidt ('Don't Cross the Lines'). Memory session now has 5 real proposals. Six proposals deleted entirely: 5 from Ashton Keys (all tracks) and 1 from Varun Adibhatla. 55 proposals remain, all shortlisted.

---

## Session 26: Workshop pages live from D1; admin email editing; session audit

*2026-06-15*

**Tracks:** member-directory, static-site

- Two workshop detail pages were missing entirely (proposals 75 — Beyond the Artwork, and 79 — Protocolize Your Book), causing 404s on their submission links. Both were created. Separately, all 5 workshop pages had two compounding bugs: (1) the auth gate checked `is_admin` rather than any authenticated member, blocking logged-in non-admin proposers; (2) pages were static HTML generated once from D1, so owner edits via the inline editor on the submissions page were never reflected. Fixed both: gate now checks `data.member` only, and all 5 pages were rewritten to fetch `/api/symposium/proposals/:id` on every load and render dynamically. A lightweight `renderText()` function handles `**bold**` and `- bullet` markdown in the raw proposal data. The proposals GET endpoint was relaxed from admin-only to any authenticated member to support this.

- Email was the `TEXT PRIMARY KEY` in the `members` schema and was used as the PATCH lookup key in both the admin UI and API, making it impossible to edit. Switched the admin member editor to use `slug` (UNIQUE NOT NULL, stable) as the lookup key throughout: frontend keyed on `data-slug`, API changed to `WHERE slug = ?`, and `email` added to `EDITABLE_FIELDS`. Email input added to the edit form. Separately, the member Edit Profile page now shows email as a read-only field with a note directing members to contact an admin to change it.

- Audited all 4 special session pages (Memory, Protocol Fiction, Psychohistory, Southeast Asia) and the submissions index for correct member gating, owner edit wiring, and live edit reflection. All were correct except the Memory session: its `startSessionEdit()` function referenced `meta-date`, `meta-start`, `meta-end`, `edit-date`, `edit-start`, `edit-end` — DOM elements that were removed in an earlier refactor. Clicking the edit button threw a TypeError silently. Removed the three stale lines; the other 3 session pages already had the corrected version.

- James Langdon's member record email was updated directly in D1 from `james@protocolized.io` to `editor@protocolized.io`. He subsequently signed up via the join form with `editor@protocolized.io` and the request was approved via the admin panel. The approval's `INSERT OR IGNORE INTO members` correctly detected the existing record and skipped insertion, preserving his team-level member record. Resend API key is stored but is send-only restricted; bounce status for the old `james@` welcome email must be checked in the Resend dashboard.

---

## Session 27: Login flow overhaul: pending state, mobile nav, touch targets

*2026-06-15*

**Tracks:** member-directory, static-site

- The `humboldt` member record's email was `humboldt@protocol-institute.org` (a non-existent address). Logging in as `vgururao@gmail.com` (the owner email) caused `/api/members/me` to return 404, dropping the user into the apply form. D1 was updated directly: `UPDATE members SET email = 'vgururao@gmail.com', owner_email = NULL WHERE slug = 'humboldt'`. A stale `membership_requests` row created when Venkat went through the apply flow to diagnose the bug was also deleted. `humboldt@protocol-institute.org` has never existed; when it is created it can be set as the email again.

- The pending check in `request.js` filtered on `status = 'pending'` only. If a user submitted, was auto-approved (changing status to 'approved'), then submitted again, the check passed, the second `INSERT INTO membership_requests` hit a PRIMARY KEY conflict, the Worker crashed, and CF returned a 500 HTML page. `res.json()` on that HTML threw 'Unexpected token &lt;' as the visible error. Fixed: the check now queries for any existing row (any status) and returns a status-specific JSON 409 message. Also wrapped `res.json()` in try/catch in the join page so a future Worker crash shows 'Server error. Please try again.' instead of a raw parse exception.

- `/api/members/me` previously returned 404 for any email with a valid session but no member row. It now checks `membership_requests` first: if a pending row exists, it returns `{ pending: true, email }` with status 200. 404 is reserved for emails with no member record and no pending application. This is the pivot that makes all the pending-state UI work without extra API endpoints.

- Major rewrite of the join page logic. (1) On page load, checks for an existing session: approved member → redirect, pending → skip to pending state, no session → show step 1 as before. (2) After PIN verify, the same three-way dispatch replaces the old binary check. (3) After apply submit: `auto_approved: true` → 'Your email was on the pre-approved list…' welcome state with member directory link; pending → pending state (same UI as the returning-visitor case). (4) Pending state: grey box with email address and Log out button — no apply form shown. (5) Log out button in pending state uses the same `doLogout` helper as the nav.

- The Edit Profile page previously contained a full Email → Verify → Edit wizard, duplicating the join page's auth logic. This was confusing for existing members who were not logged in (they saw a login wizard inside what should be a profile editor). Removed steps 1 and 2 entirely. The page now shows only the edit form. On load it calls `/api/members/me`: if the response is not a full member record (unauthenticated, pending, or 404), it immediately redirects to `/members/join?return=/members/edit`. The nav's Edit Profile link only appears for approved members, so pending users are never pointed here.

- Nav session check updated to handle three states: (1) approved member — name + dropdown with Edit Profile and Log out (unchanged); (2) pending — 'Pending Approval' label + Log out only, no Edit Profile; (3) not authenticated — login link (unchanged). On mobile (≤768px), the desktop auth element was `display:none` with nothing replacing it — logged-out users had no login link and logged-in users had no profile menu. Fixed by adding a `nav-mobile-auth` list item as the last item in the hamburger menu, separated by a border, populated with the same three states. A shared `doLogout` helper is used by both desktop and mobile logout buttons. All `/members/join` anchors without a `return=` param are now updated with `?return=&lt;current-path&gt;` in a single `querySelectorAll` pass, covering both the nav link and all in-page gate links.

- On mobile (17px base font), form elements were below the 44px touch-target minimum. Buttons: `padding: 0.7em → 0.9em` vertical (~39px → ~45px). Inputs: `padding: 0.6rem → 0.75rem` vertical and `font-size: 0.95rem → 1rem` (~40px → ~45px; also prevents iOS auto-zoom which triggers below 16px effective font size). Checkboxes: box size 15px → 20px with 0.3rem row padding on the label. All overrides applied in a `@media (max-width: 768px)` block to leave desktop layout unchanged.

- Added `docs/authentication.md` documenting the full auth system: member states, the join/apply/edit flows, D1 table schemas, API endpoint reference, nav behaviour per state, mobile behaviour, security notes, and a section of known limitations and future improvements (rate limiting on send-pin, session revocation on email change, no active-session list, fixed TTL, CSRF).

- Two gaps in the edit profile page. (1) The photo upload section was shown to all members even though regular member photos appear nowhere on the site. Fixed: `photo-field-group` now starts hidden and is revealed only when `is_team || is_consultant` (or always for admins). (2) Regular members had no self-service path to the consulting directory. Fixed: a 'List me in the PI Consulting Network' checkbox appears for non-consultant members; checking it expands the consulting fields and photo section; on Save, `is_consultant = 1` is written and the opt-in toggle collapses. `is_consultant` moved to `SELF_EDITABLE` in `update.js` — consistent with the stated 'approved by default' policy. Admins retain override via `ADMIN_EDITABLE`. After save, UI updates in-place without a reload.

- D1 update: `is_team = 1`, `tier = 'team'`, `team_title = 'Book Editor'`, `photo_r2_key = 'jennadixon.webp'`. Photo uploaded from inbox to R2 bucket `pi-assets` as `jennadixon.webp` (WebP). She now appears in the team view at `/members` with her photo.

---

## Session 28: Symposium nav polish: comments, edit buttons, dynamic sessions

*2026-06-15*

**Tracks:** member-directory, static-site

- Added the expandable comments section (toggle → lazy-load → compose/post) to every view where a proposal appears: the Draft Agenda index page already had it; added it to all 5 workshop detail pages and all 4 special session pages. Each card shows `Comments (N) ▾`; first expand fetches `/api/symposium/comments?proposal_id=`; count updates after posting. Workshop detail pages required a separate `toggleComments / loadComments / submitComment` implementation (single-proposal scope, no shared IDs). Session pages share the index-page pattern (per-proposal IDs passed as arguments).

- Workshop titles on the Draft Agenda index are now links to their detail pages (inheriting title colour, underline on hover); the redundant 'Workshop details →' footer link removed. The `saveEdit` function updated to preserve the anchor after inline title edits. All workshop detail pages and all session pages received a '← Draft Agenda' back link at the top of the authenticated view, and the label on workshop pages was updated from the stale '← Accepted Submissions'.

- Workshop detail pages previously had no edit affordance once you navigated there from the index. Added: the page now calls `/api/members/me` first to resolve email and isAdmin; after the proposal renders, admin gets a red link to `edit-proposal.html?id=PROPOSAL_ID` (full form, all fields) and non-admin organiser gets an inline title/abstract form. The bar is dynamically populated via `innerHTML` after auth resolves so there is only one element in the HTML. Session pages similarly got an 'Edit details' button above the title; admin → link to full form, session owner → inline form. The edit button and form are positioned above the `page-header / h1` (inside `main-view`) so they appear at the top of the authenticated view rather than after the body content.

- The session-level edit form previously only offered 'About this session' and 'Agenda'. Added a 'Title' (name) field. Backend: `name` added to the allowed PATCH fields in `sessions/[slug].js`. On page load, `sess.name` (returned by the GET endpoint) is now applied to `#session-title`, fixing a bug where the hardcoded HTML h1 silently overrode any saved name on every reload. After save, the h1 is updated in-place. The PATCH handler now also fetches the old name before writing; if the name changed, it runs `UPDATE symposium_proposals SET session = new WHERE session = old` — cascading the rename to all affected proposals automatically. Prior to this fix, renaming a session left proposals pointing at the old name, breaking the filter.

- The Draft Agenda page had a hardcoded `&lt;select&gt;` and `SESSION_SLUGS` map that listed 'Memory', 'Protocol Fiction', 'Psychohistory', 'Southeast Asia'. These would fall out of sync any time a session was renamed. Replaced with: a new public endpoint `GET /api/symposium/sessions` (`functions/api/symposium/sessions/index.js`) that returns `[{slug, name}]` ordered alphabetically; the page now fetches this in parallel with proposals after auth, builds `SESSION_SLUGS` from the response, and appends `&lt;option&gt;` elements to the dropdown dynamically. The hardcoded values are gone.

- The workshop 'Beyond the Artwork' had a doubled 'b' in its directory slug and D1 record. Fixed: `git mv` to rename the directory, login return URL in the HTML corrected, D1 updated via `UPDATE symposium_proposals SET slug = 'beyond-...' WHERE id = 75`. The index page generates workshop links from `p.slug` via the API so no other file changes were needed.

- Three sessions were renamed (Memory → 'The Art of Memory', Protocol Fiction → 'Worldbuilding in New Nature', Psychohistory → 'Inventing Psychohistory') before the cascade fix was in place. 11 proposals (5+3+3) still had the old names and therefore matched nothing in the dropdown. Fixed with three direct D1 UPDATE statements. Going forward the PATCH cascade ensures this stays in sync automatically.

---

## Session 29: Voting UX Overhaul + Program Rename

*2026-06-16*

**Tracks:** member-directory, static-site

- Each voter now sees only their own contribution: *Your interest weight* (tier × √n) and *Your votes* input. Admins additionally see *Total interest weight* and *Total votes* per card. proposals.js adds total_votes to the aggregate query. The previous design showed the aggregate score to all voters, which would have been gameable signal during the voting window.

- Added `is_early_voter INTEGER DEFAULT 0` to members. Members with this flag can cast votes before VOTE_START. Both the votes API and the frontend gate on `canVote = (votingOpen || isEarlyVoter) &amp;&amp; before deadline`. venkat@protocol-institute.org, timber@protocol-institute.org, and hi@timbeiko.com seeded as early voters. Tim Beiko also promoted to is_admin=1.

- Added an All tab (all 55 proposals, alphabetical by first name) as the default starting view for easy vote distribution. The separate Interactive tab was removed; interactive proposals now appear in the Talks tab with a *· Interactive* italic tag on the track line. The type field is preserved in the DB.

- The submissions directory was renamed to program via `git mv`, preserving history. Page title changed to &ldquo;Draft Program&rdquo;. All internal links across session pages, workshop pages, edit-proposal, and the symposium index CTA updated. Redirect added: `/events/protocol-symposium-2026/submissions → /program`. Slug will remain /program after voting ends; title will drop &ldquo;Draft&rdquo;.

- Budget bar restructured: Save / Distribute Evenly / Clear Votes buttons in a right-aligned column; meta (Your total interest weight + bold deadline) stacked left; Sort by radio row inside the sticky area. Budget raised 50→55 to match proposal count. Distribute Evenly fills floor(budget/n) per proposal (exactly 1 each at 55/55). All controls disabled when voting is closed.

- Each session page hardcoded `const SESSION = 'Memory'` (or 'Protocol Fiction', 'Psychohistory') to filter proposals. After Session 28 renames, proposal session fields cascaded correctly but these constants were never updated, so no talks appeared. Fixed by removing the constant and filtering on `sess.name` from the live API response, making future renames safe.

- Three issues found via Playwright at 390px: (1) Sticky bar 362px tall (43% of viewport) — compact button padding at ≤600px brings it to 265px. (2) Progress bar orphaned on its own flex row — hidden on mobile since the text label already conveys the count. (3) Deadline line not bold — DM Sans only loads weights 300/400/500, so `&lt;strong&gt;` (700) had no matching face; fixed with explicit `font-weight:600` CSS rule.

---

## Session 30: Nav overhaul, page simplifications, early voter backfill, member dates

*2026-06-16*

**Tracks:** static-site, member-directory, operations

- The /calendar page (Google Calendar iframe) and /events page (event history list from events.json) were merged into a single /events page with a tabbed submenu — Calendar first and default, Events History on click. Nav updated from “Calendar” to “Events”; /calendar and /calendar/ redirect to /events. Active-link detection in main.js now highlights “Events” for all /events/* subpages.

- A “More ▾” dropdown added as the last nav item, containing: About, Network, Symposium, Contact, Members, Support Us — previously footer-only links. Desktop: positioned dropdown, opens on click, closes on outside click, teal highlight when current page is one of the items. Mobile: toggle hidden, items always shown inline as stacked nav entries. CSS scoped to .nav-more-* classes.

- About page rewritten by editor with bracket notation for links. All 8 anchors resolved: Protocolized, Substack, Programs, Events, Team, Community Leads, Discord, Support Us. A 180×180px logo block (logo-static.png with light border) inserted between paragraphs 1 and 2 as a visual break. Stale hardcoded footer replaced with injected footer.

- Join page intro rewritten to one concise paragraph. Eligibility detail (SoP cohorts, Protocol School, SIGs, Protocol Kit, Protocolized) moved to a footnote linked by a * superscript, using a hairline top border, 0.8rem muted text, and a back-link. The old dense bold approval-timing paragraph was removed. Stale hardcoded footer replaced.

- Old support page (pitch deck iframe) saved as support/index.html.bak. New page has a concise intro, 8-item list of support mechanisms (books, Substack, ticketed events, consultant hire, partner orgs, research projects, grassroots drives, grant funding), and a contact close. All bracket links resolved. List item labels styled teal+500 weight via scoped style block — DM Sans only loads weights 300/400/500 so browser bold maps to 500 with little contrast.

- Projects sections added to four SIG pages: YakRobot Protocols (yakrobot.com) under DRG; World Machines (/worldmachines) under SIGPSY; Jamverse (/jamverse) under ProtFiSIG; protocolized.dev (/protocolized-dev) under SIGPfB. YakRobot Protocols also added to Programs page under Research → Projects. Jamverse “coming soon” badge removed.

- Shortlisted symposium proposals carry speaker_email, organizer_email, and co_organizer_email. Cross-referencing all three fields yielded 51 unique proposer emails, all in the CRM pre-approval list. All 20 registered proposers now have is_early_voter=1 (16 updated via D1; 4 including Venkat/Timber/Tim already set). The remaining 31 will get is_early_voter=1 automatically on registration: request.js now queries symposium_proposals for a matching email in any of the three fields with is_shortlisted=1.

- Two new TEXT fields added to members: member_since (signup date, YYYY-MM-DD) and membership_expires (signup + 1 year). Set at member creation in both the CRM auto-approve path (request.js) and admin manual approval (admin/members.js). 36 existing members backfilled from created_at. Fields are informational only; expiration enforcement, renewal logic, and notification emails are documented as a backlog item in ROADMAP.md. A provisional status line added to both the join page (Step 3) and edit profile page: “Membership status is currently free, and based on ongoing qualifying contributions to PI activities.”

---

## Session 31: Voting analytics admin dashboard

*2026-06-17*

**Tracks:** member-directory, operations

- New table `symposium_vote_saves(member_email PK, save_count INTEGER, last_saved_at TEXT)` tracks how many times each voter has clicked the Save Votes button. votes.js previously DELETE+INSERT on each save with no audit trail; now also UPSERTs to this table (increment save_count, update last_saved_at). Save counts before this deploy are 0 — historical vote totals are accurate from symposium_votes.

- New CF Pages Function returns real-time stats aggregated from D1: total_members, total_voters, ratio, total_votes_cast at the top level; per-registrant rows with name, email, registered_at, save_count, votes_placed, proposals_touched, and an is_indifferent flag (true when max_vote &le; 1 and votes_placed &gt; 0 — signals the voter spread at most 1 vote per proposal, the quadratic voting analog of indifference). Auth: must have a valid pi_session cookie with is_admin = 1 in D1.

- New admin page at /admin/symposium-analytics (CF Access gated via the /admin/* policy). Four stat cards at top: Voters, Members, Participation %, Total Votes Cast. Registrant table ordered newest-first: Name, Email, Registered (full timestamp), Saves, Votes Placed, Proposals Touched, Distribution badge (Indifferent / Engaged / No vote). Page auto-refreshes every 30 seconds with a visible countdown. Entirely server-driven — no cron, no laptop required; every load queries live D1 via the analytics endpoint.

---

## Session 32: Voting launch and UX polish

*2026-06-17*

**Tracks:** member-directory, operations, static-site

- Moved `VOTE_START` from `2026-06-17T14:00:00Z` (7 AM PDT, early-voter-only window) to `2026-06-17T00:00:00Z` in all three files: the backend CF Function (`functions/api/symposium/votes.js`), the program page JS, and the symposium page JS. The early-voter gate was effectively bypassed once VOTE_START passed; this change ensures the backend also allows all members rather than returning 403. `VOTE_DEADLINE` simultaneously updated from `2026-06-20T14:00:00Z` to `2026-06-21T00:00:00Z` (Saturday June 20, midnight UTC) across all files.

- Added a prominent **Symposium Voting Open** button (teal, links to `/events/protocol-symposium-2026/program/`) with a *(members only)* sub-label and a live countdown ticker (*Voting closes in X days, Y hours*) above the banner carousel on `index.html`. The banner link itself was also updated to go directly to `/program/` rather than the intermediate symposium page.

- All voting deadline/countdown displays now share a consistent style: `color:#B91C1C; font-weight:700`, larger font-size than before. Applied to: homepage countdown ticker (`.symposium-vote-countdown`), symposium page countdown time and sub-text (`.vote-countdown-time`, `.vote-countdown-sub`), program page mini clock (`.vote-clock-mini`), and the deadline-line span in the sticky bar (`#deadline-line`).

- The All/Talks/Workshops tab row was moved inside the sticky budget bar so it stays visible while scrolling. A voting strategy hint was added below the sort radio buttons. For team and community-lead members a tier-multiplier note is shown (*Your votes count 3×/2× a regular member's in the final tally*); weight displays show plain √n to all members — the tier multiplier is applied server-side in aggregate scoring only. Discovered and fixed a bug where `updateBudget()` was computing effective weight as Σ√n (missing tier multiplier) — then reverted per-display to plain √n per product decision.

- Workshop proposals now display a filled teal **Workshop** badge (class `.type-badge--workshop`) below the title, visible in both the All and Workshops tabs. The SIG track/alignment label (the `proposal-track` field) was suppressed from all cards to reduce confusion with special sessions — only the *Interactive* tag is preserved for interactive proposals. Special-session proposals show an outlined teal **Special Session** chip alongside the session link, with 'special session' removed from the anchor text (now reads e.g. *Psychohistory →*).

- Added a new `.sig-projects` block between the blurb and Meeting Archive on four SIG index pages: SIGPfB → protocolized.dev; DRG → YakRobot Protocols (external); SIGPSY → World Machines; ProtFiSIG → Jamverse. New CSS in `style.css`. These links were planned but never added to the HTML in prior sessions.

- Kei Kreutler and Spencer Nitkey promoted to `community_lead` tier with `community_lead_title = 'SIG Host'` (the title drives the red badge on member cards). Josh Davis joined as `protocolinstitute@j0xh.com`, set to `team` tier with `is_team=1`, `team_title='Protocol Coordinator Emeritus'`, and `photo_r2_key='logo-static.png'` (the same PI logo placeholder used for C3PO and Humboldt). Jamverse 'Coming soon' banner removed.

---

## Session 33: SIG about pages and managed-page system

*2026-06-18*

**Tracks:** static-site, member-directory, cloudflare-migration

- Each SIG now has a `/sigs/{sig}/about/` page: `sigs/{sig}/about/index.html` is a static shell that loads content from D1 via `managed-page.js`. The MRG page already existed (created in a prior session); this session added `sigfpt`, `sigpfb`, `protfisig`, `drg`, and `sigpsy`. All 5 new pages were seeded with placeholder markdown (title + existing description text) to D1 via `python3 scripts/import_page.py --all-sigs`. Each SIG index page fetches `/api/pages/sigs/{sig}/about` at load time and displays the first non-heading paragraph as a snippet with a 'More about X →' link.

- New shared JS module at `js/managed-page.js`. Requires a `PAGE_KEY` global before loading. On init, fetches content from `/api/pages/{PAGE_KEY}` and renders it via marked.js (CDN lazy-loaded; falls back to inline plain renderer if CDN fails). Admins and SIG hosts see an Edit Bar with an Edit button. Clicking Edit loads EasyMDE (CDN lazy-loaded) and mounts the rich editor. Save POSTs JSON to `/api/pages/{PAGE_KEY}`. Shell HTML must contain: `page-loading`, `page-content`, `page-body`, `edit-bar`, `edit-btn`, `page-editor`, `editor-mount`, `save-btn`, `cancel-btn`.

- New CF Pages Function. GET is public: returns `managed_pages` row if `is_published = 1`, otherwise 404. POST (auth-gated): upserts content; authorization checks `is_admin` or (`is_sig_host` + `sig_host_slugs` contains the first path segment). Important: CF WAF blocks HTTP PUT on Cloudflare Pages sites, returning an HTML error page — the endpoint must export `onRequestPost`. Both `onRequestPost` and `onRequestPut` are exported (PUT kept for robustness but the client always uses POST). The handler wraps all logic in try/catch to return a JSON error body rather than letting CF generate an opaque HTML 500.

- Added `is_sig_host INTEGER NOT NULL DEFAULT 0` and `sig_host_slugs TEXT` to the `members` table. `sig_host_slugs` stores a JSON array of SIG slug strings (e.g. `["mrg","sigfpt"]`). These fields are queried by both `checkEditPermission()` on the client side (via `/api/members/me`) and `canEdit()` in the pages API. Missing this migration caused the first save attempt to return a D1_ERROR 500. Kei Kreutler and Spencer Nitkey were each set to `is_sig_host=1` with appropriate `sig_host_slugs`.

- The `_headers` Content-Security-Policy was extended in multiple passes to allow all jsDelivr resources used by `managed-page.js`: `script-src` (EasyMDE + marked.js), `style-src` (EasyMDE CSS), `font-src` (Font Awesome glyphs bundled as `data:` URIs in EasyMDE's CSS), `connect-src` (source map requests). Also added `blob:` to `img-src` for drag-and-drop image upload support in EasyMDE.

- Switched the rich editor from Toast UI (which silently failed to render) to EasyMDE v2 (jsDelivr CDN). EasyMDE loads successfully: the CodeMirror editing area renders formatted markdown, the status bar shows line/word counts, and toolbar buttons are functionally correct (formatting applies on click). However, the **Font Awesome icon glyphs in the toolbar are invisible** — the button outlines and hover states are visible but the icons are not. The `injectEditorStyles()` function currently has the wrong selector (`.editor-toolbar a` instead of `.editor-toolbar button`); even the correct selector with `color: #1A1A1A !important` did not make the icons visible. Investigation continues next session. Textarea fallback is available if EasyMDE fails to construct.

---

## Session 34: Voting Close and Results Compilation

*2026-06-20*

**Tracks:** member-directory, operations

- The symposium voting window (Jun 17–20) closed automatically at `2026-06-21T00:00:00Z` via the `VOTE_DEADLINE` constant in `functions/api/symposium/votes.js` and the program page JS. Final participation: **48 unique voters**, **2,291 total votes cast** across 55 shortlisted proposals. Top result: Kei Kreutler “Interior Computing” (score 64.6, 29 voters). Full ranked results saved to `data/symposium-2026-results.csv`.

- The `/admin/symposium-analytics` page gained a two-tab layout: **Voters** (existing registrant table) and **Proposals** (new). The Proposals tab fetches `/api/symposium/proposals` alongside the existing analytics call — this endpoint already returns tier-weighted quadratic scores, raw vote totals, and voter counts for all shortlisted proposals. Results are ranked descending by weighted score. A **Download CSV** button generates a fresh CSV client-side from the loaded data.

- Final results snapshot exported from D1 via `wrangler d1 execute --json` piped through a Python CSV writer. 55 rows (one per proposal), columns: Rank, Title, Speaker/Organizer, Type, Session, Weighted Score, Total Votes, Voters. Committed to `data/` as a permanent record of the final voting outcome.

---

## Session 35: Post-Voting Cleanup: Preliminary Program Goes Public

*2026-06-22*

**Tracks:** static-site, operations

- Voting has closed; all voting affordances removed from three surfaces: the **landing page** ("Symposium Voting Open" CTA → simple "Preliminary Program" link), the **symposium main page** (`/events/protocol-symposium-2026/`, voting countdown widget + script removed), and the **program page** (`/events/protocol-symposium-2026/program/`, budget bar, vote inputs, sort-by-votes, distribute/clear/save buttons, countdown clock, and blurb all removed). The program page was gated to PI members during voting; it is now publicly visible to all visitors.

- The `GET /api/symposium/proposals` endpoint previously required a valid member session (returned 401 otherwise). It now fetches all shortlisted proposals unconditionally and returns them to unauthenticated callers. Authenticated members additionally receive `my_votes`, `budget`, `tier`, and `is_admin` for backward compatibility with the admin analytics dashboard, which passes credentials and relies on these fields. The admin analytics page at `/admin/symposium-analytics` is unaffected.

- The program page retitled "Program (Preliminary)". New blurb: registration opens August 21; comments open for suggestions to speakers/workshop organizers. Members see a comment compose textarea; non-members see a login prompt. Proposal owners and admins retain inline editing. Admin-only aggregate score/vote display removed from proposal cards (now admin-dashboard-only). A "← Symposium main page" back link and a New Nature theme preview talk link (protocolized.io/features/new-nature) added above the proposal list.

- A "Key Dates" section added to `/events/protocol-symposium-2026/` as a two-column definition list: Jul 15 special session details due, Aug 21 registration opens, Sept 15 materials due, Sept 21–22 workshops, Sept 23–25 main program, Oct 18 final papers/essays due for proceedings volume.

- New PIN member: Princeton Human-Computer Interaction Lab (Andrés Monroy-Hernández, Associate Professor). Submitted via Google Form 2026-06-22. Lab logo pulled from GitHub avatar URL, uploaded to R2 at `network/princeton-hci.png`, and wired into the network card. Work description: "Decentralization through Protocolization."

---

## Session 36: SIG Calendar Subscriptions, Program Anchors, Project Themes

*2026-07-06*

**Tracks:** static-site, content, operations

- Each SIG now has a dedicated `.ics` file at `/calendar/sigs/{slug}.ics` (six files: sigfpt, mrg, sigpfb, protfisig, drg, sigpsy). Each file is a valid RFC 5545 iCalendar with a `VEVENT` carrying an `RRULE:FREQ=WEEKLY;INTERVAL=N;BYDAY=XX` that represents the full recurring series — not a single instance. The files are generated by `sync_sig_meetings.py`, which already maintained `data/sig-meetings.json`; a new `write_ics_files()` function at the end of `main()` derives `DTSTART` from the first occurrence in the occurrences list and writes the files to `calendar/sigs/`. Motivation: the embedded Google Calendar iframe only exposes a single-instance &ldquo;Add to calendar&rdquo; action; users who clicked it were getting one meeting, not the series. The .ics approach allows any calendar client (Apple, Google, Outlook) to subscribe to the full recurring series in one click.

- The `calendar/index.html` subscribe link was retitled &ldquo;Subscribe (all 6 SIGs as recurring series)&rdquo; to distinguish it from the per-SIG .ics option. A `cal-note` paragraph below the embedded iframe now explains the two options: the all-SIGs Google Calendar subscribe link, and individual per-SIG .ics links (six inline links by SIG name). The note also explains why clicking embedded calendar events only adds a single instance. The `main.js` `fmt()` function was updated to inject `.sig-cal-links` with both options alongside each SIG&rsquo;s schedule block on SIG index pages.

- Each proposal card on the JS-rendered program page (`/events/protocol-symposium-2026/program/`) now has an addressable anchor (`id=&ldquo;p-{id}&rdquo;`). A chain-link SVG icon renders next to each proposal title; clicking it updates the URL hash via `history.pushState`, copies the direct link to the clipboard, and briefly displays a &ldquo;Copied!&rdquo; fade-out label. On page load, `scrollToHash()` runs after `renderAll()` to scroll to any incoming hash. The icon is muted gray at rest and turns teal on hover. No backend changes — purely front-end, since proposals are already fetched by ID.

- D1 migration `027_projects_themes.sql` adds a `themes TEXT` column (JSON array) to the `projects` table, applied to live D1 via wrangler. The `projects/submit/` form replaced the admin-facing `program` dropdown (which encoded internal classification) with a &ldquo;Relevant Themes&rdquo; checkbox panel listing all six SIGs plus &ldquo;Solo Project&rdquo;. This is a semantic self-declaration by the submitter, not an administrative category. The `functions/api/projects.js` POST handler validates theme values against a server-side `VALID_THEMES` set before storing as JSON; the GET handler parses and returns themes as an array. The projects index page (`projects/index.html`) renders theme tags using `.project-theme-tag` (teal, small-caps, bordered) in place of the program badge when themes are present; projects without themes fall back to the old program badge.

- Two existing projects received D1 updates. Project id=9 (Legible Action, Venkatesh Rao) was set to `status=&lsquo;approved&rsquo;` and tagged `themes=[&ldquo;sigfpt&rdquo;]` — it was previously in pending state despite being a live artifact. Project id=8 (Cognitive Ergonomics) was tagged `themes=[&ldquo;mrg&rdquo;,&ldquo;solo&rdquo;]`. Both now appear on the public projects index with SIG-labeled theme badges. This seeds the projects index with two visible entries using the new schema before further submissions arrive.

- The six SIG index pages were updated with new meeting entries from the June 26, 2026 session round. SIGFPT gained a crossover session with the robotics group covering yakrobot protocol demonstration, power-budget computation formalization, and blockchain-based Groth16 verifier contracts for robot protocols. The other SIG pages received analogous session content. Meeting counts updated in section headings. These updates are generated by `sync_sig_meetings.py` and were staged during this session.

---

## Session 37: Calendar Overhaul and the c3po PR Protocol

*2026-07-08*

**Tracks:** static-site, content

- Session 36 shipped a per-SIG recurring `.ics` series file, but there was no way to add a single upcoming occurrence directly to a calendar app — only the whole series. `js/main.js`'s `fmt()` function (which populates the `[data-sig]` schedule blocks on `/sigs`) now also computes a Google Calendar `action=TEMPLATE` link for the next occurrence, using the exact UTC start time from `data/sig-meetings.json` and a fixed 1-hour duration (matching `DURATION:PT1H` in the `.ics` series files). Each SIG's schedule block now shows three links: “Add this meeting to your calendar” (single next event, interactive), “Add series (.ics)” (full recurring series, download), and “Subscribe to full PI Community Calendar” (all SIGs). The distinction is intentional: individual-event add is an interactive one-click action for someone dropping into a single meeting, series add is an explicit file download for someone subscribing long-term.

- The SIG schedule text previously read “...on Discord voice channel.” with no link at all — a naked reference to an unspecified channel. A `SIG_CHANNELS` map was added to `main.js` keyed by SIG slug, with real Discord voice-channel IDs and display names sourced from c3po's `config/discord_channels.json` channel registry (the canonical source c3po's Discord bot already uses for guild structure). The schedule text now links to `https://discord.com/channels/{guild_id}/{channel_id}` with the channel name as anchor text (e.g. `#formal-protocol-theory`), consistent across all 6 SIGs.

- 12 links across 6 SIG index pages and 6 session detail pages (sigfpt × 5, sigpfb × 2, protfisig × 2, each appearing once on the index summary and once on the detail page) used the literal domain `www.youtube.com` as anchor text for session-recording links — indistinguishable from a raw pasted URL. Anchor text changed to “Session livestream (YouTube)” via a scoped `perl` substitution matching only `youtube.com/watch` hrefs, leaving other “Links discussed” resource links (arxiv, github, etc.) on their existing domain-as-anchor convention, which reads fine for citation-style external references. `sigs/CONVENTIONS.md` gained a new rule documenting this distinction, so future c3po ingestion generates correct anchor text for session recordings without a follow-up cleanup pass.

- The Calendar tab on `/events` previously embedded a Google Calendar iframe, which only supported adding a single instance of a recurring event and couldn't be filtered or sorted meaningfully. It's replaced with a native list, JS-rendered from the same structured data that already drives `/sigs` and the `.ics` files: `data/events.json` (Institute-level events — symposia, workshops, conferences, filtered to those not yet ended) merged with each SIG's next occurrence from `data/sig-meetings.json`, sorted chronologically. Every row gets a direct “Add single event to calendar” link (a Google Calendar `action=TEMPLATE` link, single-instance for SIG meetings, all-day/multi-day for Institute events) plus a Details link to the full page; SIG rows additionally get “Download event series (.ics)”. Visual design went through two iterations based on feedback: first pass reused the History tab's thumbnail-card layout (too sprawling, with placeholder image boxes for SIG rows that have no image); second pass introduced dedicated `.cal-row`/`.cal-when`/`.cal-title` etc. styles — date/time bold on the left as the focal element (matching how a calendar reads), title with the Details link beside it, type badge under the date/time, single-line-clamped description, links row — fit into 2–3 text-height rows with no images. The two Google Calendar subscribe links (community, institute) sit above the list rather than buried at the bottom; only the “how to add an event to the community calendar” note stays at the bottom. Removed the now-orphaned `calendar/index.html` — `_redirects` already sent `/calendar` → `/events`, so that file was unreachable and had drifted out of sync with the live page.

- Mid-session, a c3po daemon cycle pushed a full regeneration of all 6 `sigs/*/index.html` files directly to this repo's working tree (not yet committed at the time it was caught). The regeneration silently stripped the `&lt;a href&gt;` wrapper from essentially every meeting-title across all 6 SIGs (~100 entries, including ones whose detail pages already existed) because `generate_sig_pages.py` runs after `update_sig_pages.py` injects those links and had no awareness they were there — every regen reset them to plain text. It also reverted this session's own manual “Session livestream (YouTube)” anchor-text fix in 3 files, and had published two fabricated past-tense summaries for meetings that hadn't happened yet (SIGFPT “Formal Modeling of Stigmergy” dated 2026-07-10, DRG “EIP-8126 Discussion” dated 2026-07-09 — both future-dated at the time), because Discord threads are created ahead of a session to post the agenda and c3po's ingestion had no gate against summarizing an agenda-only thread as if the meeting had concluded. Caught before commit: the working-tree changes were identified as external (all 6 files touched at an identical timestamp, unrelated to any tool call in this session), left uncommitted, and `main` was never polluted. c3po has since been patched: it now opens a PR (branch prefix `c3po/...`) against this repo instead of pushing straight to `main`, waits 7 days after a meeting's date before treating it as complete, and special-cases YouTube links in its generator so manual anchor-text fixes survive regeneration. The resulting fix PR ([#5](https://github.com/Protocol-Institute/website/pull/5)) was reviewed — every restored link target verified to resolve to an existing detail-page directory, YouTube anchor text confirmed untouched, session counts cross-checked against added/removed `&lt;li&gt;` entries — and merged. `CLAUDE.md` now documents this as a standing protocol: check `gh pr list` for open c3po PRs at the start of every session, with a checklist of what a correct c3po PR must satisfy, so a future regression is caught the same way rather than silently landing.

---

## Session 38: SIGs/Events Calendar-Link Deduplication

*2026-07-08*

**Tracks:** static-site

- Session 37 added three calendar-action links (single-event add, series `.ics` download, community-calendar subscribe) directly into each SIG's `/sigs` schedule block — but the same session also rebuilt `/events`'s Calendar tab to show exactly the same three actions for the same next occurrence, via the same underlying `data/sig-meetings.json`. The two blocks had drifted into duplicating each other rather than one linking to the other. `js/main.js`'s `fmt()` (populates `[data-sig]` blocks on `/sigs`) now drops the three inline links entirely and ends with a single sentence: “Next meeting on DATE, view calendar entry” — the phrase links to `/events#sig-&lt;slug&gt;`. All calendar-action links (add single event, add series, subscribe) now live in exactly one place, the `/events` Calendar tab; `/sigs` is now purely a pointer to that entry, not a second copy of the actions.

- For the `/sigs` → `/events` link to land on the right row, each row rendered by `loadUpcoming()` in `events/index.html` now carries a stable `id`: `sig-&lt;slug&gt;` for SIG rows (stable across weeks — always means “this SIG's next occurrence”, not tied to a specific date), `event-&lt;id&gt;` for Institute events (the event's slug from `data/events.json`). Because the list is populated asynchronously after a `fetch`, the browser's native fragment-jump (which fires once at initial parse, before the fetch resolves) can't be relied on — added an explicit check after the list renders: if `window.location.hash` matches a rendered row's id, `scrollIntoView({block:'center'})` is called manually. This pattern (async-rendered list + manual post-render hash scroll) is the one to reuse for any future JS-rendered list that needs deep-linkable rows.

- Deleted alongside the `fmt()` simplification — the class was only ever referenced by the inline-links `&lt;span&gt;` that `fmt()` no longer emits.

---

## Session 39: Blank-Line Bloat Cleanup + c3po Auto-Push Pipeline Diagnosed

*2026-07-24*

**Tracks:** static-site, operations

- Each SIG index page (`sigs/{sigfpt,mrg,sigpfb,protfisig,drg,sigpsy}/index.html`) had roughly 2,672 blank lines sitting between the meeting-list's closing `&lt;/ul&gt;` and the `sig-cta` div. Verified with a small script that the entire span was pure whitespace — no buried content — before stripping each down to a single blank line. Notably, 1,351 of those blank lines per file were already present in the *committed* `main` baseline (a pre-existing generator artifact, not something introduced this session); the remaining ~1,326 were added when two new meeting entries (DRG#03 — EIP-8126 Robot Verification Discussion, and ProtFiSIG's Jamverse writing-exercise session, both dated 2026-07-09) were regenerated locally on disk. Total diff: 8,104 lines removed, 274 inserted, across the 6 files plus the two new session detail-page directories.

- The new DRG#03/ProtFiSIG content wasn't sitting uncommitted by accident — it revealed a real gap in the PR-only pipeline set up in Session 37/38 (PR [#5](https://github.com/Protocol-Institute/website/pull/5)). c3po's daemon (`bin/daemon.py` in the sibling `c3po` repo, 30-minute cycle) always regenerates `sigs/*/index.html` directly on disk in this working tree — that part runs every cycle, unconditionally, writing straight to the filesystem with no git awareness. Separately, a weekly step (`push_website_if_changed()`, gated to run at most once every 7 days) is supposed to stash those changes, rebuild a dedicated `c3po/auto-sig-pages` branch from `origin/main`, and open/update a PR. That weekly step has failed on *every* attempt since 2026-07-09 — confirmed in `daemon.log` for 07-09, 07-16, and 07-24 — with `fatal: pathspec ':(prefix:0)sigs.html' did not match any files`. `WEBSITE_PATHS` in `daemon.py` still listed a top-level `sigs.html` file that hasn't existed since the site restructured to `sigs/index.html` (Session 9, months ago); `generate_sig_pages.py` itself already guards against this and skips gracefully, but `daemon.py`'s git-staging path didn't. The stale pathspec kills the first `git stash push -u -- sigs/ sigs.html monitoring.html` call, the whole flow raises, and the exception handler's recovery is just a bare `git checkout main` — no branch, no PR, and (since the stash itself partially succeeds before the pathspec error surfaces) an orphaned `git stash` entry left behind each time. Three such stashes now sit in this repo's local clone (07-09, 07-16, 07-24), all based on the same stale commit. Net effect: no automated c3po PR has actually landed since #5 on 2026-07-08 — new SIG content has only reached `main` when a human noticed the dirty working tree and committed it by hand, exactly as happened this session.

- Opened [c3po#1](https://github.com/Protocol-Institute/c3po/pull/1) in `Protocol-Institute/c3po` removing the stale `sigs.html` entry from `WEBSITE_PATHS` — a one-line fix. Not merged yet as of this session. `bin/daily_sync.sh` (an older, unscheduled script in the same repo) has the same stale reference and does a direct commit+push rather than opening a PR, but it isn't wired into launchd (only `daemon.py` is) so it was left out of scope rather than fixed speculatively. Until the fix merges and a subsequent weekly cycle is confirmed to actually open a website PR, the automated pipeline can't be trusted — `CLAUDE.md`'s session-start checklist now includes a `git status` check for this exact symptom (dirty `sigs/*/index.html` with no corresponding open PR).

- PR [#1](https://github.com/Protocol-Institute/website/pull/1) ("Fix nav position jump between landing and interior pages", opened 2026-04-27 from the `vgururao` fork) targeted a `.landing-nav` CSS class that no longer exists — the landing and interior nav were consolidated into a single shared `.site-nav` (injected from `js/main.js`) back in Session 9. Closed with an explanatory comment rather than merged.

---

## Session 40: Research (Challenges + Projects) Unification; Symposium Session Pages Fixed to Public

*2026-08-08*

**Tracks:** static-site, member-directory, content

- The four special-session pages under `/events/protocol-symposium-2026/sessions/` (memory, psychohistory, southeast-asia, protocol-fiction) required a logged-in member session before rendering *any* content — `/api/members/me` returns 401 for anonymous visitors, and the page's fetch chain rejected on any non-`ok` response, triggering a full-page "Member access required" gate. The underlying `/api/symposium/sessions/:slug` and `/api/symposium/proposals` endpoints were already public; only the client-side gating logic was wrong. Fixed to treat an anonymous response as "no member" rather than an error, matching the pattern already used on the Draft Program page. Edit affordances (session-details edit bar, per-proposal edit button) were already correctly conditioned on owner/admin and needed no change; comment-posting is now gated on login with a visible prompt, comment-viewing behavior unchanged.

- Investigating the request to link Projects and Challenges surfaced that the existing D1-backed project-submission feature (`projects/submit/` → `POST /api/projects` → admin approval → `GET /api/projects`) was fully functional end-to-end but completely unreachable: `_redirects` still 301'd `/projects` and `/projects/` to `/programs?view=flattened`, a rule added when the *old* flat Initiatives page lived at that path, before the site restructured to `/programs` months ago. When the project-submission feature was later built and given the same URL, nobody removed the stale redirect — so the listing page rendered correctly whenever tested directly, but no real visitor could ever reach it. Separately, the Programs page had accumulated its own hand-authored, parallel notion of "projects" (Jamverse, Cognitive Ergonomics, protocolized.dev, World Machines, YakRobot Protocols, plus institutional infrastructure like C3PO/Humboldt all mixed into one "Projects" sub-category per program) with zero connection to the D1 table — 7 of the 8 existing D1 project rows were themselves just Venkat manually re-entering that same static list into the database by hand, not real submissions.

- Merged Challenges and Projects into a single page at `/research` (nav label "Research", replacing "Challenges") with two tab views — Challenges (default) and Projects — sharing `js/research.js` for the value formula (`seed + 1×anon² + 3×member²`, unchanged from the original challenges formula) and the watching (👀) button mechanics, so both entity types are scored and voted on identically rather than risking two formulas drifting apart. Each challenge card now lists its responding projects; each project card lists the challenges it responds to — both directions read from a new `project_challenges` many-to-many join table (migration 028), which is deliberately editable at any time from the project's own detail page rather than submission-time-only, since either a project or a relevant challenge can postdate the other. `/challenges` and `/projects` (the old list pages) were deleted outright as fully superseded; `_redirects` now sends both into `/research`, which also finally fixes the stale-redirect bug described above.

- Migration 028 replaced the projects table's overloaded `program` (admin-only, never exposed in the submit form) / `sub_program` / `themes` (a multi-select that conflated "which SIG" with a `solo` pseudo-tag) with a single `sig_slug` column — one of the 6 SIG slugs, or `NULL` for independent. Old columns were left in place unused rather than dropped, since dropping columns cleanly across existing rows isn't worth the risk on a live D1 table for a purely cosmetic cleanup. Added `anon_interesting`/`member_interesting`/`seed_interesting` to `projects` plus a `project_votes` table, mirroring `challenges`/`challenge_votes` exactly (same member-dedup-by-email, same anon-dedup-by-cookie pattern, new cookie name `pi_proj_voted`). New `project_team` table implements self-declared team membership: any logged-in member who isn't already the lead can request to join (status `pending`); only the project's `lead_slug` or an admin can approve, at which point the member's name becomes a public credit next to "Lead:". New endpoints: `POST /api/projects/:slug/watching`, `POST /api/projects/:slug/team`, `POST`/`DELETE /api/projects/:slug/team/:member_slug/approve`, `POST`/`DELETE /api/projects/:slug/challenges`.

- Deleted 3 of the 8 existing `projects` rows (c3po, humboldt, and a nonsensical "Challenges Index" self-reference) — these are institutional infrastructure that now lives solely on `/programs`, never duplicated into the member-project system. Backfilled `sig_slug` on the 5 real projects kept (jamverse→protfisig, protocolized-dev→sigpfb, worldmachines→sigpsy, cognitive-ergonomics→mrg, the one organic member submission→sigfpt), using existing `sub_program`/`themes` values and a Session-30 status.md note as evidence. `programs/index.html` had its Research→Projects and Protocolized→Projects sub-categories deleted entirely (5 items, all now member/team-led and living solely in `/research`), keeping the Programs page's remaining content — SIGs, institutional infrastructure (C3PO, Humboldt, the new "Research index" link), Events, and the Long Now track — mutually exclusive with the member-project index by construction, not just by convention. Added YakRobot Protocols as a proper project (lead: Anuraj R., confirmed by Venkat after the initial pass flagged it as unresolvable without a lead decision) and corrected two lead misattributions Venkat caught post-session: Jamverse's real lead is Sachin Benny and World Machines' is Aneesh Sathe, not Venkat — both had been created as admin/Venkat-owned stub entries in the original 2026-06-09 backfill, before those SIG members were onboarded as PI members.

- Session-start housekeeping found the same known pattern as Session 39: c3po's daemon regenerates `sigs/*/index.html` locally every 30 minutes but its weekly website-PR step is still not confirmed working (c3po#1 fix not yet merged), so 5 new SIG session entries (DRG#04 A2A protocol integration, ProtFiSIG sci-fi/Mrs. Brown, SIGFPT formal methods pt.2, SIGPfB drone warfare journalism, SIGPSY Oracle v2.0) were sitting as uncommitted local changes rather than arriving via PR. Reviewed against the c3po PR checklist (link targets exist, no <7-day premature summaries, session counts match, YouTube anchor text intact) and committed by hand. The recurring whitespace-bloat regen artifact (Session 39 also hit this) was worse this cycle — roughly 300 lines/file across all 6 SIGs, including `mrg`, which had received no new content at all — stripped back down to baseline levels before committing.

---

## Session 41: c3po Pipeline Audit + Fixes; SIG Calendar Gains First Non-SIG Entry

*2026-08-10*

**Tracks:** operations, content

- c3po#1 (merged 2026-07-24) genuinely fixed the stale `sigs.html` pathspec bug, but the very next weekly push attempt (2026-08-07 daemon.log) hit a *different* fatal error: `git add` refusing to stage `monitoring.html` because this repo's `.gitignore` excludes it (deliberately, since 2026-06-03 &mdash; it's a local-convenience dashboard copy, never meant to be deployed). `git add` on an explicitly-named ignored path is fatal, not a silent skip, so the whole push flow aborted before a PR could open. Net effect: zero c3po website PRs landed between #5 (2026-07-08) and this session &mdash; the pathspec fix bought exactly one bug's worth of runway before the next one blocked the same flow. Opened [c3po#2](https://github.com/Protocol-Institute/c3po/pull/2) dropping `monitoring.html` from `WEBSITE_PATHS`; not yet merged.

- The recurring "stray blank lines on every regen" issue tracked since Session 39 turned out to have a precise, single-line cause: `_patch_meeting_archive()`'s replace pattern stopped matching at a zero-width lookahead (`(?=\s*&lt;div class="sig-cta"&gt;)`) rather than consuming that whitespace as part of the match. A lookahead never eats characters, so the regex engine's earliest satisfying position was immediately after `&lt;/ul&gt;`, leaving the existing blank-line whitespace before the `sig-cta` div completely untouched &mdash; then the replacement string appended its own fresh `\n\n` on top of it. Since this patch runs unconditionally for all 6 SIGs on every 30-minute daemon cycle regardless of whether meeting data changed, the leak was constant: roughly 2 lines/cycle/file, compounding to ~800 leaked lines/file by this session (up from "4 lines" when Session 39 first spotted it one cycle later). Fix moves `\s*` out of the lookahead into the consumed match; verified idempotent (repeated runs produce byte-identical output) against synthetic input covering both the normal-archive and empty-archive cases, and against all 6 real current SIG pages. Opened [c3po#3](https://github.com/Protocol-Institute/c3po/pull/3); not yet merged.

- Because the push-flow bug above meant no PR had landed since 07-08, the VM's daemon (`c3po-vm.exe.xyz`, migrated there 2026-08-01) had been silently regenerating `sigs/*/index.html` locally every 30 minutes with nowhere for the results to go &mdash; content just accumulated as uncommitted changes in its working tree, mirroring the Session 39 incident exactly. Pulled the accumulated diff directly from the VM via scp, reviewed by hand against the standing c3po-PR checklist (link targets resolve, no premature past-tense summaries for meetings &lt;7 days old, anchor-text conventions, section counts match), and committed the reviewed result directly to `main` (`549b9d6`): 2 new sessions (SIGPfB, SIGPSY), 3 meeting-title entries promoted from plain text to linked detail pages, 1 session-recording summary appended to an existing page, ~800 lines/file of blank-line bloat stripped from 6 index pages (confirmed zero real content diff for 3 of them &mdash; the VM's clone was simply stale, missing manual commits already on `main`). One SIGFPT entry (3 days old, full past-tense summary despite the daemon's own log showing it deferred pending the 7-day cooling-off window) was deliberately dropped from the commit rather than landed early. Reset the VM's website clone to clean `origin/main` afterward so the next daemon cycle starts fresh.

- Added the "Stigmergy Workshop coordination call" (a 5-week, weekly, 30-minute contributor series for the stigsim simulator, running Aug 14&ndash;Sept 18 ahead of the Symposium's Stigmergy Workshop) as the Calendar tab's first entry that isn't one of the 6 standing SIGs &mdash; correcting an earlier same-session misread of "leave unmapped" as a soft no-op rather than full exclusion. Wiring it in surfaced two real, previously-invisible bugs in `sync_sig_meetings.py`, both now fixed generically (not just special-cased for this one event): `RRULE`'s `UNTIL` was never parsed, so any time-boxed series would generate 30 fabricated future occurrences stretching past its real end date &mdash; this was already silently wrong for `protfisig`'s genuine 2027-01-01 `UNTIL`, and separately let an already-ended stale `sigpfb` calendar duplicate risk winning the "first match" race against the real active series depending on iCal fetch ordering. And event `DURATION` was hardcoded to 1 hour everywhere (both `.ics` output and the "add to calendar" Google Calendar link) instead of derived from the source event's actual `DTSTART`/`DTEND`. `js/sig-meta.js`'s `PI_SIGS` gained two new optional override fields, `detailHref` and `typeLabel`, so `events/index.html` can point a non-SIG entry at real content and label it distinctly, instead of the hardcoded `/sigs/&lt;slug&gt;/` + "SIG" badge every entry got before. This is a stopgap, not a redesign &mdash; flagged in-code and in `status.md` as design debt: the whole pipeline (sync script, `PI_SIGS`, Calendar-tab rendering) still assumes "calendar entry" means "one of 6 standing SIGs" almost everywhere, worth a real fix (a `type` field, non-derived link targets, non-Discord-channel locations) if more one-off call types show up. Verified end-to-end in a local browser session: Calendar tab sorts/renders the new row correctly, Details/title links resolve to the real workshop page, `.ics` downloads, 30-minute duration flows through to the calendar link, and the 6 standing SIGs (both `/events` and `/sigs`) show no regression.

---

## Session 42: Symposium Program: Full Scheduling System; c3po Still Stuck

*2026-08-17*

**Tracks:** content, static-site, operations

- Session 41's two c3po fix PRs ([c3po#2](https://github.com/Protocol-Institute/c3po/pull/2), dropping gitignored `monitoring.html` from the push flow; [c3po#3](https://github.com/Protocol-Institute/c3po/pull/3), the blank-line-leak regex fix) were still unmerged. Checked the VM's `daemon.log` directly: the weekly website-PR check ran 2026-08-14 06:24 UTC and failed with the identical `git add`/gitignore error c3po#2 targets &mdash; unsurprising since the fix was never merged into what the daemon actually runs. Next attempt won't fire until ~2026-08-21 (7-day gate). The VM's `sigs/` working tree has re-accumulated ~1,961 lines of real, uncommitted SIG content across 6 pages in the meantime, same pattern as Session 41. Also found a new, previously unlogged error: every 30-minute cycle now throws `fetch_discord_links failed (rc=1)` / `enrich_discord_links failed (rc=1)`, unrelated to the push-flow bug. Venkat is merging the two c3po PRs in a separate agent session rather than through this repo.

- Three migrations built the scheduling system incrementally as requirements came in. 029 added `scheduled_date`/`scheduled_time_utc` to `symposium_proposals`, populated from the scheduling spreadsheet (a separate Google Sheet from the abstracts-submission form, with a fixed 30-minute UTC slot grid across Sept 23&ndash;25) by cross-referencing 55 shortlisted proposals against it by speaker name. The 4 special sessions (Memory, Worldbuilding in New Nature, Psychohistory, Southeast Asia) deliberately did *not* get individual per-talk slots: Venkat's direction was that multiple items inside one session share a single time block, with the exact running order left free-form for the session host to set &mdash; so 020's previously-unused `symposium_sessions.date/start_time/end_time` columns got populated instead, and the program page falls back to a session's block time for any item that doesn't have its own `scheduled_date`. The one exception: Psychohistory's 3 confirmed talks got explicit individual sub-times (19:30/20:00/20:30) by direct instruction, arbitrarily ordered but placed to cover the full 2-hour block, leaving the last 30 minutes as unscheduled discussion time. 030 added `scheduled_end_time_utc` for the one item whose duration isn't the default 30 minutes: the Closing Session, remapped to the full 1.5-hour reserved plenary block. 031 added `registration_url` plus a new `symposium_workshop_sessions` table (proposal_id, seq, date, start_time, end_time, note) for the 5 workshops, which self-schedule 4&ndash;5 repeated windows across Sept 21&ndash;22 rather than fitting the single-slot model at all &mdash; a structurally different shape from everything else, hence the separate table rather than overloading the same columns.

- Cross-referencing the schedule against D1 surfaced two people scheduled in the spreadsheet with no matching proposal at all: Robert Peake and a second Venkatesh Rao talk. Both turned out to be real, already-submitted abstracts sitting in the separate Google Form response sheet, never migrated in &mdash; pulled directly from there and inserted (`talk-robert-protocols-for-co-cognition`, `talk-venkatesh-blygger-ai-native-decentralized`), deduping Robert's abstract which had been submitted twice with identical content. A third gap, the PFSIG "Magazine Launch" slot, had no corresponding submission at all &mdash; created as an explicit placeholder (`Monstrous Times Magazine Launch`, owner Sachin Benny, abstract TBD) rather than left silently absent, per the standing rule that a session block's leftover time only gets a placeholder row when it names a concrete agenda item, not for generic "interactive/discussion" filler. A fourth new item, the "David/Timber/Venkat protocol studies panel" from the spreadsheet, had never been represented as a proposal at all since it isn't a submission; added directly as a talk-type row (co_speakers, no single owner) slotted immediately after David Lang's talk. The Opening and Closing items already existed but were renamed/reassigned: Opening &rarr; "Welcome Session" (host Timber, co-host Venkat), Closing Session remapped to the full plenary block (owner Venkat, co-host Timber) &mdash; both already had the *other* person as `co_speakers` before the edit, so swapping the primary speaker without touching co_speakers briefly left each row listing the same person twice; caught and corrected.

- Rewrote `/program`'s render logic from a flat alphabetical list to day-grouped chronological order, with an explicit "Not yet scheduled" bucket at the end so gaps stay visible rather than silently missing. Each item's effective sort date/time resolves in priority order: its own `scheduled_date`/`time`, then its special session's shared block, then (for workshops specifically) the earliest of its own `workshop_sessions` rows &mdash; the last fallback was missing in the first pass and caused all 5 workshops to fall into "Not yet scheduled" despite having real Sept 21&ndash;22 session times, since workshops use a separate data source than the General-grid `scheduled_date` column; caught via user testing and fixed by anchoring each workshop to its first session. Added a viewer-local time label next to every UTC time, computed client-side via `Intl.DateTimeFormat` off the stored UTC values &mdash; no new data, no timezone database, just letting the browser do the conversion. Descriptions are now fully collapsed by default (previously a 4-line clamp) so the page reads as a compact title list, with a per-item "Show description" toggle; this applies uniformly across talks, workshops, and interactive items since they share one render function.

- Both the `/program` workshop listing and each workshop's own detail page now show sequentially labeled sessions ("Session 1", "Session 2", ...) with UTC + local time, and a prominent "Register for this workshop" button linking each workshop's own registration form (pulled from the scheduling spreadsheet's separate Workshops tab). AI Kitcraft has 5 sessions where the other 4 workshops have 4 &mdash; one of its sessions is explicitly marked "(Optional)" in the source spreadsheet, rendered as-is rather than force-fit to a uniform count. Implementing this surfaced a real, pre-existing bug unrelated to anything built this session: `GET /api/symposium/proposals/:id` was hard-gated to admins only (per its own code comment), so all 5 workshop detail pages had been silently blocking every anonymous visitor with a "members only" wall since they were built, even though the underlying data was always meant to be public (the list endpoint it's drawn from has been public throughout). Split GET (now public) from PATCH (still owner/admin-gated), matching the precedent already set by `sessions/[slug].js`; also fixed the workshop pages' own client-side fetch chain, which independently hard-failed to the same gate on any non-member session instead of degrading to anonymous view &mdash; the same anon-gating bug class fixed for the SIG session pages in Session 40. Also dropped the workshop detail pages' "Notes" section, which rendered `p.comments` (internal admin context, not public-facing).

- Removed "Preliminary" from the Program page's title, meta description, h1, and both intro blurbs (symposium landing page and `/program` itself) now that the schedule is substantially filled in, and added "The event will be fully virtual" to both blurbs, which hadn't been stated anywhere on the site before. Separately: one push this session (commit `8c28305`) built successfully on Cloudflare's automatic GitHub-integration path, briefly showed as "Active" in `wrangler pages deployment list`, then flipped to "Failure" a few minutes later with no visible cause (no build step exists for this repo). Recovered by running `npx wrangler pages deploy .` directly, which bypasses that path entirely and succeeded immediately. Logged in status.md as something to watch for recurrence, since the cause wasn't diagnosed.

---

## Session 43: Symposium Landing + Program Pages Merged; Sub-Session Clustering Designed

*2026-08-17*

**Tracks:** content, static-site

- The site previously split the symposium into two pages linked to each other: a short landing page at `/events/protocol-symposium-2026/` (blurb, key dates, a link to the program) and the actual program listing at `/events/protocol-symposium-2026/program/`. Merged them into the landing URL: kept the landing page's title and kicker, folded both pages' intro blurbs into three paragraphs (virtual/registration, theme, UTC-time legend), dropped the Key Dates panel, shrank the banner image (max-width 380px → 220px), added a placeholder “Register” button (`href="#"` — no registration flow exists yet), and inlined the full tabbed program listing (All/Talks/Workshops, session filter, schedule cards, comments, admin/owner inline edit) below the fold, unchanged in behavior from the standalone page it replaced. The standalone `program/index.html` was deleted; `_redirects` gained an exact-path (non-wildcard) redirect from `/events/protocol-symposium-2026/program` to the merged page, so `program/edit-proposal.html` and the five `program/workshops/*` detail pages — which live in the same directory but weren't part of the merge — continue to resolve normally. The homepage's separate “Symposium — Preliminary Program” text button was removed outright; the only symposium link left on the homepage is the existing banner carousel (data-driven from `carousel/banners.md`), repointed from the old `/program/` path to the merged page directly rather than relying on the new redirect. Nine other stale “← Draft Program”/“← Draft Agenda” back-links across the four special-session pages, five workshop detail pages, and the admin edit-proposal form were updated to point at the merged page with current wording; each special-session page also lost a now-redundant duplicate link at its own foot. Verified in-browser locally: homepage and merged page both render correctly; full proposal-list rendering needs the live API so wasn't checked against a local static server.

- Long-standing TODO (flagged since Session 42): break the ~46 Wed–Fri General-session items into named 4–5-talk sub-sessions rather than one long chronological list, while leaving the 4 special sessions untouched. Pulling the live schedule from `/api/symposium/proposals` showed the existing time grid already falls into clean 2-hour boundaries (15:00/17:00/19:00 UTC, then a special-session slot, then 21:30 UTC) on all three days without needing day-specific adjustment. Landed on a `Track I` / `Track II` numbering scheme — `I-A`, `I-B`, … chronologically through the whole event (letter `I` skipped to avoid confusion with the numeral), plus a second parallel `II-A`/`II-B` track to carry the 8 still-unscheduled General talks as two 4-talk sessions run concurrently against two chosen Track I boundaries, since Track I's boundaries are already at their 4–5-talk target and can't absorb more without a genuine parallel track. Named every sub-session thematically by reading actual abstracts (e.g. “Trust & Governance,” “Capture & Divergence,” “Minds Under Pressure”), with the two bookend sessions left as plain “Opening”/“Closing.” Built a static local-only preview (`_draft-schedule.html` at the repo root, untracked) rendering the full day → session-block → card structure, including a two-column desktop layout for the double-tracked slots, to review before touching the schema. Paused there: Nathan Schneider's Friday 15:00 talk ends up alone in its own single-talk session block — fallout from the Southeast Asia special session eating the rest of that boundary's window — and needs a different grouping approach before this gets built into the real page. Nothing here touched D1 or the deployed site; the design (boundary grid, track scheme, session names) carries over to next session even though the exact grouping logic needs rework.

---
