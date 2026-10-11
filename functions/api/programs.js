// POST /api/programs — admin only: create a program (then assign hosts on its edit page).
// GET /api/programs — public: every area, program and edition, for the project
// affiliation picker, the program pages and /operations. A program's realm
// ('research' | 'admin') is its primary area's. See programs/PLAN.md.
// ?detail=1 adds each program's links, approved projects (slug + title) and hosts
// (slug + name) — what /programs and /research-groups render; left off by default to keep the picker's payload small.

import { getSession } from '../_shared/session.js';
import { programHref, memberForSession, PROGRAM_KINDS, SLUG_RE } from '../_shared/programs.js';

export async function onRequestGet({ request, env }) {
  const detail = new URL(request.url).searchParams.get('detail') === '1';
  try {
    const [areas, programs, links, editions, counts] = await Promise.all([
      env.DB.prepare('SELECT slug, realm, title, description FROM areas ORDER BY sort_order').all(),
      env.DB.prepare(`
        SELECT slug, kind, title, short_title, description, page_url, status, affiliation_policy, accepts_tags
        FROM programs ORDER BY sort_order, title
      `).all(),
      env.DB.prepare('SELECT program_slug, area_slug, is_primary FROM program_areas').all(),
      env.DB.prepare(`
        SELECT id, program_slug, slug, title, start_date, end_date, location, host_context,
               page_url, part_of_edition_id, status
        FROM editions ORDER BY start_date DESC, slug DESC
      `).all(),
      env.DB.prepare(`
        SELECT pp.program_slug, COUNT(*) AS n
        FROM project_programs pp JOIN projects p ON p.id = pp.project_id
        WHERE pp.status = 'approved' AND p.status = 'approved'
        GROUP BY pp.program_slug
      `).all(),
    ]);

    const linksByProgram = {}, projectsByProgram = {}, hostsByProgram = {};
    if (detail) {
      const [plinks, projects, hosts] = await Promise.all([
        env.DB.prepare('SELECT program_slug, kind, label, url, note FROM program_links ORDER BY sort_order, id').all(),
        env.DB.prepare(`
          SELECT pp.program_slug, p.slug, p.title
          FROM project_programs pp JOIN projects p ON p.id = pp.project_id
          WHERE pp.status = 'approved' AND p.status = 'approved'
          ORDER BY p.title
        `).all(),
        env.DB.prepare(`
          SELECT h.program_slug, h.member_slug AS slug, m.name
          FROM program_hosts h LEFT JOIN members m ON m.slug = h.member_slug
          ORDER BY h.rowid
        `).all(),
      ]);
      for (const l of plinks.results || []) {
        (linksByProgram[l.program_slug] ||= []).push({ kind: l.kind, label: l.label, url: l.url, note: l.note });
      }
      for (const p of projects.results || []) {
        (projectsByProgram[p.program_slug] ||= []).push({ slug: p.slug, title: p.title });
      }
      for (const h of hosts.results || []) {
        (hostsByProgram[h.program_slug] ||= []).push({ slug: h.slug, name: h.name || h.slug });
      }
    }

    const areasByProgram = {};
    for (const l of links.results || []) {
      (areasByProgram[l.program_slug] ||= []).push({ slug: l.area_slug, is_primary: !!l.is_primary });
    }
    const editionsByProgram = {};
    for (const e of editions.results || []) {
      (editionsByProgram[e.program_slug] ||= []).push({
        id: e.id, slug: e.slug, title: e.title, start_date: e.start_date, end_date: e.end_date,
        location: e.location, host_context: e.host_context, href: e.page_url,
        part_of_edition_id: e.part_of_edition_id, status: e.status,
      });
    }
    const countBy = Object.fromEntries((counts.results || []).map(c => [c.program_slug, c.n]));
    const realmOfArea = Object.fromEntries((areas.results || []).map(a => [a.slug, a.realm]));
    const realmOf = slug => {
      const as = areasByProgram[slug] || [];
      return realmOfArea[(as.find(a => a.is_primary) || as[0] || {}).slug] || 'research';
    };

    return Response.json({
      areas: areas.results || [],
      programs: (programs.results || []).map(p => ({
        slug: p.slug, kind: p.kind, realm: realmOf(p.slug), title: p.title, short_title: p.short_title,
        description: p.description, href: programHref(p.slug, p.page_url),
        status: p.status, affiliation_policy: p.affiliation_policy, accepts_tags: !!p.accepts_tags,
        areas: areasByProgram[p.slug] || [],
        editions: editionsByProgram[p.slug] || [],
        project_count: countBy[p.slug] || 0,
        ...(detail ? { links: linksByProgram[p.slug] || [], projects: projectsByProgram[p.slug] || [],
                    hosts: hostsByProgram[p.slug] || [] } : {}),
      })),
    });
  } catch (err) {
    console.error('programs GET error:', err);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function onRequestPost({ request, env }) {
  const member = await memberForSession(env, await getSession(request, env));
  if (!member?.is_admin) return Response.json({ error: 'Admins only' }, { status: 403 });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const slug  = String(body.slug || '').trim().toLowerCase();
  const title = String(body.title || '').trim();
  const kind  = String(body.kind || '').trim();
  const areas = Array.isArray(body.areas) ? body.areas.map(String) : [];

  if (!SLUG_RE.test(slug)) return Response.json({ error: 'Slug: lowercase letters, digits and hyphens' }, { status: 400 });
  if (!title) return Response.json({ error: 'Title required' }, { status: 400 });
  if (!PROGRAM_KINDS.includes(kind)) return Response.json({ error: 'Invalid kind' }, { status: 400 });
  if (!areas.length) return Response.json({ error: 'At least one area required' }, { status: 400 });
  if (await env.DB.prepare('SELECT 1 FROM programs WHERE slug = ?').bind(slug).first()) {
    return Response.json({ error: 'A program with that slug already exists' }, { status: 409 });
  }
  const primary = await env.DB.prepare('SELECT realm FROM areas WHERE slug = ?').bind(areas[0]).first();
  if (!primary) return Response.json({ error: 'Unknown area' }, { status: 400 });

  // Research programs take tags freely; admin-realm programs are moderated.
  const policy = primary.realm === 'admin' ? 'moderated' : 'open';
  const stmts = [env.DB.prepare(`
    INSERT INTO programs (slug, kind, title, short_title, description, status, affiliation_policy, sort_order)
    VALUES (?, ?, ?, ?, ?, 'active', ?, 100)
  `).bind(slug, kind, title, String(body.short_title || '').trim() || null,
          String(body.description || '').trim() || null, policy)];
  areas.forEach((a, i) => stmts.push(env.DB.prepare(
    'INSERT INTO program_areas (program_slug, area_slug, is_primary) SELECT ?, slug, ? FROM areas WHERE slug = ?'
  ).bind(slug, i === 0 ? 1 : 0, a)));
  await env.DB.batch(stmts);
  return Response.json({ ok: true, slug }, { status: 201 });
}
