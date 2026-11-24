// GET /api/host/people/{slug} — one member, for an app refreshing a byline or checking
// that someone still holds a group. Host API secret required. 404 for an unknown slug.

import { authorizedApp, hostPerson, notFound, unauthorized, PERSON_COLUMNS } from '../../../_shared/host-api.js';
import { sessionVaryingJson } from '../../../_shared/response.js';

export async function onRequestGet({ request, env, params }) {
  if (!await authorizedApp(request, env)) return unauthorized();
  const row = await env.DB.prepare(`SELECT ${PERSON_COLUMNS} FROM members WHERE slug = ?`).bind(params.slug).first();
  if (!row) return notFound();
  return sessionVaryingJson({ person: await hostPerson(env, row, new URL(request.url).origin) });
}
