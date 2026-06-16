// GET /api/symposium/sessions — list all special sessions (slug, name)
// Public: no auth required

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    'SELECT slug, name FROM symposium_sessions ORDER BY name ASC'
  ).all();
  return Response.json({ sessions: results || [] });
}
