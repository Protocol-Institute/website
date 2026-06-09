// GET   /api/items/:slug — single approved item with vote counts + comments
// PATCH /api/items/:slug — edit item (admin or original author)
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
      item.my_vote  = vr?.vote || null;
      item.is_admin  = !!(member.is_admin);
      item.is_author = item.contributed_by_slug === member.slug;
    } else {
      item.my_vote   = null;
      item.is_admin  = false;
      item.is_author = false;
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

export async function onRequestPatch({ params, request, env }) {
  const member = await getSessionMember(request, env);
  if (!member) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  const { slug } = params;
  const item = await env.DB.prepare(
    "SELECT id, contributed_by_slug FROM cogergo_items WHERE slug = ? AND status != 'rejected'"
  ).bind(slug).first();
  if (!item) return Response.json({ error: 'Not found' }, { status: 404 });
  if (!member.is_admin && item.contributed_by_slug !== member.slug) {
    return Response.json({ error: 'Not authorized' }, { status: 403 });
  }

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const title             = (body.title || '').trim();
  const type              = (body.type || '').trim();
  const symptoms          = (body.symptoms || '').trim();
  const prognosis         = (body.prognosis || '').trim();
  const improvement_ideas = (body.improvement_ideas || '').trim();
  const rawTags           = (body.tags || '').trim();
  const tags = JSON.stringify(
    rawTags ? rawTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : []
  );

  if (!title)                          return Response.json({ error: 'Title required' }, { status: 400 });
  if (!['good', 'bad'].includes(type)) return Response.json({ error: 'Invalid type' }, { status: 400 });
  if (!symptoms)                       return Response.json({ error: 'Visible symptoms required' }, { status: 400 });
  if (!prognosis)                      return Response.json({ error: 'Prognosis required' }, { status: 400 });
  if (!improvement_ideas)              return Response.json({ error: 'Improvement ideas required' }, { status: 400 });

  try {
    await env.DB.prepare(`
      UPDATE cogergo_items
      SET title=?, type=?, symptoms=?, prognosis=?, improvement_ideas=?, tags=?, updated_at=datetime('now')
      WHERE slug=?
    `).bind(title, type, symptoms, prognosis, improvement_ideas, tags, slug).run();
    return Response.json({ ok: true });
  } catch (err) {
    console.error('item PATCH error:', err);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}
