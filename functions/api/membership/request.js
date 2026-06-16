// POST /api/membership/request
// Handles new member registration form submission.
// If the email matches a CRM contact, auto-approves without admin review.

import { EVENT_TAGS } from '../../_shared/tags.js';
import { sendWelcomeEmail } from '../../_shared/welcome.js';

const CRM_TAG_MAP = {
  'SoP23':                    'tag_sop23',
  'SoP24':                    'tag_sop24',
  'SoP25':                    'tag_sop25',
  '2025 Protocol School':     'tag_ps25',
  '2025 Foundations Workshop':'tag_symposium_25',
  '2026 Symposium':           'tag_symposium_26',
  'Protocolized Writer':      'tag_protocolized_writer',
  'Guest Speaker':            'tag_guest_speaker',
};

export async function onRequestPost({ request, env }) {
  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const email          = (body.email || '').trim().toLowerCase();
  const name           = (body.name || '').trim();
  const bio            = (body.bio || '').trim();
  const website        = (body.website || '').trim();
  const city           = (body.city || '').trim();
  const discord_handle = (body.discord_handle || '').trim();
  const qualifying_events = Array.isArray(body.qualifying_events) ? body.qualifying_events : [];
  const request_consultant   = body.request_consultant ? 1 : 0;
  const consulting_expertise = (body.consulting_expertise || '').trim();
  const consulting_contact   = (body.consulting_contact || '').trim();
  const consulting_portfolio = (body.consulting_portfolio || '').trim();
  const photo_url      = (body.photo_url || '').trim();
  const applicant_notes = (body.applicant_notes || '').trim();

  if (!email || !email.includes('@')) return Response.json({ error: 'Valid email required' }, { status: 400 });
  if (!name) return Response.json({ error: 'Name required' }, { status: 400 });

  const validEvents = qualifying_events.filter(t => EVENT_TAGS.includes(t));
  if (validEvents.length === 0) return Response.json({ error: 'At least one qualifying event required' }, { status: 400 });

  const existing = await env.DB.prepare('SELECT email FROM members WHERE email = ?').bind(email).first();
  if (existing) return Response.json({ error: 'This email is already registered. Use the edit page to update your profile.' }, { status: 409 });

  const existingReq = await env.DB.prepare(
    'SELECT status FROM membership_requests WHERE email = ?'
  ).bind(email).first();
  if (existingReq) {
    const msg = existingReq.status === 'approved'
      ? 'This email has already been approved. Try logging in again.'
      : existingReq.status === 'rejected'
      ? 'A previous application from this email was not approved. Contact team@protocol-institute.org for help.'
      : 'A request from this email is already pending review.';
    return Response.json({ error: msg }, { status: 409 });
  }

  // Insert pending request
  await env.DB.prepare(`
    INSERT INTO membership_requests
      (email, name, bio, website, city, discord_handle,
       qualifying_events, request_consultant, photo_url,
       consulting_expertise, consulting_contact, consulting_portfolio,
       applicant_notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `).bind(
    email, name, bio || null, website || null,
    city || null, discord_handle || null,
    JSON.stringify(validEvents),
    request_consultant, photo_url || null,
    consulting_expertise || null, consulting_contact || null, consulting_portfolio || null,
    applicant_notes || null
  ).run();

  // CRM check — auto-approve if email is a known contact
  try {
    const crm = await env.DB.prepare(
      'SELECT affiliations FROM crm_contacts WHERE email = ?'
    ).bind(email).first();

    if (crm) {
      const aff = crm.affiliations || '';
      const tagSet = new Set(validEvents);
      for (const [label, col] of Object.entries(CRM_TAG_MAP)) {
        if (aff.includes(label)) tagSet.add(col);
      }
      const tagValues = EVENT_TAGS.map(col => tagSet.has(col) ? 1 : 0);

      const memberSlug = email.split('@')[0].replace(/[^a-z0-9]+/gi, '-').toLowerCase();

      await env.DB.prepare(`
        INSERT OR IGNORE INTO members
          (email, slug, name, bio, website, photo_r2_key,
           is_consultant, is_team,
           consulting_expertise, consulting_contact, consulting_portfolio,
           city, discord_handle, owner_email,
           ${EVENT_TAGS.join(', ')})
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ${EVENT_TAGS.map(() => '?').join(', ')})
      `).bind(
        email, memberSlug, name, bio || null, website || null, photo_url || null,
        request_consultant,
        consulting_expertise || null, consulting_contact || null, consulting_portfolio || null,
        city || null, discord_handle || null, email,
        ...tagValues
      ).run();

      await env.DB.prepare(
        `UPDATE membership_requests SET status = 'approved', reviewed_at = ?, admin_notes = 'Auto-approved: matched CRM' WHERE email = ?`
      ).bind(new Date().toISOString(), email).run();

      await sendWelcomeEmail(env, email, name.split(' ')[0]);
      return Response.json({ ok: true, auto_approved: true });
    }
  } catch (err) {
    // CRM check failure is non-fatal — fall through to normal pending flow
    console.error('CRM auto-approve error:', err);
  }

  return Response.json({ ok: true });
}
