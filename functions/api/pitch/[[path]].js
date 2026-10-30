// GET /api/pitch/{html|pdf|meta} — the assembled Institute overview, built by
// scripts/pitch/build_pitch.py and stored under the private/ prefix of pi-assets
// (which /assets/* refuses to serve). Admin or team members only.
import { pitchAccess, denied } from '../../_shared/pitch.js';

const FILES = {
  html: { key: 'private/pitch/overview.html', type: 'text/html; charset=utf-8' },
  meta: { key: 'private/pitch/meta.json', type: 'application/json' },
  pdf: {
    key: 'private/pitch/overview.pdf',
    type: 'application/pdf',
    disposition: 'attachment; filename="Protocol-Institute-Overview.pdf"',
  },
};

export async function onRequestGet({ request, env, params }) {
  const access = await pitchAccess(request, env);
  if (!access.role) return denied(access);

  const name = Array.isArray(params.path) ? params.path.join('/') : params.path;
  const file = FILES[name];
  if (!file) return new Response('Not found', { status: 404 });

  const object = await env.ASSETS_BUCKET.get(file.key);
  if (!object) return new Response('Not built yet', { status: 404 });

  const headers = {
    'Content-Type': file.type,
    'Cache-Control': 'private, no-store',
    'X-Robots-Tag': 'noindex',
  };
  if (file.disposition) headers['Content-Disposition'] = file.disposition;
  // The page also needs to know who is looking (to show the Edit link).
  if (name === 'meta') headers['X-Pitch-Role'] = access.role;
  return new Response(object.body, { headers });
}
