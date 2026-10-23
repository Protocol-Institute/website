// GET  /api/pibowrimo/wordcounts — public leaderboard of PiBoWriMo books, ranked by words of
//      credit (sum of |daily net change|: cutting 1000 earns what adding 1000 does); when signed in, also the caller's own loggable projects and entries.
// POST /api/pibowrimo/wordcounts — { project_id, date, words, start_words? }: log (or replace)
//      one day's net change (negative = net cut) for a project the caller leads or is an
//      approved team member of. A project's first entry must carry start_words, its length
//      before the month (books already in progress); the baseline is never scored.
//
// "Registered" = the project is approved, published and tagged to the pibowrimo program
// (approved tag, no edition or the 2026-11 edition) — the same set the landing page's
// book index shows. The open window is that edition's start/end date. See migration 060.

import { getSession } from '../../_shared/session.js';
import { sessionVaryingJson } from '../../_shared/response.js';

const MAX_WORDS_PER_DAY = 200000;
const MAX_START_WORDS = 2000000;

async function loadEdition(env) {
  return env.DB.prepare(
    "SELECT id, start_date, end_date FROM editions WHERE program_slug = 'pibowrimo' AND slug = '2026-11'"
  ).first();
}

// Registered projects, with the caller's relation to each.
async function registeredProjects(env, edition) {
  const { results } = await env.DB.prepare(`
    SELECT p.id, p.slug, p.title, p.lead_slug, m.name AS lead_name
    FROM project_programs pp
    JOIN projects p ON p.id = pp.project_id
    LEFT JOIN members m ON m.slug = p.lead_slug
    WHERE pp.program_slug = 'pibowrimo' AND pp.status = 'approved' AND p.status = 'approved'
      AND (pp.edition_id IS NULL OR pp.edition_id = ?)
  `).bind(edition.id).all();
  return results || [];
}

async function memberSlug(env, email) {
  const row = await env.DB.prepare('SELECT slug FROM members WHERE email = ?').bind(email).first();
  return row ? row.slug : null;
}

async function mySlugsFor(env, slug, projects) {
  if (!slug) return new Set();
  const { results } = await env.DB.prepare(
    "SELECT project_id FROM project_team WHERE member_slug = ? AND status = 'approved'"
  ).bind(slug).all();
  const team = new Set((results || []).map(r => r.project_id));
  return new Set(projects.filter(p => p.lead_slug === slug || team.has(p.id)).map(p => p.id));
}

function windowState(edition) {
  const today = new Date().toISOString().slice(0, 10);
  return { start: edition.start_date, end: edition.end_date, today,
           open: today >= edition.start_date && today <= edition.end_date };
}

export async function onRequestGet({ request, env }) {
  const edition = await loadEdition(env);
  if (!edition) return Response.json({ error: 'No PiBoWriMo edition' }, { status: 404 });

  const [projects, totals] = await Promise.all([
    registeredProjects(env, edition),
    env.DB.prepare(`
      SELECT project_id, SUM(ABS(words)) AS total, SUM(words) AS net, COUNT(*) AS days, MAX(entry_date) AS last_date
      FROM pibowrimo_wordcounts WHERE entry_date BETWEEN ? AND ? GROUP BY project_id
    `).bind(edition.start_date, edition.end_date).all(),
  ]);
  const byProject = new Map((totals.results || []).map(t => [t.project_id, t]));

  const leaderboard = projects.map(p => {
    const t = byProject.get(p.id) || {};
    return { project_id: p.id, slug: p.slug, title: p.title, lead_slug: p.lead_slug,
             lead_name: p.lead_name, total: t.total || 0, net: t.net || 0, days: t.days || 0, last_date: t.last_date || null };
  }).sort((a, b) => b.total - a.total || b.days - a.days || a.title.localeCompare(b.title));

  const out = { window: windowState(edition), leaderboard, mine: null };

  const email = await getSession(request, env);
  if (email) {
    const mine = await mySlugsFor(env, await memberSlug(env, email), projects);
    const ids = [...mine];
    let entries = [];
    if (ids.length) {
      const { results } = await env.DB.prepare(`
        SELECT project_id, entry_date, words FROM pibowrimo_wordcounts
        WHERE project_id IN (${ids.map(() => '?').join(',')}) ORDER BY entry_date DESC
      `).bind(...ids).all();
      entries = results || [];
    }
    let started = new Set();
    if (ids.length) {
      const { results } = await env.DB.prepare(
        `SELECT project_id FROM pibowrimo_starts WHERE project_id IN (${ids.map(() => '?').join(',')})`
      ).bind(...ids).all();
      started = new Set((results || []).map(r => r.project_id));
    }
    out.mine = {
      projects: projects.filter(p => mine.has(p.id)).map(p => ({ id: p.id, title: p.title, has_start: started.has(p.id) })),
      entries,
    };
  }
  return sessionVaryingJson(out);
}

export async function onRequestPost({ request, env }) {
  const email = await getSession(request, env);
  if (!email) return Response.json({ error: 'Sign in to log words' }, { status: 401 });

  let body;
  try { body = await request.json(); } catch { return Response.json({ error: 'Invalid JSON' }, { status: 400 }); }
  const projectId = Number(body.project_id);
  const date = String(body.date || '');
  const words = Number(body.words);

  if (!Number.isInteger(projectId)) return Response.json({ error: 'Choose a project' }, { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
    return Response.json({ error: 'Invalid date' }, { status: 400 });
  }
  if (!Number.isInteger(words) || Math.abs(words) > MAX_WORDS_PER_DAY) {
    return Response.json({ error: `Word change must be a whole number between -${MAX_WORDS_PER_DAY} and ${MAX_WORDS_PER_DAY}` }, { status: 400 });
  }
  const hasStart = body.start_words !== undefined && body.start_words !== null && body.start_words !== '';
  const startWords = hasStart ? Number(body.start_words) : null;
  if (hasStart && (!Number.isInteger(startWords) || startWords < 0 || startWords > MAX_START_WORDS)) {
    return Response.json({ error: 'Starting word count must be a whole number, 0 or more' }, { status: 400 });
  }

  const edition = await loadEdition(env);
  if (!edition) return Response.json({ error: 'No PiBoWriMo edition' }, { status: 404 });
  const win = windowState(edition);
  if (!win.open) {
    return Response.json({ error: `The word counter is open ${win.start} to ${win.end}` }, { status: 403 });
  }
  if (date < win.start || date > win.end) {
    return Response.json({ error: `Date must be between ${win.start} and ${win.end}` }, { status: 400 });
  }
  // One day of slack so a participant west of UTC can log their evening.
  const latest = new Date(Date.parse(win.today) + 86400000).toISOString().slice(0, 10);
  if (date > latest) return Response.json({ error: 'That date is in the future' }, { status: 400 });

  const projects = await registeredProjects(env, edition);
  const mine = await mySlugsFor(env, await memberSlug(env, email), projects);
  if (!mine.has(projectId)) {
    return Response.json({ error: 'You can only log words for your own PiBoWriMo projects' }, { status: 403 });
  }

  const existing = await env.DB.prepare('SELECT 1 FROM pibowrimo_starts WHERE project_id = ?').bind(projectId).first();
  if (!existing && !hasStart) {
    return Response.json({ error: 'Enter this project\'s starting word count (0 if it is a new book)', needs_start: true }, { status: 400 });
  }
  if (hasStart && !existing) {
    await env.DB.prepare('INSERT INTO pibowrimo_starts (project_id, words, logged_by) VALUES (?, ?, ?)')
      .bind(projectId, startWords, email).run();
  }

  await env.DB.prepare(`
    INSERT INTO pibowrimo_wordcounts (project_id, entry_date, words, logged_by)
    VALUES (?, ?, ?, ?)
    ON CONFLICT (project_id, entry_date)
    DO UPDATE SET words = excluded.words, logged_by = excluded.logged_by, updated_at = datetime('now')
  `).bind(projectId, date, words, email).run();

  return Response.json({ ok: true });
}
