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
