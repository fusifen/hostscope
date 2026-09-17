/**
 * Cross-checks `public/admin/config.yml` against the Zod schemas in
 * `src/content.config.ts`.
 *
 * Why this exists: the CMS writes Markdown frontmatter that Astro then
 * validates with Zod. If a CMS field is renamed and the schema is not, the
 * build fails at the first `astro build` — usually on CI, after the editor has
 * already saved. Catching the drift locally is much cheaper.
 *
 * It does not execute the Astro modules (they import `astro:content`, which
 * only resolves inside the Astro pipeline). Instead it parses the TypeScript
 * textually and reconstructs the shape of each `z.object(...)`.
 *
 * Reports three things per collection:
 *   - MISSING IN CMS  : schema has it, the CMS cannot edit it
 *   - MISSING IN SCHEMA: CMS can edit it, but Zod will reject it
 *   - matched field counts
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const yaml = require('js-yaml');

const config = yaml.load(readFileSync(resolve(ROOT, 'public/admin/config.yml'), 'utf8'));
const schemaSrc = readFileSync(resolve(ROOT, 'src/content.config.ts'), 'utf8');

/* ------------------------------------------------------------------ *
 *  Minimal brace matcher
 * ------------------------------------------------------------------ */

/** Given the index of an opening `{`, return the index of its match. */
function matchBrace(src, openIndex) {
  let depth = 0;
  let inString = null;
  for (let i = openIndex; i < src.length; i += 1) {
    const ch = src[i];
    if (inString) {
      if (ch === '\\') i += 1;
      else if (ch === inString) inString = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      inString = ch;
      continue;
    }
    if (ch === '/' && src[i + 1] === '/') {
      const nl = src.indexOf('\n', i);
      i = nl === -1 ? src.length : nl;
      continue;
    }
    if (ch === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i);
      i = end === -1 ? src.length : end + 1;
      continue;
    }
    if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * Collect the property names declared directly inside a `z.object({...})`
 * body, together with the raw source of each value so nested objects can be
 * recursed into.
 */
function objectEntries(body) {
  const entries = [];
  let depth = 0;
  let inString = null;
  let lineStart = 0;

  const flush = (segment) => {
    // Strip leading/trailing commas and any doc comments the split left behind.
    const text = segment
      .replace(/^\s*,?\s*/, '')
      .replace(/,\s*$/, '')
      .replace(/\/\*[\s\S]*?\*\//g, ' ')
      .replace(/^\s*\/\/[^\n]*\n/gm, '')
      .trim();
    if (!text) return;

    // Spread of a named primitive, e.g. `...seoFields`
    const spread = text.match(/^\.\.\.([A-Za-z0-9_$]+)$/);
    if (spread) {
      entries.push({ kind: 'spread', name: spread[1] });
      return;
    }

    const prop = text.match(/^(?:'([^']+)'|"([^"]+)"|([A-Za-z0-9_$]+))\s*:\s*([\s\S]+)$/);
    if (!prop) return;
    const name = prop[1] ?? prop[2] ?? prop[3];
    entries.push({ kind: 'prop', name, value: prop[4].trim() });
  };

  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i];
    if (inString) {
      if (ch === '\\') i += 1;
      else if (ch === inString) inString = null;
      continue;
    }
    if (ch === "'" || ch === '"' || ch === '`') {
      inString = ch;
      continue;
    }
    // Comments are stripped before structural scanning — doc comments contain
    // commas and quote characters that would otherwise desync the parser.
    if (ch === '/' && body[i + 1] === '/') {
      const nl = body.indexOf('\n', i);
      i = nl === -1 ? body.length : nl;
      continue;
    }
    if (ch === '/' && body[i + 1] === '*') {
      const close = body.indexOf('*/', i);
      i = close === -1 ? body.length : close + 1;
      continue;
    }
    if (ch === '{' || ch === '(' || ch === '[') depth += 1;
    else if (ch === '}' || ch === ')' || ch === ']') depth -= 1;
    else if (ch === ',' && depth === 0) {
      flush(body.slice(lineStart, i));
      lineStart = i + 1;
    }
  }
  flush(body.slice(lineStart));
  return entries;
}

/** Reconstruct dotted field paths from a `z.object({...})` source slice. */
function collectZodPaths(src, seenPrimitives) {
  const paths = [];

  const walk = (valueSrc, prefix) => {
    // z.object({ ... })
    const objIdx = valueSrc.indexOf('z.object(');
    if (objIdx !== -1) {
      const braceIdx = valueSrc.indexOf('{', objIdx);
      const end = matchBrace(valueSrc, braceIdx);
      const body = valueSrc.slice(braceIdx + 1, end);
      for (const entry of objectEntries(body)) {
        if (entry.kind === 'spread') {
          const primitive = seenPrimitives[entry.name];
          if (primitive) paths.push(...primitive.map((k) => `${prefix}${k}`));
          continue;
        }
        const child = `${prefix}${entry.name}`;
        // Prettier wraps these as `z\n  .array(\n    z.object({`, so collapse
        // whitespace before testing the shape.
        const compact = entry.value.replace(/\s+/g, '');
        // Test the array-of-object form first — it also contains `z.object(`.
        if (compact.includes('z.array(z.object(')) {
          walk(entry.value, `${child}[].`);
        } else if (compact.includes('z.object(')) {
          walk(entry.value, `${child}.`);
        } else {
          paths.push(child);
        }
      }
      return;
    }

    // Bare reference to a named primitive, e.g. z.array(faq)
    const ref = valueSrc.match(/z\.array\(\s*([A-Za-z0-9_$]+)\s*\)/);
    if (ref && seenPrimitives[ref[1]]) {
      for (const k of seenPrimitives[ref[1]]) paths.push(`${prefix}${k}`);
      return;
    }

    paths.push(prefix.replace(/\.$/, ''));
  };

  // Locate the schema's z.object
  const schemaIdx = src.indexOf('schema: z.object(');
  const braceIdx = src.indexOf('{', schemaIdx);
  const end = matchBrace(src, braceIdx);
  const body = src.slice(braceIdx + 1, end);

  for (const entry of objectEntries(body)) {
    if (entry.kind === 'spread') {
      const primitive = seenPrimitives[entry.name];
      if (primitive) paths.push(...primitive);
      continue;
    }
    // Order matters: `z.array(z.object(...))` also contains `z.object(`, so the
    // array form has to be tested first or it is mis-typed as a plain object.
    // Whitespace is collapsed because Prettier wraps `z` / `.array(` / `z.object(`.
    const compact = entry.value.replace(/\s+/g, '');
    if (compact.includes('z.array(z.object(')) {
      walk(entry.value, `${entry.name}[].`);
    } else if (compact.includes('z.object(')) {
      walk(entry.value, `${entry.name}.`);
    } else {
      const ref = compact.match(/^z\.array\(([A-Za-z0-9_$]+)\)/);
      if (ref && seenPrimitives[ref[1]]) {
        for (const k of seenPrimitives[ref[1]]) paths.push(`${entry.name}[].${k}`);
      } else {
        paths.push(entry.name);
      }
    }
  }

  return paths.map((p) => p.replace(/\.$/, '')).filter(Boolean);
}

/* ------------------------------------------------------------------ *
 * Named primitives declared at module scope
 * ------------------------------------------------------------------ */

const primitives = {};

// const faq = z.object({ question: ..., answer: ... })
{
  const idx = schemaSrc.indexOf('const faq = z.object(');
  if (idx !== -1) {
    const brace = schemaSrc.indexOf('{', idx);
    const end = matchBrace(schemaSrc, brace);
    primitives.faq = objectEntries(schemaSrc.slice(brace + 1, end)).map((e) => e.name);
  }
}

// const seoFields = { seoTitle: ..., seoDescription: ..., noindex: ... }
{
  const idx = schemaSrc.indexOf('const seoFields = {');
  if (idx !== -1) {
    const brace = schemaSrc.indexOf('{', idx);
    const end = matchBrace(schemaSrc, brace);
    primitives.seoFields = objectEntries(schemaSrc.slice(brace + 1, end)).map((e) => e.name);
  }
}

/* ------------------------------------------------------------------ *
 * Extract each collection's Zod paths
 * ------------------------------------------------------------------ */

const schemaPaths = {};
for (const name of ['plans', 'articles', 'comparisons']) {
  const idx = schemaSrc.indexOf(`const ${name} = defineCollection(`);
  if (idx === -1) continue;
  const brace = schemaSrc.indexOf('{', idx);
  const end = matchBrace(schemaSrc, brace);
  schemaPaths[name] = collectZodPaths(schemaSrc.slice(idx, end + 1), primitives);
}

/* ------------------------------------------------------------------ *
 * Extract each collection's CMS paths
 * ------------------------------------------------------------------ */

const cmsPaths = {};

function walkFields(fields, prefix, out) {
  for (const field of fields ?? []) {
    if (!field?.name) continue;
    const path = `${prefix}${field.name}`;
    if (field.widget === 'object' && field.fields) {
      walkFields(field.fields, `${path}.`, out);
    } else if (field.widget === 'list' && field.fields) {
      walkFields(field.fields, `${path}[].`, out);
    } else {
      out.add(path);
    }
  }
}

for (const collection of config.collections ?? []) {
  const out = new Set();
  walkFields(collection.fields, '', out);
  out.delete('body'); // markdown body, not a frontmatter key
  cmsPaths[collection.name] = out;
}

/* ------------------------------------------------------------------ *
 * Compare
 * ------------------------------------------------------------------ */

let failures = 0;

for (const name of Object.keys(schemaPaths)) {
  const zod = new Set(schemaPaths[name]);
  const cms = cmsPaths[name];
  if (!cms) {
    console.log(`\n${name}: no matching CMS collection`);
    failures += 1;
    continue;
  }

  const missingInCms = [...zod].filter((p) => !cms.has(p)).sort();
  const missingInSchema = [...cms].filter((p) => !zod.has(p)).sort();
  const matched = [...zod].filter((p) => cms.has(p)).length;

  console.log(`\n${name}  —  ${matched}/${zod.size} schema fields editable in the CMS`);

  if (missingInCms.length) {
    console.log('  MISSING IN CMS (schema requires, editor cannot set):');
    for (const p of missingInCms) console.log(`    - ${p}`);
  }
  if (missingInSchema.length) {
    console.log('  MISSING IN SCHEMA (CMS can set, Zod will reject):');
    for (const p of missingInSchema) console.log(`    - ${p}`);
  }
  if (!missingInCms.length && !missingInSchema.length) console.log('  OK — exact 1:1 match');

  failures += missingInCms.length + missingInSchema.length;
}

console.log('');
if (failures) {
  console.log(`${failures} field mismatch(es) found.`);
  process.exit(1);
}
console.log('CMS config and Zod schemas are in sync.');
