#!/opt/homebrew/bin/python3
"""Load the overview's markdown into D1 (managed_pages 'pitch/overview'), replacing what is there.

One-time seeding, or restoring from a local copy. Day-to-day edits happen at
/pages/edit?key=pitch/overview (admins). The text is private and this repo is public,
so keep the local copy in pitch-private/ (gitignored), never in a migration.

  python3 scripts/pitch/seed_source.py pitch-private/source.md
Needs CLOUDFLARE_API_TOKEN. Run only after the /api/pages pitch/* guard is deployed.
"""
import datetime, subprocess, sys, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]

if len(sys.argv) != 2:
    sys.exit(__doc__)
text = Path(sys.argv[1]).read_text().replace("'", "''")
now = datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds")
sql = ("INSERT INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) "
       f"VALUES ('pitch/overview', 'Institute Overview (private)', '{text}', '{now}', 'seed', 1) "
       "ON CONFLICT(page_key) DO UPDATE SET content_md = excluded.content_md, updated_at = excluded.updated_at, updated_by = 'seed';")
with tempfile.NamedTemporaryFile("w", suffix=".sql") as f:
    f.write(sql); f.flush()
    subprocess.run(["npx", "wrangler", "d1", "execute", "pi-members", "--remote", f"--file={f.name}"], cwd=ROOT, check=True)
