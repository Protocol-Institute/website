// GET /api/members — public member directory endpoint
// Query params: tag=team|consultant|<event_tag>, type=human|ai
// Returns members with is_public=1, never includes email field

import { VALID_TAGS, TAG_ALIASES } from '../_shared/tags.js';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const tagParam = url.searchParams.get('tag');
  const typeParam = url.searchParams.get('type');

  let tagColumn = null;
  if (tagParam) {
    tagColumn = TAG_ALIASES[tagParam] ?? (VALID_TAGS.includes(tagParam) ? tagParam : null);
    if (!tagColumn) {
      return Response.json({ error: 'Invalid tag' }, { status: 400 });
    }
  }

  let query = `
    SELECT slug, name, bio, website, type, photo_r2_key,
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

  if (tagColumn) {
    query += ` AND ${tagColumn} = 1`;
  }
  if (typeParam === 'human' || typeParam === 'ai') {
    query += ` AND type = ?`;
    bindings.push(typeParam);
  }

  query += ` ORDER BY is_team DESC, name ASC`;

  try {
    const { results } = await env.DB.prepare(query).bind(...bindings).all();
    return Response.json({ members: results });
  } catch (err) {
    console.error('D1 query error:', err);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}
