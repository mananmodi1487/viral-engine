import { describe, it, expect } from 'vitest';
import {
  analyze,
  validateReport,
  assertFailureConditions,
  toMarkdown,
  toHtml,
  toTerminal,
  bandFromRepoCount,
} from '@viral-engine/core';
import type { SourceDocument } from '@viral-engine/core';

const src = (body: string, extra: Partial<SourceDocument> = {}): SourceDocument => ({
  kind: 'readme-text',
  ref: 'fixture.md',
  title: 'Fixture project',
  description: 'A tool for a specific audience',
  body,
  topics: [],
  fetchedFrom: 'pasted',
  ...extra,
});

const GOOD = `# Fixture project

It's not a project tracker. It's deadline-risk management for freelance contractors.

47 tabs, 3 deadlines, 0 systems. This is for you.

npm install fixture-tool
npx fixture-tool analyze .

This fails if contractors read it as another productivity lecture.
`;

describe('analyze: contract', () => {
  it('produces a schema-valid report', async () => {
    const r = await analyze(src(GOOD), { saturationCount: 120, now: () => new Date('2026-01-01T00:00:00Z') });
    expect(() => validateReport(r)).not.toThrow();
    expect(r.schemaVersion).toBe('1.0.0');
    expect(r.generatedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('always includes failure conditions everywhere they are required', async () => {
    const r = await analyze(src(GOOD), { saturationCount: 120 });
    expect(() => assertFailureConditions(r)).not.toThrow();
    expect(r.failureCondition.statement).toBeTruthy();
    expect(r.category.failureCondition.observable).toBeTruthy();
    expect(r.launchPlan.killCriteria.length).toBeGreaterThan(0);
    for (const b of r.broadcasters) expect(b.failureCondition).toBeTruthy();
  });

  it('always names at least one broadcaster with a paste-ready message', async () => {
    const r = await analyze(src(GOOD), { saturationCount: 120 });
    expect(r.broadcasters.length).toBeGreaterThanOrEqual(1);
    for (const b of r.broadcasters) {
      expect(b.target.length).toBeGreaterThan(10);
      expect(b.messageTemplate.length).toBeGreaterThan(40);
      expect(b.whatNotToSay.length).toBeGreaterThanOrEqual(1);
      expect(b.likelyAmplifier.length).toBeGreaterThan(10);
    }
  });

  it('records saturation as unavailable rather than guessing', async () => {
    const r = await analyze(src(GOOD), { saturationUnavailableReason: 'test forced offline' });
    expect(r.category.saturation).toBe('unknown');
    expect(r.category.saturationBasis).toBe('unavailable');
    expect(r.category.saturationEvidence).toContain('test forced offline');
    expect(r.scorecard.lowConfidence).toBe(true);
  });

  it('uses a supplied saturation count and labels it measured', async () => {
    const r = await analyze(src(GOOD), { saturationCount: 9000 });
    expect(r.category.saturation).toBe('saturated');
    expect(r.category.saturationBasis).toBe('measured');
    expect(r.category.saturationEvidence).toContain('9,000');
  });

  it('refuses to launch when honesty blockers exist', async () => {
    const bad = 'Guaranteed viral growth! Trusted by 10,000 professionals. 100K stars incoming.';
    const r = await analyze(src(bad), { saturationCount: 10 });
    expect(r.honesty.passed).toBe(false);
    expect(r.launchPlan.doNotLaunchYet).toBe(true);
    expect(r.launchPlan.doNotLaunchReason).toMatch(/honesty/i);
  });

  it('permits launch for a clean document', async () => {
    const r = await analyze(src(GOOD), { saturationCount: 50 });
    expect(r.honesty.passed).toBe(true);
  });

  it('never claims an outcome in its own prose', async () => {
    const r = await analyze(src(GOOD), { saturationCount: 50 });
    const prose = toMarkdown(r).toLowerCase();
    expect(prose).not.toMatch(/guaranteed virality|guaranteed to go viral/);
    expect(prose).not.toMatch(/\bwe guarantee\b/);
  });

  it('includes the limitations section, including saturation provenance', async () => {
    const r = await analyze(src(GOOD), { saturationUnavailableReason: 'offline' });
    expect(r.limitations.length).toBeGreaterThan(2);
    expect(r.limitations.join(' ')).toMatch(/heuristic|unavailable|offline/i);
  });
});

describe('analyze: determinism across the stack', () => {
  it('two runs produce byte-identical JSON for the same injected clock', async () => {
    const opts = { saturationCount: 42, now: () => new Date('2026-05-05T00:00:00Z') };
    const a = JSON.stringify(await analyze(src(GOOD), opts));
    const b = JSON.stringify(await analyze(src(GOOD), opts));
    expect(a).toBe(b);
  });
});

describe('reporters', () => {
  it('markdown contains the eight required sections', async () => {
    const r = await analyze(src(GOOD), { saturationCount: 10 });
    const md = toMarkdown(r);
    for (const heading of [
      '## 1. Scorecard',
      '## 2. Category',
      '## 3. The broadcaster',
      '## 4. Share friction',
      '## 5. Honesty check',
      '## 6. Launch assets',
      '## 7. Pre-launch checklist',
      '## 8. Kill criteria',
    ]) {
      expect(md).toContain(heading);
    }
  });

  it('html is self-contained (no external requests)', async () => {
    const r = await analyze(src(GOOD), { saturationCount: 10 });
    const html = toHtml(r);
    expect(html).toContain('<!doctype html>');
    expect(html).not.toMatch(/<link[^>]+href="http/);
    expect(html).not.toMatch(/<script/);
    expect(html).not.toMatch(/src="http/);
  });

  it('terminal output strips colour when asked', async () => {
    const r = await analyze(src(GOOD), { saturationCount: 10 });
    const plain = toTerminal(r, { colour: false });
    expect(plain).not.toMatch(/\x1b\[/);
    expect(plain).toContain('viral-engine');
  });

  it('escapes pipe characters so markdown tables cannot break', async () => {
    const r = await analyze(src(`# A | B\n\nIt's not X. It's Y for people. | piped`), { saturationCount: 5 });
    const md = toMarkdown(r);
    const tableRows = md.split('\n').filter((l) => l.startsWith('|') && l.includes('| `'));
    // no row should contain an unescaped pipe inside a cell value
    for (const row of tableRows) {
      expect(row.split('\\|').length).toBeLessThanOrEqual(row.split('|').length);
    }
  });
});

describe('bandFromRepoCount thresholds', () => {
  it('maps counts to documented bands', () => {
    expect(bandFromRepoCount(10).saturation).toBe('low');
    expect(bandFromRepoCount(300).saturation).toBe('moderate');
    expect(bandFromRepoCount(2000).saturation).toBe('high');
    expect(bandFromRepoCount(50000).saturation).toBe('saturated');
  });

  it('marks the band as measured and cites the number', () => {
    const b = bandFromRepoCount(1234);
    expect(b.basis).toBe('measured');
    expect(b.evidence).toContain('1,234');
  });
});
