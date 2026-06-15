-- Migration 018: Add session field to symposium_proposals
ALTER TABLE symposium_proposals ADD COLUMN session TEXT DEFAULT 'General';
