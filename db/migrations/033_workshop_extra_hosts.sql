-- Migration 033: Workshops can have up to 5 hosts total.
-- Previously only organizer_name/co_organizer_name (2 slots) existed.
-- Adds 3 more host slots, matching the existing organizer/co_organizer
-- name+email+bio pattern.

ALTER TABLE symposium_proposals ADD COLUMN host3_name  TEXT;
ALTER TABLE symposium_proposals ADD COLUMN host3_email TEXT;
ALTER TABLE symposium_proposals ADD COLUMN host3_bio   TEXT;

ALTER TABLE symposium_proposals ADD COLUMN host4_name  TEXT;
ALTER TABLE symposium_proposals ADD COLUMN host4_email TEXT;
ALTER TABLE symposium_proposals ADD COLUMN host4_bio   TEXT;

ALTER TABLE symposium_proposals ADD COLUMN host5_name  TEXT;
ALTER TABLE symposium_proposals ADD COLUMN host5_email TEXT;
ALTER TABLE symposium_proposals ADD COLUMN host5_bio   TEXT;
