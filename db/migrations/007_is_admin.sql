-- Migration 007: add is_admin flag; grant to founding admins
ALTER TABLE members ADD COLUMN is_admin INTEGER DEFAULT 0;
UPDATE members SET is_admin = 1 WHERE email IN ('vgururao@gmail.com', 'timber@protocol-institute.org');
