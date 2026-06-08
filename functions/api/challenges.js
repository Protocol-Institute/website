// GET /api/challenges — public list, sorted by challenge value desc
// POST /api/challenges — create a challenge (requires valid pi_session)

const VALID_DIFFICULTY = new Set([1, 2, 3, 5, 8, 13, 21, 34, 55, 89]);

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

export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(`
      SELECT c.id, c.title, c.description, c.posed_by_slug,
             c.difficulty, c.interesting, c.created_at,
             m.name AS posed_by_name
      FROM challenges c
      LEFT JOIN members m ON m.slug = c.posed_by_slug
      ORDER BY (c.interesting * c.interesting * c.difficulty) DESC, c.created_at DESC
    `).all();
    return Response.json({ challenges: results || [] });
  } catch (err) {
    console.error('challenges GET error:', err);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  const email = await getSession(request, env);
  if (!email) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  const member = await env.DB.prepare(
    'SELECT slug, name FROM members WHERE email = ?'
  ).bind(email).first();
  if (!member) return Response.json({ error: 'Member not found' }, { status: 404 });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const title = (body.title || '').trim();
  const description = (body.description || '').trim();
  const difficulty = Number(body.difficulty);

  if (!title) return Response.json({ error: 'Title required' }, { status: 400 });
  if (!description) return Response.json({ error: 'Description required' }, { status: 400 });
  if (!VALID_DIFFICULTY.has(difficulty)) {
    return Response.json({ error: 'Difficulty must be a Fibonacci planning-poker value' }, { status: 400 });
  }

  try {
    const result = await env.DB.prepare(`
      INSERT INTO challenges (title, description, posed_by_slug, difficulty)
      VALUES (?, ?, ?, ?)
    `).bind(title, description, member.slug, difficulty).run();
    return Response.json({ id: result.meta.last_row_id }, { status: 201 });
  } catch (err) {
    console.error('challenges POST error:', err);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}
