-- 052: Community Leads become Research Leads; Sarah Friend joins (Session 57, 2026-10-10).
--
-- Display rename only: the tier value stays 'community_lead' (as programs.kind
-- stays 'sig'), and the label "Research Leads" lives in members/index.html and
-- about/index.html. The leads' titles said "SIG Host", the old class acronym,
-- so they become "Research Group Host" (see the naming rule in CLAUDE.md).
-- Sarah Friend hosts the Personhood Research Group (program_hosts, prg).

UPDATE members SET community_lead_title = 'Research Group Host', updated_at = datetime('now')
WHERE tier = 'community_lead' AND community_lead_title = 'SIG Host';

UPDATE members SET tier = 'community_lead', community_lead_title = 'Research Group Host', updated_at = datetime('now')
WHERE slug = 'sarah-anne-friend';
