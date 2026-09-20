-- Migration 036: a per-session note about how firm the running order is.
--
-- A special session owns a block (symposium_sessions.date/start_time/end_time)
-- and its talks are scheduled individually inside that block, like any other
-- talk. That makes every per-talk time look equally authoritative on the
-- program page, which is wrong for a session whose times were assigned only to
-- fill the block in a fixed cadence and whose real running order is the host's
-- call on the day.
--
-- The Art of Memory is the case that prompted this (Session 51): its five talks
-- had no times at all until 2026-09-20, when they were given 30-minute slots in
-- database order purely so the block would render. Publishing those as if they
-- were decided would misinform attendees planning which talk to catch.
--
-- Stored on the session rather than hardcoded in the page or the brochure
-- generator, because both surfaces need it and they read different sources —
-- the page goes through /api/symposium/sessions, make_brochure.py queries D1
-- directly. NULL means the order is firm; no note is rendered.
--
-- Rendered by: events/protocol-symposium-2026/index.html (renderParallelBlock,
-- in the Track I panel above the cards) and make_brochure.py (session banner,
-- between the abstract and the schedule). Note that the page only has a place
-- to show it inside a parallel block; a special session with no Track II
-- pairing renders as bare cards with no session header to hang it on.

ALTER TABLE symposium_sessions ADD COLUMN running_order_note TEXT;

UPDATE symposium_sessions
SET running_order_note = 'Running order may be different and determined by session host.'
WHERE slug = 'memory';
