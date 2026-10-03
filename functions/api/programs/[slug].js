// GET /api/programs/:slug — public: one program with its areas, links, editions, the
// runs of other programs nested inside its editions (e.g. a workshop run as part
// of a Symposium), and its approved projects. Projects affiliated with a nested
// run are included too, marked with `via`, so a Symposium page shows what came
// out of its workshops.

import { getSession } from '../../_shared/session.js';
import { programHref, memberForSession, canEditProgram } from '../../_shared/programs.js';

export async function onRequestGet({ params, env }) {
  try {
    const program = await env.DB.prepare(`
      SELECT slug, kind, title, short_title, description, byline, page_url, status, affiliation_policy
      FROM programs WHERE slug = ?
    `).bind(params.slug).first();
    if (!program) return Response.json({ error: 'Not found' }, { status: 404 });

    const [areas, editions, nested, links, hosts] = await Promise.all([
      env.DB.prepare(`
        SELECT a.slug, a.realm, a.title, pa.is_primary
        FROM program_areas pa JOIN areas a ON a.slug = pa.area_slug
        WHERE pa.program_slug = ? ORDER BY pa.is_primary DESC, a.sort_order
      `).bind(program.slug).all(),
      env.DB.prepare(`
        SELECT e.id, e.slug, e.title, e.start_date, e.end_date, e.location, e.host_context,
               e.page_url, e.status, e.part_of_edition_id,
               pe.title AS part_of_title, pe.page_url AS part_of_page_url, pe.program_slug AS part_of_program
        FROM editions e LEFT JOIN editions pe ON pe.id = e.part_of_edition_id
        WHERE e.program_slug = ? ORDER BY e.start_date DESC, e.slug DESC
      `).bind(program.slug).all(),
      env.DB.prepare(`
        SELECT c.id, c.title, c.page_url, c.part_of_edition_id, c.start_date,
               pr.slug AS program_slug, pr.title AS program_title, pr.page_url AS program_page_url
        FROM editions c
        JOIN editions parent ON parent.id = c.part_of_edition_id
        JOIN programs pr ON pr.slug = c.program_slug
        WHERE parent.program_slug = ? ORDER BY pr.sort_order, pr.title
      `).bind(program.slug).all(),
      env.DB.prepare(`
        SELECT id, kind, label, url, note, sort_order FROM program_links WHERE program_slug = ? ORDER BY sort_order, id
      `).bind(program.slug).all(),
      env.DB.prepare(`
        SELECT h.member_slug AS slug, m.name
        FROM program_hosts h LEFT JOIN members m ON m.slug = h.member_slug
        WHERE h.program_slug = ? ORDER BY m.name
      `).bind(program.slug).all(),
    ]);

    const nestedIds = (nested.results || []).map(n => n.id);
    const nestedPh = nestedIds.map(() => '?').join(',');
    const { results: projectRows } = await env.DB.prepare(`
      SELECT p.slug, p.title, p.description, p.url, p.state, p.realm, p.lead_slug, m.name AS lead_name,
             pp.edition_id, pp.program_slug AS via_program, pr.title AS via_title
      FROM project_programs pp
      JOIN projects p ON p.id = pp.project_id
      JOIN programs pr ON pr.slug = pp.program_slug
      LEFT JOIN members m ON m.slug = p.lead_slug
      WHERE pp.status = 'approved' AND p.status = 'approved'
        AND (pp.program_slug = ? ${nestedIds.length ? `OR pp.edition_id IN (${nestedPh})` : ''})
      ORDER BY p.title
    `).bind(program.slug, ...nestedIds).all();

    // A project linked both directly and through a nested run appears once,
    // as a direct affiliation.
    const projects = [];
    const seen = new Map();
    for (const r of projectRows || []) {
      const direct = r.via_program === program.slug;
      const row = {
        slug: r.slug, title: r.title, description: r.description, url: r.url, state: r.state, realm: r.realm,
        lead_slug: r.lead_slug, lead_name: r.lead_name, edition_id: r.edition_id,
        via: direct ? null : { slug: r.via_program, title: r.via_title },
      };
      if (!seen.has(r.slug)) { seen.set(r.slug, projects.length); projects.push(row); }
      else if (direct) projects[seen.get(r.slug)] = row;
    }

    return Response.json({
      program: {
        slug: program.slug, kind: program.kind, title: program.title, short_title: program.short_title,
        description: program.description, byline: program.byline,
        href: programHref(program.slug, program.page_url), page_url: program.page_url,
        has_own_page: !!program.page_url, status: program.status,
        affiliation_policy: program.affiliation_policy,
      },
      realm: ((areas.results || [])[0] || {}).realm || 'research',
      areas: (areas.results || []).map(a => ({ slug: a.slug, title: a.title, is_primary: !!a.is_primary })),
      links: links.results || [],
      hosts: hosts.results || [],
      editions: (editions.results || []).map(e => ({
        id: e.id, slug: e.slug, title: e.title, start_date: e.start_date, end_date: e.end_date,
        location: e.location, host_context: e.host_context, href: e.page_url, status: e.status,
        part_of: e.part_of_edition_id
          ? { id: e.part_of_edition_id, title: e.part_of_title, href: e.part_of_page_url || programHref(e.part_of_program, null) }
          : null,
        nested: (nested.results || []).filter(n => n.part_of_edition_id === e.id).map(n => ({
          id: n.id, title: n.title, program_slug: n.program_slug, program_title: n.program_title,
          href: n.page_url || programHref(n.program_slug, n.program_page_url),
        })),
      })),
      projects,
    });
  } catch (err) {
    console.error('program GET error:', err);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}

// POST /api/programs/:slug — edit a program. Hosts may change the content they
// own (description, byline); admins may also change identity and placement
// (title, short_title, status, affiliation_policy, page_url, areas).
export async function onRequestPost({ params, request, env }) {
  const member = await memberForSession(env, await getSession(request, env));
  if (!member) return Response.json({ error: 'Not authenticated' }, { status: 401 });
  if (!await canEditProgram(env, member, params.slug)) {
    return Response.json({ error: 'Only this program\'s hosts or an admin can edit it' }, { status: 403 });
  }
  const program = await env.DB.prepare('SELECT slug FROM programs WHERE slug = ?').bind(params.slug).first();
  if (!program) return Response.json({ error: 'Not found' }, { status: 404 });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const sets = [];
  const binds = [];
  const text = (v, max) => (v == null ? null : String(v).trim().slice(0, max) || null);

  if ('description' in body) { sets.push('description = ?'); binds.push(text(body.description, 2000)); }
  if ('byline' in body)      { sets.push('byline = ?');      binds.push(text(body.byline, 300)); }

  if (member.is_admin) {
    if ('title' in body) {
      const t = text(body.title, 200);
      if (!t) return Response.json({ error: 'Title required' }, { status: 400 });
      sets.push('title = ?'); binds.push(t);
    }
    if ('short_title' in body) { sets.push('short_title = ?'); binds.push(text(body.short_title, 40)); }
    if ('page_url' in body)    { sets.push('page_url = ?');    binds.push(text(body.page_url, 300)); }
    if ('status' in body) {
      if (!['active', 'past'].includes(body.status)) return Response.json({ error: 'Invalid status' }, { status: 400 });
      sets.push('status = ?'); binds.push(body.status);
    }
    if ('affiliation_policy' in body) {
      if (!['open', 'moderated'].includes(body.affiliation_policy)) return Response.json({ error: 'Invalid policy' }, { status: 400 });
      sets.push('affiliation_policy = ?'); binds.push(body.affiliation_policy);
    }
  }

  const stmts = [];
  if (sets.length) {
    stmts.push(env.DB.prepare(`UPDATE programs SET ${sets.join(', ')} WHERE slug = ?`).bind(...binds, params.slug));
  }
  if (member.is_admin && Array.isArray(body.areas)) {
    if (!body.areas.length) return Response.json({ error: 'At least one area required' }, { status: 400 });
    stmts.push(env.DB.prepare('DELETE FROM program_areas WHERE program_slug = ?').bind(params.slug));
    body.areas.forEach((a, i) => stmts.push(env.DB.prepare(
      'INSERT INTO program_areas (program_slug, area_slug, is_primary) SELECT ?, slug, ? FROM areas WHERE slug = ?'
    ).bind(params.slug, i === 0 ? 1 : 0, String(a))));
  }
  if (stmts.length) await env.DB.batch(stmts);
  return Response.json({ ok: true });
}
