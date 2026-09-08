-- Migration 034: arbitrary links attached to a SIG.
--
-- SIGs previously had no structured link storage at all: a group's own site or
-- any related resource had to be hand-written into sigs/<slug>/index.html, which
-- drifted out of sync with reality (see Session 47). Affiliated *projects* are
-- already modelled in `projects.sig_slug` and are NOT duplicated here — this
-- table is only for links that are not projects.
--
-- kind = 'website' is the SIG's own homepage, rendered under the page blurb.
-- kind = 'link'    is a generic related link, rendered in the resources block.
CREATE TABLE IF NOT EXISTS sig_links (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  sig_slug   TEXT NOT NULL,
  kind       TEXT NOT NULL DEFAULT 'link' CHECK(kind IN ('website', 'link')),
  label      TEXT NOT NULL,
  url        TEXT NOT NULL,
  note       TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sig_links_slug ON sig_links (sig_slug, sort_order);
