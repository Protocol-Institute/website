-- 042: C3PO is now PIBot (2026-10-07). Display name and address only; the project
-- slug stays 'c3po' so /c3po, /projects/project?slug=c3po and existing tags keep working.
-- (041 is reserved for the schema cleanup mentioned in 040.) Idempotent. Not applied
-- to the live D1 by the PR: run it with the usual migration command after merge.
UPDATE projects
   SET title = 'PIBot',
       url   = 'https://pibot.protocolized.io'
 WHERE slug = 'c3po';
