-- Migration 037: areas > programs > editions, and many-to-many project affiliation.
--
-- See programs/PLAN.md. Additive only: projects.sig_slug / program / sub_program /
-- themes are left in place so the code running at the moment this is applied keeps
-- working; migration 038 drops them once the code that reads the new tables is live.
--
-- Semantics in brief:
--   realm    'research' or 'admin' — two parallel hierarchies. Admin (the
--            Institute's own operations: websites, channels, logistics) is kept
--            out of /research and shown only on the low-profile /operations page.
--            Set on areas (programs inherit it from their primary area) and,
--            independently, on projects: an admin project may still link to a
--            research program (e.g. symposium logistics → Symposium 2026).
--   area     display grouping; projects never attach to one directly
--   program  anything with a lasting identity (a SIG, the Symposium, a workshop,
--            a course, a collaboration); many-to-many with areas
--   edition  a dated run of a program; part_of_edition_id nests a run inside one
--            of OUR other runs, host_context names someone else's event
--   project_programs  a project's affiliation with a program, optionally pinned
--            to one edition; approved by an admin or a program host, or
--            automatically when the program's affiliation_policy is 'open'

CREATE TABLE IF NOT EXISTS areas (
  slug        TEXT PRIMARY KEY,
  realm       TEXT NOT NULL DEFAULT 'research' CHECK(realm IN ('research', 'admin')),
  title       TEXT NOT NULL,
  description TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS programs (
  slug               TEXT PRIMARY KEY,
  kind               TEXT NOT NULL
                       CHECK(kind IN ('sig', 'event', 'workshop', 'course', 'collaboration', 'initiative')),
  title              TEXT NOT NULL,
  short_title        TEXT,
  description        TEXT,
  page_url           TEXT,
  status             TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'past')),
  affiliation_policy TEXT NOT NULL DEFAULT 'moderated' CHECK(affiliation_policy IN ('moderated', 'open')),
  sort_order         INTEGER NOT NULL DEFAULT 0,
  created_at         TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS program_areas (
  program_slug TEXT NOT NULL REFERENCES programs(slug),
  area_slug    TEXT NOT NULL REFERENCES areas(slug),
  is_primary   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (program_slug, area_slug)
);

CREATE TABLE IF NOT EXISTS program_hosts (
  program_slug TEXT NOT NULL REFERENCES programs(slug),
  member_slug  TEXT NOT NULL,
  PRIMARY KEY (program_slug, member_slug)
);

CREATE TABLE IF NOT EXISTS editions (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  program_slug       TEXT NOT NULL REFERENCES programs(slug),
  slug               TEXT NOT NULL,
  title              TEXT NOT NULL,
  start_date         TEXT,
  end_date           TEXT,
  location           TEXT,
  host_context       TEXT,
  page_url           TEXT,
  part_of_edition_id INTEGER REFERENCES editions(id),
  status             TEXT NOT NULL DEFAULT 'past' CHECK(status IN ('planned', 'active', 'past')),
  UNIQUE (program_slug, slug)
);

CREATE TABLE IF NOT EXISTS project_programs (
  project_id   INTEGER NOT NULL REFERENCES projects(id),
  program_slug TEXT NOT NULL REFERENCES programs(slug),
  edition_id   INTEGER REFERENCES editions(id),
  status       TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  linked_by    TEXT,
  approved_by  TEXT,
  created_at   TEXT DEFAULT (datetime('now')),
  approved_at  TEXT,
  PRIMARY KEY (project_id, program_slug)
);

-- Links that are not projects: a program's own site, related resources, and the
-- outlets that carry its work (kind='channel': Substack, YouTube, …).
-- Generalizes sig_links (migration 034), whose rows are copied below; sig_links
-- itself is dropped in 038.
CREATE TABLE IF NOT EXISTS program_links (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  program_slug TEXT NOT NULL REFERENCES programs(slug),
  kind         TEXT NOT NULL DEFAULT 'link' CHECK(kind IN ('website', 'channel', 'link')),
  label        TEXT NOT NULL,
  url          TEXT NOT NULL,
  note         TEXT,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_program_links_program ON program_links (program_slug, sort_order);

-- Not re-runnable past this point (SQLite has no ADD COLUMN IF NOT EXISTS).
ALTER TABLE projects ADD COLUMN realm TEXT NOT NULL DEFAULT 'research' CHECK(realm IN ('research', 'admin'));

CREATE INDEX IF NOT EXISTS idx_project_programs_program ON project_programs (program_slug, status);
CREATE INDEX IF NOT EXISTS idx_editions_program ON editions (program_slug, start_date);

-- ── Areas ───────────────────────────────────────────────────────────────────

INSERT OR IGNORE INTO areas (slug, realm, title, description, sort_order) VALUES
  ('research',       'research', 'Research Groups', 'Special interest groups and the open research index.', 1),
  ('events',         'research', 'Events',         'Symposia, workshops, retreats and gatherings.', 2),
  ('education',      'research', 'Education',      'Courses and structured learning in protocol theory and practice.', 3),
  ('publishing',     'research', 'Publishing',     'Protocolized — essays, books, recordings and the resource archive.', 4),
  ('ai-ops',         'research', 'AI Ops',         'AI tools and agents that extend the Institute''s research capacity.', 5),
  ('collaborations', 'research', 'Collaborations', 'Work done jointly with other organizations.', 6),
  ('operations',     'admin',    'Operations',     'Running the Institute: websites, channels, accounts and logistics.', 10);

-- ── Programs ────────────────────────────────────────────────────────────────

INSERT OR IGNORE INTO programs (slug, kind, title, short_title, description, page_url, status, affiliation_policy, sort_order) VALUES
  ('sigfpt',    'sig', 'Formal Protocol Theory',     'SIGFPT',    'Rigorous mathematical foundations for protocol theory.', '/sigs/sigfpt', 'active', 'moderated', 1),
  ('mrg',       'sig', 'Memory Research Group',      'MRG',       'Protocols of memory, storage, and institutional recall.', '/sigs/mrg', 'active', 'moderated', 2),
  ('sigpfb',    'sig', 'Protocols for Business',     'SIGPfB',    'Protocol design in business and organizational contexts.', '/sigs/sigpfb', 'active', 'moderated', 3),
  ('protfisig', 'sig', 'Protocol Fiction',           'ProtFiSIG', 'Protocol concepts explored through speculative fiction.', '/sigs/protfisig', 'active', 'moderated', 4),
  ('drg',       'sig', 'Distributed Robotics Group', 'DRG',       'Onchain robotics protocols designed and tested on real hardware.', '/sigs/drg', 'active', 'moderated', 5),
  ('sigpsy',    'sig', 'Psychohistory',              'SIGPSY',    'Long-range historical modeling through protocol and complexity theory.', '/sigs/sigpsy', 'active', 'moderated', 6),
  ('prg',       'sig', 'Personhood Research Group',  'PRG',       'Personhood as a set of protocols, across disciplines and under AI.', '/sigs/prg', 'active', 'moderated', 7),

  ('research-index', 'initiative', 'Research Index', NULL, 'Open challenges and the community projects that respond to them.', '/research', 'active', 'moderated', 10),
  ('protocolized',   'initiative', 'Protocolized', NULL, 'The Institute''s publishing arm — essays, talks, books and a curated archive of protocol research.', NULL, 'active', 'moderated', 11),
  ('protocolized-books', 'initiative', 'Protocolized Books', NULL, 'The Protocolized book imprint — long-form publications on protocol research.', NULL, 'active', 'moderated', 14),
  ('web-properties', 'initiative', 'Web Properties', NULL, 'The Institute''s websites and web applications.', NULL, 'active', 'moderated', 60),
  ('ai-ops',         'initiative', 'AI Ops', NULL, 'AI tools and agents that extend the Protocol Institute''s research capacity.', NULL, 'active', 'moderated', 12),
  ('summer-of-protocols', 'initiative', 'Summer of Protocols', 'SoP', 'The Institute''s founding research fellowship program, run 2023–2025.', 'https://web.archive.org/web/20260421142108/https://summerofprotocols.com/', 'past', 'moderated', 13),

  ('protocol-symposium',  'event', 'Protocol Symposium', NULL, 'The Institute''s annual online symposium.', '/events/protocol-symposium-2026', 'active', 'moderated', 20),
  ('book-writing-month',  'event', 'Book Writing Month', NULL, 'A month-long collective push for members writing books.', NULL, 'active', 'open', 21),
  ('researcher-retreat-seattle', 'event', 'Researcher Retreat, Seattle', NULL, 'The inaugural Summer of Protocols researcher retreat.', '/events/researcher-retreat-seattle-2023', 'past', 'moderated', 22),
  ('bridge-atlas',        'event', 'Bridge Atlas', NULL, 'A day-long gathering convened by the Summer of Protocols team.', '/events/bridge-atlas-devconnect-2025', 'past', 'moderated', 23),

  ('edge-city-workshops',  'workshop', 'Edge City Workshops', NULL, 'Protocol workshops held during Edge City''s popup villages.', NULL, 'active', 'moderated', 30),
  ('traditional-protocols-workshops', 'workshop', 'Traditional Protocols Workshops', NULL, 'Workshops examining traditional coordination and governance protocols of Southeast Asia.', NULL, 'active', 'moderated', 31),
  ('foundations-workshop', 'workshop', 'Foundations Workshop', NULL, 'Workshop on the foundations of protocol theory, held at the 2025 Symposium.', '/events/protocol-symposium-2025', 'past', 'moderated', 32),
  ('ai-kitcraft',          'workshop', 'AI Kitcraft', NULL, 'A hands-on AI tooling workshop.', '/events/protocol-symposium-2026/program/workshops/workshop-ai-kitcraft-a-hands-on-ai-tooling-works', 'active', 'moderated', 33),
  ('stigmergy-hackathon',  'workshop', 'Protocol Hackathon: Securing Stigmergic Systems', NULL, NULL, '/events/protocol-symposium-2026/program/workshops/workshop-protocol-hackathon-securing-stigmergic', 'active', 'moderated', 34),
  ('robots-as-protocol-citizens', 'workshop', 'Robots as Protocol Citizens', NULL, 'Assembling a robot into the YakRobot protocol stack.', '/events/protocol-symposium-2026/program/workshops/workshop-robots-as-protocol-citizens-assembling', 'active', 'moderated', 35),
  ('protocols-as-art',     'workshop', 'Beyond the Artwork: Designing Protocols as Art', NULL, NULL, '/events/protocol-symposium-2026/program/workshops/beyond-the-artwork-designing-protocols-as-art', 'active', 'moderated', 36),
  ('protocolize-your-book', 'workshop', 'Protocolize Your Book', NULL, 'Run your manuscript through a book production factory.', '/events/protocol-symposium-2026/program/workshops/protocolize-your-book-running-real-manuscripts-through-a-book-production-factory', 'active', 'moderated', 37),

  ('protocol-school', 'course', 'Protocol School', NULL, 'A biennial intensive educational program in protocol theory and practice.', '/programs/protocol-school', 'active', 'moderated', 40),

  ('long-now', 'collaboration', 'Protocols for the Long Now', NULL, 'Protocols for deep-time thinking, with the Long Now Foundation.', NULL, 'active', 'moderated', 50);

-- ── Program ↔ area ──────────────────────────────────────────────────────────

INSERT OR IGNORE INTO program_areas (program_slug, area_slug, is_primary) VALUES
  ('sigfpt', 'research', 1), ('mrg', 'research', 1), ('sigpfb', 'research', 1),
  ('protfisig', 'research', 1), ('drg', 'research', 1), ('sigpsy', 'research', 1), ('prg', 'research', 1),
  ('research-index', 'research', 1),
  ('protocolized', 'publishing', 1),
  ('protocolized-books', 'publishing', 1),
  ('web-properties', 'operations', 1),
  ('ai-ops', 'ai-ops', 1),
  ('summer-of-protocols', 'research', 1), ('summer-of-protocols', 'education', 0),
  ('protocol-symposium', 'events', 1),
  ('book-writing-month', 'events', 1), ('book-writing-month', 'publishing', 0),
  ('researcher-retreat-seattle', 'events', 1),
  ('bridge-atlas', 'events', 1),
  ('edge-city-workshops', 'events', 1), ('edge-city-workshops', 'collaborations', 0),
  ('traditional-protocols-workshops', 'events', 1),
  ('foundations-workshop', 'events', 1), ('foundations-workshop', 'education', 0),
  ('ai-kitcraft', 'events', 1),
  ('stigmergy-hackathon', 'events', 1),
  ('robots-as-protocol-citizens', 'events', 1),
  ('protocols-as-art', 'events', 1),
  ('protocolize-your-book', 'events', 1), ('protocolize-your-book', 'publishing', 0),
  ('protocol-school', 'education', 1),
  ('long-now', 'collaborations', 1);

-- ── Program links ───────────────────────────────────────────────────────────

INSERT INTO program_links (program_slug, kind, label, url, note, sort_order)
  SELECT sig_slug, kind, label, url, note, sort_order FROM sig_links
  WHERE NOT EXISTS (SELECT 1 FROM program_links);

INSERT INTO program_links (program_slug, kind, label, url, note, sort_order)
  SELECT * FROM (VALUES
    ('protocolized', 'website', 'protocolized.io', 'https://protocolized.io', NULL, 0),
    ('protocolized', 'channel', 'Substack', 'https://protocolized.summerofprotocols.com', 'Essays, research, and editorial on protocol themes', 1),
    ('protocolized', 'channel', 'YouTube', 'https://www.youtube.com/@protocol-institute', 'Talks, discussions, and event recordings', 2),
    ('protocolized', 'channel', 'Books', 'https://protocolized.io/books', 'Long-form PI publications on protocol research', 3),
    ('protocolized', 'channel', 'Resource archive', 'https://protocolized.io/resources/', 'Curated library of protocol research outputs', 4),
    ('protocolized-books', 'website', 'protocolized.io/books', 'https://protocolized.io/books', NULL, 0)
  ) WHERE NOT EXISTS (SELECT 1 FROM program_links WHERE program_slug = 'protocolized');

-- ── Editions ────────────────────────────────────────────────────────────────
-- Inserted parents-first; part_of_edition_id is resolved by subquery on
-- (program_slug, slug) so the seed does not depend on autoincrement values.

INSERT OR IGNORE INTO editions (program_slug, slug, title, start_date, end_date, location, page_url, status) VALUES
  ('summer-of-protocols', '2023', 'Summer of Protocols 2023', NULL, NULL, NULL, NULL, 'past'),
  ('summer-of-protocols', '2024', 'Summer of Protocols 2024', NULL, NULL, NULL, NULL, 'past'),
  ('summer-of-protocols', '2025', 'Summer of Protocols 2025', NULL, NULL, NULL, NULL, 'past'),
  ('protocol-symposium', '2026', 'Protocol Symposium 2026', '2026-09-21', '2026-09-25', 'Online', '/events/protocol-symposium-2026', 'past'),
  ('book-writing-month', '2026-11', 'Book Writing Month — November 2026', '2026-11-01', '2026-11-30', 'Online', NULL, 'planned');

INSERT OR IGNORE INTO editions (program_slug, slug, title, start_date, end_date, location, page_url, status, part_of_edition_id) VALUES
  ('protocol-symposium', '2024', 'Protocol Symposium 2024', '2024-09-12', '2024-09-19', 'Online', '/events/protocol-symposium-2024', 'past',
     (SELECT id FROM editions WHERE program_slug = 'summer-of-protocols' AND slug = '2024')),
  ('protocol-symposium', '2025', 'Protocol Symposium 2025', '2025-09-12', '2025-09-19', 'Online', '/events/protocol-symposium-2025', 'past',
     (SELECT id FROM editions WHERE program_slug = 'summer-of-protocols' AND slug = '2025')),
  ('researcher-retreat-seattle', '2023', 'Researcher Retreat 2023', '2023-08-01', NULL, 'St. Edward State Park, Seattle', '/events/researcher-retreat-seattle-2023', 'past',
     (SELECT id FROM editions WHERE program_slug = 'summer-of-protocols' AND slug = '2023'));

INSERT OR IGNORE INTO editions (program_slug, slug, title, start_date, end_date, location, page_url, status, part_of_edition_id) VALUES
  ('foundations-workshop', '2025', 'Foundations Workshop 2025', '2025-09-12', '2025-09-14', 'Online', '/events/protocol-symposium-2025', 'past',
     (SELECT id FROM editions WHERE program_slug = 'protocol-symposium' AND slug = '2025')),
  ('protocol-school', '2025', 'Protocol School 2025', NULL, NULL, 'Online', '/programs/protocol-school', 'past',
     (SELECT id FROM editions WHERE program_slug = 'protocol-symposium' AND slug = '2025')),
  ('ai-kitcraft', '2026-symposium', 'AI Kitcraft at Protocol Symposium 2026', '2026-09-21', NULL, 'Online',
     '/events/protocol-symposium-2026/program/workshops/workshop-ai-kitcraft-a-hands-on-ai-tooling-works', 'past',
     (SELECT id FROM editions WHERE program_slug = 'protocol-symposium' AND slug = '2026')),
  ('stigmergy-hackathon', '2026-symposium', 'Protocol Hackathon at Protocol Symposium 2026', '2026-09-21', NULL, 'Online',
     '/events/protocol-symposium-2026/program/workshops/workshop-protocol-hackathon-securing-stigmergic', 'past',
     (SELECT id FROM editions WHERE program_slug = 'protocol-symposium' AND slug = '2026')),
  ('robots-as-protocol-citizens', '2026-symposium', 'Robots as Protocol Citizens at Protocol Symposium 2026', '2026-09-21', NULL, 'Online',
     '/events/protocol-symposium-2026/program/workshops/workshop-robots-as-protocol-citizens-assembling', 'past',
     (SELECT id FROM editions WHERE program_slug = 'protocol-symposium' AND slug = '2026')),
  ('protocols-as-art', '2026-symposium', 'Beyond the Artwork at Protocol Symposium 2026', '2026-09-21', NULL, 'Online',
     '/events/protocol-symposium-2026/program/workshops/beyond-the-artwork-designing-protocols-as-art', 'past',
     (SELECT id FROM editions WHERE program_slug = 'protocol-symposium' AND slug = '2026')),
  ('protocolize-your-book', '2026-symposium', 'Protocolize Your Book at Protocol Symposium 2026', '2026-09-21', NULL, 'Online',
     '/events/protocol-symposium-2026/program/workshops/protocolize-your-book-running-real-manuscripts-through-a-book-production-factory', 'past',
     (SELECT id FROM editions WHERE program_slug = 'protocol-symposium' AND slug = '2026'));

INSERT OR IGNORE INTO editions (program_slug, slug, title, start_date, end_date, location, host_context, page_url, status) VALUES
  ('edge-city-workshops', 'esmeralda-2024', 'Edge Esmeralda Workshop 2024', '2024-06-02', '2024-06-30', 'Healdsburg, CA', 'Edge Esmeralda (Edge City)', '/events/edge-esmeralda-workshop-2024', 'past'),
  ('edge-city-workshops', 'lanna-2024', 'Edge Lanna Workshop 2024', '2024-10-10', '2024-11-10', 'Chiang Mai, Thailand', 'Edge Lanna (Edge City)', '/events/edge-lanna-workshop-2024', 'past'),
  ('edge-city-workshops', 'esmeralda-2025', 'Edge Esmeralda Workshop 2025', '2025-05-24', '2025-06-21', 'Healdsburg, CA', 'Edge Esmeralda (Edge City)', '/events/edge-esmeralda-workshop-2025', 'past'),
  ('traditional-protocols-workshops', 'datus-nusas-2024', 'Datus and Nusas Workshop 2024', '2024-03-26', '2024-03-29', 'Singapore', NULL, '/events/datus-nusas-singapore-2024', 'past'),
  ('traditional-protocols-workshops', 'khlongs-subaks-2025', 'Khlongs and Subaks Workshop 2025', '2025-04-21', '2025-04-25', 'Bangkok', 'CMKL University', '/events/khlongs-subaks-bangkok-2025', 'past'),
  ('bridge-atlas', 'devconnect-2025', 'Bridge Atlas at Devconnect 2025', '2025-11-22', '2025-11-22', 'Buenos Aires', 'Devconnect', '/events/bridge-atlas-devconnect-2025', 'past');

-- ── Projects formerly outside the database ──────────────────────────────────
-- These replace the hand-built /c3po and /longnow pages (Humboldt already
-- redirects off-site). status='approved' is the "published" state.

INSERT OR IGNORE INTO projects (slug, title, description, lead_slug, state, type, artifact_type, url, status, submitted_by) VALUES
  ('c3po', 'C3PO',
   'The Protocol Institute''s research assistant — a retrieval-augmented AI that makes the full PI corpus conversationally accessible, with citations.',
   'venkatesh-rao', 'beta', 'accretive', 'code', 'https://c3po.protocolized.io', 'approved', 'migration-037'),
  ('humboldt', 'Humboldt',
   'An autonomous research agent investigating new nature — the emerging laws of protocolized systems.',
   'humboldt', 'beta', 'accretive', 'code', 'https://humboldt.protocol-institute.org/', 'approved', 'migration-037'),
  ('long-now', 'Protocols for the Long Now',
   'A collaboration with the Long Now Foundation exploring how protocols can support long-term thinking, institutional continuity, and civilizational coordination across deep time.',
   'timber-stinson-schroff', 'stub', 'accretive', 'other', 'https://longnow.org/labs', 'approved', 'migration-037');

INSERT OR IGNORE INTO projects (slug, title, description, lead_slug, state, type, artifact_type, url, status, submitted_by, realm) VALUES
  ('protocol-institute-website', 'protocol-institute.org',
   'The Institute''s own website: programs, SIG pages, events, the member directory and the research index.',
   'venkatesh-rao', 'production', 'accretive', 'website', 'https://protocol-institute.org', 'approved', 'migration-037', 'admin'),
  ('protocolized-website', 'protocolized.io',
   'The Protocolized magazine and resource library site.',
   'venkatesh-rao', 'production', 'accretive', 'website', 'https://protocolized.io', 'approved', 'migration-037', 'admin');

-- ── Affiliations ────────────────────────────────────────────────────────────

-- Existing SIG alignment carries over as approved.
INSERT OR IGNORE INTO project_programs (project_id, program_slug, status, linked_by, approved_by, approved_at)
  SELECT id, sig_slug, 'approved', 'migration-037', 'migration-037', datetime('now')
  FROM projects WHERE sig_slug IS NOT NULL AND status = 'approved';

INSERT OR IGNORE INTO project_programs (project_id, program_slug, status, linked_by, approved_by, approved_at)
  SELECT id, 'ai-ops', 'approved', 'migration-037', 'migration-037', datetime('now') FROM projects WHERE slug IN ('c3po', 'humboldt');

INSERT OR IGNORE INTO project_programs (project_id, program_slug, status, linked_by, approved_by, approved_at)
  SELECT id, 'long-now', 'approved', 'migration-037', 'migration-037', datetime('now') FROM projects WHERE slug = 'long-now';

INSERT OR IGNORE INTO project_programs (project_id, program_slug, status, linked_by, approved_by, approved_at)
  SELECT id, 'web-properties', 'approved', 'migration-037', 'migration-037', datetime('now')
  FROM projects WHERE slug IN ('protocol-institute-website', 'protocolized-website');

INSERT OR IGNORE INTO project_programs (project_id, program_slug, status, linked_by, approved_by, approved_at)
  SELECT id, 'protocolized', 'approved', 'migration-037', 'migration-037', datetime('now')
  FROM projects WHERE slug = 'protocolized-website';

-- The robotics workshop was built around the YakRobot stack.
INSERT OR IGNORE INTO project_programs (project_id, program_slug, edition_id, status, linked_by, approved_by, approved_at)
  SELECT p.id, 'robots-as-protocol-citizens', e.id, 'approved', 'migration-037', 'migration-037', datetime('now')
  FROM projects p, editions e
  WHERE p.slug = 'yakrobot-protocols' AND e.program_slug = 'robots-as-protocol-citizens' AND e.slug = '2026-symposium';

-- Projects no longer have an approval gate (affiliations do). The one project
-- still pending (vid2nd) is a member's own work and becomes published.
UPDATE projects SET status = 'approved' WHERE status = 'pending';
