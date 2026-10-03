// GET  /api/affiliations — pending project↔program affiliations the caller can
//      approve: every one for an admin, only their programs' for a program host.
// POST /api/affiliations — { project_slug, program_slug, action: approve|reject }
//
// Replaces the old project approval queue (/api/admin/projects): projects are
// published on creation; what gets moderated is the claim that a project
// belongs to a program. See programs/PLAN.md.

import { getSession } from '../_shared/session.js';
import { sessionVaryingJson } from '../_shared/response.js';
import { approvablePrograms, canApprove } from '../_shared/programs.js';

async function caller(request, env) {
  const email = await getSession(request, env);
  if (!email) return null;
  const member = await env.DB.prepare('SELECT slug, is_admin FROM members WHERE email = ?').bind(email).first();
  if (!member) return null;
  return { email, member, approvable: await approvablePrograms(env, member) };
}

export async function onRequestGet({ request, env }) {
  const c = await caller(request, env);
  if (!c) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  const { results } = await env.DB.prepare(`
    SELECT pp.program_slug, pp.created_at, pp.linked_by,
           pr.title AS program_title, pr.short_title AS program_short_title,
           e.title AS edition_title,
           p.slug AS project_slug, p.title AS project_title, p.description, p.url,
           p.lead_slug, m.name AS lead_name
    FROM project_programs pp
    JOIN projects p ON p.id = pp.project_id
    JOIN programs pr ON pr.slug = pp.program_slug
    LEFT JOIN editions e ON e.id = pp.edition_id
    LEFT JOIN members m ON m.slug = p.lead_slug
    WHERE pp.status = 'pending' AND p.status = 'approved'
    ORDER BY pp.created_at ASC
  `).all();

  const pending = (results || [])
    .filter(r => canApprove(c.approvable, r.program_slug))
    .map(({ linked_by, ...r }) => r);

  return sessionVaryingJson({ pending, is_admin: c.approvable === null });
}

export async function onRequestPost({ request, env }) {
  const c = await caller(request, env);
  if (!c) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { project_slug, program_slug, action } = body;
  if (!project_slug || !program_slug || !['approve', 'reject'].includes(action)) {
    return Response.json({ error: 'project_slug, program_slug and action required' }, { status: 400 });
  }
  if (!canApprove(c.approvable, program_slug)) {
    return Response.json({ error: 'Not a host of this program' }, { status: 403 });
  }

  const project = await env.DB.prepare('SELECT id FROM projects WHERE slug = ?').bind(project_slug).first();
  if (!project) return Response.json({ error: 'Project not found' }, { status: 404 });

  const res = await env.DB.prepare(`
    UPDATE project_programs SET status = ?, approved_by = ?, approved_at = datetime('now')
    WHERE project_id = ? AND program_slug = ?
  `).bind(action === 'approve' ? 'approved' : 'rejected', c.email, project.id, program_slug).run();

  if (!res.meta.changes) return Response.json({ error: 'Affiliation not found' }, { status: 404 });
  return Response.json({ ok: true });
}
