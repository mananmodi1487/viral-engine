/**
 * Evaluation harness.
 *
 * Measures the detector against hand-labelled fixtures. This exists because
 * "the tool seems good" is not a measurement, and a scorer with no benchmark is
 * a scorer with no idea whether it works.
 *
 * Run: npm run bench
 * Exits non-zero if precision or recall falls below the configured floor, so it
 * can gate CI.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { analyze, extractSignals } from '../packages/core/src/index.js';
import type { SourceDocument } from '../packages/core/src/schemas.js';

export type SignalName =
  | 'weakCategory'
  | 'missingAudience'
  | 'missingBroadcaster'
  | 'inflatedClaims'
  | 'missingFailureCondition';

interface FixtureCase {
  id: string;
  description: string;
  expect: SignalName[];
  mustNotFlag: SignalName[];
  document: string;
}

interface FixtureFile {
  version: string;
  cases: FixtureCase[];
}

/**
 * Detector predicates. Each is a deterministic rule over the same signals the
 * report uses, so the benchmark measures the real tool rather than a parallel
 * reimplementation.
 */
export function detect(document: string): Record<SignalName, boolean> {
  const signals = extractSignals(document);

  const blockerPatterns = /guarantee[ds]?\s+(?:viral|growth|success)|\btrusted by\b|\b10,000\+?\b|\b100K\b|\b100,000\b/i;

  return {
    weakCategory: !signals.hasCategoryPairing && signals.identityMarkers.length === 0,
    missingAudience: signals.identityMarkers.length === 0,
    missingBroadcaster: signals.tribeMarkers.length === 0,
    inflatedClaims: blockerPatterns.test(document) && !isNegatedClaim(document),
    missingFailureCondition: !signals.hasFailureCondition,
  };
}

/** A claim inside a warning is not a claim. Mirrors the honesty scanner's guard. */
function isNegatedClaim(document: string): boolean {
  const m = document.match(/[^.!?]*\b(?:guarantee[ds]?|trusted by|100K|10,000)\b[^.!?]*[.!?]?/gi) ?? [];
  return m.length > 0 && m.every((s) => /\b(?:no|not|never|cannot|can't|nobody|without)\b/i.test(s));
}

export interface BenchResult {
  total: number;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  f1: number;
  perSignal: Record<SignalName, { tp: number; fp: number; fn: number; precision: number; recall: number }>;
  failures: Array<{ id: string; kind: 'FP' | 'FN'; signal: SignalName }>;
}

export function runBenchmark(fixturesPath?: string): BenchResult {
  const here = dirname(fileURLToPath(import.meta.url));
  const path = fixturesPath ?? join(here, '..', 'fixtures', 'benchmark.json');
  const fixtures = JSON.parse(readFileSync(path, 'utf8')) as FixtureFile;

  const signals: SignalName[] = [
    'weakCategory',
    'missingAudience',
    'missingBroadcaster',
    'inflatedClaims',
    'missingFailureCondition',
  ];
  const perSignal = Object.fromEntries(
    signals.map((s) => [s, { tp: 0, fp: 0, fn: 0, precision: 0, recall: 0 }]),
  ) as BenchResult['perSignal'];

  let tp = 0;
  let fp = 0;
  let fn = 0;
  const failures: BenchResult['failures'] = [];

  for (const c of fixtures.cases) {
    const got = detect(c.document);
    // Partial labelling: only signals the fixture names are scored. Labelling
    // every signal for every case invites invented expectations, which would
    // make the benchmark look good and mean nothing.
    const evaluated = new Set<SignalName>([...c.expect, ...c.mustNotFlag]);
    for (const s of signals) {
      if (!evaluated.has(s)) continue;
      const expected = c.expect.includes(s);
      const actual = got[s];
      if (expected && actual) {
        tp += 1;
        perSignal[s].tp += 1;
      } else if (!expected && actual) {
        fp += 1;
        perSignal[s].fp += 1;
        failures.push({ id: c.id, kind: 'FP', signal: s });
      } else if (expected && !actual) {
        fn += 1;
        perSignal[s].fn += 1;
        failures.push({ id: c.id, kind: 'FN', signal: s });
      }
    }
  }

  for (const s of signals) {
    const p = perSignal[s];
    p.precision = p.tp + p.fp === 0 ? 1 : p.tp / (p.tp + p.fp);
    p.recall = p.tp + p.fn === 0 ? 1 : p.tp / (p.tp + p.fn);
  }

  const precision = tp + fp === 0 ? 1 : tp / (tp + fp);
  const recall = tp + fn === 0 ? 1 : tp / (tp + fn);

  return {
    total: fixtures.cases.length,
    truePositives: tp,
    falsePositives: fp,
    falseNegatives: fn,
    precision,
    recall,
    f1: precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall),
    perSignal,
    failures,
  };
}

/** Full-pipeline sanity: every fixture must produce a schema-valid report. */
async function pipelineCheck(): Promise<{ ok: number; failed: Array<{ id: string; error: string }> }> {
  const here = dirname(fileURLToPath(import.meta.url));
  const fixtures = JSON.parse(
    readFileSync(join(here, '..', 'fixtures', 'benchmark.json'), 'utf8'),
  ) as FixtureFile;
  const failed: Array<{ id: string; error: string }> = [];
  let ok = 0;
  for (const c of fixtures.cases) {
    const src: SourceDocument = {
      kind: 'free-text',
      ref: c.id,
      body: c.document,
      topics: [],
      fetchedFrom: 'pasted',
    };
    try {
      await analyze(src, { saturationUnavailableReason: 'benchmark runs offline' });
      ok += 1;
    } catch (err) {
      failed.push({ id: c.id, error: (err as Error).message });
    }
  }
  return { ok, failed };
}

async function main(): Promise<void> {
  const r = runBenchmark();
  const pct = (n: number): string => `${(n * 100).toFixed(1)}%`;

  console.log('\nviral-engine evaluation harness');
  console.log('─'.repeat(64));
  console.log(`cases     ${r.total}`);
  console.log(`precision ${pct(r.precision)}   recall ${pct(r.recall)}   f1 ${pct(r.f1)}`);
  console.log(`tp ${r.truePositives} · fp ${r.falsePositives} · fn ${r.falseNegatives}`);
  console.log('');
  console.log('per signal');
  console.log('  signal                      precision  recall');
  for (const [k, v] of Object.entries(r.perSignal)) {
    console.log(`  ${k.padEnd(26)} ${pct(v.precision).padStart(7)}  ${pct(v.recall).padStart(7)}`);
  }
  if (r.failures.length) {
    console.log('\nmisclassifications');
    for (const f of r.failures) console.log(`  ${f.kind}  ${f.id} → ${f.signal}`);
  }

  const pipe = await pipelineCheck();
  console.log(`\npipeline   ${pipe.ok}/${pipe.ok + pipe.failed.length} fixtures produced a valid report`);
  for (const f of pipe.failed) console.log(`  FAILED ${f.id}: ${f.error}`);

  const FLOOR_PRECISION = 0.85;
  const FLOOR_RECALL = 0.8;
  const gate =
    r.precision >= FLOOR_PRECISION && r.recall >= FLOOR_RECALL && pipe.failed.length === 0;
  console.log(
    `\ngate       precision ≥ ${pct(FLOOR_PRECISION)}, recall ≥ ${pct(FLOOR_RECALL)}, zero pipeline failures`,
  );
  console.log(`result     ${gate ? 'PASS' : 'FAIL'}\n`);
  if (!gate) process.exit(1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
