-- One-off data cleanup for the /research unification (migration 028).
-- Removes the 3 institutional-infrastructure rows that were backfilled into
-- `projects` purely to mirror the Programs page (they now live only there,
-- never duplicated into the member-project index — mutual exclusivity).
-- Backfills sig_slug on the 5 rows that stay, replacing the old
-- program/sub_program/themes overload with a single SIG-or-independent field.

DELETE FROM projects WHERE slug IN ('c3po', 'humboldt', 'challenges');

UPDATE projects SET sig_slug = 'protfisig' WHERE slug = 'jamverse';
UPDATE projects SET sig_slug = 'sigpfb'    WHERE slug = 'protocolized-dev';
UPDATE projects SET sig_slug = 'sigpsy'    WHERE slug = 'worldmachines';
UPDATE projects SET sig_slug = 'mrg'       WHERE slug = 'cognitive-ergonomics';
UPDATE projects SET sig_slug = 'sigfpt'    WHERE slug = 'legible-action-distinction-signaling-and-the-formalization-of-pr';
