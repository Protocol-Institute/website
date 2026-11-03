-- 064: self-reported AI use per PiBoWriMo daily log (Session 64, 2026-11-03).
--
-- One of none | low | medium | high, chosen on each daily entry and replaced
-- with it when a date is re-logged. NULL = logged before this column existed.
-- Not used in scoring yet; kept so the standings can later weight or sort by it.
ALTER TABLE pibowrimo_wordcounts ADD COLUMN ai_use TEXT CHECK (ai_use IN ('none', 'low', 'medium', 'high'));
