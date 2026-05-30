-- Migration 001: add owner_email for AI/bot member records
ALTER TABLE members ADD COLUMN owner_email TEXT;
