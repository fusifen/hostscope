/**
 * On-page SEO audit.
 *
 * Checks the <head> of every built page for the things that decide how the
 * page appears in a search result, and which no other layer looks at.
 *
 * The defect that prompted this: one plan's frontmatter `name` was
 * "Hostinger Website Builder" while every other plan used a bare name, and the
 * templates prefix "Hostinger". That produced:
 *
 *   <h1>Hostinger Hostinger Website Builder</h1>
 *   <title>Hostinger Hostinger Website Builder Review 2026: … | HostScope</title>
 *   keywords: hostinger hostinger website builder
 *
 * …on the H1, the title, the OG title, the schema name and the keywords, all
 * from one inconsistent value. Nothing in the build complains, and a browser
 * renders it happily. A repeated-word check catches it immediately.
 *
 * Checks, per page:
 *   1. Exactly one <h1>.
 *   2. A <title> exists, is not duplicated site-wide, and fits ~70 characters.
 *   3. A meta description exists, is not duplicated, and fits ~165 characters.
 *   4. A canonical link exists.
 *   5. og:title, og:description and og:image exist.
 *   6. No word is repeated back-to-back in the title ("Hostinger Hostinger").
 *
 * Lengths are measured after decoding HTML entities, because a title
 * containing &#39; is 5 characters longer in source than on screen and would
 * otherwise be reported as over-length when it is not.
 *
 * Attribute values are matched with a backreference (`content=(["'])(.*?)\1`)
 * rather than a character class (`content=["'](.*?)["']`). The class form
 * opens on whichever quote comes first and then closes on *either* quote, so
 * `content="How Hostinger's SSL works"` terminates at the apostrophe in
 * "Hostinger's" — truncating the value, under-reporting its length, and
 * making two unrelated descriptions that both contain an early apostrophe
 * look identical. That produced two phantom "duplicate description" errors.
 *
 * Runs against the built output, so build first.
 *
 *   node scripts/check-onpage-seo.mjs
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

const TITLE_WARN = 70;
const TITLE_MAX = 80;
const DESC_WARN = 155;
const DESC_MAX = 165;

const ENTITIES = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x27;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&mdash;': '—',
  '&ndash;': '–',
  '&hellip;': '…',
};

function decode(text) {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&[a-z]+;/gi, (m) => ENTITIES[m.toLowerCase()] ?? m);
}

const strip = (s) => decode(s.replace(/<[^>]*>/g, '')).replace(/\s+/g, ' ').trim();

/**
 * Read an attribute from a tag's source text, tolerating either quote style
 * and any attribute order. The backreference forces the closing quote to
 * match the opening one, so apostrophes inside the value are safe.
 */
function attr(tag, name) {
  const re = new RegExp(`(?:^|\\s)${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i');
  return tag.match(re)?.[2];
}

/** Find a <meta> tag by its name/property attribute, then read `content`. */
function metaContent(head, key, value) {
  const tags = head.match(/<meta\b[^>]*>/gi) ?? [];
  for (const tag of tags) {
    if (attr(tag, key)?.toLowerCase() === value) return attr(tag, 'content');
  }
  return undefined;
}

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

const files = htmlFiles(DIST).filter((f) => !relative(DIST, f).startsWith('admin'));

const titles = new Map();
const descriptions = new Map();
let longestTitle = { len: 0, page: '' };
let longestDesc = { len: 0, page: '' };

for (const file of files) {
  const page = relative(ROOT, file).replace(/\\/g, '/');
  const html = readFileSync(file, 'utf8');
  const head = html.split('</head>')[0];

  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((m) => strip(m[1]));
  if (h1s.length === 0) errors.push(`${page} has no <h1>`);
  else if (h1s.length > 1) errors.push(`${page} has ${h1s.length} <h1> elements: ${h1s.join(' / ')}`);

  const titleRaw = head.match(/<title>([\s\S]*?)<\/title>/i)?.[1];
  if (!titleRaw) {
    errors.push(`${page} has no <title>`);
  } else {
    const title = strip(titleRaw);
    if (title.length > TITLE_MAX) {
      errors.push(`${page} title is ${title.length} chars (max ${TITLE_MAX}): ${title}`);
    } else if (title.length > TITLE_WARN) {
      warnings.push(`${page} title is ${title.length} chars: ${title}`);
    }
    if (title.length > longestTitle.len) longestTitle = { len: title.length, page };

    // A word repeated back-to-back almost always means a template and a data
    // value both supplied it — e.g. "Hostinger" from the template and again
    // from the plan name.
    const repeated = title.match(/\b(\p{L}{3,})\s+\1\b/iu);
    if (repeated) {
      errors.push(`${page} title repeats the word "${repeated[1]}": ${title}`);
    }

    if (titles.has(title)) errors.push(`${page} duplicates the title of ${titles.get(title)}: ${title}`);
    else titles.set(title, page);
  }

  const descRaw = metaContent(head, 'name', 'description');
  if (!descRaw) {
    errors.push(`${page} has no meta description`);
  } else {
    const text = strip(descRaw);
    if (text.length > DESC_MAX) {
      errors.push(`${page} meta description is ${text.length} chars (max ${DESC_MAX})`);
    } else if (text.length > DESC_WARN) {
      warnings.push(`${page} meta description is ${text.length} chars`);
    }
    if (text.length > longestDesc.len) longestDesc = { len: text.length, page };

    if (descriptions.has(text)) {
      errors.push(`${page} duplicates the meta description of ${descriptions.get(text)}`);
    } else {
      descriptions.set(text, page);
    }
  }

  const canonical = (head.match(/<link\b[^>]*>/gi) ?? []).find(
    (tag) => attr(tag, 'rel')?.toLowerCase() === 'canonical',
  );
  if (!canonical) errors.push(`${page} has no canonical link`);
  else if (!attr(canonical, 'href')) errors.push(`${page} canonical link has no href`);

  for (const prop of ['og:title', 'og:description', 'og:image']) {
    const value = metaContent(head, 'property', prop);
    if (!value) errors.push(`${page} is missing ${prop}`);
  }
}

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */

const dedupe = (list) => [...new Set(list)];

console.log('');
console.log('ON-PAGE SEO AUDIT');
console.log('─'.repeat(52));
console.log(`  Pages scanned        ${files.length}`);
console.log(`  Distinct titles      ${titles.size}`);
console.log(`  Distinct descriptions ${descriptions.size}`);
console.log(`  Longest title        ${longestTitle.len} chars  (${longestTitle.page})`);
console.log(`  Longest description  ${longestDesc.len} chars  (${longestDesc.page})`);
console.log('');

const uniqueWarnings = dedupe(warnings);
const uniqueErrors = dedupe(errors);

if (uniqueWarnings.length) {
  console.log(`WARNINGS (${uniqueWarnings.length}):`);
  for (const w of uniqueWarnings.slice(0, 12)) console.log(`  ! ${w}`);
  if (uniqueWarnings.length > 12) console.log(`  … and ${uniqueWarnings.length - 12} more`);
  console.log('');
}

if (uniqueErrors.length) {
  console.log(`BLOCKERS (${uniqueErrors.length}):`);
  for (const e of uniqueErrors.slice(0, 20)) console.log(`  x ${e}`);
  if (uniqueErrors.length > 20) console.log(`  … and ${uniqueErrors.length - 20} more`);
  console.log('');
  process.exit(1);
}

console.log('On-page SEO is clean.');
