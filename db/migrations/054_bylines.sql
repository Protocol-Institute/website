-- 054: Bylines (Session 57, 2026-10-10).
--
-- DRG's byline wrote "Anuraj R." while his member name is "Anuraj R"; the
-- byline auto-linker (PI.linkPeople) matches member names, so the period sat
-- outside the link. Dropped for consistency.
--
-- PiBoWriMo and the Research Roadmap had hosts (migrations 044, 045) but no
-- byline, so their pages didn't say who runs them. Their own pages now render
-- programs.byline with the hosts linked, as group pages do.

UPDATE programs SET byline = replace(byline, 'Anuraj R. and', 'Anuraj R and')
 WHERE slug = 'drg' AND byline LIKE 'Led by Anuraj R. and%';

UPDATE programs SET byline = 'Hosted by Timber Stinson-Schroff and Venkatesh Rao'
 WHERE slug = 'pibowrimo' AND byline IS NULL;

UPDATE programs SET byline = 'Hosted by Venkatesh Rao'
 WHERE slug = 'research-roadmap' AND byline IS NULL;
