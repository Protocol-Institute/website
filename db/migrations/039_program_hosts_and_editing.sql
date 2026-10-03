-- Migration 039: hosts edit their programs; research-realm tagging is free.
--
-- 1. programs.byline — the "Led by … — schedule" line on a SIG page, now
--    host-editable and rendered from D1 (was hand-written HTML). Seeded from
--    the lines on the SIG pages as of Session 54.
-- 2. program_hosts becomes the single source of host authority, replacing
--    members.is_sig_host / sig_host_slugs (unused in production — no member had
--    them set). Seeded with each SIG's listed leads, all of whom are members.
-- 3. Research-realm programs become affiliation_policy = 'open': any member may
--    tag any research program and the tag applies at once; a host can remove it
--    afterwards. Admin-realm programs stay 'moderated'.

ALTER TABLE programs ADD COLUMN byline TEXT;

UPDATE programs SET byline = 'Led by Venkatesh Rao and Patrick Nast — Biweekly Fridays, 10am Pacific' WHERE slug = 'sigfpt';
UPDATE programs SET byline = 'Led by Kei Kreutler — Biweekly Thursdays, 7:30am Pacific'             WHERE slug = 'mrg';
UPDATE programs SET byline = 'Led by Rafael Fernandez — Biweekly Mondays, 8am Pacific'              WHERE slug = 'sigpfb';
UPDATE programs SET byline = 'Led by Spencer Nitkey and Sachin Benny — Biweekly Thursdays, 8am Pacific' WHERE slug = 'protfisig';
UPDATE programs SET byline = 'Led by Anuraj R. and Rafael Fernandez — Biweekly Thursdays, 4:30pm UTC' WHERE slug = 'drg';
UPDATE programs SET byline = 'Led by Venkatesh Rao and Aneesh Sathe — Biweekly Thursdays, 4pm UTC'  WHERE slug = 'sigpsy';
UPDATE programs SET byline = 'Led by Sarah Friend'                                                   WHERE slug = 'prg';

INSERT OR IGNORE INTO program_hosts (program_slug, member_slug) VALUES
  ('sigfpt', 'venkatesh-rao'), ('sigfpt', 'patricktnast'),
  ('mrg', 'kei'),
  ('sigpfb', 'rafael-fernandez'),
  ('protfisig', 'spencernitkeywriting'), ('protfisig', 'sachin-benny'),
  ('drg', 'anuraj-rp'), ('drg', 'rafael-fernandez'),
  ('sigpsy', 'venkatesh-rao'), ('sigpsy', 'aneesh-sathe'),
  ('prg', 'sarah-anne-friend');

-- Carry over any legacy SIG-host grants (none in production at time of writing).
INSERT OR IGNORE INTO program_hosts (program_slug, member_slug)
  SELECT j.value, m.slug FROM members m, json_each(m.sig_host_slugs) j
  WHERE m.is_sig_host = 1 AND m.sig_host_slugs IS NOT NULL AND json_valid(m.sig_host_slugs)
    AND j.value IN (SELECT slug FROM programs);

UPDATE programs SET affiliation_policy = 'open'
  WHERE slug IN (
    SELECT pa.program_slug FROM program_areas pa JOIN areas a ON a.slug = pa.area_slug
    WHERE pa.is_primary = 1 AND a.realm = 'research'
  );

-- 4. SIG blurbs move from hand-written HTML to programs.description (host-
--    editable), seeded from each SIG page's static blurb as of Session 54.
UPDATE programs SET description = 'Mathematical and logical modeling of protocols, developing the underlying formal sciences with applications across fields including cryptography, distributed systems, and healthcare.' WHERE slug = 'sigfpt';
UPDATE programs SET description = 'Exploring analogies and metaphors for understanding memory and its relationship to protocols, at the intersection of cognitive science, infrastructure, and institutional design.' WHERE slug = 'mrg';
UPDATE programs SET description = 'Business applications of protocols, including AI adoption and organizational coordination, with case studies and essays published in Protocolized.' WHERE slug = 'sigpfb';
UPDATE programs SET description = 'An emerging genre exploration group developing protocol fiction — primarily for Protocolized magazine — as a mode of inquiry into how protocols shape worlds.' WHERE slug = 'protfisig';
UPDATE programs SET description = 'The Distributed Robotics Group studies and develops protocols for onchain robotics — examining how decentralized coordination, blockchain infrastructure, and robots and physical AI intersect to create new classes of protocol design challenges. Building one robot is an engineering challenge; getting two or more to coordinate is a protocol problem.' WHERE slug = 'drg';
UPDATE programs SET description = 'Studying long-range historical modeling and prediction — drawing on quantitative history, complexity science, and protocol theory to develop frameworks for understanding civilizational-scale dynamics. The group maintains worldmachines.org, a collaborative platform for psychohistorical modeling.' WHERE slug = 'sigpsy';
UPDATE programs SET description = 'The Personhood Research Group investigates how personhood has been constituted as a set of protocols across different times, places, and disciplines; how related questions like “what is life?” interact with it; and how it is changing as a result of AI.' WHERE slug = 'prg';
