-- Migration 017: Symposium proposal comments

CREATE TABLE IF NOT EXISTS symposium_comments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  proposal_id  INTEGER NOT NULL REFERENCES symposium_proposals(id),
  member_email TEXT NOT NULL,
  member_name  TEXT NOT NULL,
  body         TEXT NOT NULL,
  created_at   TEXT DEFAULT (datetime('now'))
);
