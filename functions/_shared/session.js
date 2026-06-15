// Shared session authentication — validates pi_session cookie against auth_pins

async function sha256hex(str) {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(str));
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function getSession(request, env) {
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
