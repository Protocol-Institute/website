-- 066: optional GitHub username on member profiles (2026-11-18).
--
-- Bare username, normalised by functions/_shared/github-user.js (a pasted profile URL or
-- @handle is accepted and reduced). Public, like discord_handle. Asked at sign-up and in the
-- profile editor; the Blygger hackathon's declare form also offers to save the owner of a
-- personal repo. No backfill: no member website is a GitHub URL, and the one project lead
-- with a GitHub project link points at an organisation.

ALTER TABLE members ADD COLUMN github_username TEXT;
ALTER TABLE membership_requests ADD COLUMN github_username TEXT;
