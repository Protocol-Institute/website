// GET /api/symposium/proposals
// Returns all shortlisted proposals with aggregate quadratic-weighted scores.
// Public: no auth required. If authenticated, also returns my_votes, budget, tier, is_admin.
//
// Contact emails are never returned to anyone — the program is a public page, so
// speaker/organizer/host addresses must not ride along in the payload. Ownership is
// reported as a computed `is_owner` flag instead. Vote aggregates are member
// deliberation data and are returned only to authenticated members.

import { getSession } from '../../_shared/session.js';
import { sessionVaryingJson } from '../../_shared/response.js';

// Allowlist, not a denylist: a column added to symposium_proposals later is
// withheld until it is listed here, rather than silently published.
const PUBLIC_FIELDS = [
  'id', 'type', 'slug', 'track', 'title', 'abstract', 'session', 'is_shortlisted',
  'speaker_name', 'speaker_website', 'artifact_type', 'co_speakers',
  'organizer_name', 'organizer_bio',
  'co_organizer_name', 'co_organizer_bio',
  'host3_name', 'host3_bio',
  'host4_name', 'host4_bio',
  'host5_name', 'host5_bio',
  'audience', 'takeaways', 'activities', 'max_participants',
  'created_at', 'scheduled_date', 'scheduled_time_utc', 'scheduled_end_time_utc',
  'registration_url', 'schedule_track',
  'comment_count', 'workshop_sessions',
];

// Withheld from the public payload; released to authenticated members only.
const MEMBER_FIELDS = ['score', 'voter_count', 'total_votes'];

function normalize(v) {
  return (v || '').trim().toLowerCase();
}

// Matches the ownership test used by PATCH /api/symposium/proposals/:id
function isOwner(proposal, email) {
  const e = normalize(email);
  if (!e) return false;
  return normalize(proposal.speaker_email) === e || normalize(proposal.organizer_email) === e;
}

function publicView(proposal, { includeVotes = false, viewerEmail = null } = {}) {
  const out = {};
  for (const field of PUBLIC_FIELDS) {
    if (proposal[field] !== undefined) out[field] = proposal[field];
  }
  if (includeVotes) {
    for (const field of MEMBER_FIELDS) out[field] = proposal[field];
  }
  if (viewerEmail) out.is_owner = isOwner(proposal, viewerEmail);
  return out;
}

export async function onRequestGet({ request, env }) {
  const email = await getSession(request, env);

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

  const { results: workshopSessions } = await env.DB.prepare(
    'SELECT proposal_id, seq, date, start_time, end_time, note FROM symposium_workshop_sessions ORDER BY proposal_id ASC, seq ASC'
  ).all();
  const sessionsByProposal = {};
  (workshopSessions || []).forEach(s => {
    (sessionsByProposal[s.proposal_id] = sessionsByProposal[s.proposal_id] || []).push(s);
  });
  (proposals || []).forEach(p => {
    if (p.type === 'workshop') p.workshop_sessions = sessionsByProposal[p.id] || [];
  });

  const rows = proposals || [];
  const project = opts => rows.map(p => publicView(p, opts));

  // Public response when not authenticated
  if (!email) return sessionVaryingJson({ proposals: project() });

  const member = await env.DB.prepare(
    'SELECT tier, is_admin, is_early_voter FROM members WHERE email = ? AND is_public = 1'
  ).bind(email).first();

  // Unknown/non-member session: still return proposals publicly
  if (!member) return sessionVaryingJson({ proposals: project() });

  // Authenticated member: include their vote allocations and budget
  const { results: myVotes } = await env.DB.prepare(
    'SELECT proposal_id, votes FROM symposium_votes WHERE member_email = ?'
  ).bind(email).all();

  const myVoteMap = {};
  let myTotal = 0;
  myVotes.forEach(v => {
    myVoteMap[v.proposal_id] = v.votes;
    myTotal += v.votes;
  });

  return sessionVaryingJson({
    proposals: project({ includeVotes: true, viewerEmail: email }),
    my_votes: myVoteMap,
    my_total: myTotal,
    budget: 55,
    tier: member.tier,
    is_admin: !!member.is_admin,
    is_early_voter: !!member.is_early_voter,
  });
}
