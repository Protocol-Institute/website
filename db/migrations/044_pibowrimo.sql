-- 044: Book Writing Month becomes PiBoWriMo (Session 56).
--
-- PiBoWriMo — Protocol Institute Book Writing Month — is a *workshop* program
-- (a repeatable format; its dated runs display as "Runs"), not an event: it
-- always runs stand-alone, likely every November, never as part of another
-- event. November 2026 is its first run. Open tagging stays: members tag their
-- own book projects; a host or admin can remove a tag, and since this session
-- a removed tag stays removed until an admin restores it (syncAffiliations).
--
-- The slug changes too (book-writing-month -> pibowrimo). D1 foreign keys have
-- no ON UPDATE CASCADE, so: insert the new program, repoint every child row,
-- delete the old one. Nothing was tagged to the old program when this was
-- written; the project_programs UPDATE is there in case that changes first.
-- Hosts: Venkatesh Rao and Timber Stinson-Schroff.

INSERT INTO programs (slug, kind, title, short_title, description, byline, page_url, status, affiliation_policy, sort_order)
SELECT 'pibowrimo', 'workshop', 'PiBoWriMo', NULL,
       'Protocol Institute Book Writing Month — a month-long, mostly asynchronous push for members writing protocol-themed books, inspired by the old NaNoWriMo.',
       NULL, '/events/pibowrimo-2026', status, 'open', sort_order
FROM programs WHERE slug = 'book-writing-month';

UPDATE program_areas    SET program_slug = 'pibowrimo' WHERE program_slug = 'book-writing-month';
UPDATE program_hosts    SET program_slug = 'pibowrimo' WHERE program_slug = 'book-writing-month';
UPDATE program_links    SET program_slug = 'pibowrimo' WHERE program_slug = 'book-writing-month';
UPDATE project_programs SET program_slug = 'pibowrimo' WHERE program_slug = 'book-writing-month';
UPDATE editions
   SET program_slug = 'pibowrimo', title = 'PiBoWriMo 2026', page_url = '/events/pibowrimo-2026'
 WHERE program_slug = 'book-writing-month';

DELETE FROM programs WHERE slug = 'book-writing-month';

INSERT OR IGNORE INTO program_hosts (program_slug, member_slug) VALUES
  ('pibowrimo', 'venkatesh-rao'),
  ('pibowrimo', 'timber-stinson-schroff');

-- The landing page's body copy moves into D1 so the hosts can edit it from
-- /programs/edit?slug=pibowrimo#about (it was hand-written HTML). The page
-- keeps the same copy as a fallback for when the fetch fails.
INSERT OR IGNORE INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) VALUES (
  'programs/pibowrimo/about', 'PiBoWriMo',
  'In November 2026, the Protocol Institute will host its first book-writing month, inspired by the old NaNoWriMo. This will be a mostly asynchronous event on our Discord, with just enough structure to keep you motivated and moving.

If you have a protocol-themed book project underway, or just an idea for one, join us. Sign in, list some details of your book project, and tag it as part of PiBoWriMo. It will show up in the index below.

We will have coworking sessions, peer mentorship, and mutual accountability mechanisms. Details forthcoming.',
  datetime('now'), 'migration-044', 1);
