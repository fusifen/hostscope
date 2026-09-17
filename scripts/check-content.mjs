/**
 * Content integrity check across `src/content/**`.
 *
 * Astro validates each file against its Zod schema at build time, but it does
 * NOT validate the *references between* files, and it does not notice when a
 * price in a plan file drifts away from the price quoted in an article. Those
 * are the failures that reach production silently:
 *
 *   - `relatedArticles: ['some-slug']` pointing at a file that was renamed
 *   - `relatedPlans: ['premium']` pointing at a plan that does not exist
 *   - an unknown `author` slug rendering as an empty byline
 *   - a plan's promo price disagreeing with the canonical figure
 *   - two articles claiming the same title or meta description
 *   - raw affiliate URLs pasted into body copy instead of going through
 *     `affiliateUrl()` (which is how sub-id tracking gets lost)
 *   - an FAQ section written into the body, which duplicates the layout's
 *
 * Run after editing content: `node scripts/check-content.mjs`
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const yaml = require('js-yaml');

const problems = [];
const warnings = [];

/* ------------------------------------------------------------------ *
 * Frontmatter parsing
 * ------------------------------------------------------------------ */

function loadCollection(dir) {
  const full = resolve(ROOT, dir);
  if (!existsSync(full)) return [];

  return readdirSync(full)
    .filter((f) => f.endsWith('.md'))
    .map((file) => {
      const raw = readFileSync(join(full, file), 'utf8');
      const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
      if (!match) {
        problems.push(`${dir}/${file}: no YAML frontmatter block found`);
        return null;
      }
      let data;
      try {
        data = yaml.load(match[1]) ?? {};
      } catch (err) {
        problems.push(`${dir}/${file}: frontmatter failed to parse — ${err.message}`);
        return null;
      }
      return { slug: file.replace(/\.md$/, ''), file, data, body: match[2] ?? '' };
    })
    .filter(Boolean);
}

const plans = loadCollection('src/content/plans');
const articles = loadCollection('src/content/articles');
const comparisons = loadCollection('src/content/comparisons');

const planSlugs = new Set(plans.map((p) => p.slug));
const articleSlugs = new Set(articles.map((a) => a.slug));

/* ------------------------------------------------------------------ *
 * Canonical prices — mirrors CONTENT-BRIEF.md (verified 2026-09-17)
 * ------------------------------------------------------------------ */

const CANONICAL_PRICES = {
  premium: { promo: 2.99, regular: 11.99, renewal: 10.99 },
  unlimited: { promo: 3.99, regular: 18.99, renewal: 16.99 },
  'cloud-startup': { promo: 7.99, regular: 27.99, renewal: 25.99 },
  'cloud-professional': { promo: 15.99, regular: 44.99, renewal: 39.99 },
  'cloud-enterprise': { promo: 29.99, regular: 74.99, renewal: 65.99 },
  'kvm-1': { promo: 6.49, regular: 19.49, renewal: 11.99 },
  'kvm-2': { promo: 8.99, regular: 24.49, renewal: 14.99 },
  'kvm-4': { promo: 12.99, regular: 42.99, renewal: 28.99 },
  'kvm-8': { promo: 25.99, regular: 73.99, renewal: 49.99 },
  // The Website Builder is sold on the same three tiers as web hosting; the
  // plan file models the entry (Premium-equivalent) tier.
  'hostinger-ai-builder': { promo: 2.99, regular: 11.99, renewal: 10.99 },
};

const EDITORS = new Set(['maya-ross', 'daniel-okafor', 'priya-nair']);

/* ------------------------------------------------------------------ *
 * Plans
 * ------------------------------------------------------------------ */

for (const plan of plans) {
  const { data } = plan;

  const expected = CANONICAL_PRICES[plan.slug];
  if (!expected) {
    warnings.push(`plans/${plan.file}: no canonical price entry — add one to CANONICAL_PRICES`);
  } else if (data.pricing) {
    for (const [field, want] of [
      ['promoMonthly', expected.promo],
      ['regularMonthly', expected.regular],
      ['renewalMonthly', expected.renewal],
    ]) {
      const got = data.pricing[field];
      if (typeof got === 'number' && Math.abs(got - want) > 0.001) {
        problems.push(
          `plans/${plan.file}: pricing.${field} is $${got}, canonical is $${want}`,
        );
      }
    }
  }

  if (data.author && !EDITORS.has(data.author)) {
    problems.push(`plans/${plan.file}: unknown author "${data.author}"`);
  }
  if (!data.verdict) problems.push(`plans/${plan.file}: missing verdict`);
  if (!Array.isArray(data.faqs) || data.faqs.length < 3) {
    warnings.push(`plans/${plan.file}: only ${data.faqs?.length ?? 0} FAQ(s) — aim for 4+`);
  }
  if (!Array.isArray(data.pros) || data.pros.length < 3) {
    warnings.push(`plans/${plan.file}: fewer than 3 pros`);
  }
  if (!Array.isArray(data.cons) || data.cons.length < 2) {
    warnings.push(`plans/${plan.file}: fewer than 2 cons — reviews without cons read as ads`);
  }

  // Resource figures should be present, since they are the differentiator.
  for (const key of ['websites', 'cpuCores', 'ram', 'storage', 'bandwidth', 'mailboxes', 'backups']) {
    if (!data.specs?.[key]) problems.push(`plans/${plan.file}: specs.${key} is empty`);
  }
}

/* ------------------------------------------------------------------ *
 * Articles
 * ------------------------------------------------------------------ */

const titles = new Map();
const descriptions = new Map();

for (const article of articles) {
  const { data, body } = article;

  for (const slug of data.relatedArticles ?? []) {
    if (!articleSlugs.has(slug)) {
      problems.push(`articles/${article.file}: relatedArticles references missing "${slug}"`);
    }
    if (slug === article.slug) {
      problems.push(`articles/${article.file}: relatedArticles references itself`);
    }
  }

  for (const slug of data.relatedPlans ?? []) {
    if (!planSlugs.has(slug)) {
      problems.push(`articles/${article.file}: relatedPlans references missing "${slug}"`);
    }
  }

  for (const field of ['author', 'reviewedBy']) {
    if (data[field] && !EDITORS.has(data[field])) {
      problems.push(`articles/${article.file}: unknown ${field} "${data[field]}"`);
    }
  }

  if (data.title) {
    const key = data.title.toLowerCase().trim();
    if (titles.has(key)) {
      problems.push(`articles/${article.file}: duplicate title with ${titles.get(key)}`);
    } else titles.set(key, article.file);
  }

  if (data.description) {
    const key = data.description.toLowerCase().trim().slice(0, 90);
    if (descriptions.has(key)) {
      problems.push(`articles/${article.file}: duplicate description with ${descriptions.get(key)}`);
    } else descriptions.set(key, article.file);

    const len = data.description.length;
    if (len < 110 || len > 320) {
      warnings.push(`articles/${article.file}: description is ${len} chars (target 110–320)`);
    }
  }

  if (!Array.isArray(data.tags) || data.tags.length === 0) {
    warnings.push(`articles/${article.file}: no tags`);
  }
  if (!Array.isArray(data.faqs) || data.faqs.length < 3) {
    warnings.push(`articles/${article.file}: only ${data.faqs?.length ?? 0} FAQ(s)`);
  }

  // Body hygiene
  if (/hostg\.xyz|aff_c\?/.test(body)) {
    problems.push(
      `articles/${article.file}: raw affiliate URL in body — use the AffiliateButton component instead`,
    );
  }
  if (/^##+\s*(frequently asked questions|faq)\b/im.test(body)) {
    problems.push(
      `articles/${article.file}: FAQ section written into the body — the layout renders frontmatter faqs`,
    );
  }

  const words = body.split(/\s+/).filter(Boolean).length;
  if (words < 700) {
    warnings.push(`articles/${article.file}: only ${words} words`);
  }
  // 180 wpm is the site-wide convention (see scripts/normalize-reading-time.mjs).
  const expectedReadingTime = Math.max(3, Math.round(words / 180));
  if (data.readingTime && Math.abs(data.readingTime - expectedReadingTime) > 2) {
    warnings.push(
      `articles/${article.file}: readingTime ${data.readingTime} vs ~${expectedReadingTime} computed`,
    );
  }
}

/* ------------------------------------------------------------------ *
 * Comparisons
 * ------------------------------------------------------------------ */

for (const comparison of comparisons) {
  const { data, body } = comparison;

  if (data.author && !EDITORS.has(data.author)) {
    problems.push(`comparisons/${comparison.file}: unknown author "${data.author}"`);
  }
  if (!Array.isArray(data.rows) || data.rows.length < 9) {
    problems.push(
      `comparisons/${comparison.file}: ${data.rows?.length ?? 0} rows — the table needs 9+`,
    );
  }

  // A comparison where one side wins everything is not a comparison.
  const edges = (data.rows ?? []).map((r) => r.edge);
  const competitorWins = edges.filter((e) => e === 'competitor').length;
  const ties = edges.filter((e) => e === 'tie').length;
  if (edges.length && competitorWins === 0) {
    problems.push(
      `comparisons/${comparison.file}: competitor wins zero rows — this reads as an advert`,
    );
  }
  if (edges.length && ties === 0) {
    warnings.push(`comparisons/${comparison.file}: no tied rows`);
  }

  if (!data.hostingerCons?.length) {
    warnings.push(`comparisons/${comparison.file}: no hostingerCons listed`);
  }
  if (/hostg\.xyz|aff_c\?/.test(body)) {
    problems.push(`comparisons/${comparison.file}: raw affiliate URL in body`);
  }
}

/* ------------------------------------------------------------------ *
 * Orphans — content nothing links to
 * ------------------------------------------------------------------ */

const referencedPlans = new Set();
for (const article of articles) {
  for (const slug of article.data.relatedPlans ?? []) referencedPlans.add(slug);
}
for (const plan of plans) {
  if (!referencedPlans.has(plan.slug)) {
    warnings.push(`plans/${plan.file}: no article references this plan via relatedPlans`);
  }
}

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */

console.log('');
console.log('CONTENT INTEGRITY REPORT');
console.log('─'.repeat(52));
console.log(`  Plans         ${plans.length}`);
console.log(`  Articles      ${articles.length}`);
console.log(`  Comparisons   ${comparisons.length}`);
console.log(`  Total words   ${[...plans, ...articles, ...comparisons]
  .reduce((n, e) => n + e.body.split(/\s+/).filter(Boolean).length, 0)
  .toLocaleString()}`);
console.log('');

if (warnings.length) {
  console.log(`WARNINGS (${warnings.length}):`);
  for (const w of warnings) console.log(`  ! ${w}`);
  console.log('');
}

if (problems.length) {
  console.log(`PROBLEMS (${problems.length}):`);
  for (const p of problems) console.log(`  x ${p}`);
  console.log('');
  process.exit(1);
}

console.log('Content is consistent: all references resolve, prices match the brief.');
