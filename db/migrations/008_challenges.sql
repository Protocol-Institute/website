CREATE TABLE IF NOT EXISTS challenges (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL,
  posed_by_slug TEXT NOT NULL,
  difficulty    INTEGER NOT NULL CHECK(difficulty IN (1,2,3,5,8,13,21,34,55,89)),
  interesting   INTEGER DEFAULT 0,
  created_at    TEXT DEFAULT (datetime('now'))
);
