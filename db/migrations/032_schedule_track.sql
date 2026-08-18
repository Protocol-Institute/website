-- Migration 032: Parallel-track marker for General talks scheduled alongside
-- a special session's block. 'ii' = alternate track, shown behind a tab next
-- to the special session it runs in parallel with (see events/protocol-
-- symposium-2026/index.html). NULL = normal single-track scheduling.
-- Distinct from the existing `track` column, which is a topical SIG/track
-- category on the submission form, not a scheduling concept.

ALTER TABLE symposium_proposals ADD COLUMN schedule_track TEXT;
