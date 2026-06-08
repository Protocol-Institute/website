// POST /api/challenges/:id/interesting — increment interesting counter

export async function onRequestPost({ params, env }) {
  const id = parseInt(params.id, 10);
  if (!id || isNaN(id)) return Response.json({ error: 'Invalid id' }, { status: 400 });

  try {
    const result = await env.DB.prepare(
      'UPDATE challenges SET interesting = interesting + 1 WHERE id = ?'
    ).bind(id).run();

    if (!result.meta.changes) return Response.json({ error: 'Not found' }, { status: 404 });

    const row = await env.DB.prepare(
      'SELECT interesting FROM challenges WHERE id = ?'
    ).bind(id).first();

    return Response.json({ interesting: row.interesting });
  } catch (err) {
    console.error('interesting POST error:', err);
    return Response.json({ error: 'Database error' }, { status: 500 });
  }
}
