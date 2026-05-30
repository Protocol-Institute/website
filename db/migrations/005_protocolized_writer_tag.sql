-- Migration 005: add Protocolized Writer tag
ALTER TABLE members ADD COLUMN tag_protocolized_writer INTEGER DEFAULT 0;

-- Apply all tags to Venkat (founding team, all qualifying events)
UPDATE members SET
  tag_sop23 = 1, tag_sop24 = 1, tag_sop25 = 1, tag_ps25 = 1,
  tag_datus_nusas = 1, tag_khlongs_subaks = 1, tag_town_hall = 1,
  tag_sig = 1, tag_protocol_kit = 1, tag_protocolized_writer = 1
WHERE email = 'venkat@protocol-institute.org';
