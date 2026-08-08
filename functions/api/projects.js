// GET  /api/projects — public list of approved projects, optional ?sig= filter; session-aware (voted_by_me, is_admin)
// POST /api/projects — submit a new project (requires pi_session)
//
// Project value formula (same as challenges): seed + 1*anon^2 + 3*member^2

import { getSession } from '../_shared/session.js';

const VALID_STATES        = new Set(['stub', 'beta', 'production']);
const VALID_TYPES          = new Set(['one-off', 'versioned', 'accretive']);
const VALID_ARTIFACT_TYPES = new Set(['text', 'code', 'website', 'rich_media', 'other']);
const VALID_SIGS           = new Set(['sigfpt', 'mrg', 'sigpfb', 'protfisig', 'drg', 'sigpsy']);

function slugify(str) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64);
}

async function attachRelations(env, projects) {
  const ids = projects.map(p => p.id);
  if (!ids.length) return projects;

  const placeholders = ids.map(() => '?').join(',');
  const [teamRes, chalRes] = await Promise.all([
    env.DB.prepare(`
      SELECT pt.project_id, pt.member_slug, m.name
      FROM project_team pt
      JOIN members m ON m.slug = pt.member_slug
      WHERE pt.status = 'approved' AND pt.project_id IN (${placeholders})
    `).bind(...ids).all(),
    env.DB.prepare(`
      SELECT pc.project_id, pc.challenge_id, c.title
      FROM project_challenges pc
      JOIN challenges c ON c.id = pc.challenge_id
      WHERE pc.project_id IN (${placeholders})
    `).bind(...ids).all(),
  ]);

  const teamByProject = {};
  for (const row of teamRes.results || []) {
    (teamByProject[row.project_id] ||= []).push({ slug: row.member_slug, name: row.name });
  }
  const challengesByProject = {};
  for (const row of chalRes.results || []) {
    (challengesByProject[row.project_id] ||= []).push({ id: row.challenge_id, title: row.title });
  }

  return projects.map(p => ({
    ...p,
    team: teamByProject[p.id] || [],
    challenges: challengesByProject[p.id] || [],
  }));
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const sig = url.searchParams.get('sig') || null;

  const email = await getSession(request, env);
  let myVotes = new Set();
  let isAdmin = false;
  if (email) {
    try {
      const [voteRows, memberRow] = await Promise.all([
        env.DB.prepare('SELECT project_id FROM project_votes WHERE email = ?').bind(email).all(),
        env.DB.prepare('SELECT is_admin FROM members WHERE email = ?').bind(email).first(),
      ]);
      myVotes = new Set((voteRows.results || []).map(v => v.project_id));
      isAdmin = !!(memberRow?.is_admin);
    } catch {}
  }

  try {
    const baseSelect = `
      SELECT p.id, p.slug, p.title, p.description, p.lead_slug, p.sig_slug, p.state, p.type,
             p.artifact_type, p.artifact_type_other, p.url, p.current_version,
             p.anon_interesting, p.member_interesting, p.seed_interesting, p.created_at,
             m.name AS lead_name
      FROM projects p
      LEFT JOIN members m ON m.slug = p.lead_slug
    `;
    const orderBy = `
      ORDER BY (
        p.seed_interesting +
        1 * p.anon_interesting * p.anon_interesting +
        3 * p.member_interesting * p.member_interesting
      ) DESC, p.created_at DESC
    `;

    const { results } = sig
      ? await env.DB.prepare(`${baseSelect} WHERE p.status = 'approved' AND p.sig_slug = ? ${orderBy}`).bind(sig).all()
      : await env.DB.prepare(`${baseSelect} WHERE p.status = 'approved' ${orderBy}`).all();

    let projects = (results || []).map(p => ({ ...p, voted_by_me: myVotes.has(p.id) }));
    projects = await attachRelations(env, projects);

    return Response.json({ projects, is_admin: isAdmin });
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
  const state         = (body.state || '').trim();
  const type          = (body.type || '').trim();
  const artifact_type = (body.artifact_type || '').trim();
  const artifact_type_other = artifact_type === 'other' ? (body.artifact_type_other || '').trim() : null;
  const url             = (body.url || '').trim();
  const current_version = type === 'versioned' ? ((body.current_version || '').trim() || null) : null;
  const sig_slug = (body.sig_slug || '').trim() || null;

  if (!title)       return Response.json({ error: 'Title required' }, { status: 400 });
  if (!description) return Response.json({ error: 'Description required' }, { status: 400 });
  if (!lead_slug)   return Response.json({ error: 'Lead required' }, { status: 400 });
  if (!VALID_STATES.has(state))        return Response.json({ error: 'Invalid state' }, { status: 400 });
  if (!VALID_TYPES.has(type))          return Response.json({ error: 'Invalid type' }, { status: 400 });
  if (!VALID_ARTIFACT_TYPES.has(artifact_type)) return Response.json({ error: 'Invalid artifact type' }, { status: 400 });
  if (artifact_type === 'other' && !artifact_type_other) return Response.json({ error: 'Specify artifact type' }, { status: 400 });
  if (!url) return Response.json({ error: 'URL required' }, { status: 400 });
  if (sig_slug && !VALID_SIGS.has(sig_slug)) return Response.json({ error: 'Invalid SIG' }, { status: 400 });

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
    const result = await env.DB.prepare(`
      INSERT INTO projects
        (slug, title, description, lead_slug, sig_slug, state, type, artifact_type, artifact_type_other, url, current_version, submitted_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(slug, title, description, lead_slug, sig_slug, state, type, artifact_type, artifact_type_other, url, current_version, email).run();

    return Response.json({ ok: true, slug }, { status: 201 });
  } catch (err) {
    console.error('projects POST error:', err);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}
