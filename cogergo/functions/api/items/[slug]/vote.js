// POST /api/items/:slug/vote — toggle or set vote ('do' | 'dont'), requires pi_session
import { getSessionMember } from '../../../_shared/auth.js';

export async function onRequestPost({ params, request, env }) {
  const member = await getSessionMember(request, env);
  if (!member) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  const { slug } = params;
  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const vote = body.vote;
  if (!['do', 'dont'].includes(vote)) return Response.json({ error: 'vote must be do or dont' }, { status: 400 });

  const item = await env.DB.prepare(
    "SELECT id FROM cogergo_items WHERE slug = ? AND status = 'approved'"
  ).bind(slug).first();
  if (!item) return Response.json({ error: 'Item not found' }, { status: 404 });

  const existing = await env.DB.prepare(
    'SELECT vote FROM cogergo_votes WHERE item_id = ? AND email = ?'
  ).bind(item.id, member.email).first();

  if (existing && existing.vote === vote) {
    // Same vote — toggle off
    await env.DB.prepare('DELETE FROM cogergo_votes WHERE item_id = ? AND email = ?')
      .bind(item.id, member.email).run();
  } else {
    // New vote or switch — upsert
    await env.DB.prepare('INSERT OR REPLACE INTO cogergo_votes (item_id, email, vote) VALUES (?, ?, ?)')
      .bind(item.id, member.email, vote).run();
  }

  const { results } = await env.DB.prepare(`
    SELECT vote, COUNT(*) AS cnt FROM cogergo_votes WHERE item_id = ? GROUP BY vote
  `).bind(item.id).all();
  const counts = Object.fromEntries((results || []).map(r => [r.vote, r.cnt]));

  const newVote = await env.DB.prepare(
    'SELECT vote FROM cogergo_votes WHERE item_id = ? AND email = ?'
  ).bind(item.id, member.email).first();

  return Response.json({
    ok: true,
    my_vote: newVote?.vote || null,
    do_count: counts.do || 0,
    dont_count: counts.dont || 0,
  });
}
