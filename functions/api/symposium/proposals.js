// GET /api/symposium/proposals
// Returns all shortlisted proposals with aggregate quadratic-weighted scores
// + the current member's vote allocations and budget
// Requires valid member session

import { getSession } from '../../_shared/session.js';

export async function onRequestGet({ request, env }) {
  const email = await getSession(request, env);
  if (!email) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  const member = await env.DB.prepare(
    'SELECT tier, is_admin, is_early_voter FROM members WHERE email = ? AND is_public = 1'
  ).bind(email).first();
  if (!member) return Response.json({ error: 'Not a member' }, { status: 403 });

  // Proposals with aggregate score:
  //   score = Σ (tier_weight × √votes) for all voters on this proposal
  const { results: proposals } = await env.DB.prepare(`
    SELECT p.*,
      ROUND(COALESCE(SUM(
        CASE m.tier
          WHEN 'team'           THEN 3.0
          WHEN 'community_lead' THEN 2.0
          ELSE 1.0
        END * SQRT(CAST(v.votes AS REAL))
      ), 0), 2) AS score,
      COUNT(DISTINCT v.member_email) AS voter_count,
      COALESCE(SUM(v.votes), 0) AS total_votes,
      (SELECT COUNT(*) FROM symposium_comments c WHERE c.proposal_id = p.id) AS comment_count
    FROM symposium_proposals p
    LEFT JOIN symposium_votes v ON v.proposal_id = p.id AND v.votes > 0
    LEFT JOIN members m ON m.email = v.member_email
    WHERE p.is_shortlisted = 1
    GROUP BY p.id
    ORDER BY p.type ASC, p.id ASC
  `).all();

  // This member's current allocations
  const { results: myVotes } = await env.DB.prepare(
    'SELECT proposal_id, votes FROM symposium_votes WHERE member_email = ?'
  ).bind(email).all();

  const myVoteMap = {};
  let myTotal = 0;
  myVotes.forEach(v => {
    myVoteMap[v.proposal_id] = v.votes;
    myTotal += v.votes;
  });

  const budget = 55;

  return Response.json({
    proposals: proposals || [],
    my_votes: myVoteMap,
    my_total: myTotal,
    budget,
    tier: member.tier,
    is_admin: !!member.is_admin,
    is_early_voter: !!member.is_early_voter,
  });
}
