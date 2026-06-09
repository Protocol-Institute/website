// GET /api/projects/:slug — public, returns single approved project with lead member info

export async function onRequestGet({ params, env }) {
  const { slug } = params;

  try {
    const row = await env.DB.prepare(`
      SELECT p.*, m.name AS lead_name
      FROM projects p
      LEFT JOIN members m ON m.slug = p.lead_slug
      WHERE p.slug = ? AND p.status = 'approved'
    `).bind(slug).first();

    if (!row) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json({ project: row });
  } catch (err) {
    console.error('project slug GET error:', err);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}
