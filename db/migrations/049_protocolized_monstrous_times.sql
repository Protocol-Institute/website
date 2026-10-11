-- 049: Protocolized's fiction spun out as Monstrous Times (Session 57, 2026-10-10).
--
-- Monstrous Times (monstroustimes.com, "The Magazine of Strange Rules", editor in
-- chief Sachin Benny) carries on the protocol fiction that Protocolized published.
-- It is listed as a partner organization on /network (static HTML, no D1 row);
-- here only Protocolized's program blurb gains the spin-out sentence.
--
-- Also fixes a leftover from the Research Groups rename (migration 046): the
-- research area's description still said "Special interest groups".

UPDATE programs
   SET description = 'The Institute''s publishing arm — essays, talks, books and a curated archive of protocol research. Its protocol fiction has been spun out as an independent magazine, [Monstrous Times](https://monstroustimes.com).'
 WHERE slug = 'protocolized';

UPDATE areas
   SET description = 'Research groups and the open research index.'
 WHERE slug = 'research' AND description = 'Special interest groups and the open research index.';
