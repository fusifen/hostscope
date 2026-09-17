# Deploying HostScope to Cloudflare Pages

**Live URL: `https://hostscope-2et.pages.dev`.**

Two traps with the names: the Pages project is `hostscope-2et` while the repo is
`hostscope`, and `hostscope.pages.dev` (no suffix) is a **different site** whose
canonical is `hostscope.online`. `hostscope.io` — the value currently in
`SITE.url` — does not resolve and is still aspirational.

If the deployed site is not tracking `main`, see
[The live site is behind `main`](#the-live-site-is-behind-main).

## Why the first build failed

Astro 7 requires **Node.js ≥ 22.12.0**. Cloudflare Pages does not always pick a
Node version that new, and the repository originally had no version pin, so the
build ran on an older Node and stopped before it compiled anything.

The fix is already committed: `.nvmrc` and `.node-version` both pin `22.12.0`.

## Cloudflare Pages settings

Create the project with **Connect to Git**, pick `fusifen/hostscope`, and set:

| Setting | Value |
|---|---|
| Production branch | `main` |
| Framework preset | `Astro` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | *(leave empty — the repo root is the project)* |

If the framework preset is not offered, set the build command and output
directory manually to the values above.

> **Do not set the build command to `npm run verify`.** `verify` chains the
> content, link, structured-data and on-page SEO audits after the build. Any one
> of them failing fails the build and blocks the deploy — so a single
> over-length meta description can stop the whole site from updating. Run
> `verify` locally; let CI run `build`.

## Environment variables

Add these under **Settings → Environment variables** for both Production and
Preview:

| Name | Value | Required |
|---|---|---|
| `NODE_VERSION` | `22.12.0` | **Yes** — overrides Cloudflare's default |
| `NPM_FLAGS` | `--no-audit --no-fund` | Optional — quieter, faster installs |

`NODE_VERSION` is the documented mechanism and takes precedence over `.nvmrc`.
Set it even though the pin files exist; belt and braces.

### If the build still fails

Check the build log for one of these, in order of likelihood:

1. **`Astro requires Node.js v22.12.0 or higher`** — `NODE_VERSION` is not set,
   or is set for the wrong environment (Production vs Preview are separate).
2. **`Vite requires Node.js version 20.19+ or 22.12+`** — same cause.
3. **`Cannot find module @rolldown/binding-linux-x64-gnu`** — the lockfile lost
   its Linux native binaries. Run `npm run check:deploy` locally; it names the
   missing package. Fix by deleting `node_modules` and `package-lock.json`,
   running `npm install` on a clean tree, and committing the regenerated
   lockfile.
4. **`npm ci can only install with an existing package-lock.json`** — the
   lockfile is not committed. It is; check `.gitignore` has not been changed.
5. **Build succeeds but the site is blank** — the output directory is wrong. It
   must be `dist`, not `public` or `/`.

## Verify before you push

```bash
npm run check:deploy   # Node floor, Linux native binaries, placeholders
npm run verify         # full: checks + build + link and affiliate audit
```

`check:deploy` is the one that matters for Cloudflare. It fails loudly if the
pinned Node is below the toolchain floor or if the lockfile is missing a native
binary the Linux builder needs.

## Custom domain

Point the domain at the Pages project, then update `SITE.url` in
`src/consts.ts` to match. That value feeds canonical URLs, the sitemap, the RSS
feed and every OG image URL — if it is wrong, search engines are told the
canonical version of every page lives somewhere else.

## The content manager at /admin/

`backend.repo` is already set to `fusifen/hostscope`, so the CMS knows where the
content lives. The remaining question is how you sign in. There are two ways,
and you only need one.

### Option A — access token (no setup, works now)

1. Open `https://<your-site>/admin/`.
2. Click **Sign In with Token**.
3. Generate a GitHub **fine-grained** personal access token scoped to
   `fusifen/hostscope` with **Contents: Read and write**, and paste it in.

The token is stored in the browser's local storage and used for every subsequent
request. Nothing to deploy, nothing to register. This is the right choice for a
solo operator or a small trusted team.

### Option B — GitHub OAuth (for non-technical editors)

Token sign-in asks every editor to create a GitHub token, which is too much to
ask of a writer. For a hosted login button:

1. **Deploy the Worker.** Clone
   [sveltia/sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) and
   run `wrangler deploy`, or use the *Deploy to Cloudflare Workers* button in
   that repo. It is **self-hosted by design** — there is no hosted service.
   Note the resulting URL: `https://sveltia-cms-auth.<subdomain>.workers.dev`.

2. **Register a GitHub OAuth App** at
   <https://github.com/settings/applications/new>:

   | Field | Value |
   |---|---|
   | Application name | `Sveltia CMS Authenticator` |
   | Homepage URL | `https://hostscope-2et.pages.dev` |
   | Authorization callback URL | `https://sveltia-cms-auth.<subdomain>.workers.dev/callback` |

   The callback is the **Worker** URL followed by `/callback` — not your site.
   Generate a client secret afterwards.

3. **Set the Worker's environment variables** (Settings → Variables):

   | Variable | Value |
   |---|---|
   | `GITHUB_CLIENT_ID` | from step 2 |
   | `GITHUB_CLIENT_SECRET` | from step 2 — click **Encrypt** |
   | `ALLOWED_DOMAINS` | `hostscope-2et.pages.dev` |

   `ALLOWED_DOMAINS` is optional but set it: it stops other sites using your
   Worker at your expense, and stops them obtaining a token through it. Accepts
   comma-separated hostnames, and `*` to match any subdomain.

4. **Point the CMS at it.** Uncomment `base_url` in `public/admin/config.yml`
   and set it to the Worker URL:

   ```yaml
   base_url: https://sveltia-cms-auth.<subdomain>.workers.dev
   ```

5. Commit and redeploy. `npm run check:cms` stops flagging the missing
   `base_url` warning once it is set.

### If /admin/ shows a blank or stuck page

The page now diagnoses itself: if Sveltia has not painted within 15 seconds it
replaces the splash with the actual cause. Before that, the two things that
produce a blank screen with no error at all:

1. **The bundle is being loaded as an ES module.** It must be a classic
   `<script src="./sveltia-cms.js">`. `type="module"` or a dynamic `import()`
   downloads it, fetches `config.yml`, then never mounts and logs nothing.
   `npm run check:cms` fails if this regresses.
2. **Sveltia rejected the config.** It renders "Errors found in configuration"
   instead of the editor. Open the browser console — the offending field is
   named there. The classic case is a `fields.`-prefixed `sortable_fields`
   entry, which Sveltia reads as a literal field name.

If the page shows the login screen but sign-in fails:

3. **"Sign In with GitHub" opens a page saying `Not Found`.** This is expected
   with no `base_url`, and it is not a bug in your setup. Sveltia has no OAuth
   broker of its own, so it falls back to **Netlify's**:

   ```
   https://api.netlify.com/auth?provider=github&site_id=hostscope-2et.pages.dev
   ```

   Netlify has no site by that name, so it returns `Not Found`. A static site
   cannot complete GitHub's OAuth flow on its own — it would have to hold the
   client secret. **Either** use the token button, **or** deploy a broker (see
   below). Do not try to "fix" this by editing the GitHub OAuth app.

   - **Immediate:** click **Sign In Using Access Token** instead and paste a
     fine-grained PAT with `Contents: Read and write` on this repository. No
     infrastructure, works today. Correct for a solo operator or a small
     trusted team. The token is stored in the browser's local storage.
   - **Proper fix:** deploy the `sveltia-cms-auth` Worker so the GitHub button
     works — needed when non-technical editors must log in. See
     [Option B](#option-b--github-oauth-for-non-technical-editors) above.

4. **The repository is private and the token lacks `Contents: Read and write`.**
   A fine-grained token defaults to read-only on public repos and no access at
   all on private ones.

The Sveltia bundle is **vendored** into `public/admin/`, so an ad blocker or a
CDN outage can no longer break the CMS.

`npm run check:cms` validates the config structure and the loader,
`npm run check:deploy` flags the auth and domain placeholders.

---

## The live site is behind `main`

**Rule out caching first — it is the likeliest explanation and the easiest to
get wrong.** Cloudflare serves from its edge cache, and any tool you use to
fetch the page may cache too (some fetch helpers hold a response for 15
minutes). On 2026-09-17 this section was written after diagnosing a "stale
deployment" that was in fact a cached read: the site had been current the whole
time.

**Always append a unique query string when checking:**

```bash
curl -s "https://hostscope-2et.pages.dev/admin/config.yml?nocache=$RANDOM" | grep -m1 repo:
```

A changed query string is a different cache key, so it reaches the current
deployment. Without it you can read a build from hours ago and conclude the
pipeline is broken. Note that `/admin/*` is set to `no-cache, must-revalidate`
in `public/_headers` — but that only applies once the deployment carrying
`_headers` is already live, so it cannot help you detect a stale deploy.

If the cache-busted fetch still shows an old value, *then* work through the
list below. The first thing that looks wrong is your cause.

1. **Deployments tab — is a new deployment appearing at all?**
   *Workers & Pages → your project → Deployments.*

   - **No new entry after a push** → the Git integration is not connected.
     *Settings → Builds & deployments.* If it shows **Direct Upload**, the
     project is not linked to GitHub and will **never** deploy on push. Either
     reconnect it to `fusifen/hostscope`, branch `main`, or deploy from the CLI
     with `npx wrangler pages deploy dist`.

   - **A new entry marked Failed** → open it and read the end of the log. Go
     to 2 and 3.

2. **Is the build command `npm run build`?**
   *Settings → Builds & deployments → Build command.*

   It must be `npm run build` — **not** `npm run verify`. The verify chain runs
   content, link, structured-data and on-page SEO audits; any one of them
   failing fails the build and blocks the deploy. Those gates are for you to run
   locally, not for CI. Output directory must be `dist`.

3. **Is `NODE_VERSION` set?**
   *Settings → Environment variables.*

   Astro 7 requires Node **≥ 22.12.0**. `.nvmrc` and `.node-version` pin
   `22.12.0`, but Cloudflare's `NODE_VERSION` **overrides both files**, so if it
   is set to anything older — or set on Production but not Preview — the build
   dies before compiling a file. Set it to `22.12.0` on **both** Production and
   Preview; they are independent.

   This was the cause of the very first failed deploy. If someone later set it
   back, every deploy since has failed silently while the old build stayed live.

4. **Is the production branch `main`?**
   *Settings → Builds & deployments → Production branch.*
   A mismatch means pushes to `main` build as *preview* deployments, which never
   update the production URL.

**Force a rebuild once the setting is fixed.** *Deployments → ⋯ → Retry
deployment* on the newest one, or push an empty commit:

```bash
git commit --allow-empty -m "chore: trigger Pages rebuild" && git push origin main
```

**Verify the fix landed** — the placeholder must be gone. Cache-bust, or you
may read the old value and think the rebuild failed:

```bash
curl -s "https://hostscope-2et.pages.dev/admin/config.yml?nocache=$RANDOM" | grep -m1 repo:
# expect: repo: fusifen/hostscope
```

Then open `https://hostscope-2et.pages.dev/admin/`. You should get the Sveltia
login screen with **Sign In Using Access Token**.

### One thing to fix while you are in there

The Cloudflare Pages project is named `hostscope-2et`, but the repo is
`hostscope`. Note that `hostscope.pages.dev` — without the suffix — is a
**different site** (its canonical is `hostscope.online`). Do not confuse the two
when reading logs.

