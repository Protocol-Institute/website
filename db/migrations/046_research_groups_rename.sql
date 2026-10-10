-- 046: Special Interest Groups renamed Research Groups (Session 57, 2026-10-10).
--
-- The class name changes; individual groups keep their names (SIGFPT, SIGPSY's
-- "Special Interest Group in Psychohistory", "Protocols for Business SIG" in a
-- member's own text). Pages moved from /sigs/ to /research-groups/, with 301s
-- in _redirects. Internal identifiers keep "sig": programs.kind = 'sig', slugs,
-- managed_pages keys sigs/<slug>/about, the tag_sig member tag, and the
-- calendar feeds at /calendar/sigs/*.ics.
--
-- Apply AFTER the deploy that moves the pages — before it, these page_urls
-- point at paths that don't exist yet.

UPDATE programs SET page_url = '/research-groups/' || slug
 WHERE kind = 'sig' AND page_url = '/sigs/' || slug;

UPDATE projects SET url = replace(url, 'protocol-institute.org/sigs/', 'protocol-institute.org/research-groups/')
 WHERE url LIKE 'https://protocol-institute.org/sigs/%';

UPDATE programs SET description = replace(description, 'The Intelligence Media SIG explores', 'The Intelligence Media Research Group explores')
 WHERE slug = 'intelligence-media';

UPDATE projects SET description = replace(description, 'programs, SIG pages, events', 'programs, research group pages, events')
 WHERE slug = 'protocol-institute-website';
