// Admin API for cogergo items — session-based, requires is_admin = 1
// GET  /api/admin/items?status=pending|approved — list items
// POST /api/admin/items — approve, reject, or set_severity
import { getSessionMember } from '../../_shared/auth.js';

async function requireAdmin(request, env) {
  const member = await getSessionMember(request, env);
  if (!member || !member.is_admin) return null;
  return member;
}

function parseTags(raw) {
  try { return JSON.parse(raw || '[]'); } catch { return []; }
}

export async function onRequestGet({ request, env }) {
  const admin = await requireAdmin(request, env);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const status = url.searchParams.get('status') || 'pending';
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return Response.json({ error: 'Invalid status' }, { status: 400 });
  }

  const { results } = await env.DB.prepare(`
    SELECT ci.*, m.name AS contributor_name,
      (SELECT COUNT(*) FROM cogergo_votes cv WHERE cv.item_id = ci.id AND cv.vote = 'do')   AS do_count,
      (SELECT COUNT(*) FROM cogergo_votes cv WHERE cv.item_id = ci.id AND cv.vote = 'dont') AS dont_count
    FROM cogergo_items ci
    LEFT JOIN members m ON m.slug = ci.contributed_by_slug
    WHERE ci.status = ?
    ORDER BY ci.title ASC
  `).bind(status).all();

  return Response.json({
    items: (results || []).map(r => ({ ...r, tags: parseTags(r.tags) })),
  });
}

export async function onRequestPost({ request, env }) {
  const admin = await requireAdmin(request, env);
  if (!admin) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { slug, action, admin_notes, severity } = body;
  if (!slug || !action) return Response.json({ error: 'slug and action required' }, { status: 400 });

  if (action === 'set_severity') {
    if (severity === undefined || severity === null) {
      // Clear severity
      await env.DB.prepare(
        "UPDATE cogergo_items SET severity = NULL, updated_at = datetime('now') WHERE slug = ?"
      ).bind(slug).run();
    } else {
      const s = parseInt(severity, 10);
      if (isNaN(s) || s < -10 || s > 10) return Response.json({ error: 'Severity must be -10 to 10' }, { status: 400 });
      await env.DB.prepare(
        "UPDATE cogergo_items SET severity = ?, updated_at = datetime('now') WHERE slug = ?"
      ).bind(s, slug).run();
    }
    return Response.json({ ok: true, action: 'severity_set' });
  }

  if (!['approve', 'reject'].includes(action)) {
    return Response.json({ error: 'action must be approve, reject, or set_severity' }, { status: 400 });
  }

  const item = await env.DB.prepare(
    "SELECT id FROM cogergo_items WHERE slug = ? AND status = 'pending'"
  ).bind(slug).first();
  if (!item) return Response.json({ error: 'Item not found or already processed' }, { status: 404 });

  const newStatus = action === 'approve' ? 'approved' : 'rejected';
  const sevVal = action === 'approve' && severity !== undefined && severity !== null
    ? parseInt(severity, 10) : null;

  await env.DB.prepare(`
    UPDATE cogergo_items SET status = ?, admin_notes = ?, severity = ?, updated_at = datetime('now')
    WHERE slug = ?
  `).bind(newStatus, admin_notes || null, isNaN(sevVal) ? null : sevVal, slug).run();

  return Response.json({ ok: true, action });
}
