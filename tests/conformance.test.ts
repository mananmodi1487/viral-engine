/**
 * Conformance suite for ODS 1.0 and the reference implementation.
 *
 * This file is the thing a third-party implementation can run against its own
 * output. The six conformance rules from protocol/open-diffusion-spec.md §5 are
 * each asserted here against a real generated document — not against a fixture
 * someone could have hand-tuned.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { analyzeOds } from '../packages/core/src/analyze/ods.js';
import { ingest } from '../packages/core/src/ingest/index.js';
import { AQI_DIMENSIONS, AQI_MAX } from '../packages/protocol/src/aqi.js';
import type { OdsDocument } from '../packages/core/src/analyze/ods.js';

const TEXT = `# Placement Risk

It's not a habit tracker. It's placement-risk management for students in placement season.

47 deadlines, 6 companies, one spreadsheet that disagrees with your calendar.
One command tells you which deadline you are actually going to miss.

Built after missing two interviews in one week.

This fails if students read it as another productivity lecture. Observable: they
describe it as a to-do app. Horizon: the first 24 hours.`;

async function generate(over: Record<string, unknown> = {}): Promise<OdsDocument> {
  const ing = await ingest('', { text: TEXT });
  return analyzeOds(ing.source, {
    offline: true,
    networkCalls: 0,
    saturationUnavailableReason: 'offline mode — not measured',
    now: () => new Date('2026-03-04T00:00:00Z'),
    ...over,
  });
}

describe('ODS conformance rule 1: the document validates against the schema', () => {
  it('has every required top-level field', async () => {
    const doc = await generate();
    const required = [
      'ods_version', 'artifact', 'current_positioning', 'honesty_audit',
      'scorecard', 'failure_conditions', 'ethics_review',
    ];
    for (const key of required) {
      expect(doc, `missing ${key}`).toHaveProperty(key);
    }
    expect(doc.ods_version).toBe('1.0.0');
  });

  it('matches the published JSON Schema structure', async () => {
    const schema = JSON.parse(readFileSync('packages/protocol/ods.schema.json', 'utf8')) as {
      required: string[];
      properties: Record<string, unknown>;
    };
    const doc = (await generate()) as unknown as Record<string, unknown>;
    for (const key of schema.required) {
      expect(doc, `schema requires ${key} but the generator omitted it`).toHaveProperty(key);
    }
    for (const key of Object.keys(doc)) {
      // x_* is the extension namespace the spec explicitly permits.
      if (key.startsWith('x_')) continue;
      expect(schema.properties, `generated field "${key}" is not in the schema`).toHaveProperty(key);
    }
  });

  it('is byte-identical across runs, except for the timestamp', async () => {
    const a = await generate();
    const b = await generate();
    const strip = (d: OdsDocument): string => JSON.stringify({ ...d, generated_at: '' });
    expect(strip(a)).toBe(strip(b));
  });
});

describe('ODS conformance rule 2: unknown is used, never a guess', () => {
  it('reports saturation as unavailable when nothing was measured', async () => {
    const doc = await generate();
    const cat = doc.category_analysis as Record<string, unknown>;
    expect(cat.saturation_estimate).toBe('unknown');
    expect(cat.saturation_basis).toBe('unavailable');
    expect((cat.missing_data as string[]).length).toBeGreaterThan(0);
  });

  it('uses a measured value when one is supplied, and labels it', async () => {
    const doc = await generate({ saturationCount: 1400 });
    const cat = doc.category_analysis as Record<string, unknown>;
    expect(cat.saturation_basis).toBe('measured');
    expect(cat.saturation_estimate).not.toBe('unknown');
  });

  it('never emits an unavailable basis together with a definite claim', async () => {
    const doc = await generate();
    for (const d of doc.scorecard.dimensions) {
      if (d.basis === 'unavailable') {
        expect(d.score, `${d.key} claims a score while marking itself unavailable`).toBe(0);
      }
    }
  });
});

describe('ODS conformance rule 3: failure conditions are present', () => {
  it('has at least one top-level failure condition', async () => {
    const doc = await generate();
    expect(doc.failure_conditions.length).toBeGreaterThanOrEqual(1);
  });

  it('every failure condition has a statement, an observable, and a horizon', async () => {
    const doc = await generate();
    for (const f of doc.failure_conditions) {
      expect(f.statement.length, 'statement').toBeGreaterThan(8);
      expect(f.observable.length, 'observable').toBeGreaterThan(8);
      expect(f.horizon.length, 'horizon').toBeGreaterThan(2);
    }
  });

  it('every broadcaster brief carries one', async () => {
    const doc = await generate();
    const bc = doc.broadcaster_analysis as Record<string, unknown>;
    expect(bc.failure_condition).toBeTruthy();
  });
});

describe('ODS conformance rule 4: the ethics block can stop a launch', () => {
  it('is a boolean and is present', async () => {
    const doc = await generate();
    expect(typeof doc.ethics_review.do_not_launch_yet).toBe('boolean');
  });

  it('blocks when honesty blockers are present', async () => {
    const ing = await ingest('', {
      text: 'A productivity app. 10,000+ users already love it. Guaranteed to make you go viral. 10x your audience.',
    });
    const doc = await analyzeOds(ing.source, { offline: true, networkCalls: 0 });
    expect(doc.honesty_audit.passed).toBe(false);
    expect(doc.ethics_review.do_not_launch_yet).toBe(true);
    expect(doc.ethics_review.do_not_launch_reason).toBeTruthy();
  });

  it('does not block a clean document for honesty reasons alone', async () => {
    const doc = await generate();
    expect(doc.honesty_audit.passed).toBe(true);
    if (doc.ethics_review.do_not_launch_yet) {
      // Only an attempt-quality threshold may block here, and it must say so.
      expect(doc.ethics_review.do_not_launch_reason).toMatch(/1000|Attempt quality/i);
    }
  });

  it('records an ethical risk check with at least one entry', async () => {
    const doc = await generate();
    expect(doc.ethics_review.ethical_risk_check.length).toBeGreaterThanOrEqual(1);
    for (const r of doc.ethics_review.ethical_risk_check) {
      expect(['clear', 'caution', 'violation']).toContain(r.assessment);
    }
  });
});

describe('ODS conformance rule 5: no score without evidence, improvement, failure condition', () => {
  it('holds for every dimension of every generated document', async () => {
    const doc = await generate();
    expect(doc.scorecard.dimensions).toHaveLength(AQI_DIMENSIONS.length);
    for (const d of doc.scorecard.dimensions) {
      expect(d.evidence.length, `${d.key} evidence`).toBeGreaterThan(0);
      expect(d.improvement.length, `${d.key} improvement`).toBeGreaterThan(8);
      expect(d.failure_condition.length, `${d.key} failure condition`).toBeGreaterThan(15);
      expect(['low', 'medium', 'high']).toContain(d.confidence);
      expect(['measured', 'structural', 'heuristic', 'user-supplied', 'unavailable']).toContain(d.basis);
    }
  });

  it('the dimensions sum to the stated total', async () => {
    const doc = await generate();
    const sum = doc.scorecard.dimensions.reduce((a, d) => a + d.points, 0);
    expect(Math.abs(sum - doc.scorecard.total)).toBeLessThanOrEqual(1);
    expect(doc.scorecard.total).toBeLessThanOrEqual(AQI_MAX);
  });

  it('every dimension uses the weight from the shared rubric', async () => {
    const doc = await generate();
    for (const d of doc.scorecard.dimensions) {
      const spec = AQI_DIMENSIONS.find((s) => s.key === d.key);
      expect(spec, `${d.key} is not in the rubric`).toBeTruthy();
      expect(d.weight).toBe(spec!.weight);
    }
  });
});

describe('ODS conformance rule 6: limitations are stated', () => {
  it('states at least one thing it cannot determine', async () => {
    const doc = await generate();
    expect(doc.limitations.length).toBeGreaterThanOrEqual(5);
    expect(doc.limitations.some((l) => /not a prediction|rubric/i.test(l))).toBe(true);
  });

  it('always says the score is not a forecast', async () => {
    const doc = await generate();
    expect(doc.scorecard.disclaimer).toMatch(/not a forecast/i);
  });
});

describe('ODS: provenance and privacy are auditable', () => {
  it('reports zero network calls in offline mode', async () => {
    const doc = await generate();
    expect(doc.generator.network_calls).toBe(0);
    expect(doc.provenance.network_calls).toBe(0);
  });

  it('records the input kind and its consent basis', async () => {
    const doc = await generate();
    expect(doc.provenance.inputs[0].consent).toBe('user-provided');
  });

  it('names no private individual anywhere in the broadcaster block', async () => {
    const doc = await generate();
    const json = JSON.stringify(doc.broadcaster_analysis);
    // An @handle or a personal-looking name would indicate scraping, which the
    // protocol forbids. Roles and discovery methods only.
    expect(json).not.toMatch(/@[a-z0-9_]{2,}/i);
    const bc = doc.broadcaster_analysis as Record<string, unknown>;
    expect(bc.max_contacts).toBeLessThanOrEqual(3);
    expect((bc.anti_spam_rules as string[]).length).toBeGreaterThan(2);
  });
});

describe('ODS: our own output passes our own honesty scan', () => {
  it('the generated asset text contains no blocker-severity claim', async () => {
    const doc = await generate();
    const assets = doc.launch_assets as Record<string, unknown>;
    const text = JSON.stringify(assets);
    expect(text).not.toMatch(/guaranteed to (?:go )?viral/i);
    expect(text).not.toMatch(/\b\d{4,}\+?\s+(?:users|stars|customers)\b/i);
  });

  it('declares every placeholder it emitted', async () => {
    const doc = await generate();
    const assets = doc.launch_assets as Record<string, unknown>;
    const placeholders = (assets.placeholders_used as string[]) ?? [];
    // Scan the asset *text*, not its JSON serialisation: serialisation escapes
    // quotes and splits arrays, so a regex over JSON would invent placeholders
    // that do not exist and miss ones that do.
    const strings: string[] = [];
    const walk = (v: unknown): void => {
      if (typeof v === 'string') strings.push(v);
      else if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === 'object') Object.values(v).forEach(walk);
    };
    (assets as Record<string, unknown>)['placeholders_used'] = [];
    walk(assets);
    const text = strings.join('\n');
    const found = [...text.matchAll(/\[([^[\]\n]{3,80})\]/g)].map((m) => m[1].trim()).filter((p) => p && !p.startsWith('http'));
    for (const f of new Set(found)) {
      const declared = placeholders.some((p) => p === f || f.startsWith(p) || p.startsWith(f));
      expect(declared, `undeclared placeholder "[${f}]" in generated assets`).toBe(true);
    }
  });
});
