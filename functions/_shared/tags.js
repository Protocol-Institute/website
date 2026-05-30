// Canonical tag definitions — single source of truth for all Worker functions.
// For client-side use, see /js/tags.js.

export const EVENT_TAGS = [
  'tag_sop23', 'tag_sop24', 'tag_sop25', 'tag_ps25',
  'tag_datus_nusas', 'tag_khlongs_subaks', 'tag_town_hall',
  'tag_sig', 'tag_protocol_kit', 'tag_protocolized_writer',
];

// Includes role flags for filter/validation in public API
export const VALID_TAGS = ['is_team', 'is_consultant', ...EVENT_TAGS];

export const TAG_ALIASES = {
  team: 'is_team',
  consultant: 'is_consultant',
};
