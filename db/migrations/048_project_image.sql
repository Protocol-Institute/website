-- 048: optional project image (Session 57, 2026-10-10).
--
-- One image per project, uploaded by the lead (or an admin) from the project
-- editor and shown at the top of the project page; no image, nothing rendered.
-- The browser crops it to 16:9 and re-encodes it as JPEG (max 1600x900) before
-- upload. Stored in R2 at projects/<slug>/<timestamp>.jpg and served via
-- /assets/; the key changes on every upload, so a replaced image is never
-- stuck behind the asset cache. Written only by /api/projects/<slug>/image.

ALTER TABLE projects ADD COLUMN image_key TEXT;
