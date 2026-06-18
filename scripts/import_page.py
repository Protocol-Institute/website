#!/usr/bin/env python3
"""
Import a content.md file into the managed_pages D1 table.

Usage:
    python3 scripts/import_page.py sigs/mrg/about
    python3 scripts/import_page.py --all-sigs
    python3 scripts/import_page.py sigs/mrg/about --dry-run
"""
import argparse
import re
import subprocess
from pathlib import Path

WEBSITE_DIR = Path(__file__).parent.parent
DB_NAME = 'pi-members'

SIG_SLUGS = ['sigfpt', 'mrg', 'sigpfb', 'protfisig', 'drg', 'sigpsy']


def import_page(page_key: str, dry_run: bool = False) -> None:
    md_path = WEBSITE_DIR / page_key / 'content.md'
    if not md_path.exists():
        print(f'  ERROR: {md_path} not found')
        return

    content_md = md_path.read_text()

    # Extract title from first H1
    title = ''
    for line in content_md.splitlines():
        if line.startswith('# '):
            title = line[2:].strip()
            break

    # Escape single quotes for SQL
    content_escaped = content_md.replace("'", "''")
    title_escaped = title.replace("'", "''")

    sql = (
        f"INSERT INTO managed_pages (page_key, title, content_md, updated_at, updated_by, is_published) "
        f"VALUES ('{page_key}', '{title_escaped}', '{content_escaped}', datetime('now'), 'import-script', 1) "
        f"ON CONFLICT(page_key) DO UPDATE SET "
        f"title=excluded.title, content_md=excluded.content_md, "
        f"updated_at=excluded.updated_at, updated_by=excluded.updated_by;"
    )

    print(f'  {page_key}  ({len(content_md)} chars, title: "{title}")')
    if dry_run:
        print(f'  [dry-run] SQL preview:\n    {sql[:120]}…')
        return

    result = subprocess.run(
        ['/usr/local/bin/node', '/usr/local/bin/npx', 'wrangler', 'd1', 'execute',
         DB_NAME, '--remote', '--command', sql],
        capture_output=True, text=True, cwd=WEBSITE_DIR,
    )
    # Fall back to PATH-based npx if explicit path fails
    if result.returncode != 0:
        result = subprocess.run(
            ['npx', 'wrangler', 'd1', 'execute', DB_NAME, '--remote', '--command', sql],
            capture_output=True, text=True, cwd=WEBSITE_DIR,
        )
    if result.returncode != 0:
        print(f'  ERROR:\n{result.stderr.strip()}')
    else:
        print(f'  OK')


def main():
    parser = argparse.ArgumentParser(description='Import content.md into managed_pages D1 table')
    parser.add_argument('page_key', nargs='?', help='e.g. sigs/mrg/about')
    parser.add_argument('--all-sigs', action='store_true', help='Import about pages for all SIGs')
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()

    keys = []
    if args.all_sigs:
        keys = [f'sigs/{s}/about' for s in SIG_SLUGS]
    elif args.page_key:
        keys = [args.page_key]
    else:
        parser.error('Provide a page_key or --all-sigs')

    for key in keys:
        import_page(key, dry_run=args.dry_run)


if __name__ == '__main__':
    main()
