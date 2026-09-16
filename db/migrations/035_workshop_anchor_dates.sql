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
  AND scheduled_date IS NULL
  AND EXISTS (
    SELECT 1 FROM symposium_workshop_sessions ws WHERE ws.proposal_id = symposium_proposals.id
  );
