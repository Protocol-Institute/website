# Sprints: a class of time-boxed leaderboard events

Status: hackathon built on the shared tables (2026-11-05); PiBoWriMo moves over in December. PiBoWriMo and the Blygger hackathon are the first two instances.
"Sprint" is a working name. It avoids "challenge", which already means something at /research.

## What a sprint is

A dated edition of a program in which members declare projects by tagging them, and a leaderboard ranks
those projects by a daily figure. Sprints differ only in where the figure comes from.

| | PiBoWriMo | Blygger hackathon |
|---|---|---|
| Program kind | `workshop` | `workshop`, as `stigmergy-hackathon` is |
| Window | Nov 1-30 | Fri Nov 20, 17:00 UTC kickoff, through the end of Nov 27 Pacific |
| Declare | Tag a project | Tag a project |
| Figure | Net words, self-reported | Commits, read from GitHub |
| Can go negative | Yes (red) | No |
| Strong day | 500+ | 10+ |
| Who writes it | Lead or approved team, by form | Sync job |
| Extra requirement | Starting count | Project URL is a public GitHub repo |
| Cells in the strip | 30 | 8 |

No new program kind or project field is needed: `programs`, `editions`, `project_programs` and `projects.url`
already cover declaring.

## Data model

D1 can't rebuild a table that others reference, so sprint settings get a new table rather than altered `editions`.

```sql
CREATE TABLE edition_sprints (
  edition_id     INTEGER PRIMARY KEY REFERENCES editions(id),
  metric         TEXT NOT NULL,      -- 'self_words' | 'github_commits'
  unit           TEXT NOT NULL,      -- 'words' | 'commits'
  strong_at      INTEGER NOT NULL,
  timezone       TEXT NOT NULL,      -- day boundaries for server-computed figures
  starts_at      TEXT,               -- exact UTC instants when a window isn't whole days
  ends_at        TEXT,
  add_deadline   TEXT,
  excluded_owners TEXT               -- comma-separated GitHub owners whose repos can't be declared
);

CREATE TABLE sprint_progress (
  edition_id INTEGER NOT NULL REFERENCES editions(id),
  project_id INTEGER NOT NULL REFERENCES projects(id),
  entry_date TEXT NOT NULL,
  value      INTEGER NOT NULL,
  source     TEXT NOT NULL,          -- 'self' | 'github'
  ai_use     TEXT,
  logged_by  TEXT,
  updated_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (edition_id, project_id, entry_date)
);

CREATE TABLE sprint_repo_sync (
  edition_id  INTEGER NOT NULL REFERENCES editions(id),
  project_id  INTEGER NOT NULL REFERENCES projects(id),
  repo        TEXT,                  -- owner/name parsed from projects.url
  branch      TEXT,                  -- from a /tree/<branch> URL; NULL = default branch
  state       TEXT NOT NULL,         -- 'ok' | 'no_repo' | 'unreadable' | 'error'
  etag        TEXT,
  synced_at   TEXT,
  PRIMARY KEY (edition_id, project_id)
);
```

## Code

- `functions/_shared/sprints.js`: edition loading, registered projects, window state, public leaderboard shape.
  Lifted from `functions/api/pibowrimo/wordcounts.js`.
- `functions/_shared/github-commits.js`: the commit metric: repo parsing, one-repo-per-participant claims, sync.
  The `self_words` metric and a logging POST arrive when PiBoWriMo moves over.
- `functions/api/sprints/[program]/[edition].js`: GET the leaderboard, or check a repo with `?check_repo=`.
- `js/sprint.js`: standings, progress strip, add-project modal. Settings come from the API.
- `events/<slug>/index.html`: a thin page with its own copy and a `#sprint` element naming `data-program` and `data-edition`.
- `css/style.css`: rename nothing yet; the `lb-*` classes are already generic.

## Rollout: don't move PiBoWriMo mid-month

PiBoWriMo has live participants, had a date bug today, and is still running when the hackathon starts.

1. Build the shared code and ship the hackathon on it, with the page up well before the Nov 20 kickoff.
2. In December, once PiBoWriMo's final standings are in: copy its rows into `sprint_progress`, point its page at
   `js/sprint.js`, keep the old endpoint as an alias for at least 4h (JS cache rule), then retire it. `pibowrimo_starts` stays
   a PiBoWriMo-specific baseline unless a third sprint wants one.

## GitHub sync

**Where it runs:** on page view. Pages has no cron. If a repo's `synced_at` is over 10 minutes old, the GET
returns current data at once and refreshes up to 20 of the stalest repos (40 requests at most) in `waitUntil`. A quiet page does no work.
Fallback if that proves flaky: a scheduled GitHub Action, as `pitch-build.yml` does, with D1 write access.

**Token:** required. Unauthenticated calls get 60 per hour (confirmed), and Pages shares outbound IPs. Use a new
fine-grained read-only PAT for public repos, `GITHUB_READ_TOKEN`, as a Pages secret, stored in `../.env.keys` and
registered in `../admin/keys.md`. Not the `gh` login token. Conditional requests with `etag` keep usage low.

**Per repo:** list the tracked branch's commits in the window, bucket by day in the sprint timezone, and replace that
project's rows. Recomputing rather than appending makes force-pushes and retries safe.

## What counts as a commit: test cases

| Case | Behaviour |
|---|---|
| Existing repo with years of history | Only commits inside the window count |
| New commits on a feature branch | Not counted until merged, unless the project URL names that branch |
| URL names a branch: `github.com/o/r/tree/feature` | Tracks that branch, for PRs that won't merge by the close |
| Merge commit | Not counted |
| Squash of 40 commits | Counts as 1 |
| Bot author (`[bot]`, Dependabot) | Not counted |
| **Fork of an active repo, e.g. blygger-studio** | Count only commits not in the parent, so upstream work isn't credited to the fork |
| Force-push removes commits | Figures drop at next sync; never negative |
| Repo deleted or made private | Keep last figures; state `unreadable`; tell the owner on the row |
| Project URL isn't GitHub (`Blygger` itself: blygger.org) | Listed with 0 and "add a GitHub repo" |
| **Contribution to a shared repo, e.g. blygger-studio** | Work from a fork: one repo per participant |
| Fork's commit later merged upstream | Stays credited if the fork's owner authored it; another author's drops out when no longer ahead of the parent |
| Two projects name the same repo, any branch | Earliest tag keeps it; the other is listed with 0 and a note. The form refuses it up front |
| A participant leads two projects with repos | Earliest tag counts; the other is listed with 0 and a note |
| Someone declares a repo owned by the `blygger` org | The form refuses it. If set by editing the project link, listed with 0 and a note, and the lead can still declare their own repo |
| Someone declares another shared repo, outside the excluded owners | Not blocked automatically; hosts remove the tag |
| Commit before the 17:00 UTC kickoff on Friday | Not counted |
| No code: "just set up a blyg" | Listed with 0; not ranked on commits |
| Commit dated before the window, pushed during it | Bucketed by commit date; if outside the window, not counted |
| Backdated or scripted commits | Honor system, same as word counts |

Checked against GitHub on 2026-11-05: blygger-spec's counts by day, a fork ahead of its parent (KyleAMathews/blygger-studio), and an unchanged repo returning 304.

## Page differences for a commit-based sprint

- The strip's cell count follows the window. Cells need a maximum size so 3 don't fill the row.
- Join flow: a hackathon qualifying event that auto-approves, as `tag_pibowrimo` does (migration 061), or newcomers
  wait on approval during a weekend event. Generalize this per sprint if a third one needs it.
- No "Log words" button. Add-project form asks for the repo, checks it's a readable public GitHub repo, and fixes
  the artifact type to `code`.
- Rows show "as of N min ago" and a link to the repo.
- The strip reuses green, yellow and empty. Red never appears for commits, so the legend drops it.

## Event facts

From the Luma page (https://luma.com/iijbw30r), which still says a weekend: "Blygger Protocol Developer Launch and Hackathon Kickoff", hosted by Venkatesh Rao.
One-hour kickoff on Zoom, Friday Nov 20, 17:00 UTC (9am Pacific), then a weekend of async hacking on the PI Discord.
Open to non-coders working through a coding agent. The page states no end time, rules, judging or prizes.

## Decisions (2026-11-05)

Ends at the end of Nov 27 Pacific. Rank by commits, with active days as the tiebreak. Strong day at 10 commits.
One repo per participant, and none owned by the `blygger` org. Program `blygger-hackathon`, page `/events/blygger-hackathon-2026`, edition `2026-11`.
