// GET /api/symposium/livestream
// Resolves the Protocol Institute channel's *current* live broadcast to a video
// id, so the symposium page can embed the stream without a deploy each morning.
//
// Why this exists at all: YouTube's channel-scoped embed
// (`/embed/live_stream?channel=<id>`) is the obvious way to do this and renders
// "This video is unavailable" — verified against this channel on 2026-09-24
// while a broadcast was live and `playableInEmbed` was true. Only `/embed/<id>`
// works, and the id changes every day of a multi-day event. So the id is looked
// up server-side here rather than hardcoded.
//
// Public, no auth: it returns one id that is already public on the channel page.
//
// Failure is silent by design. Any miss — a fetch error, a consent interstitial,
// a markup change at YouTube's end, nothing broadcasting — returns
// `{ live: false }`, and the page simply doesn't render the player. The
// "Watch Livestream" link is static markup and is unaffected either way, so the
// worst case is the pre-embed behaviour, never a dead box.

const CHANNEL_LIVE_URL = 'https://www.youtube.com/@protocol-institute/live';

// Non-bot UA: the handle URL serves a stripped page to obvious crawlers.
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ' +
           'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

// Cached at the edge rather than per-visitor: during a session every viewer
// wants the same answer, and 2 min is well inside the gap between broadcasts.
// stale-while-revalidate keeps an expiring entry serving while it refreshes, so
// a slow YouTube response never blocks the page.
const CACHE_CONTROL = 'public, max-age=60, s-maxage=120, stale-while-revalidate=600';

function json(body, extraHeaders) {
  return new Response(JSON.stringify(body), {
    headers: Object.assign({
      'Content-Type': 'application/json',
      'Cache-Control': CACHE_CONTROL,
    }, extraHeaders || {}),
  });
}

export async function onRequestGet() {
  let html;
  try {
    const res = await fetch(CHANNEL_LIVE_URL, {
      headers: { 'User-Agent': UA, 'Accept-Language': 'en-US,en;q=0.9' },
      cf: { cacheTtl: 120, cacheEverything: true },
    });
    if (!res.ok) return json({ live: false, reason: 'upstream_' + res.status });
    html = await res.text();
  } catch (e) {
    return json({ live: false, reason: 'fetch_failed' });
  }

  // Both markers come from the same ytInitialPlayerResponse blob. isLiveNow is
  // what distinguishes an in-progress broadcast from the most recent finished
  // one, which /live also happily serves.
  if (!/"isLiveNow"\s*:\s*true/.test(html)) {
    return json({ live: false, reason: 'not_broadcasting' });
  }
  const m = html.match(/"videoId"\s*:\s*"([A-Za-z0-9_-]{11})"/);
  if (!m) return json({ live: false, reason: 'no_video_id' });

  return json({ live: true, videoId: m[1] });
}
