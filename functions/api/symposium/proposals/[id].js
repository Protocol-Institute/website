// GET   /api/symposium/proposals/:id — public, returns full proposal record
//       (including its workshop_sessions, if any)
// PATCH /api/symposium/proposals/:id — owners: title+abstract only; admins: all fields

import { getSession } from '../../../_shared/session.js';

const ALL_FIELDS = [
  'type', 'slug', 'track', 'title', 'abstract', 'session', 'is_shortlisted',
  'speaker_name', 'speaker_email', 'speaker_website', 'artifact_type', 'co_speakers',
  'organizer_name', 'organizer_email', 'organizer_bio',
  'co_organizer_name', 'co_organizer_email', 'co_organizer_bio',
  'host3_name', 'host3_email', 'host3_bio',
  'host4_name', 'host4_email', 'host4_bio',
  'host5_name', 'host5_email', 'host5_bio',
  'audience', 'takeaways', 'activities', 'comments', 'max_participants',
];

async function resolve(request, env, id) {
  const email = await getSession(request, env);
  if (!email) return { err: 'Not authenticated', status: 401 };
  const [proposal, member] = await Promise.all([
    env.DB.prepare('SELECT * FROM symposium_proposals WHERE id = ?').bind(id).first(),
    env.DB.prepare('SELECT is_admin FROM members WHERE email = ?').bind(email).first(),
  ]);
  if (!proposal) return { err: 'Not found',     status: 404 };
  if (!member)   return { err: 'Not a member',  status: 403 };
  return { email, proposal, member, isAdmin: !!member.is_admin };
}

export async function onRequestGet({ env, params }) {
  const id = parseInt(params.id);
  if (!id) return Response.json({ error: 'Invalid ID' }, { status: 400 });

  const proposal = await env.DB.prepare('SELECT * FROM symposium_proposals WHERE id = ?').bind(id).first();
  if (!proposal) return Response.json({ error: 'Not found' }, { status: 404 });

  if (proposal.type === 'workshop') {
    const { results } = await env.DB.prepare(
      'SELECT seq, date, start_time, end_time, note FROM symposium_workshop_sessions WHERE proposal_id = ? ORDER BY seq ASC'
    ).bind(id).all();
    proposal.workshop_sessions = results || [];
  }

  return Response.json({ proposal });
}

export async function onRequestPatch({ request, env, params }) {
  const id = parseInt(params.id);
  if (!id) return Response.json({ error: 'Invalid ID' }, { status: 400 });

  const auth = await resolve(request, env, id);
  if (auth.err) return Response.json({ error: auth.err }, { status: auth.status });

  const { email, proposal, isAdmin } = auth;
  const isOwner = email === (proposal.speaker_email || '').trim().toLowerCase()
               || email === (proposal.organizer_email || '').trim().toLowerCase();
  if (!isAdmin && !isOwner) return Response.json({ error: 'Not authorized' }, { status: 403 });

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const allowed = isAdmin ? ALL_FIELDS : ['title', 'abstract'];
  const sets = [], vals = [];
  for (const field of allowed) {
    if (body[field] === undefined) continue;
    const v = body[field];
    if (field === 'title' && (v === null || String(v).trim() === '')) {
      return Response.json({ error: 'Title cannot be empty' }, { status: 400 });
    }
    sets.push(`${field} = ?`);
    vals.push(v === '' ? null : v);
  }
  if (!sets.length) return Response.json({ error: 'Nothing to update' }, { status: 400 });
  vals.push(id);

  await env.DB.prepare(
    `UPDATE symposium_proposals SET ${sets.join(', ')} WHERE id = ?`
  ).bind(...vals).run();

  return Response.json({ ok: true });
}
