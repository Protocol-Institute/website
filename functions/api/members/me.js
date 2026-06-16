// GET /api/members/me
// Returns the authenticated user's own profile + any bot profiles they own
// Requires valid pi_session cookie

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
  if (!email) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Fetch own profile
  const own = await env.DB.prepare('SELECT * FROM members WHERE email = ?').bind(email).first();
  if (!own) {
    const req = await env.DB.prepare(
      'SELECT status FROM membership_requests WHERE email = ?'
    ).bind(email).first();
    if (req && req.status === 'pending') {
      return Response.json({ pending: true, email });
    }
    return Response.json({ error: 'Member not found' }, { status: 404 });
  }
  // Include email so client can reconstruct session state after page reload
  own.email = email;

  // Fetch owned bot profiles
  const { results: owned } = await env.DB.prepare(
    'SELECT * FROM members WHERE owner_email = ?'
  ).bind(email).all();

  return Response.json({ member: own, owned: owned || [] });
}
