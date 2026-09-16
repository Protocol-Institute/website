// JSON responses whose body depends on the caller's pi_session cookie.
//
// Since contact emails were withheld from the public payloads, these endpoints
// return different fields to an admin, to a proposal's owner, to a signed-in
// member and to an anonymous visitor. A cache that stored one variant and
// replayed it to a different caller would undo that split — serving an owner's
// emails to the public, or a stale anonymous body to an admin.
//
// Pages Functions responses are not cached by default, so nothing is broken
// today. This is a guard against a future Cache-Control on the route or a
// caching proxy in front of the zone.
//
//   Vary: Cookie              keys any cache on the cookie header
//   Cache-Control: private, no-store
//                             keeps shared caches from storing it at all —
//                             the stronger of the two, and what saves us if
//                             Vary is ignored or stripped
//
// Headers go through the init rather than being set on a constructed Response,
// so this never depends on the returned Response's headers being mutable.
export function sessionVaryingJson(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set('Vary', 'Cookie');
  headers.set('Cache-Control', 'private, no-store');
  return Response.json(data, { ...init, headers });
}
