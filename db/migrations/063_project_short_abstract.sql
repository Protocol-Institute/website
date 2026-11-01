-- 063: short abstract for projects (Session 62, 2026-11-01).
--
-- Descriptions run from a sentence to several pages, so nothing downstream could rely on
-- their length. short_abstract is a stand-alone 50-75 word summary, written by the lead
-- (or an admin) in the project editor; the API enforces the range when one is given.
-- Nullable: projects whose descriptions are too short to excerpt have none yet, and
-- consumers (the /pitch Research Roadmap appendix) fall back to the description's first paragraph.

ALTER TABLE projects ADD COLUMN short_abstract TEXT;
