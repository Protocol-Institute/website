// GET  /api/admin/projects — list pending project submissions
// POST /api/admin/projects — approve or reject (body: { slug, action, admin_notes? })
// Protected by session cookie + is_admin flag

import { getSession } from '../../_shared/session.js';

async function checkAdmin(request, env) {
  const email = await getSession(request, env);
  if (!email) return false;
  const member = await env.DB.prepare('SELECT is_admin FROM members WHERE email = ?').bind(email).first();
  return member?.is_admin === 1;
}

export async function onRequestGet({ request, env }) {
  if (!await checkAdmin(request, env)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { results } = await env.DB.prepare(`
      SELECT p.*, m.name AS lead_name
      FROM projects p
      LEFT JOIN members m ON m.slug = p.lead_slug
      WHERE p.status = 'pending'
      ORDER BY p.created_at ASC
    `).all();
    return Response.json({ projects: results || [] });
  } catch (err) {
    console.error('admin projects GET error:', err);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  if (!await checkAdmin(request, env)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { slug, action, admin_notes } = body;

  if (!slug || !['approve', 'reject'].includes(action)) {
    return Response.json({ error: 'slug and action required' }, { status: 400 });
  }

  const project = await env.DB.prepare(
    "SELECT id FROM projects WHERE slug = ? AND status = 'pending'"
  ).bind(slug).first();

  if (!project) {
    return Response.json({ error: 'Project not found or already processed' }, { status: 404 });
  }

  const newStatus = action === 'approve' ? 'approved' : 'rejected';

  await env.DB.prepare(`
    UPDATE projects
    SET status = ?, admin_notes = ?, updated_at = datetime('now')
    WHERE slug = ?
  `).bind(newStatus, admin_notes || null, slug).run();

  return Response.json({ ok: true, action });
}
