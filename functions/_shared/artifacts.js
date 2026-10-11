// Project artifact kinds (Session 58, migration 058). projects.artifact_type has a
// CHECK that D1 can't widen, so the full list lives in projects.artifact_kind and
// artifact_type keeps a CHECK-valid fallback. Read artifact_kind first; the API
// hands it out as `artifact_type`, so pages only ever see one field.
export const ARTIFACT_KINDS = ['text', 'code', 'website', 'rich_media', 'book', 'other'];
export const isArtifactKind = k => ARTIFACT_KINDS.includes(k);
// Value for the CHECK-constrained artifact_type column.
export const storedArtifactType = k => (k === 'book' ? 'text' : k);
