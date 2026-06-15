// GET  /api/symposium/sessions/:slug — public session metadata
// PATCH /api/symposium/sessions/:slug — session owner or admin may update

import { getSession } from '../../../_shared/session.js';

export async function onRequestGet({ params, env }) {
  const session = await env.DB.prepare(
    'SELECT slug, name, owner_email, date, start_time, end_time, description, agenda FROM symposium_sessions WHERE slug = ?'
  ).bind(params.slug).first();
  if (!session) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ session });
}

export async function onRequestPatch({ request, params, env }) {
  const email = await getSession(request, env);
  if (!email) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  const session = await env.DB.prepare(
    'SELECT owner_email FROM symposium_sessions WHERE slug = ?'
  ).bind(params.slug).first();
  if (!session) return Response.json({ error: 'Not found' }, { status: 404 });

  const member = await env.DB.prepare(
    'SELECT is_admin FROM members WHERE email = ?'
  ).bind(email).first();
  if (!member) return Response.json({ error: 'Not a member' }, { status: 403 });

  if (!member.is_admin && email !== session.owner_email) {
    return Response.json({ error: 'Not authorized' }, { status: 403 });
  }

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const allowed = ['date', 'start_time', 'end_time', 'description', 'agenda'];
  const sets = [], vals = [];
  for (const field of allowed) {
    if (body[field] !== undefined) {
      sets.push(`${field} = ?`);
      vals.push(body[field] === '' ? null : String(body[field]));
    }
  }
  if (!sets.length) return Response.json({ error: 'Nothing to update' }, { status: 400 });
  vals.push(params.slug);

  await env.DB.prepare(
    `UPDATE symposium_sessions SET ${sets.join(', ')} WHERE slug = ?`
  ).bind(...vals).run();

  return Response.json({ ok: true });
}
