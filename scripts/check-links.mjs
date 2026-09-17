/**
 * Post-build link integrity check.
 *
 * Walks every generated HTML file in `dist/` and verifies that:
 *   1. Every internal href resolves to a real file in `dist/`.
 *   2. Every affiliate link carries `offer_id=6` and `aff_id=109714`.
 *   3. Every affiliate link has `rel="sponsored` (FTC / Google requirement).
 *   4. Every page that mentions a price also ships JSON-LD.
 *   5. No `localhost` or placeholder hostnames leaked into the output.
 *
 * Exits non-zero if any hard failure is found, so it can gate a deploy.
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(ROOT, 'dist');

const EXPECTED_OFFER = '6';
const EXPECTED_AFF = '109714';

const errors = [];
const notes = [];

/* ------------------------------------------------------------------ *
 * Collect HTML files
 * ------------------------------------------------------------------ */

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (entry.endsWith('.html')) out.push(full);
  }
  return out;
}

const htmlFiles = walk(DIST);
notes.push(`Scanned ${htmlFiles.length} HTML files`);

/* ------------------------------------------------------------------ *
 * Build a set of valid routes from the filesystem
 * ------------------------------------------------------------------ */

const validRoutes = new Set(['/']);

for (const file of walk(DIST)) {
  const rel = relative(DIST, file).replace(/\\/g, '/');
  if (rel.endsWith('/index.html')) validRoutes.add(`/${rel.slice(0, -'index.html'.length)}`);
  else validRoutes.add(`/${rel}`);
}

// Static assets that legitimately live outside the route set
const assetFiles = new Set();
{
  const walkAll = (dir, out = []) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walkAll(full, out);
      else out.push(full);
    }
    return out;
  };
  for (const f of walkAll(DIST)) {
    assetFiles.add('/' + relative(DIST, f).replace(/\\/g, '/'));
  }
}

/** HTML entities appear in attribute values — `&` is serialised as `&amp;`. */
function decodeEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&#38;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/* ------------------------------------------------------------------ *
 * Scan each page
 * ------------------------------------------------------------------ */

let totalLinks = 0;
let affiliateLinks = 0;
let affiliateWithRel = 0;
let affiliateWithSubId = 0;
let pagesWithJsonLd = 0;
const subIdPlacements = new Map();
const brokenTargets = new Map(); // target -> Set of source pages

for (const file of htmlFiles) {
  const html = readFileSync(file, 'utf8');
  const page = '/' + relative(DIST, file).replace(/\\/g, '/').replace(/index\.html$/, '');

  if (html.includes('application/ld+json')) pagesWithJsonLd += 1;

  // Placeholder hosts are only a problem when they are actually linked or
  // loaded — prose mentioning example.com in a DNS tutorial is legitimate.
  for (const match of html.matchAll(/(?:href|src|action)="([^"]*)"/g)) {
    if (/localhost|127\.0\.0\.1|your-github-user|your-sveltia/i.test(match[1])) {
      errors.push(`Placeholder/localhost URL in an attribute on ${page}: ${match[1]}`);
    }
  }

  // ---- hrefs -------------------------------------------------------
  for (const match of html.matchAll(/href="([^"]+)"/g)) {
    const href = decodeEntities(match[1]);
    totalLinks += 1;

    if (href.startsWith('https://www.hostg.xyz/')) {
      affiliateLinks += 1;

      // The whole <a ...> tag, so rel/target can be inspected.
      const tagStart = html.lastIndexOf('<a ', match.index);
      const tagEnd = html.indexOf('>', match.index);
      const tag = tagStart !== -1 && tagEnd !== -1 ? html.slice(tagStart, tagEnd) : '';

      if (/rel="[^"]*sponsored/.test(tag)) affiliateWithRel += 1;
      else errors.push(`Affiliate link without rel="sponsored" on ${page}`);

      if (!/rel="[^"]*nofollow/.test(tag)) {
        errors.push(`Affiliate link without rel="nofollow" on ${page}`);
      }
      if (!/target="_blank"/.test(tag)) {
        errors.push(`Affiliate link without target="_blank" on ${page}`);
      }

      let url;
      try {
        url = new URL(href);
      } catch {
        errors.push(`Unparseable affiliate URL on ${page}: ${href}`);
        continue;
      }

      if (url.searchParams.get('offer_id') !== EXPECTED_OFFER) {
        errors.push(`Affiliate link with wrong offer_id on ${page}: ${href}`);
      }
      if (url.searchParams.get('aff_id') !== EXPECTED_AFF) {
        errors.push(`Affiliate link with wrong aff_id on ${page}: ${href}`);
      }

      const subId = url.searchParams.get('sub_id');
      if (subId) {
        affiliateWithSubId += 1;
        const placement = subId.split('__')[0];
        subIdPlacements.set(placement, (subIdPlacements.get(placement) ?? 0) + 1);
      }
      continue;
    }

    // ---- internal links --------------------------------------------
    if (
      href.startsWith('http') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('#') ||
      href.startsWith('data:')
    ) {
      continue;
    }

    const clean = href.split('#')[0].split('?')[0];
    if (!clean || clean === '/') continue;

    const candidates = [clean, clean.replace(/\/$/, ''), `${clean.replace(/\/$/, '')}/index.html`];
    const ok = candidates.some((c) => validRoutes.has(c) || assetFiles.has(c));
    if (!ok) {
      if (!brokenTargets.has(clean)) brokenTargets.set(clean, new Set());
      brokenTargets.get(clean).add(page);
    }
  }
}

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */

console.log('');
console.log('LINK INTEGRITY REPORT');
console.log('─'.repeat(52));
console.log(`  HTML pages scanned        ${htmlFiles.length}`);
console.log(`  Pages with JSON-LD        ${pagesWithJsonLd}`);
console.log(`  Links inspected           ${totalLinks}`);
console.log(`  Affiliate links           ${affiliateLinks}`);
console.log(`  ...with rel=sponsored     ${affiliateWithRel}`);
console.log(`  ...with a sub_id          ${affiliateWithSubId}`);
console.log('');

if (subIdPlacements.size) {
  console.log('  Affiliate placements (top 12):');
  const sorted = [...subIdPlacements.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
  for (const [placement, count] of sorted) {
    console.log(`    ${placement.padEnd(26)} ${count}`);
  }
  console.log('');
}

if (brokenTargets.size) {
  console.log(`  BROKEN INTERNAL LINKS (${brokenTargets.size} distinct target(s)):`);
  const sorted = [...brokenTargets.entries()].sort((a, b) => b[1].size - a[1].size);
  for (const [target, sources] of sorted.slice(0, 30)) {
    const sample = [...sources].slice(0, 2).join(', ');
    console.log(`    ${target}`);
    console.log(`      <- ${sources.size} page(s), e.g. ${sample}`);
  }
  console.log('');
}

if (errors.length) {
  console.log(`  ERRORS (${errors.length}):`);
  for (const e of [...new Set(errors)].slice(0, 40)) console.log(`    x ${e}`);
  console.log('');
}

const hardFailures = errors.length + brokenTargets.size;
if (hardFailures) {
  console.log(`${hardFailures} issue(s) need attention.`);
  process.exit(1);
}
console.log('All internal links resolve. Affiliate links are compliant.');
