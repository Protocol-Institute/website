// GET /api/challenges — public list, sorted by challenge value desc; session-aware (voted_by_me)
// POST /api/challenges — create a challenge (requires valid pi_session)
//
// Challenge value formula: A*anon² + B*(member+seed)²  where A=1, B=3

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

function escText(s) {
  return String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

// Allow only <a href="https://...">text</a>; strip all other HTML; convert \n to <br>.
function sanitizeDescription(raw) {
  const links = [];
  let s = String(raw || '').slice(0, 3000);
  s = s.replace(
    /<a\s+href="(https?:\/\/[^"<>\s]{1,512})"[^>]*>([^<]{1,300})<\/a>/gi,
    (_, href, text) => {
      const i = links.length;
      links.push(`<a href="${escText(href)}" target="_blank" rel="noopener noreferrer">${escText(text)}</a>`);
      return `\x00${i}\x00`;
    }
  );
  s = s.replace(/<[^>]*>/g, '');   // strip remaining tags
  s = escText(s);                   // escape entities in plain text
  s = s.replace(/\x00(\d+)\x00/g, (_, i) => links[parseInt(i, 10)]);  // restore links
  s = s.replace(/\n/g, '<br>');
  return s;
}

export async function onRequestGet({ request, env }) {
  const email = await getSession(request, env);

  let myVotes = new Set();
  let isAdmin = false;
  if (email) {
    try {
      const [voteRows, memberRow] = await Promise.all([
        env.DB.prepare('SELECT challenge_id FROM challenge_votes WHERE email = ?').bind(email).all(),
        env.DB.prepare('SELECT is_admin FROM members WHERE email = ?').bind(email).first(),
      ]);
      myVotes = new Set((voteRows.results || []).map(v => v.challenge_id));
      isAdmin = !!(memberRow?.is_admin);
    } catch {}
  }

  try {
    const { results } = await env.DB.prepare(`
      SELECT c.id, c.title, c.description, c.posed_by, c.communicated_by_slug,
             c.difficulty, c.anon_interesting, c.member_interesting, c.seed_interesting, c.created_at,
             m.name AS communicated_by_name
      FROM challenges c
      LEFT JOIN members m ON m.slug = c.communicated_by_slug
      ORDER BY (
        c.seed_interesting +
        1 * c.anon_interesting * c.anon_interesting +
        3 * c.member_interesting * c.member_interesting
      ) DESC, c.created_at DESC
    `).all();

    const challenges = (results || []).map(c => ({
      ...c,
      voted_by_me: myVotes.has(c.id),
    }));

    return Response.json({ challenges, is_admin: isAdmin });
  } catch (err) {
    console.error('challenges GET error:', err);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  const email = await getSession(request, env);
  if (!email) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  const member = await env.DB.prepare(
    'SELECT slug, name, is_admin FROM members WHERE email = ?'
  ).bind(email).first();
  if (!member) return Response.json({ error: 'Member not found' }, { status: 404 });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const title = (body.title || '').trim();
  const rawDesc = (body.description || '').trim();
  const posed_by = (body.posed_by || '').trim() || null;
  const difficulty = Number(body.difficulty);

  if (!title) return Response.json({ error: 'Title required' }, { status: 400 });
  if (!rawDesc) return Response.json({ error: 'Description required' }, { status: 400 });
  if (!VALID_DIFFICULTY.has(difficulty)) {
    return Response.json({ error: 'Difficulty must be a Fibonacci planning-poker value' }, { status: 400 });
  }

  const description = sanitizeDescription(rawDesc);

  let seed = 1;
  if (member.is_admin && body.seed_interesting !== undefined) {
    const s = parseInt(body.seed_interesting, 10);
    if (!isNaN(s) && s >= 0) seed = s;
  }

  try {
    const result = await env.DB.prepare(`
      INSERT INTO challenges (title, description, posed_by, posed_by_slug, communicated_by_slug, difficulty, seed_interesting)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(title, description, posed_by, member.slug, member.slug, difficulty, seed).run();
    return Response.json({ id: result.meta.last_row_id }, { status: 201 });
  } catch (err) {
    console.error('challenges POST error:', err);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}
