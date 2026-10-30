// Access rule for the Institute overview (/pitch): signed-in admins and team
// members (members.is_team). Uses the same pi_session cookie as the rest of the site.
import { getSession } from './session.js';

/** 'admin' | 'team' | null (not signed in, or signed in without access). Second value tells 401 from 403. */
export async function pitchAccess(request, env) {
  const email = await getSession(request, env);
  if (!email) return { role: null, signedIn: false };
  const m = await env.DB.prepare('SELECT is_admin, is_team FROM members WHERE email = ?').bind(email).first();
  const role = m?.is_admin ? 'admin' : m?.is_team ? 'team' : null;
  return { role, signedIn: true };
}

export function denied(access) {
  return Response.json(
    { error: access.signedIn ? 'Forbidden' : 'Unauthorized' },
    { status: access.signedIn ? 403 : 401, headers: { 'Cache-Control': 'private, no-store' } }
  );
}
