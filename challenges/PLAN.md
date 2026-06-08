# Challenges — Feature Plan

This document captures planned features and design decisions for the `/challenges` page. Current state: D1-backed index with dual-track quadratic voting (anon + member), difficulty labels, seed interest baseline, and permalink anchors.

---

## Planned Features

### 1. Individual challenge pages

Each challenge gets a dedicated page at `/challenges/[id]/` (or a human-readable slug once slugs are added to the schema).

**What it enables:**
- Shareable, bookmarkable URLs for specific challenges
- Space for full-length description, extended context, and bibliography
- A canonical home for annotations (see below)
- Better SEO and citation in external writing

**Design notes:**
- Page header: challenge title, difficulty badge, posed-by / communicated-by, date
- Full description (HTML-rendered, same sanitization as index)
- Voting button (same mechanism as index card)
- Annotations section (see below)
- Back link: `← All Challenges`

**Schema additions needed:**
- `slug TEXT UNIQUE` on `challenges` table — derived from title at insert time, used in URL
- Redirect `/challenges/[id]/` → `/challenges/[slug]/` for backward compatibility if IDs are already shared

**API additions needed:**
- `GET /api/challenges/[id]` — single challenge detail (or use slug)

---

### 2. Annotations — ongoing progress tracking

A lightweight system for attaching timestamped notes to a challenge: links to solution attempts, relevant advances, related publications, open questions, or progress updates.

**Concept:** Challenges are open-ended and evolve. Annotations are the living record of that evolution — not a comments section, but a structured log of intellectual progress.

**Annotation types:**
| Type | Meaning |
|------|---------|
| `attempt` | A documented attempt at solving or making progress on the challenge |
| `advance` | A relevant result elsewhere (paper, project, tool) that bears on the challenge |
| `reference` | A foundational or contextual reference worth tracking |
| `note` | An open-ended observation, refinement of the problem statement, or update |

**Schema (new table `challenge_annotations`):**
```sql
CREATE TABLE challenge_annotations (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  challenge_id INTEGER NOT NULL REFERENCES challenges(id),
  author_slug  TEXT NOT NULL,  -- member who posted
  type         TEXT NOT NULL CHECK(type IN ('attempt','advance','reference','note')),
  body         TEXT NOT NULL,  -- sanitized HTML (same rules as challenge description)
  url          TEXT,           -- optional primary link
  url_label    TEXT,           -- display label for url
  created_at   TEXT DEFAULT (datetime('now'))
);
```

**API:**
- `GET /api/challenges/[id]/annotations` — public, returns annotations for a challenge
- `POST /api/challenges/[id]/annotations` — auth required (any member)

**UI (on individual challenge page):**
- List of annotations, sorted chronologically, with type badge, author, date
- Members see an "Add annotation" form below the list (type selector, body textarea with link support, optional URL + label)
- No editing after submission (annotations are a log, not a wiki)

**Access control:** Any member can annotate. Future: restrict `attempt` type to SIG hosts or admin-verified contributors if needed.

---

## Deferred / Under Consideration

- **Slugs on challenges** — more readable URLs and easier linking. Derive from title at insert time (same algorithm as SIG session slugs in `sigs/CONVENTIONS.md`).
- **Challenge status field** — `open` / `has_progress` / `resolved` (even if not "solved"). Admin-settable.
- **Tagging** — link challenges to SIGs, programs, or research themes.
- **Funding allocation** — the challenge value formula (`A×anon² + B×(member+seed)²`) was designed with future funding allocation in mind. When that becomes concrete, consider: weighting by member tenure/contribution, cap per challenge, decay factor for old votes.
- **Challenge author page** — a member's profile page listing challenges they've posed or communicated.
