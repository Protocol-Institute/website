// GET  /api/projects/:slug — public, returns single published project with lead info,
//      approved team, linked challenges, program affiliations, and (if
//      authenticated) voting/team status. The lead and admins also see pending
//      affiliations.
// POST /api/projects/:slug — edit (lead or admin). Same fields as create, plus
//      `affiliations` which replaces the project's program list. POST, not PUT:
//      the CF WAF blocks PUT on Pages.

import { getSession } from '../../_shared/session.js';
import { sessionVaryingJson } from '../../_shared/response.js';
import { loadProjectPrograms, validateAffiliations, syncAffiliations, approvablePrograms } from '../../_shared/programs.js';

const VALID_STATES         = new Set(['stub', 'beta', 'production']);
const VALID_TYPES          = new Set(['one-off', 'versioned', 'accretive']);
const VALID_ARTIFACT_TYPES = new Set(['text', 'code', 'website', 'rich_media', 'other']);

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

    const programsByProject = await loadProjectPrograms(env, [project.id], { includeAll: viewerIsLeadOrAdmin });
    const programs = (programsByProject[project.id] || []).filter(a => a.status !== 'rejected' || viewerIsLeadOrAdmin);

    const allTeam = teamRes.results || [];
    const team = allTeam.filter(t => t.status === 'approved').map(t => ({ slug: t.member_slug, name: t.name }));
    const pendingTeam = viewerIsLeadOrAdmin
      ? allTeam.filter(t => t.status === 'pending').map(t => ({ slug: t.member_slug, name: t.name }))
      : [];

    // Same shape as the symposium endpoints: the submitter's address and the
    // reviewers' notes are staff data and must not ride along on a public page.
    const publicProject = { ...project, voted_by_me: votedByMe };
    // Pre-037 columns, superseded by project_programs; dropped by migration 040.
    for (const k of ['sig_slug', 'program', 'sub_program', 'themes']) delete publicProject[k];
    if (!viewerIsLeadOrAdmin) {
      delete publicProject.submitted_by;
      delete publicProject.admin_notes;
    }

    return sessionVaryingJson({
      project: publicProject,
      team,
      pending_team: pendingTeam,
      challenges: (chalRes.results || []).map(r => ({ id: r.id, title: r.title })),
      programs,
      viewer_is_lead_or_admin: viewerIsLeadOrAdmin,
      my_team_status: myTeamStatus,
    });
  } catch (err) {
    console.error('project slug GET error:', err);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function onRequestPost({ params, request, env }) {
  const email = await getSession(request, env);
  if (!email) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  const member = await env.DB.prepare('SELECT slug, is_admin FROM members WHERE email = ?').bind(email).first();
  if (!member) return Response.json({ error: 'Member not found' }, { status: 404 });

  const project = await env.DB.prepare(
    "SELECT id, lead_slug, realm FROM projects WHERE slug = ? AND status = 'approved'"
  ).bind(params.slug).first();
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 });
  if (!member.is_admin && member.slug !== project.lead_slug) {
    return Response.json({ error: 'Only the project lead or an admin can edit this project' }, { status: 403 });
  }

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const title         = (body.title || '').trim();
  const description   = (body.description || '').trim();
  const state         = (body.state || '').trim();
  const type          = (body.type || '').trim();
  const artifact_type = (body.artifact_type || '').trim();
  const artifact_type_other = artifact_type === 'other' ? (body.artifact_type_other || '').trim() : null;
  const url             = (body.url || '').trim();
  const current_version = type === 'versioned' ? ((body.current_version || '').trim() || null) : null;

  if (!title)       return Response.json({ error: 'Title required' }, { status: 400 });
  if (!description) return Response.json({ error: 'Description required' }, { status: 400 });
  if (!VALID_STATES.has(state))        return Response.json({ error: 'Invalid state' }, { status: 400 });
  if (!VALID_TYPES.has(type))          return Response.json({ error: 'Invalid type' }, { status: 400 });
  if (!VALID_ARTIFACT_TYPES.has(artifact_type)) return Response.json({ error: 'Invalid artifact type' }, { status: 400 });
  if (artifact_type === 'other' && !artifact_type_other) return Response.json({ error: 'Specify artifact type' }, { status: 400 });
  if (!url) return Response.json({ error: 'URL required' }, { status: 400 });

  // Moving a project between realms is an admin decision; leads keep the current one.
  const realm = member.is_admin && ['research', 'admin'].includes(body.realm) ? body.realm : project.realm;

  const aff = await validateAffiliations(env, body.affiliations);
  if (!aff.ok) return Response.json({ error: aff.error }, { status: 400 });

  try {
    // The slug is the project's permanent URL, so a retitle does not change it.
    await env.DB.prepare(`
      UPDATE projects
      SET title = ?, description = ?, state = ?, type = ?, artifact_type = ?, artifact_type_other = ?,
          url = ?, current_version = ?, realm = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(title, description, state, type, artifact_type, artifact_type_other, url, current_version, realm, project.id).run();

    if (Array.isArray(body.affiliations)) {
      await syncAffiliations(env, project.id, aff.rows, email, await approvablePrograms(env, member));
    }
    return Response.json({ ok: true, slug: params.slug });
  } catch (err) {
    console.error('project edit error:', err);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}
