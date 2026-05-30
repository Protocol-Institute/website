-- Migration 006: store team title and description in membership requests
ALTER TABLE membership_requests ADD COLUMN applicant_team_title TEXT;
ALTER TABLE membership_requests ADD COLUMN applicant_team_description TEXT;
