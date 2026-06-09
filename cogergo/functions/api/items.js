// GET  /api/items  — public list of approved items (all fields + vote/comment counts)
// POST /api/items  — submit new item (requires pi_session)
import { getSessionMember } from '../_shared/auth.js';

function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64);
}

function parseTags(raw) {
  try { return JSON.parse(raw || '[]'); } catch { return []; }
}

const ITEM_SELECT = `
  SELECT ci.*,
    m.name AS contributor_name,
    (SELECT COUNT(*) FROM cogergo_votes cv WHERE cv.item_id = ci.id AND cv.vote = 'do')   AS do_count,
    (SELECT COUNT(*) FROM cogergo_votes cv WHERE cv.item_id = ci.id AND cv.vote = 'dont') AS dont_count,
    (SELECT COUNT(*) FROM cogergo_comments cc WHERE cc.item_id = ci.id) AS comment_count
  FROM cogergo_items ci
  LEFT JOIN members m ON m.slug = ci.contributed_by_slug
  WHERE ci.status = 'approved'
`;

export async function onRequestGet({ request, env }) {
  const member = await getSessionMember(request, env).catch(() => null);

  try {
    const { results } = await env.DB.prepare(ITEM_SELECT + ' ORDER BY ci.title ASC').all();
    const items = (results || []).map(r => ({
      ...r,
      tags: parseTags(r.tags),
    }));

    // Attach my_vote if authenticated
    if (member) {
      const { results: votes } = await env.DB.prepare(
        'SELECT item_id, vote FROM cogergo_votes WHERE email = ?'
      ).bind(member.email).all();
      const voteMap = Object.fromEntries((votes || []).map(v => [v.item_id, v.vote]));
      items.forEach(i => { i.my_vote = voteMap[i.id] || null; });
    } else {
      items.forEach(i => { i.my_vote = null; });
    }

    return Response.json({ items, is_admin: !!(member?.is_admin) });
  } catch (err) {
    console.error('items GET error:', err);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  const member = await getSessionMember(request, env);
  if (!member) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const title             = (body.title || '').trim();
  const type              = (body.type || '').trim();
  const symptoms          = (body.symptoms || '').trim() || null;
  const prognosis         = (body.prognosis || '').trim() || null;
  const improvement_ideas = (body.improvement_ideas || '').trim() || null;
  const rawTags           = (body.tags || '').trim();
  const tags = JSON.stringify(
    rawTags ? rawTags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean) : []
  );

  if (!title)                       return Response.json({ error: 'Title required' }, { status: 400 });
  if (!['good', 'bad'].includes(type)) return Response.json({ error: 'Type must be good or bad' }, { status: 400 });

  const baseSlug = slugify(title);
  let slug = baseSlug, attempt = 0;
  while (true) {
    const existing = await env.DB.prepare('SELECT id FROM cogergo_items WHERE slug = ?').bind(slug).first();
    if (!existing) break;
    slug = `${baseSlug}-${++attempt}`;
  }

  try {
    await env.DB.prepare(`
      INSERT INTO cogergo_items (slug, title, type, symptoms, prognosis, improvement_ideas, contributed_by_slug, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(slug, title, type, symptoms, prognosis, improvement_ideas, member.slug, tags).run();

    return Response.json({ ok: true, slug }, { status: 201 });
  } catch (err) {
    console.error('items POST error:', err);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}
