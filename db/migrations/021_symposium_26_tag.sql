-- Migration 021: Protocol Symposium 2026 tag

ALTER TABLE members ADD COLUMN tag_symposium_26 INTEGER DEFAULT 0;
ALTER TABLE membership_requests ADD COLUMN tag_symposium_26 INTEGER DEFAULT 0;
