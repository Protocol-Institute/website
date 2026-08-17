-- Migration 031: Workshop self-scheduled session times + registration links
-- Workshops (Sept 21-22) are self-scheduled by their organizers, typically
-- as 4 repeated windows across the two days, unlike the single-slot General
-- grid. Each row is one labeled session ("Session 1", "Session 2", ...).

ALTER TABLE symposium_proposals ADD COLUMN registration_url TEXT;

CREATE TABLE IF NOT EXISTS symposium_workshop_sessions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  proposal_id INTEGER NOT NULL REFERENCES symposium_proposals(id),
  seq         INTEGER NOT NULL,
  date        TEXT NOT NULL,
  start_time  TEXT NOT NULL,
  end_time    TEXT NOT NULL,
  note        TEXT
);
