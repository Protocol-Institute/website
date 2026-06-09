CREATE TABLE IF NOT EXISTS projects (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  slug                TEXT UNIQUE NOT NULL,
  title               TEXT NOT NULL,
  description         TEXT NOT NULL,
  lead_slug           TEXT NOT NULL,
  program             TEXT,
  state               TEXT NOT NULL DEFAULT 'stub'
                        CHECK(state IN ('stub', 'beta', 'production')),
  type                TEXT NOT NULL
                        CHECK(type IN ('one-off', 'versioned', 'accretive')),
  artifact_type       TEXT NOT NULL
                        CHECK(artifact_type IN ('text', 'code', 'website', 'rich_media', 'other')),
  artifact_type_other TEXT,
  url                 TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK(status IN ('pending', 'approved', 'rejected')),
  submitted_by        TEXT NOT NULL,
  admin_notes         TEXT,
  created_at          TEXT DEFAULT (datetime('now')),
  updated_at          TEXT DEFAULT (datetime('now'))
);
