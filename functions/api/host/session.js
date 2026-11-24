// GET /api/host/session — who is signed in, for an app on an Institute subdomain.
//
// The app forwards the visitor's Cookie header unchanged and adds the host API secret.
// 200 { person } for an approved member with a valid pi_session; 401 otherwise, with the
// same body whether the cookie was missing, expired, forged or belongs to a pending
// applicant, so the answer never says which.

import { getSession } from '../../_shared/session.js';
import { authorizedApp, hostPerson, unauthorized, PERSON_COLUMNS } from '../../_shared/host-api.js';
import { sessionVaryingJson } from '../../_shared/response.js';

export async function onRequestGet({ request, env }) {
  if (!await authorizedApp(request, env)) return unauthorized();
  const email = await getSession(request, env);
  if (!email) return unauthorized();
  const row = await env.DB.prepare(`SELECT ${PERSON_COLUMNS} FROM members WHERE email = ?`).bind(email).first();
  if (!row) return unauthorized();
  return sessionVaryingJson({ person: await hostPerson(env, row, new URL(request.url).origin) });
}
