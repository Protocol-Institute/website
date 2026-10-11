-- 058: "Book" artifact type; finished programs closed to new tags (Session 58, 2026-10-11).
--
-- Book. projects.artifact_type has a CHECK (text|code|website|rich_media|other)
-- that can't be widened on D1 — projects is an FK parent, so it can't be rebuilt
-- (see migration 045's note on programs.kind). New column artifact_kind holds the
-- full list, validated in the API (functions/_shared/artifacts.js); artifact_type
-- keeps a CHECK-valid fallback (book -> text). The API reads artifact_kind first and
-- returns it as artifact_type, so pages see one field. PiBoWriMo's projects become books.
--
-- Closing programs. The project editor's tag picker now offers only programs that
-- are active AND accept tags; the API refuses new tags to any other (existing tags
-- stay). The 2024-26 workshop series and the 2026 symposium workshops are over:
-- status 'past' (an admin can reopen one in /programs/edit). Research Index is
-- the /research page itself, not something to tag: accepts_tags = 0. Summer of
-- Protocols was already 'past', so it drops out of the picker too.

ALTER TABLE projects ADD COLUMN artifact_kind TEXT;
UPDATE projects SET artifact_kind = artifact_type WHERE artifact_kind IS NULL;
UPDATE projects SET artifact_kind = 'book', artifact_type = 'text', artifact_type_other = NULL
  WHERE id IN (SELECT project_id FROM project_programs WHERE program_slug = 'pibowrimo');

ALTER TABLE programs ADD COLUMN accepts_tags INTEGER NOT NULL DEFAULT 1;
UPDATE programs SET accepts_tags = 0 WHERE slug = 'research-index';
UPDATE programs SET status = 'past' WHERE slug IN (
  'edge-city-workshops', 'traditional-protocols-workshops',
  'ai-kitcraft', 'stigmergy-hackathon', 'robots-as-protocol-citizens',
  'protocols-as-art', 'protocolize-your-book'
);
