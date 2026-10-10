// POST /api/projects/:slug/image — set or remove a project's image (lead or admin).
//   multipart/form-data { image: File }  → stores it, returns { image_url }
//   application/json   { remove: true }  → clears it, returns { image_url: null }
// The editor crops to 16:9 and re-encodes before upload (projects/edit); this
// endpoint only checks type and size. The previous object is deleted from R2 so
// replaced images don't accumulate. POST for both: the CF WAF blocks PUT/DELETE
// on Pages. No SVG, for the same stored-XSS reason as /api/pages/upload-image.

import { getSession } from '../../../_shared/session.js';

const TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_BYTES = 3 * 1024 * 1024;

export async function onRequestPost({ params, request, env }) {
  const email = await getSession(request, env);
  if (!email) return Response.json({ error: 'Not authenticated' }, { status: 401 });
  const member = await env.DB.prepare('SELECT slug, is_admin FROM members WHERE email = ?').bind(email).first();
  if (!member) return Response.json({ error: 'Member not found' }, { status: 404 });

  const project = await env.DB.prepare(
    "SELECT id, slug, lead_slug, image_key FROM projects WHERE slug = ? AND status = 'approved'"
  ).bind(params.slug).first();
  if (!project) return Response.json({ error: 'Not found' }, { status: 404 });
  if (!member.is_admin && member.slug !== project.lead_slug) {
    return Response.json({ error: 'Only the project lead or an admin can change its image' }, { status: 403 });
  }

  let newKey = null;
  if ((request.headers.get('Content-Type') || '').includes('application/json')) {
    let body;
    try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
    if (!body || body.remove !== true) return Response.json({ error: 'Nothing to do' }, { status: 400 });
  } else {
    let form;
    try { form = await request.formData(); } catch { return Response.json({ error: 'Invalid form data' }, { status: 400 }); }
    const image = form.get('image');
    if (!image || typeof image === 'string') return Response.json({ error: 'image file required' }, { status: 400 });
    const ext = TYPES[image.type];
    if (!ext) return Response.json({ error: 'Use a JPEG, PNG or WebP image' }, { status: 400 });
    if (image.size > MAX_BYTES) return Response.json({ error: 'Image is too large (3 MB max)' }, { status: 400 });
    newKey = `projects/${project.slug}/${Date.now()}.${ext}`;
    await env.ASSETS_BUCKET.put(newKey, image.stream(), { httpMetadata: { contentType: image.type } });
  }

  await env.DB.prepare("UPDATE projects SET image_key = ?, updated_at = datetime('now') WHERE id = ?")
    .bind(newKey, project.id).run();
  if (project.image_key && project.image_key !== newKey) {
    try { await env.ASSETS_BUCKET.delete(project.image_key); } catch (err) { console.error('old project image delete failed:', err); }
  }
  return Response.json({ image_url: newKey ? '/assets/' + newKey : null });
}
