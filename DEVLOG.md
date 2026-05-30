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

## Session 12: Architecture Review: CF Access, Tag Consolidation, Mailing List Plan

*2026-05-30*

**Tracks:** cloudflare-migration, member-directory, operations

- **Member Login/Register topbar:** Added a site-wide 'Member Login / Register' link injected above the nav on every page via `main.js`. Styled as a small uppercase link in the upper right corner. The `/members/join` page copy updated to clarify it handles both cases — existing members are routed to their edit profile, new applicants complete the join form.

- **CF Zero Trust Access for `/admin/*`:** Configured Cloudflare Access (Zero Trust free tier) to gate the admin panel at the CDN layer — unauthenticated requests never reach the page. Policy: email allowlist (Venkat + Timber), one-time PIN to email. Zero application code changes required. The existing Bearer token auth remains as a second layer. Previously, the admin page was publicly visible and the only protection was a password field sending a key from JavaScript.

- **Tag consolidation and bug fix:** `VALID_TAGS` / `TAG_COLUMNS` was duplicated across three Worker function files and two HTML inline scripts, with a silent drift: `admin/members.js` was missing `tag_protocolized_writer` from `TAG_COLUMNS`, so approving a member who applied with that tag silently dropped it from their record. Fixed by creating `functions/_shared/tags.js` (ES module, imported by all Workers) and `js/tags.js` (global for HTML pages). Adding a new event tag now requires editing one file.

- **CSP cleanup:** Removed `cdn.jsdelivr.net` from the `script-src` directive in `_headers` — it was allowlisted but never loaded. Tightening the CSP reduces the attack surface for script injection.

- **SIG mailing list plan documented:** Designed a SIG-only opt-in mailing list system using Resend Audiences + D1 subscription prefs + CF Worker for broadcast. Single sending address: `sigs@protocol-institute.org` (not yet created). Four SIG lists (sigfpt, mrg, sigpfb, protfisig). New `is_sig_host` role. Members opt in via a new Lists tab in their profile. SIG hosts compose and send via a web UI (no inbound email alias for now). Plan documented in `status-vgr.md`. Implementation blocked pending Resend sender setup and Audience creation.

---
