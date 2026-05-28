# Protocol Institute — Pitch Deck

An embeddable HTML presentation for the Support page.
Embedded at `support.html` as an iframe; directly accessible at `/pitchdeck/deck.html`.

## Files

| File | Purpose |
|------|---------|
| `deck.html` | Renderer **and** content — edit the `<script id="deck-content">` block inside |
| `deck.css` | Styles — edit to change layout, colors, or fonts |
| `deck.js` | Renderer logic — do not edit unless changing behavior |
| `deck.md` | Reference copy of current content (not used for rendering) |
| `images/` | Image assets referenced from slide content |
| `archive/` | Past versions, named `vX.Y.Z.md` |

---

## Editing the deck

Open `deck.html` in any text editor. Near the bottom, find the block:

```html
<script id="deck-content" type="text/plain">
---
title: ...
---
<!-- slide: cover -->
...
</script>
```

Edit the markdown inside that block. The renderer reads it directly from the DOM — no server or network request is involved, so the deck works in any context (local file, iframe, any hosting provider).

The `deck.md` file is a reference copy you can use for editing with Markdown syntax highlighting, then paste back into the `<script>` block in `deck.html`.

The file has two sections:

### 1. Frontmatter

```yaml
---
title: Protocol Institute
subtitle: Building Context for the Protocol Age
version: 0.1.0
date: 2026-05-28
---
```

Update `version` whenever you publish a new version (see Versioning below).

### 2. Slides

Each slide begins with a type marker:

```markdown
<!-- slide: TYPE -->
```

Then follows the slide content in standard Markdown. Slides end when the next `<!-- slide: ... -->` marker appears.

---

## Slide types

### `cover`
Full-screen teal background. Use for title and closing slides.
```markdown
<!-- slide: cover -->

# Title Text

Subtitle or supporting line
```

### `big-point`
Single large statement, centered. Best for one punchy sentence.
```markdown
<!-- slide: big-point -->

# The world runs on protocols.
```

### `section`
Teal section-break divider. Use between major sections.
```markdown
<!-- slide: section -->

# Section Name
```

### `bullets`
Heading + unordered list.
```markdown
<!-- slide: bullets -->

## Slide Heading

- First item
- Second item
- Third item with *emphasis*
```

### `numbered`
Heading + ordered list. Good for steps or ranked items.
```markdown
<!-- slide: numbered -->

## How It Works

1. **Step one** — description
2. **Step two** — description
3. **Step three** — description
```

### `quote`
Pull quote with attribution. Put the attribution on its own line after the blockquote.
```markdown
<!-- slide: quote -->

> "The quoted text goes here, as a Markdown blockquote."

— Speaker Name, Organization
```

### `big-image`
Image fills most of the slide. Add an italic line below for a caption.
```markdown
<!-- slide: big-image -->

![Alt description](images/filename.jpg)
*Optional caption text*
```

### `table`
Heading + Markdown table.
```markdown
<!-- slide: table -->

## Table Title

| Column A | Column B | Column C |
|----------|----------|----------|
| Cell     | Cell     | Cell     |
```

### `two-column`
Split layout. Use `<!-- split -->` to divide left and right content.
The first heading before `<!-- split -->` spans both columns.
```markdown
<!-- slide: two-column -->

## Full-width Heading

- Left bullet one
- Left bullet two
- Left bullet three

<!-- split -->

![Right side image](images/filename.jpg)
*Caption*
```

Both columns can hold any Markdown content — bullets, paragraphs, images.

---

## Adding images

Place image files in `images/`. Reference them in `deck.md` with a relative path:

```markdown
![Alt text](images/my-image.jpg)
```

Supported formats: JPG, PNG, SVG, WebP.

---

## Changing fonts

To use different fonts, edit the top of `deck.css`:

```css
/* Replace this @import with your font of choice */
@import url('https://fonts.googleapis.com/css2?family=...');

:root {
  --font-heading: 'Your Heading Font', serif;
  --font-body:    'Your Body Font', sans-serif;
}
```

To use a self-hosted or licensed font, replace the `@import` with `@font-face` declarations.

---

## Versioning

The deck uses semantic versioning: `MAJOR.MINOR.PATCH`

| Bump | When |
|------|------|
| `PATCH` (0.1.0 → 0.1.1) | Typo fixes, minor copy edits |
| `MINOR` (0.1.0 → 0.2.0) | New slides or significant content changes |
| `MAJOR` (0.1.0 → 1.0.0) | Structural rewrite or new narrative arc |

**Workflow for a new version:**

1. Archive the current content block:
   ```bash
   # Copy the <script id="deck-content"> block text to archive
   cp pitchdeck/deck.md pitchdeck/archive/v0.1.0.md
   ```
   (Or copy it manually from `deck.html` into `archive/vX.Y.Z.md`.)
2. Edit the `<script id="deck-content">` block in `deck.html` and bump the `version:` field.
3. Update `deck.md` to match (reference copy).
4. Commit both files.

Archived versions are stored as plain Markdown in `archive/` and are not served or linked anywhere.

---

## PDF export

Click the **↓ PDF** button in the top-right corner of the deck. This triggers the browser's print dialog — choose "Save as PDF" and set paper size to **A4 landscape** or **Letter landscape** for best results.

All slides will print one per page with navigation controls hidden.

---

## Embedding

The deck is embedded in `support.html` as an iframe:

```html
<div class="pitch-deck-container">
  <iframe src="pitchdeck/deck.html" title="Protocol Institute — Support Deck"
          class="pitch-deck-frame" loading="lazy" allowfullscreen></iframe>
</div>
```

The deck reads content from the embedded `<script id="deck-content">` block — no network request is made. It works when opened as a local file, in an iframe, or on any hosting provider.

---

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `→` or `↓` or `Space` | Next slide |
| `←` or `↑` | Previous slide |
