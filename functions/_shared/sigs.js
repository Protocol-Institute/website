// Canonical SIG slugs for Worker-side validation.
// Client-side counterparts live in js/sig-meta.js (window.PI_SIGS) and in the
// per-page label maps in js/research.js, projects/submit/, admin/projects.html
// and members/dashboard/ — all of which must be updated when a SIG is added.
export const SIG_SLUGS = ['sigfpt', 'mrg', 'sigpfb', 'protfisig', 'drg', 'sigpsy', 'prg'];
export const VALID_SIGS = new Set(SIG_SLUGS);
