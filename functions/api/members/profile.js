// GET /api/members/profile?slug= — public profile of one member, for
// /members/profile. Same field projection as the directory (/api/members):
// never the email, and only for members with is_public = 1.
// The member's projects are fetched separately via /api/projects?member=.

export async function onRequestGet({ request, env }) {
  const slug = new URL(request.url).searchParams.get('slug');
  if (!slug) return Response.json({ error: 'slug required' }, { status: 400 });

  try {
    const member = await env.DB.prepare(`
      SELECT slug, name, bio, website, type, photo_r2_key,
             tier, community_lead_title, is_team, team_title,
             city, discord_handle
      FROM members
      WHERE slug = ? AND is_public = 1
    `).bind(slug).first();
    if (!member) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json({ member });
  } catch (err) {
    console.error('member profile error:', err);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}
