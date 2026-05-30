// PATCH /api/members/update
// Body: { target_email?: string, fields: {...} }
// Updates own profile; if target_email is a bot owned by the user, updates that record instead
// Admin-only fields (is_team, team_title, qualifying tags) are blocked for self-service

const SELF_EDITABLE = new Set([
  'name', 'bio', 'website', 'photo_r2_key',
  'city', 'discord_handle',
  // Event/credential tags — self-service (team tags excluded)
  'tag_sop23', 'tag_sop24', 'tag_sop25', 'tag_ps25',
  'tag_datus_nusas', 'tag_khlongs_subaks', 'tag_town_hall',
  'tag_sig', 'tag_protocol_kit', 'tag_protocolized_writer',
  // Consulting fields
  'consulting_expertise', 'consulting_contact', 'consulting_portfolio',
]);

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

export async function onRequestPatch({ request, env }) {
  const sessionEmail = await getSession(request, env);
  if (!sessionEmail) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const targetEmail = (body.target_email || '').trim().toLowerCase() || sessionEmail;
  const fields = body.fields || {};

  // Determine if user may edit the target record
  let authorized = false;
  if (targetEmail === sessionEmail) {
    authorized = true;
  } else {
    // Check if target is a bot owned by the session user
    const target = await env.DB.prepare(
      'SELECT owner_email FROM members WHERE email = ?'
    ).bind(targetEmail).first();
    if (target && target.owner_email === sessionEmail) {
      authorized = true;
    }
  }

  if (!authorized) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Filter to allowed fields
  const allowed = {};
  for (const [k, v] of Object.entries(fields)) {
    if (SELF_EDITABLE.has(k)) {
      allowed[k] = v === '' ? null : v;
    }
  }

  if (!Object.keys(allowed).length) {
    return Response.json({ error: 'No editable fields provided' }, { status: 400 });
  }

  const setClauses = Object.keys(allowed).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(allowed), new Date().toISOString(), targetEmail];

  await env.DB.prepare(
    `UPDATE members SET ${setClauses}, updated_at = ? WHERE email = ?`
  ).bind(...values).run();

  return Response.json({ ok: true });
}
