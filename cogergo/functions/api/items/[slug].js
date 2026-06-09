// GET /api/items/:slug — single approved item with vote counts + comments
import { getSessionMember } from '../../_shared/auth.js';

function parseTags(raw) {
  try { return JSON.parse(raw || '[]'); } catch { return []; }
}

export async function onRequestGet({ params, request, env }) {
  const { slug } = params;
  const member = await getSessionMember(request, env).catch(() => null);

  try {
    const row = await env.DB.prepare(`
      SELECT ci.*,
        m.name AS contributor_name,
        (SELECT COUNT(*) FROM cogergo_votes cv WHERE cv.item_id = ci.id AND cv.vote = 'do')   AS do_count,
        (SELECT COUNT(*) FROM cogergo_votes cv WHERE cv.item_id = ci.id AND cv.vote = 'dont') AS dont_count,
        (SELECT COUNT(*) FROM cogergo_comments cc WHERE cc.item_id = ci.id) AS comment_count
      FROM cogergo_items ci
      LEFT JOIN members m ON m.slug = ci.contributed_by_slug
      WHERE ci.slug = ? AND ci.status = 'approved'
    `).bind(slug).first();

    if (!row) return Response.json({ error: 'Not found' }, { status: 404 });

    const item = { ...row, tags: parseTags(row.tags) };

    if (member) {
      const vr = await env.DB.prepare(
        'SELECT vote FROM cogergo_votes WHERE item_id = ? AND email = ?'
      ).bind(item.id, member.email).first();
      item.my_vote = vr?.vote || null;
      item.is_admin = !!(member.is_admin);
    } else {
      item.my_vote = null;
      item.is_admin = false;
    }

    const { results: comments } = await env.DB.prepare(
      'SELECT id, member_slug, member_name, body, created_at FROM cogergo_comments WHERE item_id = ? ORDER BY created_at ASC'
    ).bind(item.id).all();

    return Response.json({ item, comments: comments || [] });
  } catch (err) {
    console.error('item slug GET error:', err);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}
