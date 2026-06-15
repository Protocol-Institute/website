// POST /api/symposium/votes
// Body: { votes: { "<proposal_id>": <n>, ... } }
// Replaces all existing vote allocations for the current member.
// Total votes must not exceed the member's budget (50 for team, 30 for others).

import { getSession } from '../../_shared/session.js';

export async function onRequestPost({ request, env }) {
  const email = await getSession(request, env);
  if (!email) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  const member = await env.DB.prepare(
    'SELECT tier FROM members WHERE email = ? AND is_public = 1'
  ).bind(email).first();
  if (!member) return Response.json({ error: 'Not a member' }, { status: 403 });

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const votesMap = body.votes || {};
  const budget = member.tier === 'team' ? 50 : 30;

  const totalVotes = Object.values(votesMap).reduce((s, n) => s + (parseInt(n) || 0), 0);
  if (totalVotes > budget) {
    return Response.json({ error: `Total votes ${totalVotes} exceeds budget ${budget}` }, { status: 400 });
  }

  // Validate proposal IDs
  const { results: valid } = await env.DB.prepare(
    'SELECT id FROM symposium_proposals WHERE is_shortlisted = 1'
  ).all();
  const validIds = new Set(valid.map(p => p.id));

  // Replace this member's votes
  await env.DB.prepare('DELETE FROM symposium_votes WHERE member_email = ?').bind(email).run();

  for (const [pid, rawVotes] of Object.entries(votesMap)) {
    const id = parseInt(pid);
    const n = parseInt(rawVotes) || 0;
    if (n > 0 && validIds.has(id)) {
      await env.DB.prepare(
        'INSERT INTO symposium_votes (member_email, proposal_id, votes, updated_at) VALUES (?, ?, ?, ?)'
      ).bind(email, id, n, new Date().toISOString()).run();
    }
  }

  return Response.json({ ok: true, total_spent: totalVotes, budget });
}
