-- Migration 035: Give workshop proposals an anchor date/time on the row itself.
--
-- Workshops (Sept 21-22) carry their real schedule in symposium_workshop_sessions
-- (migration 031) — typically 4-5 repeated windows across the two days. The
-- proposal row's own scheduled_date/scheduled_time_utc, which every talk has,
-- was left NULL for them. The program page copes: effectiveDate() falls back to
-- workshop_sessions[0].date. Anything reading the API directly does not, and
-- sees all five workshops as unscheduled.
--
-- This sets the anchor to each workshop's FIRST session (earliest date, then
-- earliest start time). It is deliberately an anchor, not the whole truth: a
-- workshop spans both days and symposium_workshop_sessions remains the
-- authoritative schedule. renderCard() guards its single-date line with
-- `if (!isWorkshop)`, so this does not change what the page displays.
--
-- RE-RUNNABLE ON PURPOSE. The anchor is derived data, and nothing in
-- functions/ writes to symposium_workshop_sessions, so there is no code path
-- that refreshes it when a workshop's times move. An earlier draft guarded
-- this with `AND scheduled_date IS NULL`, which would have set the anchor once
-- and let it rot: the Stigmergy Hackathon's first session moved 13:00 -> 15:00
-- on 2026-09-16, and a one-shot migration run before that would now disagree
-- with the real schedule -- invisibly, because the program page never renders
-- a workshop's anchor. Re-run this after any workshop timing change and it
-- re-derives every anchor from the current session rows.
--
-- Consequence of being re-runnable: a hand-set anchor on a workshop that has
-- session rows will be overwritten. That is intended -- symposium_workshop_sessions
-- is the source of truth. Workshops with no session rows are left untouched by
-- the EXISTS clause.

UPDATE symposium_proposals
SET
  scheduled_date = (
    SELECT ws.date
    FROM symposium_workshop_sessions ws
    WHERE ws.proposal_id = symposium_proposals.id
    ORDER BY ws.date ASC, ws.start_time ASC
    LIMIT 1
  ),
  scheduled_time_utc = (
    SELECT ws.start_time
    FROM symposium_workshop_sessions ws
    WHERE ws.proposal_id = symposium_proposals.id
    ORDER BY ws.date ASC, ws.start_time ASC
    LIMIT 1
  )
WHERE type = 'workshop'
  AND EXISTS (
    SELECT 1 FROM symposium_workshop_sessions ws WHERE ws.proposal_id = symposium_proposals.id
  );
