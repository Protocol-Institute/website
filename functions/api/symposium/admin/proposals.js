// POST /api/symposium/admin/proposals
// Admin-only endpoint to add a new talk or workshop proposal.

import { getSession } from '../../../_shared/session.js';

export async function onRequestPost({ request, env }) {
  const email = await getSession(request, env);
  if (!email) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  const member = await env.DB.prepare(
    'SELECT is_admin FROM members WHERE email = ?'
  ).bind(email).first();
  if (!member || !member.is_admin) {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const type = body.type;
  if (!['talk', 'workshop', 'interactive'].includes(type)) {
    return Response.json({ error: 'type must be talk, workshop, or interactive' }, { status: 400 });
  }
  if (!body.title || !body.title.trim()) {
    return Response.json({ error: 'title is required' }, { status: 400 });
  }

  const s = v => (v !== undefined && v !== null && v !== '') ? v : null;

  const result = await env.DB.prepare(`
    INSERT INTO symposium_proposals
      (type, slug, track, title, abstract, session, is_shortlisted,
       speaker_name, speaker_email, speaker_website, artifact_type, co_speakers,
       organizer_name, organizer_email, organizer_bio,
       co_organizer_name, co_organizer_email, co_organizer_bio,
       audience, takeaways, activities, max_participants, comments)
    VALUES
      (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    type,
    s(body.slug),
    s(body.track),
    body.title.trim(),
    s(body.abstract),
    body.session || 'General',
    body.is_shortlisted !== undefined ? (body.is_shortlisted ? 1 : 0) : 1,
    s(body.speaker_name),
    s(body.speaker_email),
    s(body.speaker_website),
    s(body.artifact_type),
    s(body.co_speakers),
    s(body.organizer_name),
    s(body.organizer_email),
    s(body.organizer_bio),
    s(body.co_organizer_name),
    s(body.co_organizer_email),
    s(body.co_organizer_bio),
    s(body.audience),
    s(body.takeaways),
    s(body.activities),
    s(body.max_participants),
    s(body.comments),
  ).run();

  return Response.json({ ok: true, id: result.meta.last_row_id });
}
