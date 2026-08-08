-- Migration 028: unify projects with challenges under /research
--
-- sig_slug replaces program/sub_program/themes as the single "aligned with a
-- SIG, or independent (NULL)" field. program/sub_program/themes are left in
-- place (dead columns) rather than dropped, since D1's SQLite does not
-- support DROP COLUMN cleanly across all existing rows without a table
-- rebuild; they simply stop being written to going forward.
ALTER TABLE projects ADD COLUMN sig_slug TEXT;

-- Watching mechanism, mirrored from challenges (same formula, same shape):
-- value = seed_interesting + 1*anon_interesting^2 + 3*member_interesting^2
ALTER TABLE projects ADD COLUMN anon_interesting   INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN member_interesting INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN seed_interesting   INTEGER DEFAULT 1;

CREATE TABLE IF NOT EXISTS project_votes (
  project_id INTEGER NOT NULL,
  email      TEXT NOT NULL,
  voted_at   TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (project_id, email)
);

-- Team membership: any logged-in member may self-declare (status='pending');
-- only the project's lead_slug (or an admin) may flip a row to 'approved'.
CREATE TABLE IF NOT EXISTS project_team (
  project_id   INTEGER NOT NULL,
  member_slug  TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved')),
  requested_at TEXT DEFAULT (datetime('now')),
  approved_at  TEXT,
  approved_by  TEXT,
  PRIMARY KEY (project_id, member_slug)
);

-- Many-to-many: a project may respond to several challenges, a challenge may
-- have several responding projects. Editable any time by lead/admin, not
-- just at submission (either side of the link may postdate the other).
CREATE TABLE IF NOT EXISTS project_challenges (
  project_id   INTEGER NOT NULL,
  challenge_id INTEGER NOT NULL,
  linked_by    TEXT NOT NULL,
  created_at   TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (project_id, challenge_id)
);
