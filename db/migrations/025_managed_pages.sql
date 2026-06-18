-- Managed pages: D1-backed content editable via web editor or PR→import script.
-- page_key is a namespaced slug: 'sigs/mrg/about', 'projects/foo', 'static/bar'
CREATE TABLE managed_pages (
  page_key    TEXT PRIMARY KEY,
  title       TEXT NOT NULL DEFAULT '',
  content_md  TEXT NOT NULL DEFAULT '',
  updated_at  TEXT,
  updated_by  TEXT,
  is_published INTEGER NOT NULL DEFAULT 1
);
