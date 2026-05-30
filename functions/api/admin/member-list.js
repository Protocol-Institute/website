// GET /api/admin/member-list
// Returns full profile data for all members, for the admin profile selector
// Requires a valid session belonging to an is_admin member

async function sha256hex(str) {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(str));
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getSession(request, env) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/pi_session=([^;]+)/);
  if (!match) return null;

  const sessionValue = decodeURIComponent(match[1]);
  const colonIdx = sessionValue.indexOf(':');
  if (colonIdx === -1) return null;

  const token = sessionValue.slice(0, colonIdx);
  const email = sessionValue.slice(colonIdx + 1);

  const record = await env.DB.prepare(
    'SELECT pin_hash, expires_at FROM auth_pins WHERE email = ?'
  ).bind(`session:${email}`).first();

  if (!record || new Date(record.expires_at) < new Date()) return null;

  const tokenHash = await sha256hex(token);
  if (tokenHash !== record.pin_hash) return null;

  return email;
}

export async function onRequestGet({ request, env }) {
  const email = await getSession(request, env);
  if (!email) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  const me = await env.DB.prepare(
    'SELECT is_admin FROM members WHERE email = ?'
  ).bind(email).first();
  if (!me || !me.is_admin) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const { results } = await env.DB.prepare(
    'SELECT * FROM members ORDER BY is_team DESC, name ASC'
  ).all();

  // Attach email field so client can reconstruct identity
  const members = (results || []).map(m => ({ ...m, email: m.email }));
  return Response.json({ members });
}
