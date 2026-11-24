-- 067: named roles for members, read by apps on Institute subdomains (2026-11-23).
--
-- A role is a name an admin gives a member, such as the role that lets a member post on
-- blyg.protocol-institute.org. The site itself gives roles no meaning. Apps read them
-- through the host API (functions/api/host/), which reports each one as the group
-- `role:<name>`, and each app decides what a role allows. No role is created here: an admin
-- adds rows by hand, e.g.
--   INSERT INTO member_roles (member_slug, role) VALUES ('venkatesh-rao', 'blyg-author');

CREATE TABLE IF NOT EXISTS member_roles (
  member_slug TEXT NOT NULL,
  role        TEXT NOT NULL CHECK (role GLOB '[a-z0-9]*' AND role NOT GLOB '*[^a-z0-9-]*'),
  granted_at  TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (member_slug, role)
);
