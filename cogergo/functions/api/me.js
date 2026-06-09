// GET /api/me — same-origin session check for cogergo
// Reads pi_session cookie (domain: .protocol-institute.org) and returns member info.
// Avoids cross-origin fetch to protocol-institute.org/api/members/me.
import { getSessionMember } from '../_shared/auth.js';

export async function onRequestGet({ request, env }) {
  const member = await getSessionMember(request, env).catch(() => null);
  if (!member) return Response.json({ error: 'Not authenticated' }, { status: 401 });
  return Response.json({ member });
}
