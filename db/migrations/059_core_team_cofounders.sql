-- 059: Rafael Fernandez joins the core team; "Co-founder" label (Session 60, 2026-10-23).
--
-- Core Team order is now Venkat, Rafael, Timber, Tim (team_sort). Rafael stays
-- tier 'community_lead' (he remains a research leader); the Team view now keys
-- on team_core alone, so he shows in both Team and Research Leads. team_cofounder is display-only: a badge beside the title on
-- the member list and profile page, set for Venkat, Rafael and Timber.

ALTER TABLE members ADD COLUMN team_cofounder INTEGER NOT NULL DEFAULT 0;

UPDATE members SET team_core = 1, updated_at = datetime('now')
WHERE slug = 'rafael-fernandez';

UPDATE members SET team_sort = CASE slug
  WHEN 'venkatesh-rao'          THEN 1
  WHEN 'rafael-fernandez'       THEN 2
  WHEN 'timber-stinson-schroff' THEN 3
  WHEN 'tim-beiko'              THEN 4
END
WHERE slug IN ('venkatesh-rao', 'rafael-fernandez', 'timber-stinson-schroff', 'tim-beiko');

UPDATE members SET team_cofounder = 1
WHERE slug IN ('venkatesh-rao', 'rafael-fernandez', 'timber-stinson-schroff');
