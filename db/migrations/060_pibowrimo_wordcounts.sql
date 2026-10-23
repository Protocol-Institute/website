-- 060: PiBoWriMo word-count log (Session 60, 2026-10-23).
--
-- One row per project per day: logging the same date again replaces the count
-- (the UNIQUE key is the upsert target), so a figure is corrected by
-- resubmitting, not by adding. words is what was written THAT day, not a
-- running total; the leaderboard sums it. The open window is not stored here —
-- it is the start/end of the pibowrimo edition '2026-11'.
-- logged_by is the session email, kept for audit only and never returned.

CREATE TABLE IF NOT EXISTS pibowrimo_wordcounts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER NOT NULL REFERENCES projects(id),
  entry_date TEXT NOT NULL,
  words      INTEGER NOT NULL,
  logged_by  TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE (project_id, entry_date)
);

-- A project's length before the month began, for books already in progress.
-- Recorded once, the first time the project logs (the API refuses a first entry
-- without it). It is a baseline only: never part of the score.
CREATE TABLE IF NOT EXISTS pibowrimo_starts (
  project_id INTEGER PRIMARY KEY REFERENCES projects(id),
  words      INTEGER NOT NULL CHECK(words >= 0),
  logged_by  TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
