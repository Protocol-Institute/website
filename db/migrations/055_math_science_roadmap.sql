-- 055: "Toward a Mathematical Science of Protocols" joins Research Roadmap 2027
-- (Session 57, 2026-10-10). Project 9, led by Abderraouf Belalia, already tagged
-- to SIGFPT. Approved directly (Venkat is the roadmap host); the prospectus card
-- shows the first paragraph of its existing description.

INSERT OR IGNORE INTO project_programs (project_id, program_slug, edition_id, status, linked_by, approved_by, approved_at)
  SELECT p.id, 'research-roadmap', e.id, 'approved', 'migration-055', 'migration-055', datetime('now')
  FROM projects p
  JOIN editions e ON e.program_slug = 'research-roadmap' AND e.slug = '2027'
  WHERE p.slug = 'legible-action-distinction-signaling-and-the-formalization-of-pr';
