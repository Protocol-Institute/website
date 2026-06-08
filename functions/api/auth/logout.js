// POST /api/auth/logout — invalidates session in D1 and clears cookie

export async function onRequestPost({ request, env }) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/pi_session=([^;]+)/);
  if (match) {
    try {
      const val = decodeURIComponent(match[1]);
      const colonIdx = val.indexOf(':');
      if (colonIdx !== -1) {
        const email = val.slice(colonIdx + 1);
        await env.DB.prepare('DELETE FROM auth_pins WHERE email = ?')
          .bind(`session:${email}`).run();
      }
    } catch {}
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'pi_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
    },
  });
}
