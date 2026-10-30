// Access rule for the Institute overview (/pitch): signed-in admins and team
// members (members.is_team). Same pi_session cookie and member lookup as the rest of the site.
import { getSession } from './session.js';
import { memberForSession } from './programs.js';
import { sessionVaryingJson } from './response.js';

/** { role: 'admin' | 'team' | null, signedIn }. signedIn tells 401 from 403. */
export async function pitchAccess(request, env) {
  const email = await getSession(request, env);
  if (!email) return { role: null, signedIn: false };
  const member = await memberForSession(env, email);
  const role = member?.is_admin ? 'admin' : member?.is_team ? 'team' : null;
  return { role, signedIn: true };
}

export function denied(access) {
  return sessionVaryingJson(
    { error: access.signedIn ? 'Forbidden' : 'Unauthorized' },
    { status: access.signedIn ? 403 : 401 }
  );
}
