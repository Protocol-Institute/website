-- Migration 038: Book Writing Month gets its own landing page.
--
-- Migration 037 seeded the program and its November 2026 edition with no page,
-- so they fell back to the generic /programs/program renderer. The landing page
-- at /events/book-writing-month-2026 now serves both; like the Symposium, the
-- program's page_url points at its current edition's page.
UPDATE programs SET page_url = '/events/book-writing-month-2026' WHERE slug = 'book-writing-month';
UPDATE editions SET page_url = '/events/book-writing-month-2026'
  WHERE program_slug = 'book-writing-month' AND slug = '2026-11';
