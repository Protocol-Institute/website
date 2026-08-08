# Research (Challenges + Projects) — Feature Plan

This document captures planned features and design decisions for the `/research` page — originally written for the standalone `/challenges` page, and carried forward when Challenges and Projects were unified into `/research` (two tab views, one page) with a shared watching mechanism and value formula, plus project↔challenge linking and project team membership. Current state of the Challenges view: D1-backed index with dual-track quadratic voting (anon + member), difficulty labels, seed interest baseline, and permalink anchors.

---

## Planned Features

### 1. Individual challenge pages

Each challenge gets a dedicated page at `/research/challenges/[id]/` (or a human-readable slug once slugs are added to the schema) — analogous to the individual project pages at `/projects/project?slug=`.

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

### 3. Ingestion, clustering, and auto-tagging

As the challenges list grows, embed and cluster challenges to make the index searchable and filterable — without requiring manual tagging for every entry.

**Concept:** Use an embedding model (Voyage AI, consistent with the C3PO/Humboldt pipeline) to embed each challenge's title + description. Run clustering (e.g. k-means or hierarchical) over the corpus to surface natural groupings and suggest tags. Tags inform client-side filtering and search.

**Pipeline (offline / periodic):**
1. Fetch all challenges from D1 via the API or direct Wrangler query.
2. Embed each challenge with `voyage-3` (or equivalent). Store embeddings externally (Pinecone, or a flat JSON file in R2 if the corpus stays small).
3. Cluster embeddings → derive N topic clusters → hand-label cluster centroids as canonical tags (e.g. "formal theory", "governance", "distributed systems", "measurement").
4. Assign each challenge one or more tags based on nearest-cluster membership. Write tags back to a `challenge_tags` join table in D1 (or a `tags` TEXT column as JSON array).
5. Re-run periodically (or on new challenge added) to keep tags current.

**Schema additions:**
```sql
-- Option A: lightweight JSON column (good for small corpus)
ALTER TABLE challenges ADD COLUMN tags TEXT; -- JSON array of tag slugs, e.g. '["formal-theory","governance"]'

-- Option B: normalized join table (better for filtering queries)
CREATE TABLE challenge_tags (
  challenge_id INTEGER NOT NULL,
  tag          TEXT NOT NULL,
  source       TEXT DEFAULT 'auto' CHECK(source IN ('auto','manual')),
  PRIMARY KEY (challenge_id, tag)
);
```

**Client-side filtering (no backend change needed for Option A):**
- Tags returned in `GET /api/challenges` response.
- Filter bar above the list: tag pills that toggle inclusion. JS filters the already-loaded array client-side.
- Search box: simple substring match on title + description client-side (sufficient for dozens of challenges).

**Manual override:** Allow admins to edit tags on a challenge card (add/remove tag pills inline). Manual tags survive re-clustering by setting `source='manual'` and excluding them from auto-overwrite.

**Dependency:** Requires a meaningful corpus (≥20–30 challenges) before clustering produces useful groupings. Build the pipeline in Humboldt or as a standalone Python script before wiring the UI.

---

## Deferred / Under Consideration

- **Slugs on challenges** — more readable URLs and easier linking. Derive from title at insert time (same algorithm as SIG session slugs in `sigs/CONVENTIONS.md`).
- **Challenge status field** — `open` / `has_progress` / `resolved` (even if not "solved"). Admin-settable.
- **Tagging** — link challenges to SIGs, programs, or research themes.
- **Funding allocation** — the challenge value formula (`seed + A×anon² + B×member²`) was designed with future funding allocation in mind. When that becomes concrete, consider: weighting by member tenure/contribution, cap per challenge, decay factor for old votes.
- **Challenge author page** — a member's profile page listing challenges they've posed or communicated.
