// POST /api/pages/upload-image
// Accepts multipart/form-data: { image: File, page_key: string }
// Stores in R2 at pages/{page_key_slug}/{timestamp}.{ext}
// Returns { url: '/assets/pages/...' }
// Auth: whoever may edit page_key — an admin, or a host of the program it
// belongs to (sigs/<slug>/…, programs/<slug>/…). Was "any logged-in member".
//
// No SVG: uploads are served from this origin via /assets/, and an SVG can
// carry script, so accepting one would be stored XSS on protocol-institute.org.

import { getSession } from '../../_shared/session.js';
import { memberForSession, canEditProgram } from '../../_shared/programs.js';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const EXT_MAP = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif', 'image/webp': 'webp',
};

export async function onRequestPost({ request, env }) {
  const email = await getSession(request, env);
  if (!email) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const member = await memberForSession(env, email);
  if (!member) return Response.json({ error: 'Forbidden' }, { status: 403 });

  let formData;
  try { formData = await request.formData(); }
  catch { return Response.json({ error: 'Invalid form data' }, { status: 400 }); }

  const image = formData.get('image');
  const pageKey = (formData.get('page_key') || 'general').replace(/[^a-z0-9\-_\/]/gi, '-');

  const [scope, programSlug] = pageKey.split('/');
  const allowed = member.is_admin ||
    ((scope === 'sigs' || scope === 'programs') && programSlug && await canEditProgram(env, member, programSlug));
  if (!allowed) return Response.json({ error: 'Forbidden' }, { status: 403 });

  if (!image || typeof image === 'string') {
    return Response.json({ error: 'image file required' }, { status: 400 });
  }

  const contentType = image.type || 'image/jpeg';
  if (!ALLOWED_TYPES.has(contentType)) {
    return Response.json({ error: 'File type not allowed' }, { status: 400 });
  }

  const ext = EXT_MAP[contentType] || 'jpg';
  const keySlug = pageKey.replace(/\//g, '-');
  const r2Key = `pages/${keySlug}/${Date.now()}.${ext}`;

  await env.ASSETS_BUCKET.put(r2Key, image.stream(), {
    httpMetadata: { contentType },
  });

  return Response.json({ url: `/assets/${r2Key}` });
}
