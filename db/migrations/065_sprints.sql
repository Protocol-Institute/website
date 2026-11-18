-- 065: Sprints, and the Blygger hackathon as the first one on the shared tables (2026-11-05).
--
-- A sprint is a dated edition of a program whose tagged projects are ranked by a daily figure.
-- See programs/SPRINTS-PLAN.md. PiBoWriMo is the other instance; it keeps its own tables until its
-- month is over, then moves here. editions is an FK parent, which D1 can't rebuild, so sprint
-- settings are a table of their own.

CREATE TABLE IF NOT EXISTS edition_sprints (
  edition_id   INTEGER PRIMARY KEY REFERENCES editions(id),
  metric       TEXT NOT NULL,   -- 'github_commits'; 'self_words' when PiBoWriMo moves over
  unit         TEXT NOT NULL,
  strong_at    INTEGER NOT NULL,
  timezone     TEXT NOT NULL,   -- day boundaries for figures the server computes
  starts_at    TEXT NOT NULL,   -- exact instants, ISO UTC; the edition's dates name the strip's days
  ends_at      TEXT NOT NULL,
  add_deadline TEXT,
  excluded_owners TEXT          -- comma-separated GitHub owners whose repos can't be declared
);

-- One row per project per day. A github_commits sync replaces a project's rows wholesale.
CREATE TABLE IF NOT EXISTS sprint_progress (
  edition_id INTEGER NOT NULL REFERENCES editions(id),
  project_id INTEGER NOT NULL REFERENCES projects(id),
  entry_date TEXT NOT NULL,
  value      INTEGER NOT NULL,
  source     TEXT NOT NULL,
  ai_use     TEXT,
  logged_by  TEXT,
  updated_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (edition_id, project_id, entry_date)
);

CREATE TABLE IF NOT EXISTS sprint_repo_sync (
  edition_id INTEGER NOT NULL REFERENCES editions(id),
  project_id INTEGER NOT NULL REFERENCES projects(id),
  repo       TEXT,              -- owner/name as parsed from projects.url
  branch     TEXT,              -- from a /tree/<branch> URL; NULL = the default branch
  state      TEXT NOT NULL,     -- 'ok' | 'unreadable'
  etag       TEXT,
  synced_at  TEXT,
  PRIMARY KEY (edition_id, project_id)
);

INSERT OR IGNORE INTO programs (slug, kind, title, description, byline, page_url, status, affiliation_policy, sort_order, accepts_tags)
VALUES ('blygger-hackathon', 'workshop', 'Blygger Hackathon',
  'A week of asynchronous hacking on the Blygger protocol: clients, mods, integrations, applications and proposed changes to the spec.',
  'Hosted by Venkatesh Rao', '/events/blygger-hackathon-2026', 'active', 'open', 0, 1);

INSERT OR IGNORE INTO program_areas (program_slug, area_slug, is_primary) VALUES ('blygger-hackathon', 'events', 1);
INSERT OR IGNORE INTO program_hosts (program_slug, member_slug) VALUES ('blygger-hackathon', 'venkatesh-rao');

INSERT OR IGNORE INTO editions (program_slug, slug, title, start_date, end_date, location, page_url, status)
VALUES ('blygger-hackathon', '2026-11', 'Blygger Hackathon 2026', '2026-11-20', '2026-11-27', 'Online',
  '/events/blygger-hackathon-2026', 'planned');

-- Kickoff is 9am Pacific on Nov 20; the window closes at the end of Nov 27 Pacific. The blygger
-- org's repos are the shared upstreams: participants work from their own repos or forks.
INSERT OR IGNORE INTO edition_sprints (edition_id, metric, unit, strong_at, timezone, starts_at, ends_at, excluded_owners)
SELECT id, 'github_commits', 'commits', 10, 'America/Los_Angeles', '2026-11-20T17:00:00Z', '2026-11-28T08:00:00Z', 'blygger'
FROM editions WHERE program_slug = 'blygger-hackathon' AND slug = '2026-11';

INSERT OR IGNORE INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) VALUES (
  'programs/blygger-hackathon/about', 'Blygger Hackathon',
  'The [Blygger protocol](https://blygger.org) has been developing since its launch in September, with more than 30 active blygs and a dozen developers building clients, mods and integrations and contributing to the protocol itself. This hackathon is its developer launch.

We begin with an hour-long introductory session on Zoom at 17:00 UTC (9am Pacific) on Friday, November 20, followed by a week of asynchronous hacking on the Protocol Institute Discord, with members of the Blygger community on hand to help.

You could contribute to an existing project, build an extension, a domain-specific application or an entire new client, or propose changes to the spec. No coding experience is necessary: good design instincts and enough technical literacy to direct a coding agent will do.',
  datetime('now'), 'migration-065', 1);

-- A qualifying event on /members/join, approved immediately, as tag_pibowrimo is (migration 061).
ALTER TABLE members ADD COLUMN tag_blygger_hackathon INTEGER DEFAULT 0;
ALTER TABLE membership_requests ADD COLUMN tag_blygger_hackathon INTEGER DEFAULT 0;
