// Access rule for the Institute overview (/pitch). Read: researcher or above — admins,
// team (is_team or tier 'team'), research leads (tier 'community_lead') and anyone tagged
// Researcher (tag_sig). Editing is admin-only (api/pages canEdit). Same pi_session cookie
// and member lookup as the rest of the site.
import { getSession } from './session.js';
import { memberForSession } from './programs.js';
import { sessionVaryingJson } from './response.js';

/** { role: 'admin' | 'reader' | null, signedIn }. signedIn tells 401 from 403. */
export async function pitchAccess(request, env) {
  const email = await getSession(request, env);
  if (!email) return { role: null, signedIn: false };
  const member = await memberForSession(env, email);
  const reader = member && (member.is_team || member.tag_sig || member.tier === 'team' || member.tier === 'community_lead');
  const role = member?.is_admin ? 'admin' : reader ? 'reader' : null;
  return { role, signedIn: true };
}

export function denied(access) {
  return sessionVaryingJson(
    { error: access.signedIn ? 'Forbidden' : 'Unauthorized' },
    { status: access.signedIn ? 403 : 401 }
  );
}
