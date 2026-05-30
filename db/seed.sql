-- Seed data for the pi-members D1 database
-- Apply with: wrangler d1 execute pi-members --remote --file=db/seed.sql

INSERT OR IGNORE INTO members
  (email, slug, name, bio, website, type, photo_r2_key,
   is_team, is_consultant, team_title,
   consulting_expertise, consulting_contact,
   owner_email)
VALUES
  ('timber@protocol-institute.org', 'timber-stinson-schroff',
   'Timber Stinson-Schroff',
   'Timber Stinson-Schroff is the Managing Director of the Protocol Institute, and the Editor-in-Chief of Protocolized magazine. His primary focus areas are safety protocols and the application of protocol thinking to businesses. He is based in Whitehorse, Yukon.',
   'https://protocolized.io', 'human', 'beings/timber.jpg',
   1, 1, 'Managing Director',
   'Safety protocols · Business protocolization · Editorial consulting · Operations',
   'timber@protocol-institute.org',
   NULL),

  ('venkat@protocol-institute.org', 'venkatesh-rao',
   'Venkatesh Rao',
   'Venkatesh Rao is the Director of Research of the Protocol Institute, and a Contributing Editor of Protocolized Magazine. His primary focus areas are formal protocol theory and the application of protocol theory to robotics. He is based in Seattle, WA.',
   'https://venkateshrao.com', 'human', 'beings/venkat.jpg',
   1, 1, 'Director of Research',
   'Protocol theory · Organizational dynamics · Strategy · Technical writing · Robotics applications',
   'venkat@protocol-institute.org',
   NULL),

  ('james@protocol-institute.org', 'james-langdon',
   'James Langdon',
   'James Langdon is the Executive Editor of Protocolized magazine. His primary focus areas are path dependency and the entrenching of anachronistic protocols in computerised graphic design and typography. He is based in Herefordshire, UK.',
   NULL, 'human', 'beings/jameslandgon.jpg',
   1, 0, 'Executive Editor, Protocolized',
   NULL, NULL, NULL),

  ('hi@timbeiko.com', 'tim-beiko',
   'Tim Beiko',
   'Tim Beiko is an Ethereum researcher, and the chair of the advisory board for the Protocol Institute.',
   NULL, 'human', 'beings/timbeiko.jpeg',
   1, 0, 'Chair, Advisory Board',
   NULL, NULL, NULL),

  ('rafaeldf2@gmail.com', 'rafael-fernandez',
   'Rafael Fernandez',
   'Rafael Fernandez is a protocol researcher and practitioner with expertise spanning governance, blockchain systems, and AI enablement.',
   'https://rafael.fyi', 'human', 'beings/rafaellfernandez.png',
   0, 1, NULL,
   'Protocol governance · Blockchains · Token economics · Marketplaces · Swarm intelligence · Robotics · AI enablement',
   'https://rafael.fyi',
   NULL),

  ('sachben91@gmail.com', 'sachin-benny',
   'Sachin Benny',
   NULL,
   NULL, 'human', NULL,
   0, 1, NULL,
   'AI adoption models · Infrastructure ethnography',
   NULL, NULL),

  -- AI members (Venkat owns both via owner_email for admin editing)
  ('c3po@protocol-institute.org', 'c3po',
   'C3PO',
   'C3PO is the Protocol Institute''s conversational research assistant, trained on the full PI corpus — spanning papers, essays, talks, Discord discussions, SIG meetings, and Protocolized magazine content. Available as an MCP server for integration with Claude Code and Claude Desktop.',
   '/c3po', 'ai', 'logo-static.png',
   1, 0, 'Corpus Orchestrator',
   NULL, NULL,
   'venkat@protocol-institute.org'),

  ('humboldt@protocol-institute.org', 'humboldt',
   'Humboldt',
   'Humboldt is the Protocol Institute''s autonomous research agent, investigating New Nature — structural laws of protocolized and artificial systems that recur across domains. Publishes field notes in a public lab notebook.',
   '/humboldt', 'ai', 'logo-static.png',
   1, 0, 'Artificial Researcher',
   NULL, NULL,
   'venkat@protocol-institute.org');
