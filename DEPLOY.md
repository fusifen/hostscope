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

## The CMS will not log in yet

`/admin/` loads, but Sveltia cannot authenticate until you:

1. Replace `backend.repo` in `public/admin/config.yml` with `fusifen/hostscope`.
2. Deploy an OAuth broker — [sveltia/sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth)
   on Cloudflare Workers is the path of least resistance, since you are already
   on Cloudflare.
3. Set `base_url` in `public/admin/config.yml` to the Worker URL.
4. Register a GitHub OAuth App with the Worker URL as its callback.

`npm run check:deploy` warns about both of these until they are done.
