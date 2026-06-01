# Roadmap — protocol-institute.org

Features planned for the CF-powered version of the site. All require Cloudflare Pages Functions (Workers co-located with the site in a `functions/` directory). The static HTML pages stay unchanged; Workers handle API routes under `/api/*`.

CF resources needed across all phases:
- **D1** — member directory, events cache, conference data
- **KV** — PIN tokens, sessions (short-lived, TTL-based)
- **R2** — profile photos, conference materials (if bespoke conference system built)
- **Email** — Resend or Mailgun via Worker (CF Email Workers is not appropriate here)
- **Stripe** — fiat donations and conference registration payments

---

## Phase 0 — CF Pages Migration ✅ *(complete 2026-05-30)*

See `MIGRATION.md`. CF Pages live, custom domains active, R2 asset bucket, security headers, CF Web Analytics, push-to-deploy via GitHub.

---

## Backlog — Unplanned / Unprioritized

Items captured for consideration, not yet assigned to a phase:

- **Contact form with email delivery** — replace static contact page with a form (name, email, message); CF Pages Function backend at `/api/contact`; Resend for delivery to team@protocol-institute.org; CF Turnstile for spam protection
- **Symposium 2026 submission ingestion** — after June 14 deadline, run a one-time script to pull the Google Sheets responses (spreadsheet: `1cnXQUBVdwTbOJTYEhv2KCxhSAobcP_Jx0WEwH5S_dJQ`) into D1 to seed the talks/workshops database; keep the Google Form as-is for intake
- **Member pre-population from spreadsheet** — bulk-import a few hundred existing community members into D1 from the PI member spreadsheet. **Major backlog item.** Key design decisions:
  - Add `claimed` INTEGER DEFAULT 0 to the `members` table (migration 009); unclaimed rows are invisible to public directory until claimed
  - **Same-email path** (easy): existing magic-link auth already handles this — if email is found in D1, sends login link → user lands on pre-populated profile; show "complete your profile" prompt on first login when `claimed = 0`
  - **Different-email path** (hard): user signs up with an email not in the DB but is already present under another address. Options: (a) invite-first — email everyone in the spreadsheet a "claim your profile" link before opening public signup, routing most people to their record before duplicates occur; (b) self-serve merge — join flow offers "I have an existing profile under a different email" path, sends verification to old address, swaps email on confirm; (c) admin merge endpoint — accept duplicates, merge via admin panel manually
  - **Recommended approach**: invite-first (mass-email via Resend) + a minimal admin merge endpoint as fallback. The invite is also a reactivation touchpoint for the community
  - Import script: one-off Python script reads spreadsheet CSV → inserts rows into D1 via `wrangler d1 execute` or the D1 REST API; idempotent on email (skip if email already exists)
  - Spreadsheet field mapping to D1 columns needs to be established before building

---

## Phase 1 — Quick Wins (no new backend) *(target: immediately on main)*

### 1a. Protocol Symposium announcement page

Static page on `main` now, no CF required. Linked from nav and homepage.

- `symposium.html` — announcement, CFP dates, venue stub
- Links to Google Form for abstract/interest submission
- Swap for Phase 4 system when ready; redirect `/symposium` → new URL at that point

### 1b. Events calendar

Google Calendar embed or a Worker that fetches the GCal API and renders HTML. Start with the embed (one script tag, no Worker), upgrade later if custom styling is needed.

- Public GCal embed iframe in a new `events.html`  
- Or: Worker at `/api/events` fetches GCal API → returns JSON → static JS renders it
- The Worker approach allows custom styling and avoids iframe; GCal API key stored as CF Pages secret

### 1c. Support page — donation buttons

Add Stripe Payment Links or a Stripe Checkout widget (JavaScript embed, no Worker needed for basic flow). For crypto: an Ethereum address QR code + MetaMask deeplink is sufficient until Phase 3.

- Update `support.html` with a Stripe "Donate" button (Payment Link URL)
- Add ETH address section with QR code and copy button
- No Worker required at this stage — both are frontend-only

---

## Phase 2 — Member Directory ✅ *(complete 2026-05-30)*

A public-facing directory of PI members and network participants, with self-service profile editing via email PIN auth.

### Implemented

- D1 database `pi-members` with `members`, `membership_requests`, `auth_pins` tables (see `db/schema.sql`)
- Seed: 6 human + 2 AI members from team/consulting pages; confirmed emails in `db/seed.sql`
- `owner_email` field on AI members so Venkat can manage C3PO/Humboldt via edit page
- `/api/members` — public D1 endpoint, filterable by tag (team, consultant, event tags); email excluded from response
- `/api/auth/send-pin` + `/api/auth/verify-pin` — email→PIN auth; SHA-256 hashed; 24h session cookie
- `/api/membership/request` — registration form submission → membership_requests (pending review)
- `/api/members/me` + `/api/members/update` — session-based profile read/edit (admin-only fields blocked)
- `/api/admin/members` — pending request review queue; protected by `ADMIN_KEY` CF Pages secret
- `/members` — filterable directory with tag badges (JS-rendered from D1); "Members" added to site nav
- `/members/join` — 3-step registration form (email→PIN→apply); conditional consultant/team/photo sections
- `/members/edit` — 3-step edit form; bot profile switcher (Venkat sees C3PO and Humboldt selectable)
- `/admin/members.html` — admin UI for approving/rejecting pending applications
- `/team` and `/consulting` pages now fetch from D1 (same visual design)

### Still needed to fully activate

- **Set `RESEND_API_KEY` CF Pages secret** — PIN emails won't send until this is configured
- **Set `ADMIN_KEY` CF Pages secret** — admin interface locked until configured
- **Sign up for Resend** — get API key, add sending domain `protocol-institute.org`

---

## Phase 3 — Donations (proper integration) *(can run parallel to Phase 2)*

### Fiat — Stripe

- Worker at `/api/donate/create-session` creates a Stripe Checkout Session
- On success, Worker webhook at `/api/donate/webhook` records donation in D1
- `support.html` updated with amount selector and Checkout redirect

### Crypto — Ethereum

At this stage: a Worker at `/api/donate/eth` returns a signed payment request (EIP-681 URI) and displays a QR code. MetaMask or any wallet can fulfill it. No on-chain logic needed server-side — the donation is "done" when the tx lands.

For USDC/stablecoin donations: same approach, ERC-20 transfer to PI's treasury address.

Upgrade path: once Ethereum auth (Phase 4) is live, logged-in members can donate with one click using their already-connected wallet.

---

## Phase 4 — Ethereum Authentication (SIWE) *(after Phase 2 member directory is live)*

Sign-In with Ethereum (EIP-4361) lets members authenticate using their wallet instead of email PIN. Complements, not replaces, PIN auth — members without wallets can still use email.

### Frontend approach

The site currently has no build step. SIWE requires wallet connection JS. Options:
- **Recommended**: use [Dynamic.xyz](https://dynamic.xyz) or [Privy](https://privy.io) — hosted wallet auth widgets loaded from CDN, minimal JS to write, handles wallet detection + signing + session
- **DIY fallback**: load `ethers.js` from CDN, write vanilla SIWE flow (~150 lines)

Dynamic/Privy add cost at scale but are free for small member counts. Evaluate once member count is known.

### Backend

- Worker at `/api/auth/siwe/nonce` — generates and KV-stores a nonce
- Worker at `/api/auth/siwe/verify` — verifies signed message (EIP-4361), sets session cookie, links `eth_address` to D1 member row
- Member's ETH address becomes a verified field on their profile; used for on-chain donation attribution and future gating

### Access control upgrade

Once SIWE is live, the admin interface (Phase 2) can be gated to a list of admin ETH addresses, replacing the Basic auth stopgap.

---

## Phase 5 — Protocol Symposium System *(target: before fall symposium)*

### Recommendation: Sessionize for the first symposium

[Sessionize](https://sessionize.com) is purpose-built conference software (CFP, blind review, schedule builder, embeddable program widget). Free tier covers most needs. Setup time: hours, not weeks.

- Create a Sessionize event → embed the CFP form and schedule widget in `symposium.html` (replaces the Phase 1 Google Form)
- Handles: abstract submission, reviewer assignment, accept/reject notifications, schedule grid, speaker profiles
- Registration payments: Sessionize integrates with Stripe directly
- The `symposium.html` page remains on `protocol-institute.org`; Sessionize widgets are iframes

Use Sessionize for the Symposium. If PI becomes a regular conference host, migrate to a bespoke CF Workers + D1 system for the second event.

### Bespoke system (future, if needed)

If Sessionize is outgrown:

| Module | CF resources |
|---|---|
| Abstract submission form | Worker + D1 (`submissions` table) |
| Reviewer assignment + scoring | D1 + admin Worker routes |
| Accept/reject emails | Resend via Worker |
| Registration + payment | Stripe Checkout + Worker webhook |
| Program calendar | D1 → static JSON → rendered by JS or Worker |

This reuses the auth, D1, and email infrastructure from Phases 2–4.

---

## Dependency Graph

```
Phase 0 (CF migration)
  └── Phase 1 (quick wins) — parallel, no deps
  └── Phase 2 (member directory)
        └── Phase 4 (SIWE) — extends Phase 2 auth
  └── Phase 3 (donations) — parallel with Phase 2, upgrades after Phase 4
  └── Phase 5 (symposium) — Phase 1 Google Form is the interim; Sessionize is independent
```

## Open Questions

- Resend vs Mailgun vs another email API? (Needed for contact form and Phase 2 PIN auth.)
- Dynamic.xyz vs Privy vs DIY ethers.js for SIWE? (Cost/complexity tradeoff for Phase 4.)
- For the Symposium: confirm Sessionize meets review workflow needs before committing.
