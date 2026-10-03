# Areas, Programs, Editions, Projects — Data Model Plan

Written Session 54 (2026-10-03). Replaces the four unrelated meanings "program"
had on this site with one database model. Phase 1 is what gets built first;
later phases are recorded so the schema doesn't close them off.

---

## Why

Before this plan, "program" meant four things, none of them linkable:

1. **`/programs`** — five hand-written umbrellas (Protocolized, Research, AI Ops,
   Events, Collaborations) whose items mixed SIGs, events, publishing channels
   and tools. Hardcoded `<li>`s; the flat view scrapes them back out of the DOM.
2. **`projects.program` / `sub_program` / `themes`** — dead columns, replaced by
   `sig_slug` in Session 40 but still populated (and contradicting it:
   cognitive-ergonomics has `program='solo-projects'`, `sig_slug='mrg'`).
3. **SIGs** — the only thing a project could attach to, via a single
   `sig_slug`, with the SIG list duplicated in ~7 places.
4. **Events / workshops** — three unrelated stores: `data/events.json`,
   `symposium_proposals` rows, and static pages (`/programs/protocol-school`).

Plus hand-built project pages outside the database (`/longnow`, `/c3po`, and
orphaned duplicates `/jamverse`, `/worldmachines`, `/protocolized-dev`), and no
public per-member page at all.

## Semantics

### Two realms

Everything sits in one of two parallel hierarchies:

- **research** — the Institute's public work: SIGs, events, courses,
  publishing, collaborations. What `/research`, `/programs` and SIG pages show.
- **admin** — running the Institute: websites, channels, accounts, logistics.
  Deliberately low-profile: shown on `/operations` (not in the nav, `noindex`),
  as a separate "Operations" section on profiles and program pages, never on
  `/research`.

Realm is set on **areas** (a program's realm is its primary area's) and,
independently, on **projects** — an admin project may link to a research
program (symposium logistics → the Symposium 2026 edition) and stays admin.
Only admins create or re-realm admin projects. The admin realm is also where
most of the future task board and volunteer hours will attach — see
`tasks/PLAN.md`.

### What goes where

| Question | Answer |
|---|---|
| Someone builds and maintains an artifact, with a lead and team? | **project** (research or admin realm) |
| Other projects attach to it, or it convenes people? | **program** |
| An outlet or account that carries other work? | **channel** — a `program_links` row (`kind='channel'`) on the program it serves, not a node |

So: protocolized.io and protocol-institute.org are admin projects (Web
Properties); Protocolized Books is a program (book projects link to it as their
intended imprint); Substack, YouTube, Discord are channels on Protocolized.
*Who holds admin on which account* is operational/security data and belongs in
`../admin/`, not the public database.

```
Area ──< program_areas >── Program ──< Edition (optional, dated)
                              │            │
                              └──< project_programs >── Project
                                   (edition_id optional)
```

- **Area** — a top-level grouping for display (Research, Events, …). Projects
  never attach to an area directly; an area's projects are the union of its
  programs' projects (de-duplicated).
- **Program** — anything with a lasting identity a project can be affiliated
  with. Many-to-many with areas; one area is marked primary (breadcrumbs,
  canonical placement).
- **Edition** — a dated run of a program. A program *is* the recurring thing
  ("Protocol Symposium", "Protocolize Your Book", "Intro to Protocols"); an
  edition is *when* it happened ("2026", "Sept 22 at the Symposium", "Spring
  2027 cohort"). Programs without runs (SIGs, initiatives) have no editions.
- **Edition nesting** — `part_of_edition_id` points at another *of our*
  editions: a workshop's run inside the Symposium, the Symposium inside a
  Summer of Protocols year. A stand-alone run simply has none. Runs hosted
  inside *someone else's* event (Edge City villages, Devconnect) use the
  free-text `host_context` instead.
- **Project** — created by any logged-in member, visible on their personal page
  immediately. Affiliated with zero or more programs, optionally pinned to an
  edition. Each affiliation is approved separately (see Moderation).

"Event", "workshop" and "course" are therefore not competing categories — they
are kinds of program that have editions. A workshop is never a "symposium
workshop"; it is a workshop program, one of whose editions ran as part of the
Symposium.

### Program kinds

| kind | has editions | edition displayed as | examples |
|---|---|---|---|
| `sig` | no | — | SIGFPT, PRG |
| `event` | yes | edition | Protocol Symposium, Book Writing Month, a retreat |
| `workshop` | yes | session | Protocolize Your Book, Edge City Workshops |
| `course` | yes | cohort | Protocol School, future protocol courses |
| `collaboration` | optional | edition | Protocols for the Long Now |
| `initiative` | optional | edition | Summer of Protocols, AI Ops, Protocolized |

One-off things (a retreat, Bridge Atlas) are still a program with one edition —
not a separate kind. Retreats are individual events, not a recurring template.

### Moderation and authority

*(Revised Session 54 after the first deploy.)*

- **Areas and programs** are created by admins only (`/admin` → Programs tab).
  An admin then assigns **hosts** (`program_hosts`) on the program's edit page.
- **Hosts** edit their programs at `/programs/edit?slug=` — reached from the
  "Programs you host" section of their member dashboard: blurb
  (`programs.description`), byline (`programs.byline`), the About page (raw
  markdown in `managed_pages`, `sigs/<slug>/about`), links, editions, and the
  tags on their program. Admins can additionally edit title, status, page URL,
  tagging policy and areas, and assign hosts.
- **Projects** — any member creates them, no gate. Admins can hide one.
- **Tags (affiliations)** — research-realm programs are `affiliation_policy =
  'open'`: any member may tag any of them and the tag applies at once; a host
  removes a tag that doesn't fit (`status = 'rejected'`). Admin-realm programs
  stay `moderated`.

`/research` (the global project index) lists every published project,
affiliated or not.

## Schema (migration 037, additive)

```sql
areas            (slug PK, title, description, sort_order)
programs         (slug PK, kind, title, description, page_url, status active|past,
                  affiliation_policy moderated|open, sort_order, created_at)
program_areas    (program_slug, area_slug, is_primary, PK(program_slug, area_slug))
program_hosts    (program_slug, member_slug, PK(...))
editions         (id PK, program_slug, slug, title, start_date, end_date,
                  location, host_context, page_url, part_of_edition_id, status)
project_programs (project_id, program_slug, edition_id NULL, status pending|approved|rejected,
                  linked_by, approved_by, created_at, approved_at)
```

Also in 037: `areas.realm`, `projects.realm`, and `program_links (program_slug,
kind website|channel|link, label, url, note, sort_order)` — generalizes
`sig_links`, whose rows are copied in. `/api/program-links` replaces
`/api/sigs/links`; `functions/_shared/sigs.js` is gone (programs are validated
against the table).

Migration 040 (after the phase 1 code is live, never before — Pages
auto-deploys on push but migrations are applied by hand, so dropping columns
first would break the running code): drop `projects.sig_slug`, `program`,
`sub_program`, `themes`, and the `sig_links` table.

## Seed data

**Areas (research realm):** Research Groups · Events · Education · Publishing
(Protocolized) · AI Ops · Collaborations. **Areas (admin realm):** Operations. Education is new (confirmed Session 54) — home for Protocol
School and future courses; Book Writing Month sits in Events + Publishing.

**Programs and editions:**

| Program | kind | Areas | Editions |
|---|---|---|---|
| SIGFPT, MRG, SIGPfB, ProtFiSIG, DRG, SIGPSY, PRG | sig | Research | — |
| Research Index | initiative | Research | — |
| Protocolized | initiative | Publishing | — |
| AI Ops | initiative | AI Ops | — |
| Summer of Protocols | initiative | Research, Education | SoP23, SoP24, SoP25 |
| Protocol Symposium | event | Events | 2024 ⊂ SoP24, 2025 ⊂ SoP25, 2026 |
| Protocol School | course | Education | 2025 ⊂ Symposium 2025; 2027 planned |
| Researcher Retreat Seattle | event | Events | 2023 ⊂ SoP23 |
| Bridge Atlas | event | Events | Devconnect 2025 (host_context Devconnect) |
| Edge City Workshops | workshop | Events, Collaborations | Esmeralda 2024, Lanna 2024, Esmeralda 2025 (host_context Edge City) |
| Traditional Protocols Workshops *(working title)* | workshop | Events | Datus and Nusas, Singapore 2024; Khlongs and Subaks, Bangkok 2025 |
| Foundations Workshop | workshop | Events, Education | 2025 ⊂ Symposium 2025 |
| 5 Symposium 2026 workshops | workshop | Events | one each ⊂ Symposium 2026 |
| Protocols for the Long Now | collaboration | Collaborations | — |
| Protocolized Books | initiative | Publishing | — |
| Web Properties | initiative | Operations (admin) | — |
| Book Writing Month | event | Events, Publishing | November 2026 (open affiliation) |

Event editions keep their existing `/events/<id>` pages as `page_url`; SIGs keep
`/sigs/<slug>`. Programs with no page of their own get the generic renderer.

**Project migration:**
- The 6 existing `sig_slug` values → approved `project_programs` rows.
- New projects: C3PO and Humboldt (→ AI Ops), Protocols for the Long Now
  project (→ the collaboration program). Leads: Venkat for C3PO, the
  `humboldt` AI member for Humboldt, Timber for Long Now.
- YakRobot Protocols also linked to the Robots as Protocol Citizens workshop's
  2026 run (the workshop is built on the YakRobot stack).
- Admin projects: protocol-institute.org and protocolized.io (lead Venkat) →
  Web Properties; protocolized.io also → Protocolized.
- Channels on Protocolized: protocolized.io (website), Substack, YouTube,
  Books, Resource archive.
- vid2nd (pending since 2026-09-11, a member's own project) is published, per
  the no-project-gate rule.

## Phases

### Phase 1 — model + member projects (target: before November)

1. Migration 037 + seed.
2. APIs
   - `GET /api/programs` (with areas, editions) and `GET /api/programs/:slug`
     (program + editions + approved projects).
   - `GET /api/projects` gains `?program=` and `?edition=`; `?sig=` stays as an
     alias for `?program=` so the SIG page block keeps working unchanged.
   - Every project payload carries `programs: [{slug, title, kind, edition}]`
     (approved only) in place of `sig_slug`.
   - `POST /api/projects` — inserts `status='approved'`; takes
     `affiliations: [{program_slug, edition_id?}]`; creator who isn't the lead
     is added to the team as approved.
   - `POST /api/projects/:slug` — edit (lead or admin), including
     affiliations. POST not PUT (CF WAF).
   - `POST /api/projects/:slug/programs` approve/reject — admin or program host.
3. Pages
   - `/projects/submit` — program/edition multi-picker replaces the SIG select;
     doubles as the edit form (`?slug=`).
   - `/members/profile?slug=` — new public member page: bio + projects (lead
     or team). Query-param URL on purpose: a `_redirects` 200-rewrite for
     `/members/<slug>` would collide with `join/`, `edit/`, `dashboard/` and
     has bitten this site before.
   - `/projects/project` — program tags link to program pages; edit button for
     lead/admin.
   - `/research` — program tags in place of the SIG tag.
   - SIG pages — project titles link to the internal detail page, external
     artifact link secondary (currently they go straight off-site).
   - `/admin/projects` — queue of pending *affiliations* instead of projects.
   - Generic `/programs/program?slug=` page for programs with no page of their
     own.
4. Retire the static stubs: `/jamverse`, `/worldmachines`, `/protocolized-dev`
   → 301 to their project pages; `/longnow`, `/c3po` → 301 to the new
   project/program pages.
5. Migration 040 drops the dead columns. (038 points Book Writing Month at its landing page.)

### Phase 2 — Book Writing Month
Program page for the November 2026 edition listing tagged books; "Start a book
project" CTA pre-selecting the edition.

### Phase 3 — consolidation
- `/programs` generated from `areas`/`programs`.
- `/events` history from `editions`; retire `data/events.json`.
- `SIG_SLUGS` and the per-page label maps read from `programs` (or are checked
  against it), ending the 7-place SIG list.
- Program hosts UI on the member dashboard; `members.is_sig_host` /
  `sig_host_slugs` folded into `program_hosts`.
- "Calendar entry == SIG" cleanup from the status backlog.

### Later
Course enrolment (`edition_participants`), SoP alumni ↔ SoP editions, challenge
↔ program links.
