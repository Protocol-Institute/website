// GET  /api/program-links?program=<slug> — public list of a program's links (all if no ?program=)
// POST /api/program-links                — admin only: create, update, or delete a link
//
// Links that are not projects: a program's own site (kind='website', rendered
// under a SIG page's blurb), the outlets that carry its work (kind='channel':
// Substack, YouTube, …) and anything else related (kind='link'). Affiliated
// projects are NOT here — they live in project_programs. Replaces
// /api/sigs/links (migration 037 copied sig_links into program_links).

import { getSession } from '../_shared/session.js';

const VALID_KINDS = new Set(['website', 'channel', 'link']);

async function checkAdmin(request, env) {
  const email = await getSession(request, env);
  if (!email) return false;
  const member = await env.DB.prepare('SELECT is_admin FROM members WHERE email = ?').bind(email).first();
  return member?.is_admin === 1;
}

export async function onRequestGet({ request, env }) {
  const program = new URL(request.url).searchParams.get('program');
  const cols = 'id, program_slug, kind, label, url, note, sort_order';
  const { results } = program
    ? await env.DB.prepare(`SELECT ${cols} FROM program_links WHERE program_slug = ? ORDER BY sort_order, id`).bind(program).all()
    : await env.DB.prepare(`SELECT ${cols} FROM program_links ORDER BY program_slug, sort_order, id`).all();
  return Response.json({ links: results || [] });
}

export async function onRequestPost({ request, env }) {
  if (!await checkAdmin(request, env)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { id, action, program_slug, kind, label, url, note, sort_order } = body;

  if (action === 'delete') {
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });
    await env.DB.prepare('DELETE FROM program_links WHERE id = ?').bind(id).run();
    return Response.json({ ok: true, action: 'deleted' });
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
