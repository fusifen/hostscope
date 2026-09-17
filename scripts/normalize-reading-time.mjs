/**
 * Normalises `readingTime` across every article to a single formula.
 *
 * The content was written by several passes, each with its own pacing
 * assumption, so two articles of identical length ended up advertising
 * different reading times. This rewrites the frontmatter value to
 * `max(3, round(words / 180))` — 180 wpm is a reasonable pace for technical
 * prose that includes tables and step lists.
 *
 * Only the `readingTime:` line is touched; everything else is byte-identical.
 *
 *   node scripts/normalize-reading-time.mjs          # preview
 *   node scripts/normalize-reading-time.mjs --write  # apply
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = resolve(ROOT, 'src/content/articles');
const WRITE = process.argv.includes('--write');
const WPM = 180;

let changed = 0;
let skipped = 0;

for (const file of readdirSync(DIR).filter((f) => f.endsWith('.md'))) {
  const path = `${DIR}/${file}`;
  const raw = readFileSync(path, 'utf8');

  const split = raw.match(/^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n?)([\s\S]*)$/);
  if (!split) {
    console.log(`  skip (no frontmatter)  ${file}`);
    skipped += 1;
    continue;
  }

  const [, open, frontmatter, close, body] = split;
  const words = body.split(/\s+/).filter(Boolean).length;
  const target = Math.max(3, Math.round(words / WPM));

  const line = frontmatter.match(/^readingTime:\s*(\d+)\s*$/m);
  if (!line) {
    console.log(`  skip (no readingTime)  ${file}`);
    skipped += 1;
    continue;
  }

  const current = Number(line[1]);
  if (current === target) continue;

  console.log(`  ${String(current).padStart(3)} -> ${String(target).padStart(3)}   ${file}  (${words}w)`);
  changed += 1;

  if (WRITE) {
    const nextFrontmatter = frontmatter.replace(/^readingTime:\s*\d+\s*$/m, `readingTime: ${target}`);
    writeFileSync(path, `${open}${nextFrontmatter}${close}${body}`, 'utf8');
  }
}

console.log('');
console.log(`${changed} file(s) ${WRITE ? 'updated' : 'would change'}, ${skipped} skipped.`);
if (!WRITE && changed) console.log('Re-run with --write to apply.');
