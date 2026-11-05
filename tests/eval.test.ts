/**
 * The benchmark is a regression test, not a report.
 *
 * If a detector change makes precision worse, the build fails. The floor is set
 * below the current score on purpose: the point is to catch regressions, not to
 * pin the number so tightly that any honest improvement to a case breaks CI.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { runEval, TARGETS, metricsTable, type EvalCase } from '../packages/core/src/evals/harness.js';

const cases: EvalCase[] = readFileSync('fixtures/eval-dataset.jsonl', 'utf8')
  .split('\n')
  .filter((l) => l.trim())
  .map((l) => JSON.parse(l) as EvalCase);

const report = runEval(cases, () => new Date('2026-01-01T00:00:00Z'));

describe('evaluation harness', () => {
  it('has a dataset with enough cases to mean something', () => {
    expect(cases.length).toBeGreaterThanOrEqual(30);
  });

  it('covers every detection target at least once', () => {
    for (const t of TARGETS) {
      expect(cases.some((c) => c.expect.includes(t)), `no positive case for ${t}`).toBe(true);
    }
  });

  it('includes cases that must NOT fire, for every target that has a real precision risk', () => {
    const withNegatives = new Set(cases.flatMap((c) => c.mustNot));
    for (const t of ['abuse_risk', 'manipulative_language', 'fake_social_proof', 'missing_broadcaster']) {
      expect(withNegatives.has(t as never), `no negative case for ${t}`).toBe(true);
    }
  });

  it('every case explains why it exists', () => {
    for (const c of cases) expect(c.rationale.length, c.id).toBeGreaterThan(20);
  });

  it('holds precision above the published floor', () => {
    expect(report.macro.precision).toBeGreaterThanOrEqual(0.95);
  });

  it('holds recall above the published floor', () => {
    expect(report.macro.recall).toBeGreaterThanOrEqual(0.9);
  });

  it('holds the false-positive rate under 10%', () => {
    expect(report.macro.falsePositiveRate).toBeLessThan(0.1);
  });

  it('publishes known misses instead of deleting them', () => {
    for (const f of report.knownMisses) {
      expect(f.knownMiss, `${f.id} is a known miss with no explanation`).toBeTruthy();
      expect(f.knownMiss!.length).toBeGreaterThan(80);
    }
  });

  it('never reports better than the truth: passed + failed = cases', () => {
    expect(report.passed + report.failed).toBe(report.cases);
  });

  it('states its own limitations', () => {
    expect(report.limitations.length).toBeGreaterThanOrEqual(5);
    expect(report.limitations.join(' ')).toMatch(/conflict of interest/i);
    expect(report.limitations.join(' ')).toMatch(/English/i);
  });

  it('is deterministic', () => {
    const again = runEval(cases, () => new Date('2026-01-01T00:00:00Z'));
    expect(JSON.stringify(again.metrics)).toBe(JSON.stringify(report.metrics));
  });

  it('renders a metrics table a human can read', () => {
    const table = metricsTable(report);
    expect(table.split('\n').length).toBeGreaterThan(TARGETS.length);
    expect(table).toContain('Macro');
  });
});
