// POST /api/challenges/:id/interesting
// Member votes: tracked in challenge_votes table (one per member).
// Anon votes: checked and recorded via pi_chal_voted cookie (comma-separated IDs).
// Raw anon/member counts stored separately for reweighted scoring.

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

export async function onRequestPost({ params, request, env }) {
  const id = parseInt(params.id, 10);
  if (!id || isNaN(id)) return Response.json({ error: 'Invalid id' }, { status: 400 });

  const challenge = await env.DB.prepare('SELECT id FROM challenges WHERE id = ?').bind(id).first();
  if (!challenge) return Response.json({ error: 'Not found' }, { status: 404 });

  const email = await getSession(request, env);
  let setCookie = null;

  if (email) {
    // Member vote — deduplicated in DB
    const existing = await env.DB.prepare(
      'SELECT 1 FROM challenge_votes WHERE challenge_id = ? AND email = ?'
    ).bind(id, email).first();
    if (existing) return Response.json({ error: 'Already voted' }, { status: 409 });

    await env.DB.batch([
      env.DB.prepare('INSERT INTO challenge_votes (challenge_id, email) VALUES (?, ?)').bind(id, email),
      env.DB.prepare('UPDATE challenges SET member_interesting = member_interesting + 1 WHERE id = ?').bind(id),
    ]);
  } else {
    // Anon vote — deduplicated via cookie
    const cookieHeader = request.headers.get('Cookie') || '';
    const m = cookieHeader.match(/pi_chal_voted=([^;]+)/);
    const votedStr = m ? decodeURIComponent(m[1]) : '';
    const voted = votedStr ? votedStr.split(',').map(Number).filter(Boolean) : [];

    if (voted.includes(id)) return Response.json({ error: 'Already voted' }, { status: 409 });

    await env.DB.prepare(
      'UPDATE challenges SET anon_interesting = anon_interesting + 1 WHERE id = ?'
    ).bind(id).run();

    const updated = [...voted, id].join(',');
    setCookie = `pi_chal_voted=${encodeURIComponent(updated)}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }

  const row = await env.DB.prepare(
    'SELECT anon_interesting, member_interesting, seed_interesting FROM challenges WHERE id = ?'
  ).bind(id).first();

  const headers = { 'Content-Type': 'application/json' };
  if (setCookie) headers['Set-Cookie'] = setCookie;
  return new Response(JSON.stringify(row), { headers });
}
