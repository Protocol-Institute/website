-- Migration 027: add themes column to projects
-- themes: JSON array of theme slugs (sigfpt, mrg, sigpfb, protfisig, drg, sigpsy, solo)
-- Replaces the member-facing program dropdown in the submit form.
-- program stays as an admin-only classification field.
ALTER TABLE projects ADD COLUMN themes TEXT;
