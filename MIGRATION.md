# Migration: Netlify → Cloudflare Pages

This document tracks the planned migration of protocol-institute.org from Netlify to Cloudflare Pages.

## Why Migrate

1. **Stack consolidation.** protocolized.io is migrating to Cloudflare Pages at the same time. Having both PI sites on Cloudflare means one dashboard, one analytics view, consistent CDN behaviour, and no split context between Netlify and Cloudflare.

2. **DNS is already Cloudflare.** protocol-institute.org nameservers already point to Cloudflare (`martin.ns.cloudflare.com` / `luciana.ns.cloudflare.com`). Adding a CF Pages custom domain to an already-CF-managed domain is automatic — no DNS editing required.

3. **No build step.** This site is plain static HTML/CSS/JS with no build pipeline. Cloudflare Pages handles it natively; `wrangler.toml` sets `pages_build_output_dir = "."` and there is nothing else to configure.

4. **`_redirects` compatibility.** The `_redirects` file already in this repo is supported natively by both Netlify and Cloudflare Pages with identical syntax — no changes needed.

## What Changes

| | Before | After |
|---|---|---|
| Hosting | Netlify | Cloudflare Pages |
| Deploy trigger | Netlify GitHub App (push to `main`) | Cloudflare Pages GitHub App (push to `main`) |
| Build step | None | None |
| DNS | Already Cloudflare (unchanged) | Already Cloudflare (unchanged) |
| `_redirects` | Supported by Netlify | Supported by CF Pages (identical syntax) |

## What Stays the Same

- All HTML, CSS, JS, and asset files — untouched
- `_redirects` file — works as-is
- Site URL: protocol-institute.org
- Push-to-deploy workflow for the team

## Migration Steps

### Step 1 — Establish the Protocol Institute Cloudflare account

See the notes in [Protocol-Institute/protocolized-website#2](https://github.com/Protocol-Institute/protocolized-website/issues/2) on creating a shared PI CF account. The key question here is: **which Cloudflare account currently manages the protocol-institute.org DNS zone?**

- If it is a personal account (Timber's or someone else's), the recommendation is to **repurpose that account as the PI account** — rename it if possible, add Venkat as an Administrator (Account → Members), and use it for both domains and all future PI infrastructure.
- If it makes more sense to create a fresh PI account, the zone will need to be transferred: record all existing DNS records, remove the domain from the old account, add it to the new account, and update the nameservers at the registrar. Cloudflare will provide a new nameserver pair.
- Either way, the end state is one PI CF account holding both domains with both Timber and Venkat as Administrators.

### Step 2 — Create the Cloudflare Pages project

1. In the PI CF dashboard → **Workers & Pages** → Create → **Pages** → Connect to Git
2. Authorize the Cloudflare GitHub App for the **Protocol-Institute** org
3. Select repository: `Protocol-Institute/website`
4. Configure build settings:
   | Setting | Value |
   |---------|-------|
   | Project name | `protocol-institute-website` |
   | Production branch | `main` |
   | Framework preset | None |
   | Build command | *(leave empty)* |
   | Build output directory | `/` |
5. Click **Save and Deploy** — the site is all static files, so the first build should succeed immediately
6. Verify at the `*.pages.dev` preview URL

### Step 3 — Add protocol-institute.org as a custom domain

1. In the CF Pages project → **Custom domains** → Add `protocol-institute.org` and `www.protocol-institute.org`
2. Because the domain is already managed in Cloudflare, the DNS records are updated automatically — no manual editing
3. CF provisions an SSL certificate automatically

### Step 4 — Disconnect Netlify

1. In the Netlify dashboard → the protocol-institute.org site → **Site configuration** → **Build & deploy** → disconnect the Git repository
2. Or delete the Netlify site entirely if there are no other uses

### Step 5 — Merge this branch

This branch (`feat/cloudflare-migration`) adds only `wrangler.toml` and this file. Merge to `main` after the CF Pages project is confirmed working.

## Developing in Personal Account → Migrating to PI Account

The Pages project can be created and tested in a personal CF account before the PI org account exists. Migration is a reconnection, not a transfer.

**Why this works cleanly:** the site has no stateful CF resources (no D1, no R2, no KV). `wrangler.toml` intentionally omits `account_id` — Wrangler picks it up from the `CLOUDFLARE_ACCOUNT_ID` env var at deploy time, so the config file is account-neutral.

### Migration steps (personal → PI account)

1. **Pages project**: in the PI CF dashboard, create a new Pages project connected to `Protocol-Institute/website` with the same settings as Step 2 above. The old personal-account project can be deleted after the custom domain is verified in the PI account.

2. **Custom domain**: re-add `protocol-institute.org` in the PI Pages project. Because the DNS zone is already Cloudflare-managed (and will be in the PI account by this point), the DNS record updates automatically.

3. **No data to migrate**: this site has no D1, R2, or KV. Nothing else to transfer.

4. **`wrangler.toml` stays the same**: no account-specific values are committed. No file changes required.

## Rollback

If something goes wrong: reconnect the repo in Netlify and it will redeploy from the latest `main`. The DNS records currently point to Netlify's servers via Cloudflare proxy — restoring them is a one-record edit in the CF DNS dashboard.
