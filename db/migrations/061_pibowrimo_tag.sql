-- 061: PiBoWriMo as a qualifying event (Session 61, 2026-10-26).
--
-- Applicants who tick it on /members/join are auto-approved (no admin review) so they can
-- create their PiBoWriMo project straight away. Self-attested by design: the program
-- is open-tag and the commitment is low. Revisit if abused.

ALTER TABLE members ADD COLUMN tag_pibowrimo INTEGER DEFAULT 0;
ALTER TABLE membership_requests ADD COLUMN tag_pibowrimo INTEGER DEFAULT 0;
