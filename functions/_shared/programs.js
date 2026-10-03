// Shared helpers for the areas > programs > editions > projects model.
// See programs/PLAN.md and db/migrations/037_programs.sql.
//
// A project's affiliation with a program lives in project_programs, optionally
// pinned to one edition. Approved affiliations are public; pending ones are
// visible only to the project's lead, an admin, or a host of that program.

// Where a program's page lives: its own page if it has one, otherwise the
// generic renderer.
export function programHref(slug, pageUrl) {
  return pageUrl || `/programs/program?slug=${encodeURIComponent(slug)}`;
}

// Map project_id -> [{slug, title, short_title, kind, href, status, edition}]
// for the given projects. Pending/rejected rows are included only when
// includeAll is true (caller is responsible for deciding who may see them).
export async function loadProjectPrograms(env, projectIds, { includeAll = false } = {}) {
  const byProject = {};
  if (!projectIds.length) return byProject;

  const placeholders = projectIds.map(() => '?').join(',');
  const { results } = await env.DB.prepare(`
    SELECT pp.project_id, pp.status, pp.program_slug,
           pr.title, pr.short_title, pr.kind, pr.page_url, pr.sort_order,
           e.id AS edition_id, e.slug AS edition_slug, e.title AS edition_title,
           e.page_url AS edition_page_url
    FROM project_programs pp
    JOIN programs pr ON pr.slug = pp.program_slug
    LEFT JOIN editions e ON e.id = pp.edition_id
    WHERE pp.project_id IN (${placeholders})
      ${includeAll ? '' : "AND pp.status = 'approved'"}
    ORDER BY pr.sort_order, pr.title
  `).bind(...projectIds).all();

  for (const r of results || []) {
    (byProject[r.project_id] ||= []).push({
      slug: r.program_slug,
      title: r.title,
      short_title: r.short_title,
      kind: r.kind,
      href: programHref(r.program_slug, r.page_url),
      status: r.status,
      edition: r.edition_id
        ? { id: r.edition_id, slug: r.edition_slug, title: r.edition_title, href: r.edition_page_url }
        : null,
    });
  }
  return byProject;
}

// Program slugs this member can approve affiliations for. null means "all"
// (admin). An empty set means none.
export async function approvablePrograms(env, member) {
  if (!member) return new Set();
  if (member.is_admin) return null;
  const { results } = await env.DB.prepare(
    'SELECT program_slug FROM program_hosts WHERE member_slug = ?'
  ).bind(member.slug).all();
  return new Set((results || []).map(r => r.program_slug));
}

export function canApprove(approvable, programSlug) {
  return approvable === null || approvable.has(programSlug);
}

// Validate a requested affiliation list against the database. Input is
// [{program_slug, edition_id?}]; returns {ok, error?, rows} where each row has
// the program's affiliation_policy so the caller can decide the initial status.
export async function validateAffiliations(env, list) {
  if (list == null) return { ok: true, rows: [] };
  if (!Array.isArray(list)) return { ok: false, error: 'affiliations must be a list' };
  if (list.length > 20) return { ok: false, error: 'Too many affiliations' };

  const seen = new Set();
  const rows = [];
  for (const a of list) {
    const programSlug = String(a?.program_slug || '').trim();
    if (!programSlug) return { ok: false, error: 'Affiliation missing program' };
    if (seen.has(programSlug)) return { ok: false, error: 'A program can be chosen only once' };
    seen.add(programSlug);

    const program = await env.DB.prepare(
      'SELECT slug, affiliation_policy FROM programs WHERE slug = ?'
    ).bind(programSlug).first();
    if (!program) return { ok: false, error: `Unknown program: ${programSlug}` };

    let editionId = null;
    if (a.edition_id != null && a.edition_id !== '') {
      editionId = Number(a.edition_id);
      const edition = await env.DB.prepare(
        'SELECT id FROM editions WHERE id = ? AND program_slug = ?'
      ).bind(editionId, programSlug).first();
      if (!edition) return { ok: false, error: `Edition does not belong to ${programSlug}` };
    }
    rows.push({ program_slug: programSlug, edition_id: editionId, policy: program.affiliation_policy });
  }
  return { ok: true, rows };
}

// Replace a project's affiliations with `rows` (from validateAffiliations).
// Unchanged affiliations keep their status. New ones, or ones whose edition
// changed, start pending — unless the program is open or the actor can approve
// it, in which case they are approved straight away. Removed ones are deleted.
export async function syncAffiliations(env, projectId, rows, actor, approvable) {
  const { results: existing } = await env.DB.prepare(
    'SELECT program_slug, edition_id, status FROM project_programs WHERE project_id = ?'
  ).bind(projectId).all();
  const current = new Map((existing || []).map(r => [r.program_slug, r]));
  const wanted = new Set(rows.map(r => r.program_slug));
  const stmts = [];

  for (const [slug] of current) {
    if (!wanted.has(slug)) {
      stmts.push(env.DB.prepare(
        'DELETE FROM project_programs WHERE project_id = ? AND program_slug = ?'
      ).bind(projectId, slug));
    }
  }

  for (const r of rows) {
    const prev = current.get(r.program_slug);
    if (prev && (prev.edition_id ?? null) === r.edition_id) continue;

    const autoApprove = r.policy === 'open' || canApprove(approvable, r.program_slug);
    const status = autoApprove ? 'approved' : 'pending';
    stmts.push(env.DB.prepare(`
      INSERT INTO project_programs (project_id, program_slug, edition_id, status, linked_by, approved_by, approved_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (project_id, program_slug) DO UPDATE SET
        edition_id = excluded.edition_id, status = excluded.status,
        linked_by = excluded.linked_by, approved_by = excluded.approved_by,
        approved_at = excluded.approved_at, created_at = datetime('now')
    `).bind(
      projectId, r.program_slug, r.edition_id, status, actor,
      autoApprove ? actor : null, autoApprove ? new Date().toISOString() : null,
    ));
  }

  if (stmts.length) await env.DB.batch(stmts);
}
