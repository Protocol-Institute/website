-- Expand challenges table: split posed_by into free-text + communicating member,
-- split interesting into anon/member tracks, add seed baseline.
ALTER TABLE challenges ADD COLUMN posed_by TEXT;
ALTER TABLE challenges ADD COLUMN communicated_by_slug TEXT;
ALTER TABLE challenges ADD COLUMN anon_interesting INTEGER DEFAULT 0;
ALTER TABLE challenges ADD COLUMN member_interesting INTEGER DEFAULT 0;
ALTER TABLE challenges ADD COLUMN seed_interesting INTEGER DEFAULT 1;

CREATE TABLE IF NOT EXISTS challenge_votes (
  challenge_id INTEGER NOT NULL,
  email        TEXT NOT NULL,
  voted_at     TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (challenge_id, email)
);

-- Migrate existing data: communicating member was stored in posed_by_slug
UPDATE challenges SET
  communicated_by_slug = posed_by_slug,
  anon_interesting = interesting;
