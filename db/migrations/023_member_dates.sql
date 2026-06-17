-- Migration 023: member_since and membership_expires
ALTER TABLE members ADD COLUMN member_since TEXT;
ALTER TABLE members ADD COLUMN membership_expires TEXT;

-- Backfill from created_at for existing members
UPDATE members
SET member_since      = date(created_at),
    membership_expires = date(created_at, '+1 year')
WHERE member_since IS NULL;
