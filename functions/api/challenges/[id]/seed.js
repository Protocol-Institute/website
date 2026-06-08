// PATCH /api/challenges/:id/seed — admin-only, update seed_interesting baseline

async function sha256hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getSession(request, env) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/pi_session=([^;]+)/);
  if (!match) return null;
  const val = decodeURIComponent(match[1]);
  const colonIdx = val.indexOf(':');
  if (colonIdx === -1) return null;
  const token = val.slice(0, colonIdx);
  const email = val.slice(colonIdx + 1);
  const record = await env.DB.prepare(
    'SELECT pin_hash, expires_at FROM auth_pins WHERE email = ?'
  ).bind(`session:${email}`).first();
  if (!record || new Date(record.expires_at) < new Date()) return null;
  if (await sha256hex(token) !== record.pin_hash) return null;
  return email;
}

export async function onRequestPatch({ params, request, env }) {
  const email = await getSession(request, env);
  if (!email) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  const member = await env.DB.prepare('SELECT is_admin FROM members WHERE email = ?').bind(email).first();
  if (!member?.is_admin) return Response.json({ error: 'Forbidden' }, { status: 403 });

  const id = parseInt(params.id, 10);
  if (!id || isNaN(id)) return Response.json({ error: 'Invalid id' }, { status: 400 });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const seed = parseInt(body.seed, 10);
  if (isNaN(seed) || seed < 0) {
    return Response.json({ error: 'seed must be a non-negative integer' }, { status: 400 });
  }

  const result = await env.DB.prepare(
    'UPDATE challenges SET seed_interesting = ? WHERE id = ?'
  ).bind(seed, id).run();

  if (!result.meta.changes) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ seed_interesting: seed });
}
