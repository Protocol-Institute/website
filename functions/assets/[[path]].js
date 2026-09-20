export async function onRequestGet({ env, params }) {
  const key = params.path.join('/');
  const object = await env.ASSETS_BUCKET.get(key);

  if (!object) {
    return new Response('Not found', { status: 404 });
  }

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  // NOT `immutable`. Assets here are keyed by bare filename and are overwritten
  // in place — that is the documented way to add or refresh one (see CLAUDE.md).
  // `max-age=31536000, immutable` told every cache the opposite, so a replaced
  // object kept serving the old bytes for a year: re-uploading the symposium
  // programme PDF in Session 51 left the edge serving the previous build with
  // R2 already holding the new one. An hour of freshness plus background
  // revalidation keeps these effectively as cheap while letting a replacement
  // actually land.
  headers.set('cache-control',
    'public, max-age=3600, stale-while-revalidate=86400');

  return new Response(object.body, { headers });
}
