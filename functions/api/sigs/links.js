// GET /api/sigs/links?sig=<slug> — TEMPORARY read-only alias for /api/program-links.
//
// Replaced in Session 54, but js/main.js is browser-cached for up to ~4h
// (max-age=14400), so visitors holding the old script still call this path and
// would silently lose the SIG website line on a 404. Remove together with
// migration 039 — by then no cached copy of the old main.js can survive.

export async function onRequestGet({ request, env }) {
  const sig = new URL(request.url).searchParams.get('sig');
  const cols = 'id, program_slug AS sig_slug, kind, label, url, note, sort_order';
  const { results } = sig
    ? await env.DB.prepare(`SELECT ${cols} FROM program_links WHERE program_slug = ? ORDER BY sort_order, id`).bind(sig).all()
    : await env.DB.prepare(`SELECT ${cols} FROM program_links ORDER BY program_slug, sort_order, id`).all();
  return Response.json({ links: results || [] });
}
