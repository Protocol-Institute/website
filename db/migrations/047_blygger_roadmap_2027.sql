-- 047: Blygger joins Research Roadmap 2027 (Session 57, 2026-10-10).
--
-- Blygger (project 17, lead Venkatesh Rao) already existed, tagged to the
-- Intelligence Media research group (migration 040), so it appears on the
-- prospectus under that group. Approved directly — Venkat is the roadmap host.
-- The roadmap card shows the first paragraph of its existing description.

INSERT OR IGNORE INTO project_programs (project_id, program_slug, edition_id, status, linked_by, approved_by, approved_at)
  SELECT p.id, 'research-roadmap', e.id, 'approved', 'migration-047', 'migration-047', datetime('now')
  FROM projects p
  JOIN editions e ON e.program_slug = 'research-roadmap' AND e.slug = '2027'
  WHERE p.slug = 'blygger';
