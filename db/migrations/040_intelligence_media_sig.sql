-- 040: Intelligence Media SIG (Session 55, 2026-10-03).
--
-- A new research group, created as a program row the way /api/programs POST
-- would (kind='sig', primary area 'research' => affiliation_policy 'open'),
-- with Venkatesh Rao as host. It has no /sigs/<slug> page yet — no Discord
-- channel or meetings to ingest — so page_url stays NULL and it is served by
-- the generic /programs/program?slug=intelligence-media page. When meetings
-- start it needs the usual SIG plumbing: PI_SIGS in js/sig-meta.js, the
-- calendar sync, and c3po's SIG_INFO, plus page_url='/sigs/intelligence-media'.
--
-- Two new projects are seeded (Blygger, SIGPSY Oracle) and four projects are
-- tagged to the SIG. C3PO and Humboldt keep their existing ai-ops tag — a
-- project can belong to any number of programs.
--
-- The schema cleanup previously pencilled in as "migration 040" is now 041.
--
-- History: first applied 2026-10-04 with the slug/title misspelt "intelligent-media";
-- corrected in place the same hour (new program row inserted, child rows repointed,
-- old row deleted). A fresh database gets the correct name from this file.

INSERT OR IGNORE INTO programs (slug, kind, title, short_title, description, byline, status, affiliation_policy, sort_order)
VALUES ('intelligence-media', 'sig', 'Intelligence Media', NULL,
        'The Intelligence Media SIG explores AI-native protocols, including RAG bots, oracles, and the Blygger distribution protocol.',
        'Led by Venkatesh Rao — no meetings scheduled yet', 'active', 'open', 8);

INSERT OR IGNORE INTO program_links (program_slug, kind, label, url, sort_order)
VALUES ('intelligence-media', 'channel', 'Discord channel', 'https://discord.com/channels/1082444651946049567/1553833347732611222', 0);

INSERT OR IGNORE INTO program_areas (program_slug, area_slug, is_primary)
  SELECT 'intelligence-media', slug, 1 FROM areas WHERE slug = 'research';

INSERT OR IGNORE INTO program_hosts (program_slug, member_slug)
  SELECT 'intelligence-media', slug FROM members WHERE slug = 'venkatesh-rao';

INSERT OR IGNORE INTO projects (slug, title, description, lead_slug, state, type, artifact_type, artifact_type_other, url, status, submitted_by) VALUES
  ('blygger', 'Blygger',
   'An AI-native decentralized public writing medium — fragments, threads and transclusion over static files and RSS — and the distribution protocol behind it.',
   'venkatesh-rao', 'stub', 'versioned', 'other', 'protocol specification', 'https://blygger.org', 'approved', 'migration-040'),
  ('sigpsy-oracle', 'SIGPSY Oracle',
   'An AI oracle for the Special Interest Group in Psychohistory — a conversational interface over the World Machines psychohistorical corpus.',
   'aneesh-sathe', 'stub', 'accretive', 'code', NULL, 'https://worldmachines.org', 'approved', 'migration-040');

INSERT OR IGNORE INTO project_programs (project_id, program_slug, status, linked_by, approved_by, approved_at)
  SELECT id, 'intelligence-media', 'approved', 'migration-040', 'migration-040', datetime('now')
  FROM projects WHERE slug IN ('blygger', 'sigpsy-oracle', 'c3po', 'humboldt');
