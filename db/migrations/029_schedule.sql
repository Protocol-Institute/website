-- Migration 029: Per-talk schedule time for the symposium program
-- scheduled_date/scheduled_time_utc are set for individually-timed items
-- (General-session grid talks, plus sub-times within a special session's
-- block). Items with no per-item time fall back to their session's
-- date/start_time/end_time block (symposium_sessions, migration 020) when
-- session != 'General'.

ALTER TABLE symposium_proposals ADD COLUMN scheduled_date TEXT;
ALTER TABLE symposium_proposals ADD COLUMN scheduled_time_utc TEXT;
