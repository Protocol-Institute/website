// POST   /api/projects/:slug/challenges — lead or admin links a challenge (body: { challenge_id })
// DELETE /api/projects/:slug/challenges — lead or admin unlinks a challenge (body: { challenge_id })

import { getSession } from '../../../_shared/session.js';

async function checkLeadOrAdmin(request, env, leadSlug) {
  const email = await getSession(request, env);
  if (!email) return null;
  const member = await env.DB.prepare('SELECT slug, is_admin FROM members WHERE email = ?').bind(email).first();
  if (!member) return null;
  if (member.slug !== leadSlug && !member.is_admin) return null;
  return member.slug;
}

export async function onRequestPost({ params, request, env }) {
  const project = await env.DB.prepare(
    "SELECT id, lead_slug FROM projects WHERE slug = ? AND status = 'approved'"
  ).bind(params.slug).first();
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 });

  const linkerSlug = await checkLeadOrAdmin(request, env, project.lead_slug);
  if (!linkerSlug) return Response.json({ error: 'Not authorized' }, { status: 403 });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const challengeId = parseInt(body.challenge_id, 10);
  if (!challengeId) return Response.json({ error: 'challenge_id required' }, { status: 400 });

  const challenge = await env.DB.prepare('SELECT id FROM challenges WHERE id = ?').bind(challengeId).first();
  if (!challenge) return Response.json({ error: 'Challenge not found' }, { status: 404 });

  await env.DB.prepare(
    'INSERT OR IGNORE INTO project_challenges (project_id, challenge_id, linked_by) VALUES (?, ?, ?)'
  ).bind(project.id, challengeId, linkerSlug).run();

  return Response.json({ ok: true }, { status: 201 });
}

export async function onRequestDelete({ params, request, env }) {
  const project = await env.DB.prepare(
    "SELECT id, lead_slug FROM projects WHERE slug = ? AND status = 'approved'"
  ).bind(params.slug).first();
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 });

  const linkerSlug = await checkLeadOrAdmin(request, env, project.lead_slug);
  if (!linkerSlug) return Response.json({ error: 'Not authorized' }, { status: 403 });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const challengeId = parseInt(body.challenge_id, 10);
  if (!challengeId) return Response.json({ error: 'challenge_id required' }, { status: 400 });

  await env.DB.prepare(
    'DELETE FROM project_challenges WHERE project_id = ? AND challenge_id = ?'
  ).bind(project.id, challengeId).run();

  return Response.json({ ok: true });
}
