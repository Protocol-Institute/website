// PATCH /api/symposium/proposals/:id
// Speaker or admin may update title and abstract of their own proposal.

import { getSession } from '../../../_shared/session.js';

export async function onRequestPatch({ request, env, params }) {
  const email = await getSession(request, env);
  if (!email) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  const id = parseInt(params.id);
  if (!id) return Response.json({ error: 'Invalid ID' }, { status: 400 });

  const [proposal, member] = await Promise.all([
    env.DB.prepare(
      'SELECT speaker_email, organizer_email FROM symposium_proposals WHERE id = ?'
    ).bind(id).first(),
    env.DB.prepare(
      'SELECT is_admin FROM members WHERE email = ?'
    ).bind(email).first(),
  ]);

  if (!proposal) return Response.json({ error: 'Not found' }, { status: 404 });
  if (!member)   return Response.json({ error: 'Not a member' }, { status: 403 });

  const isOwner = email === proposal.speaker_email || email === proposal.organizer_email;
  if (!member.is_admin && !isOwner) {
    return Response.json({ error: 'Not authorized' }, { status: 403 });
  }

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const title    = body.title    !== undefined ? String(body.title).trim()    : undefined;
  const abstract = body.abstract !== undefined ? String(body.abstract).trim() : undefined;

  if (title !== undefined && !title) {
    return Response.json({ error: 'Title cannot be empty' }, { status: 400 });
  }
  if (title === undefined && abstract === undefined) {
    return Response.json({ error: 'Nothing to update' }, { status: 400 });
  }

  const sets = [], vals = [];
  if (title    !== undefined) { sets.push('title = ?');    vals.push(title); }
  if (abstract !== undefined) { sets.push('abstract = ?'); vals.push(abstract); }
  vals.push(id);

  await env.DB.prepare(
    `UPDATE symposium_proposals SET ${sets.join(', ')} WHERE id = ?`
  ).bind(...vals).run();

  return Response.json({ ok: true });
}
