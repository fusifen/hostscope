import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const yaml = require('js-yaml');

const dir = resolve(ROOT, 'src/content/articles');

const rows = readdirSync(dir)
  .filter((f) => f.endsWith('.md'))
  .map((f) => {
    const raw = readFileSync(`${dir}/${f}`, 'utf8');
    const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
    const data = yaml.load(m[1]) ?? {};
    const words = m[2].split(/\s+/).filter(Boolean).length;
    return {
      slug: f.replace(/\.md$/, ''),
      category: data.category ?? '?',
      words,
      declared: data.readingTime ?? null,
      calc: Math.max(1, Math.round(words / 225)),
    };
  })
  .sort((a, b) => a.words - b.words);

for (const r of rows) {
  const drift = r.declared === null ? '  -' : String(r.declared - r.calc).padStart(3);
  console.log(
    `${String(r.words).padStart(5)}w  decl ${String(r.declared ?? '-').padStart(3)}  calc ${String(
      r.calc,
    ).padStart(3)}  drift ${drift}  ${r.category.padEnd(15)} ${r.slug}`,
  );
}

const total = rows.reduce((n, r) => n + r.words, 0);
console.log('');
console.log(`articles: ${rows.length}   words: ${total.toLocaleString()}   avg: ${Math.round(total / rows.length)}`);
