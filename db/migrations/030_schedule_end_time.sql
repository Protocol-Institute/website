-- Migration 030: Optional explicit end time for individually-scheduled items
-- that don't fit the default 30-minute assumption (e.g. the Closing Plenary,
-- which spans the full 3-slot reserved block).

ALTER TABLE symposium_proposals ADD COLUMN scheduled_end_time_utc TEXT;
