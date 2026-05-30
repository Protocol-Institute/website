CREATE TABLE IF NOT EXISTS members (
  email        TEXT PRIMARY KEY,
  slug         TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  bio          TEXT,
  website      TEXT,
  type         TEXT DEFAULT 'human' CHECK(type IN ('human', 'ai')),
  photo_r2_key TEXT,
  -- Directory flags (admin-set)
  is_team      INTEGER DEFAULT 0,
  is_consultant INTEGER DEFAULT 0,
  is_public    INTEGER DEFAULT 1,
  -- Team field
  team_title   TEXT,
  -- Qualifying PI event tags
  tag_sop23          INTEGER DEFAULT 0,
  tag_sop24          INTEGER DEFAULT 0,
  tag_sop25          INTEGER DEFAULT 0,
  tag_ps25           INTEGER DEFAULT 0,
  tag_datus_nusas    INTEGER DEFAULT 0,
  tag_khlongs_subaks INTEGER DEFAULT 0,
  tag_town_hall      INTEGER DEFAULT 0,
  tag_sig                  INTEGER DEFAULT 0,
  tag_protocol_kit         INTEGER DEFAULT 0,
  tag_protocolized_writer  INTEGER DEFAULT 0,
  -- Consultant fields
  consulting_expertise TEXT,
  consulting_contact   TEXT,
  consulting_portfolio TEXT,
  -- Location and community
  city TEXT,
  discord_handle TEXT,
  -- For AI/bot members: email of the human admin who manages this record
  owner_email TEXT,
  -- Timestamps
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS membership_requests (
  email             TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  bio               TEXT,
  website           TEXT,
  city              TEXT,
  discord_handle    TEXT,
  qualifying_events TEXT, -- JSON array of tag keys
  request_team      INTEGER DEFAULT 0,
  request_consultant INTEGER DEFAULT 0,
  photo_url         TEXT,
  consulting_expertise TEXT,
  consulting_contact   TEXT,
  consulting_portfolio TEXT,
  applicant_notes   TEXT,
  status     TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
  reviewed_at  TEXT,
  admin_notes  TEXT,
  created_at   TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS auth_pins (
  email      TEXT PRIMARY KEY,
  pin_hash   TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
