-- Adds YakRobot Protocols to the projects table, completing the Programs-page
-- cleanup from the /research unification (it was removed from programs/index.html
-- pending a lead decision; Venkat confirmed Anuraj R. as lead 2026-08-08).
INSERT INTO projects
  (slug, title, description, lead_slug, sig_slug, state, type, artifact_type, artifact_type_other, url, status, submitted_by)
VALUES (
  'yakrobot-protocols',
  'YakRobot Protocols',
  'A real-hardware testbed for onchain coordination protocols, developed within the Distributed Robotics Group.',
  'anuraj-rp',
  'drg',
  'beta',
  'accretive',
  'other',
  'Hardware testbed',
  'https://yakrobot.com/',
  'approved',
  'venkat@protocol-institute.org'
);
