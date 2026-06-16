# Authentication — Protocol Institute Website

Passwordless, PIN-based auth. No third-party OAuth. All state lives in D1 and a
`HttpOnly` session cookie. No passwords are stored anywhere.

---

## Member states

A user session can resolve to one of three states, checked via `GET /api/members/me`:

| State | D1 condition | `/api/members/me` response | Nav shows |
|---|---|---|---|
| **Not authenticated** | No valid session cookie | `401` | Member Login / Register |
| **Pending** | Valid session, `membership_requests.status = 'pending'`, no `members` row | `200 { pending: true, email }` | Pending Approval (+ Log out) |
| **Approved member** | Valid session, row in `members` table | `200 { member: {...}, owned: [...] }` | Member name (+ Edit Profile, Log out) |

There is no "rejected" nav state — a rejected applicant has no session cookie
(sessions expire after 24 h) and can re-attempt with a different email or contact
the team.

---

## Login / registration flow (`/members/join`)

### On page load
The page immediately calls `/api/members/me`. If a valid session exists:
- **Approved member** → redirect to `?return=` URL or `/members`
- **Pending** → show Pending Approval state (skip auth steps)
- **No session** → show step 1 (email entry)

### Step 1 — Email
User enters email. POST to `/api/auth/send-pin` with `{ email, purpose: 'join' }`.

The endpoint:
- Normalises email (trim, lowercase)
- If `purpose = 'join'` and email has a `pending` membership request → returns an
  error ("application is being reviewed"); no PIN is sent
- Otherwise generates a cryptographically random 6-digit PIN, stores its SHA-256
  hash in `auth_pins` with a 15-minute TTL, and sends it via Resend

### Step 2 — Verify
User enters PIN. POST to `/api/auth/verify-pin` with `{ email, pin }`.

The endpoint:
- Looks up `auth_pins` for the email
- Checks expiry and hash match
- Deletes the PIN row (single-use)
- Generates a 32-byte random session token, stores its SHA-256 hash in `auth_pins`
  under the key `session:<email>` with a 24-hour TTL
- Sets `pi_session=<token>:<email>` cookie: `HttpOnly; Secure; SameSite=Lax;
  Domain=.protocol-institute.org`

After verification the page calls `/api/members/me` and dispatches:
- **Approved member** → redirect to `?return=` URL or `/members`
- **Pending** → show Pending Approval state
- **No member record** → show step 3 (Apply form)

### Step 3 — Apply (new members only)
Form collects name, bio, qualifying events, optional consulting fields.
POST to `/api/membership/request`.

The endpoint:
- Checks `members` table for existing registration (→ 409)
- Checks `membership_requests` for any prior request at any status (→ 409 with
  status-appropriate message)
- Inserts a `pending` row into `membership_requests`
- Checks `crm_contacts` for the email. If found → auto-approves: inserts into
  `members` (slug derived from email local-part), updates request status to
  `approved`, sends welcome email via Resend

**After submit:**
- `auto_approved: true` → "Your email was on the pre-approved list…" + link to
  member directory (session already active from step 2, member record now exists)
- No auto-approve → Pending Approval state

---

## Edit profile flow (`/members/edit`)

On page load, calls `/api/members/me`. If response does not include `member`
(i.e. unauthenticated, pending, or 404) → immediately redirects to
`/members/join?return=/members/edit`. No auth steps are embedded in the edit page.

Once authenticated as a full member, the page loads the edit form populated from
the member record. Admins see all members in a dropdown and get extra admin-only
fields.

---

## D1 tables involved

### `auth_pins`
Dual-purpose: stores both short-lived PINs and long-lived session tokens.

```sql
CREATE TABLE auth_pins (
  email      TEXT PRIMARY KEY,  -- 'email@...' for PIN, 'session:email@...' for session
  pin_hash   TEXT NOT NULL,     -- SHA-256 hex of the PIN or session token
  expires_at TEXT NOT NULL,     -- ISO 8601, checked on every use
  created_at TEXT DEFAULT (datetime('now'))
)
```

PINs expire in 15 minutes and are deleted on first use.
Sessions expire in 24 hours and are deleted on logout.

### `members`
One row per approved member. `email` is the primary key and the identity used
in session cookies. `slug` is unique and used for profile URLs.

### `membership_requests`
Tracks all applications. `email` is the primary key, so each email can only
ever have one application record. Status is one of `pending`, `approved`,
`rejected`.

### `crm_contacts`
Imported contact list used for auto-approval. If the submitted email appears
here, the application is approved immediately without admin review.

---

## API endpoints

| Method | Path | Auth required | Purpose |
|---|---|---|---|
| POST | `/api/auth/send-pin` | No | Generate and email a PIN |
| POST | `/api/auth/verify-pin` | No | Validate PIN, issue session cookie |
| POST | `/api/auth/logout` | No (reads cookie) | Delete session, clear cookie |
| GET | `/api/members/me` | Session cookie | Return own profile or pending state |
| POST | `/api/membership/request` | No (session set at step 2) | Submit membership application |

---

## Navigation behaviour by state

All pages inject the nav via `main.js`. On load, `main.js` calls `/api/members/me`
and updates the top-right auth element:

- **Not authenticated**: "Member Login / Register" link. `href` is set to
  `/members/join?return=<current-path>` so the user returns to the same page
  after login.
- **Pending**: "Pending Approval" label + "Log out" in dropdown. No Edit Profile.
- **Approved member**: Member name + dropdown with "Edit Profile" and "Log out".

`main.js` also scans all `<a href="/members/join...">` links on the page that
lack a `return=` param and adds `?return=<current-path>` automatically. This
covers in-page gate messages on gated content pages.

### Mobile
On mobile (≤ 768px) the desktop auth element (`nav-member-link` /
`nav-member-menu`) is hidden. A `nav-mobile-auth` list item is appended to
the hamburger menu instead, with the same three states.

---

## Gated content pages

Pages that require membership check `/api/members/me` on load and show a gate
message if the response does not include `member`. The gate message links to
`/members/join` (with `?return=` added by `main.js`). On return after login
the page reloads and the auth check passes, showing the member view.

Current gated pages:
- `/events/protocol-symposium-2026/submissions/` — proposals and voting
- `/events/protocol-symposium-2026/submissions/workshops/*` — workshop detail pages
- `/events/protocol-symposium-2026/sessions/*` — special session pages
- `/members/edit` — profile editor (redirects to join rather than showing a gate)

---

## Security notes

- PINs are SHA-256 hashed before storage. The plaintext is never stored.
- Session tokens are 32 random bytes (256-bit entropy), also SHA-256 hashed in D1.
- The cookie is `HttpOnly` (no JS access), `Secure`, `SameSite=Lax`.
- The `send-pin` endpoint silently succeeds for unknown emails in `edit` mode to
  avoid email enumeration.
- The session table key prefix `session:` prevents PIN rows and session rows from
  colliding.

---

## Known limitations and future improvements

**Rate limiting** — `send-pin` has no rate limit. A malicious actor could spam
PIN requests to any email. Add Cloudflare rate limiting (CF dashboard → Security
→ WAF → Rate Limiting) on `POST /api/auth/send-pin`, e.g. 5 requests per email
per 10 minutes.

**Session revocation on email change** — If an admin changes a member's email
via the admin editor, their old session (keyed to the old email) remains valid
until it expires. Should invalidate the old session on email update.

**No session list / active device view** — Members cannot see or revoke active
sessions. The `auth_pins` table could support multiple sessions per user (change
the key from `session:<email>` to `session:<email>:<token-id>`) to enable a
"log out of all devices" feature.

**24-hour session TTL is fixed** — There is no "remember me" option. A longer-
lived session (e.g. 30 days) with a rolling renewal on each `/api/members/me`
call would improve UX for frequent visitors without changing the security model.

**Pending state is invisible after session expires** — If a pending applicant's
24-hour session expires before they are approved, they must re-authenticate (enter
email + PIN again) to see the Pending Approval screen. This is correct but could
be confusing; the welcome email sent on approval includes a login link which
naturally handles the re-auth.

**No CSRF protection on state-mutating endpoints** — All API endpoints use JSON
bodies (not form submissions), and browsers do not send `Content-Type:
application/json` cross-origin without a preflight, so the risk is low. A
formally correct implementation would add a CSRF token or validate the `Origin`
header on POST requests.

**Bot members and owner accounts** — The `members` table has an `owner_email`
field to associate bot/AI profiles (e.g. Humboldt) with a human owner. Currently
only the direct `email` match is used for session identity; owned profiles are
fetched separately in `/api/members/me`. If the owner email and the bot member
email become the same (as with Humboldt/vgururao@gmail.com), `owner_email` is
redundant and should be set to NULL to avoid the profile appearing twice in
any future query that joins on `owner_email`.
