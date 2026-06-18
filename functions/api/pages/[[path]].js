// GET /api/pages/{page_key} — public, returns page content
// PUT /api/pages/{page_key} — auth-gated, upserts content
//
// page_key is a slash-joined path: sigs/mrg/about, projects/foo, static/bar
// Auth rules:
//   is_admin → any page
//   is_sig_host + sig_host_slugs contains X → sigs/X/*
//   (future) project owner → projects/{their_slug}

import { getSession } from '../../_shared/session.js';

async function canEdit(email, pageKey, env) {
  const member = await env.DB.prepare(
    'SELECT is_admin, is_sig_host, sig_host_slugs FROM members WHERE email = ?'
  ).bind(email).first();
  if (!member) return false;
  if (member.is_admin) return true;
  if (member.is_sig_host && member.sig_host_slugs) {
    try {
      const slugs = JSON.parse(member.sig_host_slugs);
      const parts = pageKey.split('/');
      if (parts[0] === 'sigs' && slugs.includes(parts[1])) return true;
    } catch {}
  }
  return false;
}

export async function onRequestGet({ params, env }) {
  const pageKey = Array.isArray(params.path) ? params.path.join('/') : params.path;
  const row = await env.DB.prepare(
    `SELECT page_key, title, content_md, updated_at, updated_by
     FROM managed_pages WHERE page_key = ? AND is_published = 1`
  ).bind(pageKey).first();
  if (!row) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(row);
}

async function handleSave({ request, params, env }) {
  const email = await getSession(request, env);
  if (!email) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const pageKey = Array.isArray(params.path) ? params.path.join('/') : params.path;
  if (!await canEdit(email, pageKey, env)) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { content_md, title } = body;
  if (content_md === undefined) {
    return Response.json({ error: 'content_md required' }, { status: 400 });
  }

  await env.DB.prepare(`
    INSERT INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published)
    VALUES (?, ?, ?, ?, ?, 1)
    ON CONFLICT(page_key) DO UPDATE SET
      title      = excluded.title,
      content_md = excluded.content_md,
      updated_at = excluded.updated_at,
      updated_by = excluded.updated_by
  `).bind(pageKey, title || '', content_md, new Date().toISOString(), email).run();

  return Response.json({ ok: true });
}

export const onRequestPut = handleSave;
export const onRequestPost = handleSave;
