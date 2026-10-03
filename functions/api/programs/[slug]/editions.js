// POST /api/programs/:slug/editions — host or admin: create, update or delete
// a dated run of this program.
//   { action: 'create', slug, title, start_date?, end_date?, location?, status? }
//   { action: 'update', id, ...same fields }
//   { action: 'delete', id }   — refused while projects are tagged to it

import { getSession } from '../../../_shared/session.js';
import { memberForSession, canEditProgram, SLUG_RE } from '../../../_shared/programs.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function onRequestPost({ params, request, env }) {
  const member = await memberForSession(env, await getSession(request, env));
  if (!member) return Response.json({ error: 'Not authenticated' }, { status: 401 });
  if (!await canEditProgram(env, member, params.slug)) {
    return Response.json({ error: 'Only this program\'s hosts or an admin can edit it' }, { status: 403 });
  }

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  if (body.action === 'delete') {
    const used = await env.DB.prepare('SELECT 1 FROM project_programs WHERE edition_id = ?').bind(body.id).first();
    if (used) return Response.json({ error: 'Projects are tagged to this edition' }, { status: 409 });
    const nested = await env.DB.prepare('SELECT 1 FROM editions WHERE part_of_edition_id = ?').bind(body.id).first();
    if (nested) return Response.json({ error: 'Other runs are nested inside this edition' }, { status: 409 });
    await env.DB.prepare('DELETE FROM editions WHERE id = ? AND program_slug = ?').bind(body.id, params.slug).run();
    return Response.json({ ok: true });
  }

  const title = String(body.title || '').trim();
  const slug = String(body.slug || '').trim().toLowerCase();
  const start = body.start_date || null;
  const end = body.end_date || null;
  const status = body.status || 'planned';
  if (!title) return Response.json({ error: 'Title required' }, { status: 400 });
  if (!SLUG_RE.test(slug)) return Response.json({ error: 'Slug: lowercase letters, digits and hyphens' }, { status: 400 });
  if ((start && !DATE_RE.test(start)) || (end && !DATE_RE.test(end))) {
    return Response.json({ error: 'Dates must be YYYY-MM-DD' }, { status: 400 });
  }
  if (!['planned', 'active', 'past'].includes(status)) return Response.json({ error: 'Invalid status' }, { status: 400 });
  const vals = [slug, title, start, end, String(body.location || '').trim() || null, status];

  try {
    if (body.action === 'update') {
      const res = await env.DB.prepare(`
        UPDATE editions SET slug = ?, title = ?, start_date = ?, end_date = ?, location = ?, status = ?
        WHERE id = ? AND program_slug = ?
      `).bind(...vals, body.id, params.slug).run();
      if (!res.meta.changes) return Response.json({ error: 'Edition not found' }, { status: 404 });
      return Response.json({ ok: true });
    }
    const res = await env.DB.prepare(`
      INSERT INTO editions (slug, title, start_date, end_date, location, status, program_slug)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(...vals, params.slug).run();
    return Response.json({ ok: true, id: res.meta.last_row_id }, { status: 201 });
  } catch (err) {
    if (String(err).includes('UNIQUE')) return Response.json({ error: 'An edition with that slug exists' }, { status: 409 });
    throw err;
  }
}
