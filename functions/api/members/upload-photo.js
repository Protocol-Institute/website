// POST /api/members/upload-photo
// Accepts multipart/form-data with a `photo` file field + optional `target_email`
// Uploads to R2 as beings/<slug>.<ext>, updates member record
// Requires valid pi_session cookie

const MAX_BYTES = 2 * 1024 * 1024; // 2MB

const MIME_EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

async function sha256hex(str) {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(str));
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getSession(request, env) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/pi_session=([^;]+)/);
  if (!match) return null;

  const sessionValue = decodeURIComponent(match[1]);
  const colonIdx = sessionValue.indexOf(':');
  if (colonIdx === -1) return null;

  const token = sessionValue.slice(0, colonIdx);
  const email = sessionValue.slice(colonIdx + 1);

  const record = await env.DB.prepare(
    'SELECT pin_hash, expires_at FROM auth_pins WHERE email = ?'
  ).bind(`session:${email}`).first();

  if (!record || new Date(record.expires_at) < new Date()) return null;

  const tokenHash = await sha256hex(token);
  if (tokenHash !== record.pin_hash) return null;

  return email;
}

export async function onRequestPost({ request, env }) {
  const sessionEmail = await getSession(request, env);
  if (!sessionEmail) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const file = formData.get('photo');
  if (!file || typeof file === 'string') {
    return Response.json({ error: 'No photo file provided' }, { status: 400 });
  }

  const ext = MIME_EXT[file.type];
  if (!ext) {
    return Response.json({ error: 'Unsupported file type. Please upload a JPEG, PNG, WebP, or GIF.' }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  if (buffer.byteLength > MAX_BYTES) {
    return Response.json({ error: 'File too large. Maximum size is 2MB.' }, { status: 400 });
  }

  // Determine target member (own record or owned bot)
  const targetEmailRaw = formData.get('target_email') || '';
  const targetEmail = targetEmailRaw.trim().toLowerCase() || sessionEmail;

  let member;
  if (targetEmail === sessionEmail) {
    member = await env.DB.prepare('SELECT slug FROM members WHERE email = ?').bind(sessionEmail).first();
  } else {
    member = await env.DB.prepare(
      'SELECT slug FROM members WHERE email = ? AND owner_email = ?'
    ).bind(targetEmail, sessionEmail).first();
  }

  if (!member) {
    return Response.json({ error: 'Member not found or access denied' }, { status: 403 });
  }

  const key = `beings/${member.slug}.${ext}`;

  await env.ASSETS_BUCKET.put(key, buffer, {
    httpMetadata: { contentType: file.type },
  });

  await env.DB.prepare(
    'UPDATE members SET photo_r2_key = ?, updated_at = ? WHERE email = ?'
  ).bind(key, new Date().toISOString(), targetEmail).run();

  return Response.json({ ok: true, key, url: `/assets/${key}` });
}
