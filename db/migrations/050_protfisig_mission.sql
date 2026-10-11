-- 050: ProtFiSIG's revised mission (Session 57, 2026-10-10).
--
-- With the fiction itself now published by Monstrous Times (spun out of
-- Protocolized, migration 049), the Protocol Fiction research group's mission
-- becomes the theory and concepts of protocol fiction and its use as a research
-- methodology for futurism — aligning it with its 2027 roadmap project,
-- Protocol Futurism (migration 045). Rewrites the blurb and the About page
-- (both host-editable afterwards at /programs/edit?slug=protfisig) and adds
-- Monstrous Times as a related link. Byline and meetings are unchanged. The
-- About text has no leading "# Protocol Fiction": the page template already
-- prints that heading, and the old placeholder showed it twice.

UPDATE programs
   SET description = 'Studies the theory and concepts of protocol fiction, and its application as a research methodology for futurism.'
 WHERE slug = 'protfisig';

INSERT INTO program_links (program_slug, kind, label, url, note, sort_order)
SELECT 'protfisig', 'link', 'Monstrous Times', 'https://monstroustimes.com',
       'The Magazine of Strange Rules — the protocol fiction magazine spun out of Protocolized', 0
WHERE NOT EXISTS (SELECT 1 FROM program_links WHERE program_slug = 'protfisig' AND url = 'https://monstroustimes.com');

UPDATE managed_pages
   SET content_md = 'The Protocol Fiction research group studies the theory and concepts of protocol fiction, and its application as a research methodology for futurism.

Protocol fiction is fiction about agents, humanoid and otherwise, living in strange rules environments, where the protocols that structure a world matter as much as the characters moving through it. Since its pilot session in October 2025, the group has helped develop the genre through readings, writing exercises and live workshops, much of it first published in [Protocolized](https://protocolized.io).

## From genre to method

The fiction itself is now published independently by [Monstrous Times](https://monstroustimes.com), "The Magazine of Strange Rules", which was spun out of Protocolized. The group''s focus is the theory and practice behind the genre: what makes protocol fiction work, and how it can serve as a futures technology, a way to imagine and stress-test the protocol infrastructures that scaffold possible futures.

This is the basis of the group''s 2027 project, [Protocol Futurism](/projects/project?slug=protocol-futurism): systematizing protocol futurism methodologies and validating them through live workshops into a codified set of techniques that foresight practitioners can use for serious planning and strategy. See the [Research Roadmap 2027](/programs/research-roadmap/2027).
',
       updated_at = datetime('now'), updated_by = 'migration-050'
 WHERE page_key = 'sigs/protfisig/about';
