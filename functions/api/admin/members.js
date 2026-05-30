// /admin/members API
// GET  — list pending membership requests
// POST — approve or reject a request  (body: { email, action: 'approve'|'reject', admin_notes?, slug? })
// Protected by Authorization: Bearer <ADMIN_KEY> header

const TAG_COLUMNS = [
  'tag_sop23','tag_sop24','tag_sop25','tag_ps25',
  'tag_datus_nusas','tag_khlongs_subaks','tag_town_hall',
  'tag_sig','tag_protocol_kit'
];

function checkAuth(request, env) {
  const auth = request.headers.get('Authorization') || '';
  return auth === `Bearer ${env.ADMIN_KEY}`;
}

export async function onRequestGet({ request, env }) {
  if (!checkAuth(request, env)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { results } = await env.DB.prepare(
    `SELECT * FROM membership_requests WHERE status = 'pending' ORDER BY created_at ASC`
  ).all();

  return Response.json({ requests: results });
}

export async function onRequestPost({ request, env }) {
  if (!checkAuth(request, env)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { email, action, admin_notes, slug } = body;

  if (!email || !['approve', 'reject'].includes(action)) {
    return Response.json({ error: 'email and action required' }, { status: 400 });
  }

  const req = await env.DB.prepare(
    'SELECT * FROM membership_requests WHERE email = ? AND status = ?'
  ).bind(email, 'pending').first();

  if (!req) {
    return Response.json({ error: 'Request not found or already processed' }, { status: 404 });
  }

  if (action === 'reject') {
    await env.DB.prepare(
      `UPDATE membership_requests SET status = 'rejected', reviewed_at = ?, admin_notes = ? WHERE email = ?`
    ).bind(new Date().toISOString(), admin_notes || null, email).run();
    return Response.json({ ok: true, action: 'rejected' });
  }

  // Approve: create member record
  const memberSlug = slug || email.split('@')[0].replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const events = JSON.parse(req.qualifying_events || '[]');

  const tagValues = TAG_COLUMNS.map(col => events.includes(col) ? 1 : 0);

  await env.DB.prepare(`
    INSERT OR IGNORE INTO members
      (email, slug, name, bio, website, photo_r2_key,
       is_consultant, request_consultant,
       consulting_expertise, consulting_contact, consulting_portfolio,
       ${TAG_COLUMNS.join(', ')})
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${TAG_COLUMNS.map(() => '?').join(', ')})
  `).bind(
    email,
    memberSlug,
    req.name,
    req.bio || null,
    req.website || null,
    req.photo_url || null,
    req.request_consultant ? 1 : 0,
    req.request_team ? 1 : 0,  // stored but admin must manually set is_team
    req.consulting_expertise || null,
    req.consulting_contact || null,
    req.consulting_portfolio || null,
    ...tagValues
  ).run();

  await env.DB.prepare(
    `UPDATE membership_requests SET status = 'approved', reviewed_at = ?, admin_notes = ? WHERE email = ?`
  ).bind(new Date().toISOString(), admin_notes || null, email).run();

  return Response.json({ ok: true, action: 'approved', slug: memberSlug });
}
