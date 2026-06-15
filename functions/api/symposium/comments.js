// GET /api/symposium/comments?proposal_id=N  — fetch comments for a proposal
// POST /api/symposium/comments               — post a new comment
// Both require valid member session

import { getSession } from '../../_shared/session.js';

export async function onRequestGet({ request, env }) {
  const email = await getSession(request, env);
  if (!email) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  const url = new URL(request.url);
  const proposalId = parseInt(url.searchParams.get('proposal_id'));
  if (!proposalId) return Response.json({ error: 'proposal_id required' }, { status: 400 });

  const { results } = await env.DB.prepare(
    `SELECT id, member_name, body, created_at
     FROM symposium_comments WHERE proposal_id = ? ORDER BY created_at ASC`
  ).bind(proposalId).all();

  return Response.json({ comments: results || [] });
}

export async function onRequestPost({ request, env }) {
  const email = await getSession(request, env);
  if (!email) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  const member = await env.DB.prepare(
    'SELECT name FROM members WHERE email = ? AND is_public = 1'
  ).bind(email).first();
  if (!member) return Response.json({ error: 'Not a member' }, { status: 403 });

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { proposal_id, body: text } = body;
  if (!proposal_id || !text?.trim()) {
    return Response.json({ error: 'proposal_id and body required' }, { status: 400 });
  }

  const proposal = await env.DB.prepare(
    'SELECT id FROM symposium_proposals WHERE id = ? AND is_shortlisted = 1'
  ).bind(parseInt(proposal_id)).first();
  if (!proposal) return Response.json({ error: 'Proposal not found' }, { status: 404 });

  await env.DB.prepare(
    'INSERT INTO symposium_comments (proposal_id, member_email, member_name, body) VALUES (?, ?, ?, ?)'
  ).bind(parseInt(proposal_id), email, member.name, text.trim()).run();

  return Response.json({ ok: true });
}
