# Deploying HostScope to Cloudflare Pages

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

1. Deploy [sveltia/sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth)
   to Cloudflare Workers — there is a one-click deploy button in that repo's
   README, or clone it and run `wrangler deploy`.
2. Register a GitHub OAuth app at <https://github.com/settings/applications/new>
   with **Authorization callback URL** = `https://<your-worker>.workers.dev/callback`.
3. On the Worker, set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` (encrypt the
   secret), plus `ALLOWED_DOMAINS` set to your site's hostname. `ALLOWED_DOMAINS`
   is optional but is what stops other sites from using your Worker to obtain
   tokens — set it.
4. Uncomment `base_url` in `public/admin/config.yml` and set it to the Worker URL:
   `https://<your-worker>.workers.dev`.
5. Commit and redeploy.

### If /admin/ hangs on "Loading the content manager…"

That screen means Sveltia started but could not reach the repository. In order
of likelihood:

1. **`backend.repo` is wrong.** It must be exactly `owner/repo` as GitHub spells
   it. This is the most common cause.
2. **The repository is private and the token lacks `Contents: Read and write`.**
   A fine-grained token defaults to read-only on public repos and no access at
   all on private ones.
3. **Neither auth method is configured.** With no `base_url`, only token sign-in
   works — the hosted OAuth flow needs a broker.
4. **The browser blocked the unpkg script.** The CMS itself is loaded from
   `https://unpkg.com/@sveltia/cms@0.213.5/dist/sveltia-cms.js`; an ad blocker or
   a restrictive CSP will stop it. The boot screen stays because the module never
   resolved.

`npm run check:cms` validates the config structure, and `npm run check:deploy`
flags the auth and domain placeholders.

