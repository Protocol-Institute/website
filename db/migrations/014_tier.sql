-- Migration 014: Add member tier system
-- Adds tier column (team/community_lead/member) and community_lead_title
-- Backfills tier='team' for existing is_team=1 members
-- Fixes Aneesh Sathe (incorrectly flagged as team)

ALTER TABLE members ADD COLUMN tier TEXT DEFAULT 'member';
ALTER TABLE members ADD COLUMN community_lead_title TEXT;

UPDATE members SET tier = 'team' WHERE is_team = 1;

-- Fix Aneesh Sathe: community lead (SIG Host), not team
UPDATE members SET tier = 'community_lead', community_lead_title = 'SIG Host', is_team = 0
  WHERE slug = 'aneesh-sathe';
