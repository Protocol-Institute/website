// GET /api/symposium/analytics
// Admin-only. Returns registration + voting summary for the symposium dashboard.

import { getSession } from '../../_shared/session.js';

export async function onRequestGet({ request, env }) {
  const email = await getSession(request, env);
  if (!email) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  const member = await env.DB.prepare(
    'SELECT is_admin FROM members WHERE email = ?'
  ).bind(email).first();
  if (!member || !member.is_admin) {
    return Response.json({ error: 'Admin access required' }, { status: 403 });
  }

  const stats = await env.DB.prepare(`
    SELECT
      (SELECT COUNT(*) FROM members WHERE is_public = 1) as total_members,
      (SELECT COUNT(DISTINCT member_email) FROM symposium_votes WHERE votes > 0) as total_voters,
      (SELECT COALESCE(SUM(votes), 0) FROM symposium_votes) as total_votes_cast
  `).first();

  const { results } = await env.DB.prepare(`
    SELECT
      m.name,
      m.email,
      m.created_at          as registered_at,
      COALESCE(vs.save_count, 0)    as save_count,
      COALESCE(vs.last_saved_at, NULL) as last_saved_at,
      COALESCE(SUM(sv.votes), 0)    as votes_placed,
      COALESCE(MAX(sv.votes), 0)    as max_vote,
      COUNT(CASE WHEN sv.votes > 0 THEN 1 END) as proposals_touched
    FROM members m
    LEFT JOIN symposium_vote_saves vs ON vs.member_email = m.email
    LEFT JOIN symposium_votes sv ON sv.member_email = m.email
    WHERE m.is_public = 1
    GROUP BY m.email, m.name, m.created_at, vs.save_count, vs.last_saved_at
    ORDER BY m.created_at DESC
  `).all();

  return Response.json({
    generated_at: new Date().toISOString(),
    stats: {
      total_members:    stats.total_members,
      total_voters:     stats.total_voters,
      total_votes_cast: stats.total_votes_cast,
      ratio:            stats.total_members > 0
                          ? Math.round((stats.total_voters / stats.total_members) * 1000) / 1000
                          : 0
    },
    registrants: results.map(r => ({
      name:             r.name,
      email:            r.email,
      registered_at:    r.registered_at,
      save_count:       r.save_count,
      last_saved_at:    r.last_saved_at,
      votes_placed:     r.votes_placed,
      proposals_touched: r.proposals_touched,
      // Indifference: voted but never put more than 1 vote on any single proposal
      is_indifferent:   r.votes_placed > 0 && r.max_vote <= 1
    }))
  });
}
