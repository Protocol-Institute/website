// GET /api/host/groups — every group an app can grant rights to, for its settings page.
// Host API secret required. Names only; who is in a group is asked per person.

import { authorizedApp, unauthorized } from '../../_shared/host-api.js';
import { sessionVaryingJson } from '../../_shared/response.js';

export async function onRequestGet({ request, env }) {
  if (!await authorizedApp(request, env)) return unauthorized();
  const [tiers, roles, programs] = await Promise.all([
    env.DB.prepare('SELECT DISTINCT tier FROM members WHERE tier IS NOT NULL ORDER BY tier').all(),
    env.DB.prepare('SELECT DISTINCT role FROM member_roles ORDER BY role').all(),
    env.DB.prepare('SELECT DISTINCT p.slug, p.title FROM program_hosts h JOIN programs p ON p.slug = h.program_slug ORDER BY p.slug').all(),
  ]);
  const groups = [
    { ref: 'admin', title: 'Admins' },
    ...tiers.results.map(t => ({ ref: `tier:${t.tier}`, title: `Tier: ${t.tier}` })),
    ...roles.results.map(r => ({ ref: `role:${r.role}`, title: `Role: ${r.role}` })),
    ...programs.results.map(p => ({ ref: `hosts:${p.slug}`, title: `Hosts of ${p.title}` })),
  ];
  return sessionVaryingJson({ groups });
}
