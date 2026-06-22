// Extracts the 60 authoritative O*NET occupations from the existing Inklings
// constants.ts into a clean JSON file for CareerVerse. Run from repo root:
//   node careerverse/scripts/extract-core.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');
const src = readFileSync(resolve(repoRoot, 'constants.ts'), 'utf8');

// Slice out the OCCUPATIONS array literal.
const start = src.indexOf('export const OCCUPATIONS');
const open = src.indexOf('[', start);
// find matching closing "];" — the array is followed by "];" at column 0
const close = src.indexOf('\n];', open);
let body = src.slice(open, close + 2); // include the closing ]

// Turn `RiasecType.Realistic` (used both as value and as computed key) into a string.
body = body.replace(/RiasecType\.([A-Za-z]+)/g, '"$1"');

// Evaluate the now-plain array literal.
// eslint-disable-next-line no-eval
const occupations = eval(body);

if (!Array.isArray(occupations) || occupations.length !== 60) {
  throw new Error(`Expected 60 occupations, got ${occupations?.length}`);
}

// Drop imageUrl (we don't use card art) and keep the useful fields.
const cleaned = occupations.map((o) => ({
  id: o.id,
  title: o.title,
  category: o.category,
  description: o.description,
  onetCode: o.onetCode,
  tasks: o.tasks,
  workActivities: o.workActivities,
  interests: o.interests,
}));

const out = resolve(here, '..', 'src', 'data', 'occupationsCore.json');
writeFileSync(out, JSON.stringify(cleaned, null, 2));
console.log(`Wrote ${cleaned.length} occupations to ${out}`);
