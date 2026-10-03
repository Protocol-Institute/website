# Task Board & Volunteering — Stub Plan

Seeded Session 54 (2026-10-03). **Not designed or scheduled** — this records the
shape of the idea so that the areas > programs > editions > projects model
(`programs/PLAN.md`) is built without closing it off. Revisit before building.

## The idea

A task board where volunteers pick up work for the Institute, and a way for them
to log hours against that work for volunteer-time credit. Most of it will be
admin-realm work (running the Substack, maintaining a website, symposium
logistics), but research projects can post tasks and accept volunteer time too.

## Where tasks and hours attach

Both can attach to **any level** of the hierarchy, in either realm:

| Level | Example task | Example logged time |
|---|---|---|
| Area | "Audit all Operations account access" | general ops help |
| Program | "Find a host for SIGPSY's December session" | SIG organizing |
| Edition | "Moderate chat during Book Writing Month week 2" | symposium volunteering |
| Project | "Fix mobile layout on protocolized.io" | coding on a project |

A time entry can also reference a task (hours against a specific task) or
stand alone (hours against a node, with no task).

**Likely shape:** one nullable column per level with a CHECK that exactly one is
set (`area_slug`, `program_slug`, `edition_id`, `project_id`), rather than a
polymorphic `(target_type, target_id)` pair — keeps real foreign keys and simple
joins in D1. Same pattern for `tasks` and `time_entries`.

```
tasks         (id, <one target>, title, description, status open|claimed|done|closed,
               created_by, claimed_by, estimate_hours, created_at, closed_at)
time_entries  (id, member_slug, task_id NULL, <one target>, date, hours, note,
               status pending|verified|rejected, verified_by, verified_at)
```

## Who verifies — authority resolves upward

The person who can approve a task's completion or verify logged hours should be
found by walking up from the node: **project lead → hosts of its programs →
area stewards (TBD) → admin.** This is the same question as "who approves a
project↔program affiliation" in the current build, generalized. The current
helper (`approvablePrograms` / `canApprove` in `functions/_shared/programs.js`)
answers it only at program level; when this is built it should become one
`authorityFor(node)` resolver used by both.

## Open questions (decide before designing)

- **Credit currency** — raw hours only, or weighted? What does credit *buy*
  (symposium tickets, membership tiers, acknowledgement)? Shapes everything else.
- **Visibility** — public board, members-only, or per-realm? Admin-realm tasks
  probably members-only; hours almost certainly not public per-person.
- **Who may post tasks** — leads/hosts only, or any member with approval?
- **Area stewards** — areas have no owners today. Needed only if area-level
  tasks/hours are real; otherwise drop area as an attach point.
- **Reporting** — per-member totals on the profile? Per-program totals for
  grant reporting?
- **Relation to project teams** — does logging verified hours on a project make
  you a team member, or are these independent?

## Constraints already honoured by the current build

- Every node has a stable key (area/program slug, edition id, project id).
- Admin work is first-class: `realm = 'admin'` on areas and projects, admin
  projects have leads and teams like research ones, so there is something to
  attach admin tasks and hours to.
- Approval authority is centralised in one shared module, not scattered across
  endpoints.
