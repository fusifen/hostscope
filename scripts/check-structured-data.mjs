/**
 * Structured data (JSON-LD) audit.
 *
 * Structured data is the highest-leverage thing on a review site that nothing
 * else checks. It never throws, never shows up in a browser, and never fails a
 * build — it just quietly stops you getting rich results, or publishes a value
 * that looks broken to a reader. Three real bugs found this way on this site:
 *
 *   1. `author.name` was the frontmatter *slug* (`maya-ross`) rather than the
 *      display name, so Google was told the author was literally "maya-ross".
 *   2. The visible byline rendered the same slug with `.replace('-', ' ')`,
 *      producing "By maya ross" on 33 pages while the author card on the same
 *      page correctly said "Maya Ross".
 *   3. Six comparison pages emitted an `Article` with no `image`, and the blog
 *      listing emitted 20 `Article` nodes with only headline/url/date.
 *
 * Checks, per page:
 *   1. Every `application/ld+json` block parses as JSON.
 *   2. Every typed node has the properties its schema type requires.
 *   3. No `Person.name` looks like a slug or an unformatted key.
 *   4. Absolute URLs in the graph point at SITE.url.
 *
 * Runs against the built output, so build first.
 *
 *   node scripts/check-structured-data.mjs
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = resolve(ROOT, 'dist');

if (!existsSync(DIST)) {
  console.error('dist/ not found — run `npm run build` first.');
  process.exit(1);
}

/* ------------------------------------------------------------------ *
 * Required properties per schema.org type
 * ------------------------------------------------------------------ */

const REQUIRED = {
  Organization: ['name', 'url'],
  WebSite: ['url', 'name'],
  BreadcrumbList: ['itemListElement'],
  ListItem: ['position'],
  Article: ['headline', 'datePublished', 'author', 'publisher', 'image'],
  BlogPosting: ['headline', 'datePublished', 'author'],
  FAQPage: ['mainEntity'],
  Question: ['name', 'acceptedAnswer'],
  Answer: ['text'],
  HowTo: ['name', 'step'],
  HowToStep: ['text'],
  Review: ['itemReviewed', 'reviewRating', 'author'],
  Rating: ['ratingValue'],
  AggregateRating: ['ratingValue', 'reviewCount'],
  Offer: ['price', 'priceCurrency'],
  AggregateOffer: ['lowPrice', 'priceCurrency'],
  SoftwareApplication: ['name'],
  Person: ['name'],
  ImageObject: ['url'],
  CollectionPage: ['name', 'url'],
  WebPage: ['name', 'url'],
};

/* ------------------------------------------------------------------ *
 * Read the expected site URL from the single source of truth
 * ------------------------------------------------------------------ */

const consts = readFileSync(resolve(ROOT, 'src/consts.ts'), 'utf8');
const SITE_URL = consts.match(/url:\s*'([^']+)'/)?.[1] ?? null;

/* ------------------------------------------------------------------ *
 * Walk the built output
 * ------------------------------------------------------------------ */

function htmlFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...htmlFiles(full));
    else if (entry.endsWith('.html')) out.push(full);
  }
  return out;
}

const errors = [];
const warnings = [];
const typeCounts = new Map();
let blocks = 0;

/** A name that is all lowercase and/or hyphenated is a key, not a person. */
const SLUG_LIKE = /^[a-z0-9]+(?:[-_ ][a-z0-9]+)*$/;

function walk(node, page, path = '@graph') {
  if (Array.isArray(node)) {
    node.forEach((child, i) => walk(child, page, `${path}[${i}]`));
    return;
  }
  if (!node || typeof node !== 'object') return;

  const type = node['@type'];
  if (typeof type === 'string') {
    // A node carrying only `@type` and `@id` is a *reference* to a node defined
    // elsewhere in the graph, not a definition. `mainEntityOfPage`, `publisher`
    // and `isPartOf` are routinely written this way, and a reference is not
    // expected to repeat the target's properties.
    const isReference =
      typeof node['@id'] === 'string' &&
      Object.keys(node).every((key) => key === '@type' || key === '@id');

    if (isReference) return;

    typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1);

    for (const prop of REQUIRED[type] ?? []) {
      const value = node[prop];
      const empty =
        value === undefined ||
        value === null ||
        value === '' ||
        (Array.isArray(value) && value.length === 0);
      if (empty) {
        errors.push(`${page} → ${type} (${path}) is missing required "${prop}"`);
      }
    }

    if (type === 'Person' && typeof node.name === 'string') {
      if (SLUG_LIKE.test(node.name)) {
        errors.push(
          `${page} → Person.name is "${node.name}", which looks like a frontmatter key ` +
            `rather than a display name. Resolve it through resolveEditor() in src/consts.ts.`,
        );
      }
    }

    // Relative URLs in structured data are resolved against the page, which is
    // rarely what you want; and absolute ones must use the canonical host.
    for (const [key, value] of Object.entries(node)) {
      if (typeof value !== 'string') continue;
      if (value.startsWith('http') && SITE_URL && !value.startsWith(SITE_URL)) {
        if (!/schema\.org|w3\.org/.test(value)) {
          warnings.push(`${page} → ${type}.${key} points off-site: ${value}`);
        }
      }
    }
  }

  for (const [key, value] of Object.entries(node)) {
    if (value && typeof value === 'object') walk(value, page, `${path}.${key}`);
  }
}

// The CMS admin is a client-rendered Sveltia SPA and intentionally carries no
// structured data, so it is excluded rather than reported as a gap.
const files = htmlFiles(DIST).filter((f) => !relative(DIST, f).startsWith('admin'));
const seen = new Set();

for (const file of files) {
  const page = relative(ROOT, file).replace(/\\/g, '/');
  const html = readFileSync(file, 'utf8');
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

  let match;
  let found = 0;
  while ((match = re.exec(html)) !== null) {
    found++;
    blocks++;
    let parsed;
    try {
      parsed = JSON.parse(match[1]);
    } catch (error) {
      errors.push(`${page} → JSON-LD block ${found} is not valid JSON: ${error.message}`);
      continue;
    }
    walk(parsed, page);
  }

  if (found === 0) warnings.push(`${page} has no JSON-LD block`);
  void seen;
}

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */

const dedupe = (list) => [...new Set(list)];

console.log('');
console.log('STRUCTURED DATA AUDIT');
console.log('─'.repeat(52));
console.log(`  Pages scanned      ${files.length}`);
console.log(`  JSON-LD blocks     ${blocks}`);
console.log(`  Distinct @types    ${typeCounts.size}`);
console.log('');

console.log('  Node types:');
for (const [type, count] of [...typeCounts].sort((a, b) => b[1] - a[1])) {
  console.log(`    ${String(count).padStart(5)}  ${type}`);
}
console.log('');

const uniqueErrors = dedupe(errors);
const uniqueWarnings = dedupe(warnings);

if (uniqueWarnings.length) {
  console.log(`WARNINGS (${uniqueWarnings.length}):`);
  for (const w of uniqueWarnings.slice(0, 15)) console.log(`  ! ${w}`);
  if (uniqueWarnings.length > 15) console.log(`  … and ${uniqueWarnings.length - 15} more`);
  console.log('');
}

if (uniqueErrors.length) {
  console.log(`BLOCKERS (${uniqueErrors.length}):`);
  for (const e of uniqueErrors.slice(0, 25)) console.log(`  x ${e}`);
  if (uniqueErrors.length > 25) console.log(`  … and ${uniqueErrors.length - 25} more`);
  console.log('');
  process.exit(1);
}

console.log('Structured data is complete and well-formed.');
