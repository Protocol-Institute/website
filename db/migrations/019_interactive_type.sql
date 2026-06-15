-- Migration 019: Add 'interactive' as a valid proposal type
-- SQLite requires table recreation to modify a CHECK constraint.

PRAGMA foreign_keys = OFF;

CREATE TABLE symposium_proposals_new (
  id                   INTEGER PRIMARY KEY AUTOINCREMENT,
  type                 TEXT NOT NULL CHECK(type IN ('talk','workshop','interactive')),
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
  created_at           TEXT DEFAULT (datetime('now')),
  session              TEXT DEFAULT 'General'
);

INSERT INTO symposium_proposals_new SELECT * FROM symposium_proposals;

DROP TABLE symposium_proposals;

ALTER TABLE symposium_proposals_new RENAME TO symposium_proposals;

PRAGMA foreign_keys = ON;
