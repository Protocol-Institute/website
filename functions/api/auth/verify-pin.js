// POST /api/auth/verify-pin
// Body: { email: string, pin: string }
// Validates PIN, sets 24h session cookie

const SESSION_TTL_HOURS = 24;

async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function generateSessionToken() {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  const pin = (body.pin || '').trim();

  if (!email || !pin) {
    return Response.json({ error: 'Email and PIN required' }, { status: 400 });
  }

  const record = await env.DB.prepare(
    'SELECT pin_hash, expires_at FROM auth_pins WHERE email = ?'
  ).bind(email).first();

  if (!record) {
    return Response.json({ error: 'Invalid code' }, { status: 401 });
  }

  if (new Date(record.expires_at) < new Date()) {
    await env.DB.prepare('DELETE FROM auth_pins WHERE email = ?').bind(email).run();
    return Response.json({ error: 'Code expired' }, { status: 401 });
  }

  const pinHash = await hashPin(pin);
  if (pinHash !== record.pin_hash) {
    return Response.json({ error: 'Invalid code' }, { status: 401 });
  }

  // PIN valid — delete it (single use) and issue session token
  await env.DB.prepare('DELETE FROM auth_pins WHERE email = ?').bind(email).run();

  const token = await generateSessionToken();
  const tokenHash = await hashPin(token); // reuse same SHA-256 helper
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 3600 * 1000).toISOString();

  // Store session in D1 (reuse auth_pins table with long TTL)
  await env.DB.prepare(
    'INSERT OR REPLACE INTO auth_pins (email, pin_hash, expires_at) VALUES (?, ?, ?)'
  ).bind(`session:${email}`, tokenHash, expiresAt).run();

  const cookieExpires = new Date(Date.now() + SESSION_TTL_HOURS * 3600 * 1000).toUTCString();

  return new Response(JSON.stringify({ ok: true, email }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `pi_session=${token}:${encodeURIComponent(email)}; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=${cookieExpires}`,
    },
  });
}
