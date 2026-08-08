// POST /api/projects/:slug/watching
// Member votes: tracked in project_votes table (one per member).
// Anon votes: checked and recorded via pi_proj_voted cookie (comma-separated project ids).

import { getSession } from '../../../_shared/session.js';

export async function onRequestPost({ params, request, env }) {
  const project = await env.DB.prepare(
    "SELECT id FROM projects WHERE slug = ? AND status = 'approved'"
  ).bind(params.slug).first();
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 });

  const id = project.id;
  const email = await getSession(request, env);
  let setCookie = null;

  if (email) {
    const existing = await env.DB.prepare(
      'SELECT 1 FROM project_votes WHERE project_id = ? AND email = ?'
    ).bind(id, email).first();
    if (existing) return Response.json({ error: 'Already watching' }, { status: 409 });

    await env.DB.batch([
      env.DB.prepare('INSERT INTO project_votes (project_id, email) VALUES (?, ?)').bind(id, email),
      env.DB.prepare('UPDATE projects SET member_interesting = member_interesting + 1 WHERE id = ?').bind(id),
    ]);
  } else {
    const cookieHeader = request.headers.get('Cookie') || '';
    const m = cookieHeader.match(/pi_proj_voted=([^;]+)/);
    const votedStr = m ? decodeURIComponent(m[1]) : '';
    const voted = votedStr ? votedStr.split(',').map(Number).filter(Boolean) : [];

    if (voted.includes(id)) return Response.json({ error: 'Already watching' }, { status: 409 });

    await env.DB.prepare(
      'UPDATE projects SET anon_interesting = anon_interesting + 1 WHERE id = ?'
    ).bind(id).run();

    const updated = [...voted, id].join(',');
    setCookie = `pi_proj_voted=${encodeURIComponent(updated)}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }

  const row = await env.DB.prepare(
    'SELECT anon_interesting, member_interesting, seed_interesting FROM projects WHERE id = ?'
  ).bind(id).first();

  const headers = { 'Content-Type': 'application/json' };
  if (setCookie) headers['Set-Cookie'] = setCookie;
  return new Response(JSON.stringify(row), { headers });
}
