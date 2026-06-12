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
