-- Migration 020: Symposium session metadata and ownership

CREATE TABLE IF NOT EXISTS symposium_sessions (
  slug        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  owner_email TEXT,
  date        TEXT,
  start_time  TEXT,
  end_time    TEXT,
  description TEXT,
  agenda      TEXT
);

INSERT INTO symposium_sessions (slug, name) VALUES
  ('memory',           'Memory'),
  ('protocol-fiction', 'Protocol Fiction'),
  ('psychohistory',    'Psychohistory'),
  ('southeast-asia',   'Southeast Asia');

UPDATE symposium_sessions SET owner_email = 'samuelthechua@gmail.com' WHERE slug = 'southeast-asia';
