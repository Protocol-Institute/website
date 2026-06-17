-- Migration 024: Track number of times each voter has hit "Save Votes"
-- Needed for analytics dashboard; votes.js UPSERTs on each save.

CREATE TABLE IF NOT EXISTS symposium_vote_saves (
  member_email  TEXT PRIMARY KEY,
  save_count    INTEGER NOT NULL DEFAULT 1,
  last_saved_at TEXT DEFAULT (datetime('now'))
);
