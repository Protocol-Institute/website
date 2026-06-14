-- Migration 015: Symposium/GuestSpeaker tags + CRM contacts table

ALTER TABLE members ADD COLUMN tag_symposium_25 INTEGER DEFAULT 0;
ALTER TABLE members ADD COLUMN tag_guest_speaker INTEGER DEFAULT 0;

ALTER TABLE membership_requests ADD COLUMN tag_symposium_25 INTEGER DEFAULT 0;
ALTER TABLE membership_requests ADD COLUMN tag_guest_speaker INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS crm_contacts (
  email        TEXT PRIMARY KEY,
  affiliations TEXT NOT NULL,
  imported_at  TEXT DEFAULT (datetime('now'))
);
