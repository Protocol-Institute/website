// /admin/members API
// GET  — list pending membership requests
// POST — approve, reject, or resend_welcome  (body: { email, action, admin_notes?, slug? })
// Protected by Authorization: Bearer <ADMIN_KEY> header

import { EVENT_TAGS as TAG_COLUMNS } from '../../_shared/tags.js';

const WELCOME_PIN_TTL_MINUTES = 72 * 60; // 3 days — long enough to not expire before they read it

function checkAuth(request, env) {
  const auth = request.headers.get('Authorization') || '';
  return auth === `Bearer ${env.ADMIN_KEY}`;
}

function generatePin() {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return String(arr[0] % 1000000).padStart(6, '0');
}

async function hashPin(pin) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function sendEmail(env, to, subject, html) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Protocol Institute <noreply@protocol-institute.org>',
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    console.error('Resend error:', await res.text());
  }
}

async function sendWelcomeEmail(env, email, firstName) {
  const pin = generatePin();
  const pinHash = await hashPin(pin);
  const expiresAt = new Date(Date.now() + WELCOME_PIN_TTL_MINUTES * 60 * 1000).toISOString();

  await env.DB.prepare(
    'INSERT OR REPLACE INTO auth_pins (email, pin_hash, expires_at) VALUES (?, ?, ?)'
  ).bind(email, pinHash, expiresAt).run();

  await sendEmail(env, email,
    'Welcome to the Protocol Institute member network',
    `<p>Hi ${firstName},</p>
<p>Welcome! Your application to the Protocol Institute member network has been approved. You can now log in to view and update your profile.</p>
<p>Your sign-in code is: <strong style="font-size:1.4em;letter-spacing:0.1em">${pin}</strong></p>
<p>This code expires in 3 days. If it expires, you can always request a new one at <a href="https://protocol-institute.org/members/join">protocol-institute.org/members/join</a>.</p>
<p>You now have access to members-only features of the site, such as submitting <a href="https://protocol-institute.org/challenges">Challenges</a>. More features will be added in the future. If this email landed in spam, be sure to mark it not-spam.</p>
<p>— Protocol Institute</p>`
  );

  // Mark welcome email as confirmed sent — only reached if no exception above
  await env.DB.prepare(
    'UPDATE members SET welcome_sent = 1 WHERE email = ?'
  ).bind(email).run();
}

async function sendRejectionEmail(env, email, firstName) {
  await sendEmail(env, email,
    'Your Protocol Institute membership application',
    `<p>Hi ${firstName},</p>
<p>Thank you for your interest in Protocol Institute membership. You do not currently meet the eligibility criteria, but you can apply in the future once you've attended a qualifying PI event or participated in a SIG. See the <a href="https://protocol-institute.org/members/join">Join page</a> for details.</p>
<p>— Protocol Institute</p>`
  );
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

  if (!email || !['approve', 'reject', 'resend_welcome'].includes(action)) {
    return Response.json({ error: 'email and action required' }, { status: 400 });
  }

  // resend_welcome: send welcome email to an already-approved member
  if (action === 'resend_welcome') {
    const member = await env.DB.prepare(
      'SELECT name FROM members WHERE email = ?'
    ).bind(email).first();
    if (!member) return Response.json({ error: 'Member not found' }, { status: 404 });
    const firstName = member.name.split(' ')[0];
    await sendWelcomeEmail(env, email, firstName);
    return Response.json({ ok: true, action: 'welcome_sent' });
  }

  const req = await env.DB.prepare(
    'SELECT * FROM membership_requests WHERE email = ? AND status = ?'
  ).bind(email, 'pending').first();

  if (!req) {
    return Response.json({ error: 'Request not found or already processed' }, { status: 404 });
  }

  const firstName = req.name.split(' ')[0];

  if (action === 'reject') {
    await env.DB.prepare(
      `UPDATE membership_requests SET status = 'rejected', reviewed_at = ?, admin_notes = ? WHERE email = ?`
    ).bind(new Date().toISOString(), admin_notes || null, email).run();
    await sendRejectionEmail(env, email, firstName);
    return Response.json({ ok: true, action: 'rejected' });
  }

  // Approve: create member record
  const memberSlug = slug || email.split('@')[0].replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const events = JSON.parse(req.qualifying_events || '[]');
  const tagValues = TAG_COLUMNS.map(col => events.includes(col) ? 1 : 0);

  await env.DB.prepare(`
    INSERT OR IGNORE INTO members
      (email, slug, name, bio, website, photo_r2_key,
       is_consultant, is_team,
       consulting_expertise, consulting_contact, consulting_portfolio,
       city, discord_handle, owner_email,
       ${TAG_COLUMNS.join(', ')})
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${TAG_COLUMNS.map(() => '?').join(', ')})
  `).bind(
    email,
    memberSlug,
    req.name,
    req.bio || null,
    req.website || null,
    req.photo_url || null,
    req.request_consultant ? 1 : 0,
    req.request_team ? 1 : 0,
    req.consulting_expertise || null,
    req.consulting_contact || null,
    req.consulting_portfolio || null,
    req.city || null,
    req.discord_handle || null,
    email,
    ...tagValues
  ).run();

  await env.DB.prepare(
    `UPDATE membership_requests SET status = 'approved', reviewed_at = ?, admin_notes = ? WHERE email = ?`
  ).bind(new Date().toISOString(), admin_notes || null, email).run();

  await sendWelcomeEmail(env, email, firstName);

  return Response.json({ ok: true, action: 'approved', slug: memberSlug });
}
