// POST   /api/projects/:slug/team/:member_slug/approve — lead or admin approves a pending team request
// DELETE /api/projects/:slug/team/:member_slug/approve — lead or admin declines/removes a team member

import { getSession } from '../../../../../_shared/session.js';

async function checkLeadOrAdmin(request, env, leadSlug) {
  const email = await getSession(request, env);
  if (!email) return null;
  const member = await env.DB.prepare('SELECT slug, is_admin FROM members WHERE email = ?').bind(email).first();
  if (!member) return null;
  if (member.slug !== leadSlug && !member.is_admin) return null;
  return member.slug;
}

async function loadProject(env, slug) {
  return env.DB.prepare(
    "SELECT id, lead_slug FROM projects WHERE slug = ? AND status = 'approved'"
  ).bind(slug).first();
}

export async function onRequestPost({ params, request, env }) {
  const project = await loadProject(env, params.slug);
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 });

  const approverSlug = await checkLeadOrAdmin(request, env, project.lead_slug);
  if (!approverSlug) return Response.json({ error: 'Not authorized' }, { status: 403 });

  const result = await env.DB.prepare(`
    UPDATE project_team
    SET status = 'approved', approved_at = datetime('now'), approved_by = ?
    WHERE project_id = ? AND member_slug = ? AND status = 'pending'
  `).bind(approverSlug, project.id, params.member_slug).run();

  if (!result.meta.changes) return Response.json({ error: 'No pending request found' }, { status: 404 });
  return Response.json({ ok: true });
}

export async function onRequestDelete({ params, request, env }) {
  const project = await loadProject(env, params.slug);
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 });

  const approverSlug = await checkLeadOrAdmin(request, env, project.lead_slug);
  if (!approverSlug) return Response.json({ error: 'Not authorized' }, { status: 403 });

  const result = await env.DB.prepare(
    'DELETE FROM project_team WHERE project_id = ? AND member_slug = ?'
  ).bind(project.id, params.member_slug).run();

  if (!result.meta.changes) return Response.json({ error: 'No team entry found' }, { status: 404 });
  return Response.json({ ok: true });
}
