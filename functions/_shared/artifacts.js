// Project artifact kinds (Session 58, migration 058). projects.artifact_type has a
// CHECK that D1 can't widen, so the full list lives in projects.artifact_kind and
// artifact_type keeps a CHECK-valid fallback. Read artifact_kind first; the API
// hands it out as `artifact_type`, so pages only ever see one field.
export const ARTIFACT_KINDS = ['text', 'code', 'website', 'rich_media', 'book', 'other'];
export const isArtifactKind = k => ARTIFACT_KINDS.includes(k);
// Value for the CHECK-constrained artifact_type column.
export const storedArtifactType = k => (k === 'book' ? 'text' : k);

// Projects carry an optional stand-alone summary of 50-75 words (migration 063).
export const SHORT_ABSTRACT_MIN = 50, SHORT_ABSTRACT_MAX = 75;
export function wordCount(text) { return (text || '').trim().split(/\s+/).filter(Boolean).length; }
/** null if fine (or empty), else an error message. */
export function shortAbstractError(text) {
  const n = wordCount(text);
  if (!n) return null;
  if (n < SHORT_ABSTRACT_MIN || n > SHORT_ABSTRACT_MAX) return `Short abstract must be ${SHORT_ABSTRACT_MIN}-${SHORT_ABSTRACT_MAX} words (it is ${n}).`;
  return null;
}
