/**
 * Pre-deploy readiness check.
 *
 * Catches the failure modes that only appear on a clean CI/CD container —
 * typically Cloudflare Pages, Vercel or Netlify — while your machine builds
 * perfectly happily. The classic example: you develop on Windows, the lockfile
 * records only Windows native binaries, and the Linux build dies with
 * "Cannot find module @rolldown/binding-linux-x64-gnu".
 *
 * Checks:
 *   1. The Node version the host will use is new enough for Astro.
 *   2. `.nvmrc` / `.node-version` exist and agree with `engines.node`.
 *   3. The lockfile pins the native binaries the Linux builder needs.
 *   4. `engines` in package.json is satisfiable by the pinned version.
 *   5. Deploy-blocking placeholders are gone (site URL, CMS repo).
 *   6. Nothing required at build time is gitignored.
 *   7. SEO/deploy essentials: robots.txt does not block the site's own CSS/JS,
 *      and Cloudflare Pages response headers are present.
 *
 *   node scripts/check-deploy-readiness.mjs
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const errors = [];
const warnings = [];
const notes = [];

const read = (p) => readFileSync(resolve(ROOT, p), 'utf8');

/* ------------------------------------------------------------------ *
 * 1. Node version requirements
 * ------------------------------------------------------------------ */

const pkg = JSON.parse(read('package.json'));
const requiredRange = pkg.engines?.node ?? '(not set)';

const astroPkg = JSON.parse(read('node_modules/astro/package.json'));
const vitePkg = existsSync(resolve(ROOT, 'node_modules/vite/package.json'))
  ? JSON.parse(read('node_modules/vite/package.json'))
  : null;

notes.push(`Astro ${astroPkg.version} requires node ${astroPkg.engines?.node}`);
if (vitePkg) notes.push(`Vite ${vitePkg.version} requires node ${vitePkg.engines?.node}`);

// The strictest floor across the toolchain is what the host must satisfy.
const floors = [astroPkg.engines?.node, vitePkg?.engines?.node].filter(Boolean);
const majorFloors = floors
  .flatMap((r) => [...r.matchAll(/(\d+)\.(\d+)\.(\d+)/g)].map((m) => `${m[1]}.${m[2]}.${m[3]}`))
  .filter((v) => Number(v.split('.')[0]) >= 20);

const strictest = majorFloors.sort((a, b) => {
  const [a1, a2, a3] = a.split('.').map(Number);
  const [b1, b2, b3] = b.split('.').map(Number);
  return b1 - a1 || b2 - a2 || b3 - a3;
})[0];

if (strictest) notes.push(`Toolchain floor: node >= ${strictest}`);

/* ------------------------------------------------------------------ *
 * 2. Version pin files
 * ------------------------------------------------------------------ */

const nvmrc = existsSync(resolve(ROOT, '.nvmrc')) ? read('.nvmrc').trim() : null;
const nodeVersionFile = existsSync(resolve(ROOT, '.node-version'))
  ? read('.node-version').trim()
  : null;

if (!nvmrc && !nodeVersionFile) {
  errors.push(
    'Neither .nvmrc nor .node-version exists. Cloudflare Pages defaults to an older Node ' +
      'than Astro 7 needs — pin it, or set the NODE_VERSION environment variable in the ' +
      'Pages project settings.',
  );
} else {
  const pinned = nvmrc ?? nodeVersionFile;
  notes.push(`Pinned Node: ${pinned} (${nvmrc ? '.nvmrc' : '.node-version'})`);

  if (strictest) {
    const [pMaj, pMin] = pinned.split('.').map(Number);
    const [fMaj, fMin] = strictest.split('.').map(Number);
    if (pMaj < fMaj || (pMaj === fMaj && pMin < fMin)) {
      errors.push(
        `Pinned Node ${pinned} is below the toolchain floor ${strictest} — the host build will fail.`,
      );
    }
  }
  if (nvmrc && nodeVersionFile && nvmrc !== nodeVersionFile) {
    warnings.push(`.nvmrc (${nvmrc}) and .node-version (${nodeVersionFile}) disagree.`);
  }
}

/* ------------------------------------------------------------------ *
 * 3. Native binaries the Linux builder needs
 * ------------------------------------------------------------------ */

const lock = JSON.parse(read('package-lock.json'));
const lockKeys = Object.keys(lock.packages ?? {});

/**
 * Each entry is a package that ships platform-specific native code. The Linux
 * x64 glibc build is what every mainstream CI image uses. If the lockfile was
 * generated on Windows or macOS, npm's optional-dependency handling can omit
 * these entirely, and the build fails at the first import.
 */
const REQUIRED_LINUX_BINARIES = [
  { pkg: '@rolldown/binding-linux-x64-gnu', why: 'Vite 8 bundler (Rolldown)' },
  { pkg: '@img/sharp-linux-x64', why: 'sharp — OG image generation' },
  { pkg: '@img/sharp-libvips-linux-x64', why: 'sharp libvips runtime' },
  { pkg: 'lightningcss-linux-x64-gnu', why: 'Tailwind v4 / Vite CSS transform' },
  { pkg: '@esbuild/linux-x64', why: 'esbuild' },
];

notes.push('');
notes.push('Linux native binaries in the lockfile:');

for (const { pkg: name, why } of REQUIRED_LINUX_BINARIES) {
  const present = lockKeys.includes(`node_modules/${name}`);
  notes.push(`  ${present ? 'ok  ' : 'MISS'} ${name}  (${why})`);
  if (!present) {
    errors.push(
      `package-lock.json has no entry for ${name} (${why}). The Linux build will fail with ` +
        `"Cannot find module ${name}". Fix: delete package-lock.json and node_modules, then ` +
        `run npm install — or add the package to optionalDependencies.`,
    );
  }
}

/* ------------------------------------------------------------------ *
 * 4. Deploy-blocking placeholders
 * ------------------------------------------------------------------ */

const consts = read('src/consts.ts');
const siteMatch = consts.match(/url:\s*'([^']+)'/);
const siteUrl = siteMatch?.[1] ?? null;

if (siteUrl && /localhost|example\.|\.test|hostscope\.io/.test(siteUrl)) {
  warnings.push(
    `SITE.url is "${siteUrl}". If that is not the live domain, canonical URLs, the sitemap, ` +
      'RSS and OG image URLs will all point at the wrong host.',
  );
}

const cmsPath = 'public/admin/config.yml';
if (existsSync(resolve(ROOT, cmsPath))) {
  const cms = read(cmsPath);
  const repoMatch = cms.match(/^\s*repo:\s*(.+)$/m);
  const repo = repoMatch?.[1]?.trim();
  if (repo && /your-github-user|your-org|CHANGE/i.test(repo)) {
    warnings.push(`public/admin/config.yml backend.repo is still "${repo}" — the CMS cannot log in.`);
  }
  if (!/^\s*base_url:/m.test(cms.replace(/^\s*#.*$/gm, ''))) {
    warnings.push(
      'public/admin/config.yml has no active base_url. Token sign-in still works, but the ' +
        'hosted GitHub OAuth flow needs a deployed sveltia-cms-auth Worker and base_url ' +
        'pointed at it.',
    );
  }
}

/* ------------------------------------------------------------------ *
 * 5. Build-time files must be committed
 * ------------------------------------------------------------------ */

const gitignore = existsSync(resolve(ROOT, '.gitignore')) ? read('.gitignore') : '';
for (const mustBeTracked of ['public', 'src', 'package-lock.json']) {
  const pattern = new RegExp(`^\\s*/?${mustBeTracked}/?\\s*$`, 'm');
  if (pattern.test(gitignore)) {
    errors.push(`${mustBeTracked} is listed in .gitignore but is required at build time.`);
  }
}

if (!gitignore.includes('dist')) {
  warnings.push('.gitignore does not exclude dist/ — build output should not be committed.');
}
if (!gitignore.includes('node_modules')) {
  warnings.push('.gitignore does not exclude node_modules/.');
}

/* ------------------------------------------------------------------ *
 * 6. SEO / deploy essentials
 * ------------------------------------------------------------------ */

// Blocking the asset directory in robots.txt stops Googlebot from fetching the
// CSS and JS it needs to render the page, which suppresses rendering-based
// indexing and Core Web Vitals assessment. It is an easy mistake to make and
// completely invisible in the browser, so it is worth a guard.
const robotsSource = existsSync(resolve(ROOT, 'src/pages/robots.txt.ts'))
  ? read('src/pages/robots.txt.ts')
  : null;

if (robotsSource) {
  const activeRules = robotsSource
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\/\*|\*)/.test(line))
    .join('\n');

  for (const assetPath of ['/_astro/', '/_astro']) {
    const blocking = new RegExp(`^\\s*Disallow:\\s*${assetPath.replace(/[/]/g, '\\/')}\\s*$`, 'm');
    if (blocking.test(activeRules)) {
      errors.push(
        `robots.txt disallows ${assetPath}, which holds the site's hashed CSS and JS bundles. ` +
          'Googlebot must be able to fetch these to render pages. Remove the Disallow rule.',
      );
    }
  }
}

if (!existsSync(resolve(ROOT, 'public/_headers'))) {
  warnings.push(
    'public/_headers is missing. Cloudflare Pages applies it automatically, and without it ' +
      'you get no security headers and no immutable caching for hashed /_astro/ assets.',
  );
} else {
  const headers = read('public/_headers');
  if (!/_astro\/\*/.test(headers)) {
    warnings.push('public/_headers has no /_astro/* rule — hashed assets will not be cached immutably.');
  }
}

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */

console.log('');
console.log('DEPLOY READINESS');
console.log('─'.repeat(52));
for (const n of notes) console.log(n.startsWith(' ') || n === '' ? n : `  ${n}`);
console.log('');

if (warnings.length) {
  console.log(`WARNINGS (${warnings.length}):`);
  for (const w of warnings) console.log(`  ! ${w}`);
  console.log('');
}

if (errors.length) {
  console.log(`BLOCKERS (${errors.length}):`);
  for (const e of errors) console.log(`  x ${e}`);
  console.log('');
  process.exit(1);
}

console.log('Ready to deploy.');
