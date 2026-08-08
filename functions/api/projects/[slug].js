// GET /api/projects/:slug — public, returns single approved project with lead info,
// approved team, linked challenges, and (if authenticated) voting/team status.

import { getSession } from '../../_shared/session.js';

export async function onRequestGet({ params, request, env }) {
  const { slug } = params;

  try {
    const project = await env.DB.prepare(`
      SELECT p.*, m.name AS lead_name
      FROM projects p
      LEFT JOIN members m ON m.slug = p.lead_slug
      WHERE p.slug = ? AND p.status = 'approved'
    `).bind(slug).first();

    if (!project) return Response.json({ error: 'Not found' }, { status: 404 });

    const [teamRes, chalRes] = await Promise.all([
      env.DB.prepare(`
        SELECT pt.member_slug, pt.status, m.name
        FROM project_team pt
        JOIN members m ON m.slug = pt.member_slug
        WHERE pt.project_id = ?
      `).bind(project.id).all(),
      env.DB.prepare(`
        SELECT pc.challenge_id AS id, c.title
        FROM project_challenges pc
        JOIN challenges c ON c.id = pc.challenge_id
        WHERE pc.project_id = ?
      `).bind(project.id).all(),
    ]);

    const email = await getSession(request, env);
    let viewerIsLeadOrAdmin = false;
    let votedByMe = false;
    let myTeamStatus = null;

    if (email) {
      const member = await env.DB.prepare('SELECT slug, is_admin FROM members WHERE email = ?').bind(email).first();
      if (member) {
        viewerIsLeadOrAdmin = !!member.is_admin || member.slug === project.lead_slug;
        const vote = await env.DB.prepare(
          'SELECT 1 FROM project_votes WHERE project_id = ? AND email = ?'
        ).bind(project.id, email).first();
        votedByMe = !!vote;
        const teamRow = (teamRes.results || []).find(t => t.member_slug === member.slug);
        myTeamStatus = teamRow ? teamRow.status : null;
      }
    }

    const allTeam = teamRes.results || [];
    const team = allTeam.filter(t => t.status === 'approved').map(t => ({ slug: t.member_slug, name: t.name }));
    const pendingTeam = viewerIsLeadOrAdmin
      ? allTeam.filter(t => t.status === 'pending').map(t => ({ slug: t.member_slug, name: t.name }))
      : [];

    return Response.json({
      project: { ...project, voted_by_me: votedByMe },
      team,
      pending_team: pendingTeam,
      challenges: (chalRes.results || []).map(r => ({ id: r.id, title: r.title })),
      viewer_is_lead_or_admin: viewerIsLeadOrAdmin,
      my_team_status: myTeamStatus,
    });
  } catch (err) {
    console.error('project slug GET error:', err);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}
