// GET  /api/program-links?program=<slug> — public list of a program's links (all if no ?program=)
// POST /api/program-links                — the program's hosts or an admin: create, update, or delete a link
//
// Links that are not projects: a program's own site (kind='website', rendered
// under a SIG page's blurb), the outlets that carry its work (kind='channel':
// Substack, YouTube, …) and anything else related (kind='link'). Affiliated
// projects are NOT here — they live in project_programs. Replaces
// /api/sigs/links (migration 037 copied sig_links into program_links).

import { getSession } from '../_shared/session.js';
import { memberForSession, canEditProgram } from '../_shared/programs.js';

const VALID_KINDS = new Set(['website', 'channel', 'link']);

export async function onRequestGet({ request, env }) {
  const program = new URL(request.url).searchParams.get('program');
  const cols = 'id, program_slug, kind, label, url, note, sort_order';
  const { results } = program
    ? await env.DB.prepare(`SELECT ${cols} FROM program_links WHERE program_slug = ? ORDER BY sort_order, id`).bind(program).all()
    : await env.DB.prepare(`SELECT ${cols} FROM program_links ORDER BY program_slug, sort_order, id`).all();
  return Response.json({ links: results || [] });
}

export async function onRequestPost({ request, env }) {
  const member = await memberForSession(env, await getSession(request, env));
  if (!member) return Response.json({ error: 'Not authenticated' }, { status: 401 });

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { id, action, program_slug, kind, label, url, note, sort_order } = body;

  // Authority is checked against the link's current program (for update/delete)
  // and the requested one (for create/move), so a host can't touch other programs.
  if (id) {
    const existing = await env.DB.prepare('SELECT program_slug FROM program_links WHERE id = ?').bind(id).first();
    if (!existing) return Response.json({ error: 'Link not found' }, { status: 404 });
    if (!await canEditProgram(env, member, existing.program_slug)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  if (action === 'delete') {
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });
    await env.DB.prepare('DELETE FROM program_links WHERE id = ?').bind(id).run();
    return Response.json({ ok: true, action: 'deleted' });
  }

  if (!await canEditProgram(env, member, program_slug)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const program = program_slug
    ? await env.DB.prepare('SELECT slug FROM programs WHERE slug = ?').bind(program_slug).first()
    : null;
  if (!program) return Response.json({ error: 'Valid program_slug required' }, { status: 400 });
  const linkKind = kind || 'link';
  if (!VALID_KINDS.has(linkKind)) {
    return Response.json({ error: 'kind must be website, channel or link' }, { status: 400 });
  }
  if (!label || !String(label).trim()) {
    return Response.json({ error: 'label required' }, { status: 400 });
  }
  if (!url || !/^https?:\/\//i.test(url)) {
    return Response.json({ error: 'url must be an absolute http(s) URL' }, { status: 400 });
  }

  const vals = [program_slug, linkKind, String(label).trim(), url.trim(), note || null, sort_order || 0];

  if (id) {
    await env.DB.prepare(
      'UPDATE program_links SET program_slug = ?, kind = ?, label = ?, url = ?, note = ?, sort_order = ? WHERE id = ?'
    ).bind(...vals, id).run();
    return Response.json({ ok: true, action: 'updated', id });
  }

  const res = await env.DB.prepare(
    'INSERT INTO program_links (program_slug, kind, label, url, note, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(...vals).run();
  return Response.json({ ok: true, action: 'created', id: res.meta.last_row_id });
}
