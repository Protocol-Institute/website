# SIG Page Conventions

This document specifies the URL scheme and HTML structure for SIG session pages on the Protocol Institute website. It is the authoritative reference for both manual editing and automated ingestion (e.g. c3po's Discord pipeline).

## SIG identifiers

| SIG | Slug | Directory |
|-----|------|-----------|
| Formal Protocol Theory | `sigfpt` | `sigs/sigfpt/` |
| Memory Research Group | `mrg` | `sigs/mrg/` |
| Protocols for Business | `sigpfb` | `sigs/sigpfb/` |
| Protocol Fiction | `protfisig` | `sigs/protfisig/` |
| Distributed Robotics Group | `drg` | `sigs/drg/` |
| Special Interest Group in Psychohistory | `sigpsy` | `sigs/sigpsy/` |

## Session URL scheme

Every session lives at:

```
/sigs/<sig-slug>/<YYYY-MM-DD>-<title-slug>/
```

The file on disk is `sigs/<sig-slug>/<YYYY-MM-DD>-<title-slug>/index.html`.

### Date

Use the date the session was held. If no explicit date is in the content, derive it from the Discord thread creation timestamp:

```python
from datetime import datetime, timezone
DISCORD_EPOCH = 1420070400000  # ms
ms = (channel_snowflake_id >> 22) + DISCORD_EPOCH
date = datetime.fromtimestamp(ms / 1000, tz=timezone.utc).strftime('%Y-%m-%d')
```

### Title slug

Start from the session title, then:

1. Strip common SIG-specific prefixes: `SIGFPT`, `SIGFPT NN:`, `MRG`, `SigPfB`, `ProtfiSIG`, `Week N Discussion Thread`, `PFW Session N`, etc.
2. Lowercase, replace non-alphanumeric characters with hyphens, collapse runs of hyphens.
3. Truncate to 55 characters, strip trailing hyphens.

```python
import re, html

def title_slug(title):
    t = html.unescape(title)
    t = re.sub(r'^SIGFPT\s+\w*\s*\d*\s*[:\-–.\|]\s*', '', t, flags=re.I)
    t = re.sub(r'^SIGFPT\s*[:\-–#]?\s*', '', t, flags=re.I)
    t = re.sub(r'^(SigPfB|MRG|ProtfiSIG)\s*[:\-–]\s*', '', t, flags=re.I)
    t = re.sub(r'^PFW Session\s+\d+\s*[:\-–]?\s*', '', t, flags=re.I)
    t = re.sub(r'^(Week|Session)\s+\d+\s*(Discussion\s+Thread)?\s*[:\-–]?\s*', '', t, flags=re.I)
    t = t.strip().lower()
    t = re.sub(r'[^\w\s-]', ' ', t)
    t = re.sub(r'\s+', '-', t.strip())
    t = re.sub(r'-+', '-', t)
    return t[:55].rstrip('-').lstrip('-') or 'session'

def session_slug(date_iso, title):
    return f"{date_iso}-{title_slug(title)}"
```

If two sessions on the same date produce the same slug, append `-2`, `-3`, etc.

## HTML structure

### SIG index page (`sigs/<sig-slug>/index.html`)

Each entry in the meeting list shows: date, linked title, topic tags, one-sentence abstract. Full content lives only on the detail page.

```html
<li class="meeting-item">
  <div class="meeting-date">May 27, 2026</div>
  <div class="meeting-title">
    <a href="/sigs/sigfpt/2026-05-27-stigmergy-3-pebble-automata">Session Title</a>
  </div>
  <div class="meeting-topics">
    <span class="meeting-topic">topic one</span>
    <span class="meeting-topic">topic two</span>
  </div>
  <p class="meeting-abstract">First sentence of summary.</p>
</li>
```

### Session detail page (`sigs/<sig-slug>/<date-slug>/index.html`)

The page header contains date and title. The `<div class="meeting-detail">` holds all session content. Future artifacts (essays, code, diagrams, recordings) should be added as additional sections **after** `.meeting-detail`, each with an appropriate heading.

```html
<div class="page-header">
  <p class="meeting-date" style="margin-top:0.25rem;font-size:0.9rem">May 27, 2026</p>
  <h1>Session Title</h1>
</div>

<div class="meeting-detail">
  <!-- topic tags, participants, summary paragraphs, insights, links, discord link -->
</div>

<!-- future artifacts go here, e.g.: -->
<!-- <h2 class="section-label">Essay</h2> -->
<!-- <div class="artifact"> ... </div> -->
```

## Adding a new session (manual)

1. Create `sigs/<sig-slug>/<YYYY-MM-DD>-<title-slug>/index.html` using the detail page template above. Copy nav and footer from any existing detail page.
2. Add an entry to the `<ul class="meeting-list">` in `sigs/<sig-slug>/index.html` — date, linked title, topics, abstract only.
3. Update the session count in the `<h2 class="section-label">` line.

## Future-dated sessions

Discord threads are often created ahead of the session to post an agenda. When the computed `date_iso` is in the future (relative to today), the session has not yet occurred and only agenda/announcement content is available.

- Add `class="meeting-item meeting-upcoming"` to the `<li>` on the index page. The CSS will render a "Scheduled" badge next to the date.
- Do not fabricate a summary. Use `<p class="meeting-summary">Summary to be added after the session.</p>` as a placeholder.
- After the session occurs, re-ingest the thread to replace the placeholder content and remove the `meeting-upcoming` class.

## Adding a new session (c3po automated ingestion)

The c3po pipeline should:

1. Compute `date_iso` from the Discord thread snowflake (see formula above).
2. Compute `path_slug = session_slug(date_iso, title)`.
3. Write the detail page to `sigs/<sig-slug>/<path_slug>/index.html`.
4. Patch `sigs/<sig-slug>/index.html`: insert a new `<li class="meeting-item">` entry at the top of `<ul class="meeting-list">`, and increment the count in `<h2 class="section-label">`.

The detail page template and index entry format are defined above. Do not modify any other files.
