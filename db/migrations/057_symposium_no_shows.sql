-- 057: drop the three Protocol Symposium 2026 talks whose speakers did not show
-- (VGR, 2026-10-11). The page is now an archive of what happened, so these come
-- off the programme. is_shortlisted = 0 hides them from /api/symposium/proposals,
-- which the programme page and c3po (ingest/sync_symposium.py) both read; the
-- rows, comments and votes are kept. None has a recording or slides.
--   5  Provenance Against Fluency (Stanislav Lvovsky)
--  32  The Physics of Relation (Surya Kramer)
--  85  After Client-Server (Aayush Sharma)
UPDATE symposium_proposals SET is_shortlisted = 0 WHERE id IN (5, 32, 85);
