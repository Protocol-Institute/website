// POST /api/symposium/votes
// Body: { votes: { "<proposal_id>": <n>, ... } }
// Replaces all existing vote allocations for the current member.

import { getSession } from '../../_shared/session.js';

const VOTE_START    = new Date('2026-06-17T14:00:00Z'); // June 17, 7 AM PDT
const VOTE_DEADLINE = new Date('2026-06-20T14:00:00Z'); // June 20, 7 AM PDT

export async function onRequestPost({ request, env }) {
  const email = await getSession(request, env);
  if (!email) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  const member = await env.DB.prepare(
    'SELECT tier, is_early_voter FROM members WHERE email = ? AND is_public = 1'
  ).bind(email).first();
  if (!member) return Response.json({ error: 'Not a member' }, { status: 403 });

  const now = new Date();
  const isEarlyVoter = !!member.is_early_voter;
  if (now > VOTE_DEADLINE) {
    return Response.json({ error: 'Voting closed on June 20, 2026.' }, { status: 403 });
  }
  if (!isEarlyVoter && now < VOTE_START) {
    return Response.json({ error: 'Voting has not opened yet.' }, { status: 403 });
  }

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const votesMap = body.votes || {};
  const budget = 55;

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

  const savedAt = now.toISOString();

  for (const [pid, rawVotes] of Object.entries(votesMap)) {
    const id = parseInt(pid);
    const n = parseInt(rawVotes) || 0;
    if (n > 0 && validIds.has(id)) {
      await env.DB.prepare(
        'INSERT INTO symposium_votes (member_email, proposal_id, votes, updated_at) VALUES (?, ?, ?, ?)'
      ).bind(email, id, n, savedAt).run();
    }
  }

  await env.DB.prepare(`
    INSERT INTO symposium_vote_saves (member_email, save_count, last_saved_at)
    VALUES (?, 1, ?)
    ON CONFLICT(member_email) DO UPDATE SET
      save_count    = save_count + 1,
      last_saved_at = excluded.last_saved_at
  `).bind(email, savedAt).run();

  return Response.json({ ok: true, total_spent: totalVotes, budget });
}
