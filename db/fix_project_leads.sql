-- Correct lead attribution on 2 backfilled projects: they were created as
-- admin/Venkat-owned stub entries initially, but the actual project leads
-- are Sachin Benny (Jamverse, ProtFiSIG) and Aneesh Sathe (World Machines,
-- SIGPSY). Corrected per Venkat 2026-08-08.
UPDATE projects SET lead_slug = 'sachin-benny' WHERE slug = 'jamverse';
UPDATE projects SET lead_slug = 'aneesh-sathe' WHERE slug = 'worldmachines';
