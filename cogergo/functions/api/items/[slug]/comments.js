// GET  /api/items/:slug/comments — public, oldest first
// POST /api/items/:slug/comments — add comment, requires pi_session
import { getSessionMember } from '../../../_shared/auth.js';

export async function onRequestGet({ params, env }) {
  const { slug } = params;
  const item = await env.DB.prepare(
    "SELECT id FROM cogergo_items WHERE slug = ? AND status = 'approved'"
  ).bind(slug).first();
  if (!item) return Response.json({ error: 'Not found' }, { status: 404 });

  const { results } = await env.DB.prepare(
    'SELECT id, member_slug, member_name, body, created_at FROM cogergo_comments WHERE item_id = ? ORDER BY created_at ASC'
  ).bind(item.id).all();

  return Response.json({ comments: results || [] });
}

export async function onRequestPost({ params, request, env }) {
  const member = await getSessionMember(request, env);
  if (!member) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  const { slug } = params;
  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const text = (body.body || '').trim().slice(0, 2000);
  if (!text) return Response.json({ error: 'Comment body required' }, { status: 400 });

  const item = await env.DB.prepare(
    "SELECT id FROM cogergo_items WHERE slug = ? AND status = 'approved'"
  ).bind(slug).first();
  if (!item) return Response.json({ error: 'Not found' }, { status: 404 });

  try {
    const result = await env.DB.prepare(`
      INSERT INTO cogergo_comments (item_id, email, member_slug, member_name, body)
      VALUES (?, ?, ?, ?, ?)
    `).bind(item.id, member.email, member.slug, member.name, text).run();

    return Response.json({ ok: true, id: result.meta.last_row_id }, { status: 201 });
  } catch (err) {
    console.error('comment POST error:', err);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}
