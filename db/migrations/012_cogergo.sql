CREATE TABLE IF NOT EXISTS cogergo_items (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  slug                TEXT UNIQUE NOT NULL,
  title               TEXT NOT NULL,
  type                TEXT NOT NULL CHECK(type IN ('good', 'bad')),
  symptoms            TEXT,
  prognosis           TEXT,
  improvement_ideas   TEXT,
  contributed_by_slug TEXT NOT NULL,
  tags                TEXT NOT NULL DEFAULT '[]',
  severity            INTEGER CHECK(severity IS NULL OR (severity >= -10 AND severity <= 10)),
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK(status IN ('pending', 'approved', 'rejected')),
  admin_notes         TEXT,
  created_at          TEXT DEFAULT (datetime('now')),
  updated_at          TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cogergo_votes (
  item_id    INTEGER NOT NULL,
  email      TEXT NOT NULL,
  vote       TEXT NOT NULL CHECK(vote IN ('do', 'dont')),
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (item_id, email)
);

CREATE TABLE IF NOT EXISTS cogergo_comments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id     INTEGER NOT NULL,
  email       TEXT NOT NULL,
  member_slug TEXT NOT NULL,
  member_name TEXT NOT NULL,
  body        TEXT NOT NULL,
  created_at  TEXT DEFAULT (datetime('now'))
);
