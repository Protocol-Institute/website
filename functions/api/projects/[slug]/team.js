// POST /api/projects/:slug/team — logged-in member self-declares as part of the project's team
// (status starts 'pending'; the project lead or an admin must approve before it's public).

import { getSession } from '../../../_shared/session.js';

export async function onRequestPost({ params, request, env }) {
  const email = await getSession(request, env);
  if (!email) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  const member = await env.DB.prepare('SELECT slug FROM members WHERE email = ?').bind(email).first();
  if (!member) return Response.json({ error: 'Member not found' }, { status: 404 });

  const project = await env.DB.prepare(
    "SELECT id, lead_slug FROM projects WHERE slug = ? AND status = 'approved'"
  ).bind(params.slug).first();
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 });

  if (member.slug === project.lead_slug) {
    return Response.json({ error: 'You are already the lead on this project' }, { status: 400 });
  }

  const existing = await env.DB.prepare(
    'SELECT status FROM project_team WHERE project_id = ? AND member_slug = ?'
  ).bind(project.id, member.slug).first();
  if (existing) {
    return Response.json({ error: `Already ${existing.status}` }, { status: 409 });
  }

  await env.DB.prepare(
    'INSERT INTO project_team (project_id, member_slug, status) VALUES (?, ?, ?)'
  ).bind(project.id, member.slug, 'pending').run();

  return Response.json({ ok: true, status: 'pending' }, { status: 201 });
}
