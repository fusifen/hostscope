/**
 * Validates public/admin/config.yml for the Sveltia CMS backend.
 *
 * Checks:
 *  1. The file parses as YAML.
 *  2. No duplicate mapping keys exist at the same indentation level
 *     (YAML silently keeps the last one, which hides real bugs).
 *  3. Required top-level keys are present.
 *  4. Every collection declares name / label / folder and a field list.
 *  5. Every field has a `name`, a `label` and a `widget`.
 *  6. `folder` / `file` paths point at directories/files that exist.
 *  7. media_folder exists on disk.
 */

import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG_PATH = resolve(ROOT, 'public/admin/config.yml');

const problems = [];
const warnings = [];

/* ------------------------------------------------------------------ *
 * 1. Parse
 * ------------------------------------------------------------------ */

let yaml;
try {
  yaml = require('js-yaml');
} catch {
  console.error('js-yaml is not installed. Run: npm i -D js-yaml');
  process.exit(1);
}

const source = readFileSync(CONFIG_PATH, 'utf8');

let doc;
try {
  doc = yaml.load(source);
} catch (err) {
  console.error('\nYAML PARSE ERROR\n');
  console.error(err.message);
  process.exit(1);
}

console.log('YAML parses OK');

/* ------------------------------------------------------------------ *
 * 2. Duplicate key detection (indentation + sequence aware)
 * ------------------------------------------------------------------ *
 *
 * A naive "same indent + same key" scan produces false positives, because
 * a YAML sequence legitimately repeats keys across its items:
 *
 *     view_filters:
 *       - label: Reviews     <- indent 6, key "label"
 *         field: category
 *       - label: Tutorials   <- indent 6, key "label" again — NOT a duplicate
 *         field: category
 *
 * So whenever a line starts a new sequence entry (`- `), we forget every
 * recorded key that was nested deeper than that entry. js-yaml also rejects
 * genuine duplicate keys by default, so this is a belt-and-braces check.
 */

const seen = new Map(); // `${indent}|${key}` -> line number
let blockIndent = -1; // indent of the key that opened a block scalar, -1 = none

source.split(/\r?\n/).forEach((rawLine, index) => {
  const line = rawLine.replace(/\t/g, '    ');
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;

  const lead = line.match(/^(\s*)/)[1].length;

  // Inside a block scalar body (the text under `>-`, `|`, etc.) nothing is a
  // mapping key, so skip until the block ends at the first shallower line.
  if (blockIndent >= 0) {
    if (lead > blockIndent) return;
    blockIndent = -1;
  }

  let indent;
  let rest;

  const seq = line.match(/^(\s*)-\s+(.*)$/);
  if (seq) {
    indent = seq[1].length + 2; // keys inside a sequence item sit past the dash
    rest = seq[2];
    // New sequence entry — drop keys recorded from the previous sibling.
    for (const sig of [...seen.keys()]) {
      if (Number(sig.split('|')[0]) >= indent) seen.delete(sig);
    }
  } else {
    indent = lead;
    rest = line.slice(lead);
    // A key at this indent closes every deeper mapping block.
    for (const sig of [...seen.keys()]) {
      if (Number(sig.split('|')[0]) > indent) seen.delete(sig);
    }
  }

  const keyMatch = rest.match(/^([A-Za-z0-9_.$-]+):(?=\s|$)/);
  if (!keyMatch) return;

  // `description: >-` and friends open a block scalar.
  if (/^\s*[|>][+-]?\s*$/.test(rest.slice(keyMatch[0].length))) {
    blockIndent = indent;
  }

  const sig = `${indent}|${keyMatch[1]}`;
  if (seen.has(sig)) {
    problems.push(
      `Duplicate key "${keyMatch[1]}" at indent ${indent} — line ${index + 1} (first seen line ${seen.get(sig)})`
    );
  } else {
    seen.set(sig, index + 1);
  }
});

/* ------------------------------------------------------------------ *
 * 3. Top-level requirements
 * ------------------------------------------------------------------ */

for (const key of ['backend', 'media_folder', 'collections']) {
  if (!doc[key]) problems.push(`Missing required top-level key: ${key}`);
}

if (doc.backend) {
  if (!doc.backend.name) problems.push('backend.name is missing');
  if (!doc.backend.repo) warnings.push('backend.repo is still the placeholder value');
  if (doc.backend.repo && !/^[^/\s]+\/[^/\s]+$/.test(doc.backend.repo)) {
    problems.push(`backend.repo "${doc.backend.repo}" is not in owner/repo form`);
  }
  if (doc.backend.name === 'github' && !doc.backend.base_url) {
    warnings.push(
      'backend.base_url is not set — GitHub OAuth needs an OAuth broker (e.g. a Cloudflare Worker) before the CMS can log in on the deployed site'
    );
  }
}

/* ------------------------------------------------------------------ *
 * 4 + 5. Collections and fields
 * ------------------------------------------------------------------ */

const FOLDER_COLLECTIONS = ['articles', 'plans', 'comparisons'];
const seenNames = new Set();

function walkFields(fields, collectionName, path = '') {
  if (!Array.isArray(fields)) {
    problems.push(`Collection "${collectionName}": fields${path} is not a list`);
    return;
  }
  for (const field of fields) {
    if (!field || typeof field !== 'object') {
      problems.push(`Collection "${collectionName}": a field is not a mapping`);
      continue;
    }
    const where = `${collectionName}${path}.${field.name ?? '<unnamed>'}`;
    if (!field.name) problems.push(`Collection "${collectionName}": a field is missing "name"`);
    if (!field.label) problems.push(`${where}: missing "label"`);
    if (!field.widget) problems.push(`${where}: missing "widget"`);
    if (field.widget === 'object' || field.widget === 'list') {
      if (field.fields) walkFields(field.fields, collectionName, `${path}.${field.name ?? ''}`);
    }
    if (field.widget === 'select' && !field.options && !field.options_map) {
      problems.push(`${where}: select widget has no options`);
    }
    if (field.required && field.default === undefined && field.widget === 'select' && field.options) {
      // fine
    }
  }
}

for (const collection of doc.collections ?? []) {
  const name = collection.name;
  if (!name) {
    problems.push('A collection is missing "name"');
    continue;
  }
  if (seenNames.has(name)) problems.push(`Duplicate collection name: ${name}`);
  seenNames.add(name);

  if (!collection.label) problems.push(`Collection "${name}": missing "label"`);
  if (!collection.folder && !collection.files) {
    problems.push(`Collection "${name}": needs either "folder" or "files"`);
  }

  if (collection.folder) {
    const dir = resolve(ROOT, collection.folder);
    if (!existsSync(dir)) {
      problems.push(`Collection "${name}": folder "${collection.folder}" does not exist`);
    } else if (!statSync(dir).isDirectory()) {
      problems.push(`Collection "${name}": folder "${collection.folder}" is not a directory`);
    }
  }

  if (Array.isArray(collection.files)) {
    for (const file of collection.files) {
      const target = resolve(ROOT, file.file ?? '');
      if (file.file && !existsSync(target)) {
        warnings.push(`Collection "${name}": file "${file.file}" does not exist yet`);
      }
      walkFields(file.fields, name, `.files.${file.name ?? ''}`);
    }
  }

  if (collection.fields) walkFields(collection.fields, name, '');
}

/* ------------------------------------------------------------------ *
 * 6. Media folder
 * ------------------------------------------------------------------ */

if (doc.media_folder) {
  const mediaDir = resolve(ROOT, doc.media_folder);
  if (!existsSync(mediaDir)) {
    warnings.push(`media_folder "${doc.media_folder}" does not exist yet (Sveltia will create it)`);
  }
}

/* ------------------------------------------------------------------ *
 * Report
 * ------------------------------------------------------------------ */

console.log('');
console.log(`Backend : ${doc.backend?.name} -> ${doc.backend?.repo}`);
console.log(`Media   : ${doc.media_folder}`);
console.log(`Collections (${(doc.collections ?? []).length}):`);

for (const collection of doc.collections ?? []) {
  const fieldCount = (collection.fields ?? []).length;
  console.log(`  - ${collection.name.padEnd(14)} ${collection.folder ?? '(files)'}  [${fieldCount} fields]`);
}

if (warnings.length) {
  console.log('');
  console.log('WARNINGS');
  for (const w of warnings) console.log(`  ! ${w}`);
}

if (problems.length) {
  console.log('');
  console.log('PROBLEMS');
  for (const p of problems) console.log(`  x ${p}`);
  console.log('');
  process.exit(1);
}

console.log('');
console.log('CMS config is valid.');
