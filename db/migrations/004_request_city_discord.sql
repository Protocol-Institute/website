-- Migration 004: add city and discord_handle to membership_requests
ALTER TABLE membership_requests ADD COLUMN city TEXT;
ALTER TABLE membership_requests ADD COLUMN discord_handle TEXT;
