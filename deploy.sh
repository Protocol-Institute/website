#!/usr/bin/env bash
#
# Manual deploy to Cloudflare Pages, from a clean export of a git commit.
#
# Normal deploys happen automatically on push to main. Use this only to recover
# when that path has failed and the custom domain is stuck on an old build.
#
# Usage:
#   ./deploy.sh                  # deploy HEAD
#   ./deploy.sh origin/main      # deploy a specific ref
#
# WHY NOT `wrangler pages deploy .`
#
# Pages uploads the directory you hand it, filtered ONLY by a hardcoded list
# baked into wrangler:
#
#   _worker.js  _redirects  _headers  _routes.json  functions
#   **/.DS_Store  **/node_modules  **/.git  .wrangler
#
# It does NOT read .gitignore. And `.assetsignore` — the file you would reach
# for — is honoured by Workers Assets (`wrangler deploy`), NOT by Pages, so
# adding one here would be a security control that silently does nothing.
#
# This repo keeps real secrets and PII in gitignored directories: inbox/ holds
# Luma guest-list CSVs with attendee emails, backups/ holds D1 member exports,
# and .env holds credentials. `wrangler pages deploy .` from the repo root would
# publish all of it to a public CDN.
#
# `git archive` writes only tracked files at the given commit, so the upload can
# never contain a gitignored path, a stray local file, or another branch's
# half-finished work. That last case is not hypothetical: on 2026-09-16 the
# repo's working tree held another session's uncommitted changes while a manual
# deploy was being considered.
set -euo pipefail

REF="${1:-HEAD}"
PROJECT="protocol-institute-website"

cd "$(dirname "$0")"

if ! git rev-parse --verify --quiet "$REF^{commit}" >/dev/null; then
  echo "error: '$REF' is not a commit in this repository" >&2
  exit 1
fi

SHA="$(git rev-parse --short "$REF")"
STAGE="$(mktemp -d)"
trap 'rm -rf "$STAGE"' EXIT

git archive "$REF" | tar -x -C "$STAGE"

# Belt and braces. git archive emits only TRACKED files, and .gitignore does not
# retroactively untrack anything, so the way PII could still reach a deploy is
# by having been committed at some point. This catches that.
#
# Matches files, not directories: inbox/.gitignore is a tracked keep-file and is
# expected in every export. Anything else under inbox/, anything under backups/,
# and any .env are hard stops.
SUSPECT="$(cd "$STAGE" && find . -type f \
  \( -name '.env' -o -name '.env.*' \
     -o \( -path './inbox/*' ! -name '.gitignore' \) \
     -o -path './backups/*' \) -print)"

if [ -n "$SUSPECT" ]; then
  echo "error: sensitive files are tracked in git and would be published:" >&2
  echo "$SUSPECT" | sed 's/^/       /' >&2
  echo "       refusing to deploy $SHA — untrack them before deploying" >&2
  exit 1
fi

echo "Deploying $SHA ($(git log -1 --format=%s "$REF")) from a clean export"
echo "  $(find "$STAGE" -type f | wc -l | tr -d ' ') tracked files staged"

npx wrangler pages deploy "$STAGE" --project-name "$PROJECT" --branch main --commit-dirty=true
