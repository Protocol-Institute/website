// POST /api/programs/:slug/hosts — admin only: { member_slug, action: add|remove }
// Hosts can edit the program's content, links, editions and tags, and see it in
// their member dashboard.

import { getSession } from '../../../_shared/session.js';
import { memberForSession } from '../../../_shared/programs.js';

export async function onRequestPost({ params, request, env }) {
  const member = await memberForSession(env, await getSession(request, env));
  if (!member?.is_admin) return Response.json({ error: 'Admins only' }, { status: 403 });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const { member_slug, action } = body;
  if (!member_slug || !['add', 'remove'].includes(action)) {
    return Response.json({ error: 'member_slug and action required' }, { status: 400 });
  }
  if (!await env.DB.prepare('SELECT 1 FROM programs WHERE slug = ?').bind(params.slug).first()) {
    return Response.json({ error: 'Program not found' }, { status: 404 });
  }

  if (action === 'remove') {
    await env.DB.prepare('DELETE FROM program_hosts WHERE program_slug = ? AND member_slug = ?')
      .bind(params.slug, member_slug).run();
    return Response.json({ ok: true });
  }
  if (!await env.DB.prepare('SELECT 1 FROM members WHERE slug = ?').bind(member_slug).first()) {
    return Response.json({ error: 'No member with that slug' }, { status: 400 });
  }
  await env.DB.prepare('INSERT OR IGNORE INTO program_hosts (program_slug, member_slug) VALUES (?, ?)')
    .bind(params.slug, member_slug).run();
  return Response.json({ ok: true });
}
