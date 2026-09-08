// GET  /api/sigs/links?sig=<slug> — public list of links for a SIG (all SIGs if no ?sig=)
// POST /api/sigs/links            — admin only: create, update, or delete a link
//
// Affiliated projects are NOT served here — they live in `projects.sig_slug` and
// are read from /api/projects?sig=<slug>. This endpoint covers everything that is
// a link but not a project, including a SIG's own homepage (kind='website').

import { getSession } from '../../_shared/session.js';
import { VALID_SIGS } from '../../_shared/sigs.js';

const VALID_KINDS = new Set(['website', 'link']);

async function checkAdmin(request, env) {
  const email = await getSession(request, env);
  if (!email) return false;
  const member = await env.DB.prepare('SELECT is_admin FROM members WHERE email = ?').bind(email).first();
  return member?.is_admin === 1;
}

export async function onRequestGet({ request, env }) {
  const sig = new URL(request.url).searchParams.get('sig');
  if (sig && !VALID_SIGS.has(sig)) {
    return Response.json({ error: 'Unknown SIG' }, { status: 400 });
  }

  const { results } = sig
    ? await env.DB.prepare(
        'SELECT id, sig_slug, kind, label, url, note, sort_order FROM sig_links WHERE sig_slug = ? ORDER BY sort_order, id'
      ).bind(sig).all()
    : await env.DB.prepare(
        'SELECT id, sig_slug, kind, label, url, note, sort_order FROM sig_links ORDER BY sig_slug, sort_order, id'
      ).all();

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

  const { id, action, sig_slug, kind, label, url, note, sort_order } = body;

  if (action === 'delete') {
    if (!id) return Response.json({ error: 'id required' }, { status: 400 });
    await env.DB.prepare('DELETE FROM sig_links WHERE id = ?').bind(id).run();
    return Response.json({ ok: true, action: 'deleted' });
  }

  if (!sig_slug || !VALID_SIGS.has(sig_slug)) {
    return Response.json({ error: 'Valid sig_slug required' }, { status: 400 });
  }
  const linkKind = kind || 'link';
  if (!VALID_KINDS.has(linkKind)) {
    return Response.json({ error: 'kind must be website or link' }, { status: 400 });
  }
  if (!label || !String(label).trim()) {
    return Response.json({ error: 'label required' }, { status: 400 });
  }
  if (!url || !/^https?:\/\//i.test(url)) {
    return Response.json({ error: 'url must be an absolute http(s) URL' }, { status: 400 });
  }

  const vals = [sig_slug, linkKind, String(label).trim(), url.trim(), note || null, sort_order || 0];

  if (id) {
    await env.DB.prepare(
      'UPDATE sig_links SET sig_slug = ?, kind = ?, label = ?, url = ?, note = ?, sort_order = ? WHERE id = ?'
    ).bind(...vals, id).run();
    return Response.json({ ok: true, action: 'updated', id });
  }

  const res = await env.DB.prepare(
    'INSERT INTO sig_links (sig_slug, kind, label, url, note, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(...vals).run();
  return Response.json({ ok: true, action: 'created', id: res.meta.last_row_id });
}
