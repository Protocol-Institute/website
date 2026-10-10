-- 045: Research Roadmap 2027 (Session 57, 2026-10-10). Phase 4 of programs/PLAN.md.
--
-- The roadmap is an initiative (an indefinitely extended program) whose
-- editions are years. PLAN.md proposed a new kind 'roadmap'; dropped because
-- widening the programs.kind CHECK means rebuilding a table five others
-- reference, which D1 rejected (first attempt rolled back on prod), and nothing
-- needs the distinction yet.
-- Inclusion is moderated: a member who tags a project to it waits for a roadmap
-- host (Venkatesh Rao) or an admin. The prospectus page,
-- /programs/research-roadmap/2027, lists the edition's approved projects grouped
-- by each project's SIG tag; its introduction is the program's About page
-- (managed_pages programs/research-roadmap/about), editable at
-- /programs/edit?slug=research-roadmap#about.
--
-- Seed data is the "Protocol Institute 2027 Research Prospectus" Google Doc as
-- of 2026-10-10. Seven projects are new stubs, each led by its first-named PI
-- (co-PIs join the team, approved), tagged to its SIG and to Roadmap 2027. The
-- descriptions are the doc's abstracts verbatim bar two typos, as starting
-- points for the leads to edit; the prospectus shows a description's first
-- paragraph and the project page shows all of it, so a lead extends the project
-- page by adding paragraphs below the abstract. The url column is required, so
-- each stub points at its SIG's page until it has an artifact of its own.
--
-- Cognitive Ergonomics (id 8) already existed. It moves from MRG to SIGPfB, and
-- its one-line description gets the 2027 abstract in front of it.
--
-- project_programs is keyed (project_id, program_slug), so a project is in at
-- most one roadmap year — accepted for now.
--
-- Open calls from PLAN.md, resolved: no per-inclusion note column (the first
-- paragraph serves as the abstract); no money in D1; order is SIG sort_order
-- then title.

-- ── The roadmap program and its 2027 edition ───────────────────────────────

INSERT OR IGNORE INTO programs (slug, kind, title, short_title, description, byline, page_url, status, affiliation_policy, sort_order)
VALUES ('research-roadmap', 'initiative', 'Research Roadmap', NULL,
        'The Institute''s yearly prospectus of research projects proposed by its research groups, for funders and partners.',
        NULL, '/programs/research-roadmap/2027', 'active', 'moderated', 9);

INSERT OR IGNORE INTO program_areas (program_slug, area_slug, is_primary)
  SELECT 'research-roadmap', slug, 1 FROM areas WHERE slug = 'research';

INSERT OR IGNORE INTO program_hosts (program_slug, member_slug)
  SELECT 'research-roadmap', slug FROM members WHERE slug = 'venkatesh-rao';

INSERT OR IGNORE INTO editions (program_slug, slug, title, start_date, end_date, page_url, status)
VALUES ('research-roadmap', '2027', 'Research Roadmap 2027', '2027-01-01', '2027-12-31',
        '/programs/research-roadmap/2027', 'planned');

INSERT OR IGNORE INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) VALUES (
  'programs/research-roadmap/about', 'Research Roadmap',
  'Protocol Institute operates as a set of focused, renewably chartered research groups that develop capabilities and expertise related to specific protocol themes. These groups also undertake time-bound research projects with specific goals. New groups are chartered as researchers in our network step up to lead them, on emerging salient themes.

Currently, PI features 7 research groups, and each has developed 1-2 well-defined 2027 projects, which together constitute this prospectus. These project definitions will evolve through Q4 2026 before getting finalized and formally chartered in early 2027, with goals and scopes based on funding levels.

In 2027, our projects have a shared focus on how AI and protocols are transforming each other. Our thesis is that they are coming to constitute the entangled soft and hard parts of all digital infrastructures, old and new, creating a post-industrial planetarity we refer to as New Nature.

We are currently seeking funding for these projects, to the tune of $50k–$150k each, for FY 2027. If you''re interested in funding one or more of these projects, please reach out to Venkatesh Rao, [venkat@protocol-institute.org](mailto:venkat@protocol-institute.org), Director of Research, to set up a conversation. You can also reach out to the principal investigators of specific projects directly.

Beyond this prospectus, PI also has the ability to rapidly incubate and charter new research groups to study new themes of interest, by tapping our extensive network of researchers and partner organizations. If you''d like us to undertake a protocol-themed 2027 project, please reach out. You can get a sense of our capabilities by browsing our [research archives](/research).',
  datetime('now'), 'migration-045', 1);

-- ── New projects ───────────────────────────────────────────────────────────

INSERT OR IGNORE INTO projects (slug, title, description, lead_slug, state, type, artifact_type, url, status, submitted_by) VALUES
  ('stigmergic-ai-safety', 'Stigmergic AI Safety',
   'AI computing, unlike traditional computing, has the unusual property of being stateless, relying on externalized memory architectures (ranging from simple markdown files to recursive context hierarchies) to drive inference processes. Stigmergy, the science of insect coordination through externalized memory (such as pheromones and built environment geometry), is a powerful lens for studying and designing such systems. The Protocol Institute has been studying stigmergic systems since March 2026. In 2027, we plan to study AI safety through a stigmergic lens, based on an agenda developed at a workshop in September 2026.',
   'patricktnast', 'stub', 'one-off', 'text', 'https://protocol-institute.org/sigs/sigfpt', 'approved', 'migration-045'),
  ('prophecy-protocols', 'Prophecy Protocols',
   'Isaac Asimov''s idea of psychohistory increasingly seems like it need not remain science fictional. By combining AI analysis of vast corpuses of qualitative historical data, and synthesis and composition technologies from prediction markets, it may soon be possible to usefully go beyond predictions and forecasts to prophecy – the art and science of anticipating specific consequential events (such as revolutions or pandemics) at the level of futures narratives. For the past year, PI has been studying the problem of constructing such oracles, using AI infrastructure to ingest both narrative and empirical historical data. In 2027, we plan to develop and begin testing true prophecy protocols (inspired loosely by the "Seldon vault" plot device in Asimov''s stories).',
   'aneesh-sathe', 'stub', 'one-off', 'text', 'https://protocol-institute.org/sigs/sigpsy', 'approved', 'migration-045'),
  ('decentralized-robot-markets', 'Decentralized Robot Markets',
   'Robotics is progressing rapidly thanks to advances in both AI technologies and advanced actuators and power technologies. But much of the progress has been around vertically integrated and closed-source platforms, and powered by monolithic business models. Existing open-source/open-hardware efforts are focused on the level of individual robots. The vast potential of open robotics protocols, especially onchain protocols, for creating markets of teleoperable robots with verifiable capabilities, auditable performance, and frictionless transactional affordances has largely remained unexplored. Since June 2026, PI has been home to the 3-year-old YakRobot protocols project, one of the few projects aiming to address this gap. In 2027, we aim to incubate a focused effort to develop and deploy foundations for decentralized robot markets.',
   'anuraj-rp', 'stub', 'one-off', 'text', 'https://protocol-institute.org/sigs/drg', 'approved', 'migration-045'),
  ('organizational-memory-architecture', 'Organizational Memory Architecture',
   'It is becoming increasingly clear that memory, rather than processing, is the essence of AI as a technology, and at the heart of its transformative power. It is now possible for organizations to create and maintain powerful, near-eidetic organizational memories, completely transforming organizational capabilities. Memory protocols have been one of the oldest and strongest of our research initiatives, since 2023, and we have developed a deep expertise around thinking about AI and its impact in memory-first ways. In 2027, we aim to research, field-test, and develop playbooks for a memory-first approach to designing or redesigning organizations.',
   'kei', 'stub', 'one-off', 'text', 'https://protocol-institute.org/sigs/mrg', 'approved', 'migration-045'),
  ('ai-native-data-operations', 'AI Native Data Operations',
   'The problem of effective AI adoption has received intense and widespread attention in the last year, especially since the advent of robust agentic coding capabilities. Hundreds of reports, adoption models, and case studies are now available, to the point of constituting a second-order problem of filtering the glut of ideas and evidence for the ones that both fit the needs of a specific organization and are grounded in a systematic and elegant operating philosophy. For the past year, PI has been developing a unique approach to the problem focused on data operations protocols as the key locus of leverage. We have developed a capability maturity model backed by case studies and evidence, and tested our models on two pilot consulting engagements (in the water utility and construction industries). In 2027, we aim to take this work to the next level by rigorously systematizing our models and playbooks, and field-testing them in several more domains. For this project, we are looking for both research sponsors and partners in specific domains interested in applying our methods through consulting engagements. We aim to develop and publish validated methodologies and a set of case studies in open-source forms.',
   'rafael-fernandez', 'stub', 'one-off', 'text', 'https://protocol-institute.org/sigs/sigpfb', 'approved', 'migration-045'),
  ('personhood-transformations', 'Personhood Transformations',
   'Our newest research theme focuses on the protocols that shape how personhood is constructed, in relation to technologies. AI is emerging as one of the most radical ruptures in personhood construction in history, as we''re being forced to contemplate the personhood of artificial beings, and reconsider prevailing notions of our own personhood. In 2027, we will be systematically studying how AI is transforming the construction and performance of personhood.',
   'sarah-anne-friend', 'stub', 'one-off', 'text', 'https://protocol-institute.org/sigs/prg', 'approved', 'migration-045'),
  ('protocol-futurism', 'Protocol Futurism',
   'Over the last two years, through our incubation of the emerging genre of protocol fiction in our magazine Protocolized (which has resulted in several anthologies), as well as multiple live workshops and simulations, we have developed a deep capability in using fiction as a research instrument to imagine and explore futures through the lens of the protocol infrastructures that scaffold them. In 2027, the main part of this activity will be spun out in the form of a new protocol fiction magazine, Monstrous Times. An associated research workstream, focused on the use of protocol fiction as a futures technology, will continue under the aegis of the Protocol Institute. In 2027, as part of this workstream, we plan to systematize and further validate (through multiple live workshops) our protocol futurism methodologies into a codified set of techniques that can be used by foresight practitioners to address serious planning and strategy needs.',
   'sachin-benny', 'stub', 'one-off', 'text', 'https://protocol-institute.org/sigs/protfisig', 'approved', 'migration-045');

-- Co-PIs.
INSERT OR IGNORE INTO project_team (project_id, member_slug, status, approved_at, approved_by)
  SELECT id, 'venkatesh-rao', 'approved', datetime('now'), 'migration-045' FROM projects WHERE slug IN ('stigmergic-ai-safety', 'prophecy-protocols');
INSERT OR IGNORE INTO project_team (project_id, member_slug, status, approved_at, approved_by)
  SELECT id, 'rafael-fernandez', 'approved', datetime('now'), 'migration-045' FROM projects WHERE slug = 'decentralized-robot-markets';

-- ── Cognitive Ergonomics: MRG -> SIGPfB, 2027 abstract added ───────────────

DELETE FROM project_programs WHERE project_id = (SELECT id FROM projects WHERE slug = 'cognitive-ergonomics') AND program_slug = 'mrg';

UPDATE projects SET
  description = 'The AI sector has so far focused primarily on risks relating to security incidents. But a major and growing class of risks relates to the mental health of human users of AI. Folk wisdom has already documented a large inventory of usage pathologies ranging from executive function fatigue from the continuous strain of supervising agents, to conditions that have acquired colorful colloquial names such as "AI vampirism" and "AI psychosis." There is a need for an effort to systematically inventory these phenomena and discover and document successful mitigation protocols being improvised by real AI users on the frontlines. In 2027, we aim to bring our established expertise around workplace safety and health protocols to the problem of cognitive ergonomics, with the goal of developing a set of best practices for organizations in the form of a DSM-style database of healthy and unhealthy AI use behaviors.

' || description,
  updated_at = datetime('now')
WHERE slug = 'cognitive-ergonomics' AND description NOT LIKE 'The AI sector has so far%';

-- ── Tags: each project to its SIG and to Roadmap 2027 ──────────────────────

-- (A CASE, not a UNION ALL table: D1 caps the terms in a compound SELECT.)
INSERT OR IGNORE INTO project_programs (project_id, program_slug, edition_id, status, linked_by, approved_by, approved_at)
  SELECT id, sig, NULL, 'approved', 'migration-045', 'migration-045', datetime('now')
  FROM (SELECT id, CASE slug
          WHEN 'stigmergic-ai-safety'               THEN 'sigfpt'
          WHEN 'cognitive-ergonomics'               THEN 'sigpfb'
          WHEN 'prophecy-protocols'                 THEN 'sigpsy'
          WHEN 'decentralized-robot-markets'        THEN 'drg'
          WHEN 'organizational-memory-architecture' THEN 'mrg'
          WHEN 'ai-native-data-operations'          THEN 'sigpfb'
          WHEN 'personhood-transformations'         THEN 'prg'
          WHEN 'protocol-futurism'                  THEN 'protfisig'
        END AS sig
        FROM projects)
  WHERE sig IS NOT NULL;

INSERT OR IGNORE INTO project_programs (project_id, program_slug, edition_id, status, linked_by, approved_by, approved_at)
  SELECT p.id, 'research-roadmap', e.id, 'approved', 'migration-045', 'migration-045', datetime('now')
  FROM projects p
  JOIN editions e ON e.program_slug = 'research-roadmap' AND e.slug = '2027'
  WHERE p.slug IN ('stigmergic-ai-safety', 'cognitive-ergonomics', 'prophecy-protocols', 'decentralized-robot-markets',
                   'organizational-memory-architecture', 'ai-native-data-operations', 'personhood-transformations',
                   'protocol-futurism');
