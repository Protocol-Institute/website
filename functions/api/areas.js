// POST /api/areas — admin only: create an area { slug, title, realm, description? }.
// Areas are read through GET /api/programs.

import { getSession } from '../_shared/session.js';
import { memberForSession, SLUG_RE } from '../_shared/programs.js';

export async function onRequestPost({ request, env }) {
  const member = await memberForSession(env, await getSession(request, env));
  if (!member?.is_admin) return Response.json({ error: 'Admins only' }, { status: 403 });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const slug = String(body.slug || '').trim().toLowerCase();
  const title = String(body.title || '').trim();
  const realm = body.realm === 'admin' ? 'admin' : 'research';
  if (!SLUG_RE.test(slug)) return Response.json({ error: 'Slug: lowercase letters, digits and hyphens' }, { status: 400 });
  if (!title) return Response.json({ error: 'Title required' }, { status: 400 });
  if (await env.DB.prepare('SELECT 1 FROM areas WHERE slug = ?').bind(slug).first()) {
    return Response.json({ error: 'An area with that slug exists' }, { status: 409 });
  }
  await env.DB.prepare(`
    INSERT INTO areas (slug, realm, title, description, sort_order)
    VALUES (?, ?, ?, ?, (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM areas))
  `).bind(slug, realm, title, String(body.description || '').trim() || null).run();
  return Response.json({ ok: true, slug }, { status: 201 });
}
