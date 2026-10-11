-- 056: drop the pre-programs columns and table (Session 58, 2026-10-11).
-- This is the "migration 041" cleanup planned in Session 54 (programs/PLAN.md);
-- the number moved on while it waited out the 4h main.js cache window.
--
-- Superseded by migration 037: projects.sig_slug / program / sub_program / themes
-- by project_programs, sig_links by program_links, members.is_sig_host /
-- sig_host_slugs by program_hosts. Checked against prod before applying: every
-- project with an old value has a project_programs row, the one sig_links row
-- exists in program_links, and no member had is_sig_host set. No code reads
-- any of them; none is indexed, constrained or used by a trigger, so plain
-- DROP COLUMN works (no table rebuild, which D1 refuses for FK parents).
-- Backup: backups/pre-056-20261011-1101.sql.

DROP INDEX IF EXISTS idx_sig_links_slug;
DROP TABLE IF EXISTS sig_links;

ALTER TABLE projects DROP COLUMN sig_slug;
ALTER TABLE projects DROP COLUMN program;
ALTER TABLE projects DROP COLUMN sub_program;
ALTER TABLE projects DROP COLUMN themes;

ALTER TABLE members DROP COLUMN is_sig_host;
ALTER TABLE members DROP COLUMN sig_host_slugs;
