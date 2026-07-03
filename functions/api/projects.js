// GET  /api/projects — public list of approved projects, optional ?program= filter
// POST /api/projects — submit a new project (requires pi_session)

const VALID_STATES        = new Set(['stub', 'beta', 'production']);
const VALID_TYPES         = new Set(['one-off', 'versioned', 'accretive']);
const VALID_ARTIFACT_TYPES = new Set(['text', 'code', 'website', 'rich_media', 'other']);
const VALID_THEMES        = new Set(['sigfpt', 'mrg', 'sigpfb', 'protfisig', 'drg', 'sigpsy', 'solo']);

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

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64);
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const program = url.searchParams.get('program') || null;

  try {
    let query, binds;
    if (program) {
      query = `
        SELECT p.*, m.name AS lead_name
        FROM projects p
        LEFT JOIN members m ON m.slug = p.lead_slug
        WHERE p.status = 'approved' AND p.program = ?
        ORDER BY p.created_at DESC
      `;
      binds = [program];
    } else {
      query = `
        SELECT p.*, m.name AS lead_name
        FROM projects p
        LEFT JOIN members m ON m.slug = p.lead_slug
        WHERE p.status = 'approved'
        ORDER BY p.created_at DESC
      `;
      binds = [];
    }

    const { results } = await env.DB.prepare(query).bind(...binds).all();
    const projects = (results || []).map(p => ({
      ...p,
      themes: p.themes ? JSON.parse(p.themes) : [],
    }));
    return Response.json({ projects });
  } catch (err) {
    console.error('projects GET error:', err);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  const email = await getSession(request, env);
  if (!email) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  const member = await env.DB.prepare(
    'SELECT slug FROM members WHERE email = ?'
  ).bind(email).first();
  if (!member) return Response.json({ error: 'Member not found' }, { status: 404 });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const title         = (body.title || '').trim();
  const description   = (body.description || '').trim();
  const lead_slug     = (body.lead_slug || '').trim();
  const program       = (body.program || null) || null;
  const state         = (body.state || '').trim();
  const type          = (body.type || '').trim();
  const artifact_type = (body.artifact_type || '').trim();
  const artifact_type_other = artifact_type === 'other' ? (body.artifact_type_other || '').trim() : null;
  const url             = (body.url || '').trim();
  const sub_program     = (body.sub_program || null) || null;
  const current_version = type === 'versioned' ? ((body.current_version || '').trim() || null) : null;
  const themes = Array.isArray(body.themes)
    ? JSON.stringify(body.themes.filter(t => VALID_THEMES.has(t)))
    : null;

  if (!title)       return Response.json({ error: 'Title required' }, { status: 400 });
  if (!description) return Response.json({ error: 'Description required' }, { status: 400 });
  if (!lead_slug)   return Response.json({ error: 'Lead required' }, { status: 400 });
  if (!VALID_STATES.has(state))        return Response.json({ error: 'Invalid state' }, { status: 400 });
  if (!VALID_TYPES.has(type))          return Response.json({ error: 'Invalid type' }, { status: 400 });
  if (!VALID_ARTIFACT_TYPES.has(artifact_type)) return Response.json({ error: 'Invalid artifact type' }, { status: 400 });
  if (artifact_type === 'other' && !artifact_type_other) return Response.json({ error: 'Specify artifact type' }, { status: 400 });
  if (!url) return Response.json({ error: 'URL required' }, { status: 400 });

  // Lead must be an existing member
  const lead = await env.DB.prepare('SELECT slug FROM members WHERE slug = ?').bind(lead_slug).first();
  if (!lead) return Response.json({ error: 'Lead member not found' }, { status: 400 });

  // Generate a unique slug from the title
  const baseSlug = slugify(title);
  let slug = baseSlug;
  let attempt = 0;
  while (true) {
    const existing = await env.DB.prepare('SELECT id FROM projects WHERE slug = ?').bind(slug).first();
    if (!existing) break;
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  try {
    await env.DB.prepare(`
      INSERT INTO projects
        (slug, title, description, lead_slug, program, sub_program, state, type, artifact_type, artifact_type_other, url, current_version, themes, submitted_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(slug, title, description, lead_slug, program, sub_program, state, type, artifact_type, artifact_type_other, url, current_version, themes, email).run();

    return Response.json({ ok: true, slug }, { status: 201 });
  } catch (err) {
    console.error('projects POST error:', err);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}
