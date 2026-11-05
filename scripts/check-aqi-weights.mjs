#!/usr/bin/env node
/**
 * Fails the build if the AQI weights do not sum to the stated maximum, or if any
 * dimension is missing the fields the rubric promises. A rubric that does not add
 * up is not a rubric, it is a vibe with decimals.
 */
import { readFileSync } from 'node:fs';

const w = JSON.parse(readFileSync(new URL('../protocol/aqi-weights.json', import.meta.url), 'utf8'));
const required = ['key', 'label', 'weight', 'question', 'higherIsBetter'];
const problems = [];

if (!Array.isArray(w.dimensions) || w.dimensions.length === 0) problems.push('no dimensions');

let sum = 0;
const seen = new Set();
for (const [i, d] of (w.dimensions ?? []).entries()) {
  for (const f of required) if (d[f] === undefined) problems.push(`dimensions[${i}] (${d.key ?? '?'}) is missing "${f}"`);
  if (typeof d.weight !== 'number' || !Number.isFinite(d.weight) || d.weight < 0) problems.push(`dimensions[${i}] weight is not a non-negative number`);
  if (seen.has(d.key)) problems.push(`duplicate key "${d.key}"`);
  seen.add(d.key);
  sum += d.weight ?? 0;
}

if (sum !== w.max) problems.push(`weights sum to ${sum}, but max is ${w.max}`);

const bands = w.bands ?? [];
if (!bands.length) problems.push('no bands');
let expected = 0;
for (const b of bands.sort((x, y) => x.min - y.min)) {
  if (b.min !== expected) problems.push(`bands are not contiguous around ${b.min} (expected ${expected})`);
  if (b.max - b.min < 0) problems.push(`band ${b.label} has max < min`);
  expected = b.max + 1;
}
if (expected !== w.max + 1) problems.push(`bands cover 0..${expected - 1}, but the maximum is ${w.max}`);

if (problems.length) {
  console.error('AQI weights are inconsistent:');
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}

console.log(`AQI ${w.aqiVersion}: ${w.dimensions.length} dimensions, weights sum to ${sum}/${w.max}, bands contiguous.`);
