// The host API: how apps on Institute subdomains (blyg.protocol-institute.org, later
// cogergo and bdfx) learn who is signed in without reading pi-members themselves.
// See docs/authentication.md, "Host API for subdomain apps".
//
// Server-to-server only. Every call carries `Authorization: Bearer <HOST_API_SECRET>`.
// /api/host/session also carries the visitor's own Cookie header, forwarded by the app.
// Responses hold ids, names and groups, never an email.

import { sessionVaryingJson } from './response.js';

async function digest(value) {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
}

/** True when the request carries the host API secret. Constant-time; false if the secret is unset. */
export async function authorizedApp(request, env) {
  const secret = env.HOST_API_SECRET;
  if (typeof secret !== 'string' || secret.length < 32) return false;
  const match = (request.headers.get('Authorization') || '').match(/^Bearer (.+)$/);
  if (!match) return false;
  const [a, b] = await Promise.all([digest(match[1]), digest(secret)]);
  return crypto.subtle.timingSafeEqual(a, b);
}

export const unauthorized = () => sessionVaryingJson({ error: 'Unauthorized' }, { status: 401 });
export const notFound = () => sessionVaryingJson({ error: 'Not found' }, { status: 404 });

/**
 * A member as an app sees them: id (the slug), name, the public profile URL when the
 * profile is public, the photo URL, whether the record is an AI, the slug of the human
 * who answers for an AI record, and the member's groups.
 *
 * Groups: `admin` (is_admin), `tier:<tier>`, `role:<name>` (member_roles), and
 * `hosts:<program>` (program_hosts).
 */
export async function hostPerson(env, row, siteOrigin) {
  const [roles, hosts, operator] = await Promise.all([
    env.DB.prepare('SELECT role FROM member_roles WHERE member_slug = ? ORDER BY role').bind(row.slug).all(),
    env.DB.prepare('SELECT program_slug FROM program_hosts WHERE member_slug = ? ORDER BY program_slug').bind(row.slug).all(),
    row.owner_email
      ? env.DB.prepare('SELECT slug FROM members WHERE email = ?').bind(row.owner_email).first()
      : null,
  ]);
  const groups = [
    ...(row.is_admin ? ['admin'] : []),
    ...(row.tier ? [`tier:${row.tier}`] : []),
    ...roles.results.map(r => `role:${r.role}`),
    ...hosts.results.map(h => `hosts:${h.program_slug}`),
  ];
  const photo = row.photo_r2_key && !row.photo_r2_key.startsWith('private/')
    ? `${siteOrigin}/assets/${row.photo_r2_key}` : null;
  return {
    id: row.slug,
    name: row.name,
    url: row.is_public ? `${siteOrigin}/members/profile?slug=${encodeURIComponent(row.slug)}` : null,
    photo,
    type: row.type === 'ai' ? 'ai' : 'human',
    operator: operator?.slug ?? null,
    groups,
  };
}

export const PERSON_COLUMNS = 'slug, name, type, photo_r2_key, is_public, is_admin, tier, owner_email';
