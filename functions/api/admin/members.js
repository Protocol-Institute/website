// /admin/members API
// GET               — list pending membership requests
// GET ?view=all     — list all members (for admin editor)
// POST              — approve, reject, or resend_welcome
// PATCH             — update fields on an existing member record
// All protected by Authorization: Bearer <ADMIN_KEY>

import { EVENT_TAGS as TAG_COLUMNS } from '../../_shared/tags.js';
import { sendWelcomeEmail } from '../../_shared/welcome.js';

const EDITABLE_FIELDS = new Set([
  'email', 'name', 'bio', 'website', 'photo_r2_key', 'city', 'discord_handle',
  'tier', 'community_lead_title', 'team_title',
  'is_consultant', 'is_public', 'is_admin', 'is_team', 'welcome_sent',
  ...TAG_COLUMNS,
]);

function checkAuth(request, env) {
  const auth = request.headers.get('Authorization') || '';
  return auth === `Bearer ${env.ADMIN_KEY}`;
}

async function sendRejectionEmail(env, email, firstName) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Protocol Institute <noreply@protocol-institute.org>',
      to: [email],
      subject: 'Your Protocol Institute membership application',
      html: `<p>Hi ${firstName},</p>
<p>Thank you for your interest in Protocol Institute membership. You do not currently meet the eligibility criteria, but you can apply in the future once you've attended a qualifying PI event or participated in a SIG. See the <a href="https://protocol-institute.org/members/join">Join page</a> for details.</p>
<p>— Protocol Institute</p>`,
    }),
  });
}

export async function onRequestGet({ request, env }) {
  if (!checkAuth(request, env)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);

  if (url.searchParams.get('view') === 'all') {
    const { results } = await env.DB.prepare(
      `SELECT email, slug, name, bio, website, photo_r2_key,
              tier, community_lead_title, team_title,
              is_consultant, is_public, is_admin, is_team, welcome_sent,
              city, discord_handle, type,
              ${TAG_COLUMNS.join(', ')}
       FROM members ORDER BY name ASC`
    ).all();
    return Response.json({ members: results || [] });
  }

  const { results } = await env.DB.prepare(
    `SELECT * FROM membership_requests WHERE status = 'pending' ORDER BY created_at ASC`
  ).all();
  return Response.json({ requests: results || [] });
}

export async function onRequestPatch({ request, env }) {
  if (!checkAuth(request, env)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { slug, updates } = body;
  if (!slug || !updates || typeof updates !== 'object') {
    return Response.json({ error: 'slug and updates required' }, { status: 400 });
  }

  const safe = Object.entries(updates).filter(([k]) => EDITABLE_FIELDS.has(k));
  if (!safe.length) return Response.json({ error: 'No valid fields to update' }, { status: 400 });

  const setClauses = safe.map(([k]) => `${k} = ?`).join(', ');
  const values = safe.map(([, v]) => v);

  await env.DB.prepare(
    `UPDATE members SET ${setClauses}, updated_at = ? WHERE slug = ?`
  ).bind(...values, new Date().toISOString(), slug).run();

  return Response.json({ ok: true });
}

export async function onRequestPost({ request, env }) {
  if (!checkAuth(request, env)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { email, action, admin_notes, slug, consultant_approved } = body;

  if (!email || !['approve', 'reject', 'resend_welcome'].includes(action)) {
    return Response.json({ error: 'email and action required' }, { status: 400 });
  }

  if (action === 'resend_welcome') {
    const member = await env.DB.prepare('SELECT name FROM members WHERE email = ?').bind(email).first();
    if (!member) return Response.json({ error: 'Member not found' }, { status: 404 });
    await sendWelcomeEmail(env, email, member.name.split(' ')[0]);
    return Response.json({ ok: true, action: 'welcome_sent' });
  }

  const req = await env.DB.prepare(
    'SELECT * FROM membership_requests WHERE email = ? AND status = ?'
  ).bind(email, 'pending').first();

  if (!req) return Response.json({ error: 'Request not found or already processed' }, { status: 404 });

  const firstName = req.name.split(' ')[0];

  if (action === 'reject') {
    await env.DB.prepare(
      `UPDATE membership_requests SET status = 'rejected', reviewed_at = ?, admin_notes = ? WHERE email = ?`
    ).bind(new Date().toISOString(), admin_notes || null, email).run();
    await sendRejectionEmail(env, email, firstName);
    return Response.json({ ok: true, action: 'rejected' });
  }

  // Approve
  const memberSlug = slug || email.split('@')[0].replace(/[^a-z0-9]+/gi, '-').toLowerCase();
  const events = JSON.parse(req.qualifying_events || '[]');
  const tagValues = TAG_COLUMNS.map(col => events.includes(col) ? 1 : 0);
  const today = new Date().toISOString().slice(0, 10);
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  await env.DB.prepare(`
    INSERT OR IGNORE INTO members
      (email, slug, name, bio, website, photo_r2_key,
       is_consultant, is_team,
       consulting_expertise, consulting_contact, consulting_portfolio,
       city, discord_handle, owner_email,
       member_since, membership_expires,
       ${TAG_COLUMNS.join(', ')})
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ${TAG_COLUMNS.map(() => '?').join(', ')})
  `).bind(
    email, memberSlug, req.name, req.bio || null, req.website || null,
    req.photo_url || null,
    (req.request_consultant && consultant_approved !== false) ? 1 : 0,
    req.request_team ? 1 : 0,
    req.consulting_expertise || null, req.consulting_contact || null, req.consulting_portfolio || null,
    req.city || null, req.discord_handle || null, email,
    today, expires,
    ...tagValues
  ).run();

  await env.DB.prepare(
    `UPDATE membership_requests SET status = 'approved', reviewed_at = ?, admin_notes = ? WHERE email = ?`
  ).bind(new Date().toISOString(), admin_notes || null, email).run();

  await sendWelcomeEmail(env, email, firstName);
  return Response.json({ ok: true, action: 'approved', slug: memberSlug });
}
