-- 051: Core / Extended Team + PIBot member profile (Session 57, 2026-10-10).
--
-- The Team view (/members?filter=team) splits into Core Team (team_core = 1:
-- Timber, Venkat, Tim) and Extended Team (everyone else with tier 'team'), each
-- in the hand-set team_sort order. Both columns are read only by that view —
-- every other list stays alphabetical.
--
-- The C3PO member profile becomes PIBot, matching the project rename in
-- migration 042. The slug stays 'c3po' so profile links keep working.

ALTER TABLE members ADD COLUMN team_sort INTEGER;
ALTER TABLE members ADD COLUMN team_core INTEGER NOT NULL DEFAULT 0;

UPDATE members SET team_sort = CASE slug
  WHEN 'timber-stinson-schroff' THEN 1
  WHEN 'venkatesh-rao'          THEN 2
  WHEN 'tim-beiko'              THEN 3
  WHEN 'james-langdon'          THEN 4
  WHEN 'j'                      THEN 5
  WHEN 'protocolinstitute'      THEN 6
  WHEN 'humboldt'               THEN 7
  WHEN 'c3po'                   THEN 8
END
WHERE slug IN ('timber-stinson-schroff', 'venkatesh-rao', 'tim-beiko', 'james-langdon', 'j',
               'protocolinstitute', 'humboldt', 'c3po');

UPDATE members SET team_core = 1
WHERE slug IN ('timber-stinson-schroff', 'venkatesh-rao', 'tim-beiko');

UPDATE members SET
  name = 'PIBot',
  bio  = 'PIBot (formerly C3PO) is the Protocol Institute''s conversational research assistant, built on the full PI corpus — papers, essays, talks, Discord discussions, research group meetings and Protocolized magazine content. Available as an MCP server for integration with Claude Code and Claude Desktop.',
  updated_at = datetime('now')
WHERE slug = 'c3po';
