// POST /api/pages/upload-image
// Accepts multipart/form-data: { image: File, page_key: string }
// Stores in R2 at pages/{page_key_slug}/{timestamp}.{ext}
// Returns { url: '/assets/pages/...' }
// Auth: any logged-in member (tighten later if needed)

import { getSession } from '../../_shared/session.js';

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']);
const EXT_MAP = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/gif': 'gif',
  'image/webp': 'webp', 'image/svg+xml': 'svg',
};

export async function onRequestPost({ request, env }) {
  const email = await getSession(request, env);
  if (!email) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const member = await env.DB.prepare('SELECT slug FROM members WHERE email = ?').bind(email).first();
  if (!member) return Response.json({ error: 'Forbidden' }, { status: 403 });

  let formData;
  try { formData = await request.formData(); }
  catch { return Response.json({ error: 'Invalid form data' }, { status: 400 }); }

  const image = formData.get('image');
  const pageKey = (formData.get('page_key') || 'general').replace(/[^a-z0-9\-_\/]/gi, '-');

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
