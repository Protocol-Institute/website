// Keeps the Institute overview (/pitch) current. Every successful write to something the overview is
// assembled from — member profiles (bios, tiers, team flags), research groups and their hosts, roadmap
// projects and their program tags — asks for a rebuild. Page saves (pitch/overview, static/values) do the
// same from api/pages so the editor can report it. Nothing else on the site is a built artifact: pages
// read their data live from these APIs.
import { requestPitchRebuild } from '../_shared/pitch.js';

const WRITE = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
// Writes under these prefixes change overview content.
const INPUTS = [
  /^\/api\/members\/update$/,
  /^\/api\/admin\/members$/,
  /^\/api\/programs(\/|$)/,
  /^\/api\/areas$/,
  /^\/api\/affiliations$/,
  /^\/api\/projects$/,
  /^\/api\/projects\/[^/]+$/,
];

export async function onRequest(context) {
  const response = await context.next();
  if (WRITE.has(context.request.method) && response.ok) {
    const path = new URL(context.request.url).pathname.replace(/\/$/, '');
    if (INPUTS.some(re => re.test(path))) context.waitUntil(requestPitchRebuild(context.env));
  }
  return response;
}
