// Sprints: a dated edition of a program whose tagged projects are ranked by a daily figure.
// Semantics in programs/SPRINTS-PLAN.md, tables in migration 065.

export async function loadSprint(env, program, editionSlug) {
  return env.DB.prepare(`
    SELECT e.id, e.program_slug, e.slug, e.title, e.start_date, e.end_date,
           s.metric, s.unit, s.strong_at, s.timezone, s.starts_at, s.ends_at, s.add_deadline, s.excluded_owners
    FROM editions e JOIN edition_sprints s ON s.edition_id = e.id
    WHERE e.program_slug = ? AND e.slug = ?
  `).bind(program, editionSlug).first();
}

// Approved, published projects tagged to this edition or to the program with no edition,
// earliest tag first: that order decides who keeps a contested repo.
export async function registeredProjects(env, sprint) {
  const { results } = await env.DB.prepare(`
    SELECT p.id, p.slug, p.title, p.url, p.lead_slug, m.name AS lead_name
    FROM project_programs pp
    JOIN projects p ON p.id = pp.project_id
    LEFT JOIN members m ON m.slug = p.lead_slug
    WHERE pp.program_slug = ? AND pp.status = 'approved' AND p.status = 'approved'
      AND (pp.edition_id IS NULL OR pp.edition_id = ?)
    ORDER BY pp.created_at, p.id
  `).bind(sprint.program_slug, sprint.id).all();
  return results || [];
}

export function windowState(sprint, now = Date.now()) {
  return {
    start: sprint.start_date, end: sprint.end_date,
    starts_at: sprint.starts_at, ends_at: sprint.ends_at,
    started: now >= Date.parse(sprint.starts_at),
    ended: now >= Date.parse(sprint.ends_at),
  };
}
