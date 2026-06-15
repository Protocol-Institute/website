-- Migration 016: Symposium 2026 proposals and quadratic voting

CREATE TABLE IF NOT EXISTS symposium_proposals (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  type                 TEXT NOT NULL CHECK(type IN ('talk','workshop')),
  slug                 TEXT UNIQUE,
  track                TEXT,
  title                TEXT NOT NULL,
  abstract             TEXT,
  speaker_name         TEXT,
  speaker_email        TEXT,
  speaker_website      TEXT,
  artifact_type        TEXT,
  co_speakers          TEXT,
  organizer_name       TEXT,
  organizer_email      TEXT,
  organizer_bio        TEXT,
  co_organizer_name    TEXT,
  co_organizer_email   TEXT,
  co_organizer_bio     TEXT,
  audience             TEXT,
  takeaways            TEXT,
  activities           TEXT,
  comments             TEXT,
  max_participants     TEXT,
  is_shortlisted       INTEGER DEFAULT 1,
  created_at           TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS symposium_votes (
  member_email TEXT NOT NULL,
  proposal_id  INTEGER NOT NULL REFERENCES symposium_proposals(id),
  votes        INTEGER NOT NULL DEFAULT 0 CHECK(votes >= 0),
  updated_at   TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (member_email, proposal_id)
);
