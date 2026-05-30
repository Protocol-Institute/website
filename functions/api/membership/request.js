// POST /api/membership/request
// Handles new member registration form submission
// Inserts into membership_requests (pending admin review)

const VALID_TAGS = [
  'tag_sop23', 'tag_sop24', 'tag_sop25', 'tag_ps25',
  'tag_datus_nusas', 'tag_khlongs_subaks', 'tag_town_hall',
  'tag_sig', 'tag_protocol_kit'
];

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email = (body.email || '').trim().toLowerCase();
  const name = (body.name || '').trim();
  const bio = (body.bio || '').trim();
  const website = (body.website || '').trim();
  const city = (body.city || '').trim();
  const discord_handle = (body.discord_handle || '').trim();
  const qualifying_events = Array.isArray(body.qualifying_events) ? body.qualifying_events : [];
  const request_team = body.request_team ? 1 : 0;
  const request_consultant = body.request_consultant ? 1 : 0;
  const consulting_expertise = (body.consulting_expertise || '').trim();
  const consulting_contact = (body.consulting_contact || '').trim();
  const consulting_portfolio = (body.consulting_portfolio || '').trim();
  const photo_url = (body.photo_url || '').trim();
  const applicant_notes = (body.applicant_notes || '').trim();

  // Basic validation
  if (!email || !email.includes('@')) {
    return Response.json({ error: 'Valid email required' }, { status: 400 });
  }
  if (!name) {
    return Response.json({ error: 'Name required' }, { status: 400 });
  }
  // Must select at least one qualifying event
  const validEvents = qualifying_events.filter(t => VALID_TAGS.includes(t));
  if (validEvents.length === 0) {
    return Response.json({ error: 'At least one qualifying event required' }, { status: 400 });
  }

  // Check for duplicate (already a member or pending)
  const existing = await env.DB.prepare(
    'SELECT email FROM members WHERE email = ?'
  ).bind(email).first();
  if (existing) {
    return Response.json({ error: 'This email is already registered. Use the edit page to update your profile.' }, { status: 409 });
  }

  const pending = await env.DB.prepare(
    'SELECT email FROM membership_requests WHERE email = ? AND status = ?'
  ).bind(email, 'pending').first();
  if (pending) {
    return Response.json({ error: 'A request from this email is already pending review.' }, { status: 409 });
  }

  await env.DB.prepare(`
    INSERT INTO membership_requests
      (email, name, bio, website, city, discord_handle,
       qualifying_events,
       request_team, request_consultant, photo_url,
       consulting_expertise, consulting_contact, consulting_portfolio,
       applicant_notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).bind(
    email, name, bio || null, website || null,
    city || null, discord_handle || null,
    JSON.stringify(validEvents),
    request_team, request_consultant,
    photo_url || null,
    consulting_expertise || null,
    consulting_contact || null,
    consulting_portfolio || null,
    applicant_notes || null
  ).run();

  return Response.json({ ok: true });
}
