// GET /api/members — public member directory endpoint
// Query params: tag=team|community_lead|consultant|<event_tag>, type=human|ai
// Returns members with is_public=1, never includes email field

import { VALID_TAGS, TAG_ALIASES } from '../_shared/tags.js';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const tagParam = url.searchParams.get('tag');
  const typeParam = url.searchParams.get('type');

  if (tagParam && !VALID_TAGS.includes(tagParam) && !TAG_ALIASES[tagParam]) {
    return Response.json({ error: 'Invalid tag' }, { status: 400 });
  }

  let query = `
    SELECT slug, name, bio, website, type, photo_r2_key,
           tier, community_lead_title,
           is_team, is_consultant, team_title,
           city, discord_handle,
           tag_sop23, tag_sop24, tag_sop25, tag_ps25,
           tag_datus_nusas, tag_khlongs_subaks, tag_town_hall,
           tag_sig, tag_protocol_kit, tag_protocolized_writer,
           consulting_expertise, consulting_contact, consulting_portfolio
    FROM members
    WHERE is_public = 1
  `;
  const bindings = [];

  if (tagParam === 'team') {
    query += ` AND tier = 'team'`;
  } else if (tagParam === 'community_lead') {
    query += ` AND tier = 'community_lead'`;
  } else if (tagParam === 'consultant') {
    query += ` AND is_consultant = 1`;
  } else if (tagParam) {
    const col = TAG_ALIASES[tagParam] ?? tagParam;
    query += ` AND ${col} = 1`;
  }

  if (typeParam === 'human' || typeParam === 'ai') {
    query += ` AND type = ?`;
    bindings.push(typeParam);
  }

  query += ` ORDER BY CASE tier WHEN 'team' THEN 0 WHEN 'community_lead' THEN 1 ELSE 2 END, name ASC`;

  try {
    const { results } = await env.DB.prepare(query).bind(...bindings).all();
    return Response.json({ members: results });
  } catch (err) {
    console.error('D1 query error:', err);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}
