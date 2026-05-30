-- Migration 003: add city and discord_handle fields to members
ALTER TABLE members ADD COLUMN city TEXT;
ALTER TABLE members ADD COLUMN discord_handle TEXT;
