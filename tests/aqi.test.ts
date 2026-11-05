import { describe, it, expect } from 'vitest';
import {
  AQI_DIMENSIONS,
  AQI_MAX,
  AQI_BANDS,
  computeAqi,
  dimension,
  bandFor,
  topLostPoints,
  assertWeightsSumToMax,
} from '../packages/protocol/src/aqi.js';

const ev = ['a real observation from the document'];

describe('AQI: the rubric must be internally consistent', () => {
  it('weights sum to exactly the stated maximum', () => {
    expect(() => assertWeightsSumToMax()).not.toThrow();
    expect(AQI_DIMENSIONS.reduce((a, d) => a + d.weight, 0)).toBe(AQI_MAX);
  });

  it('has exactly twenty-five dimensions', () => {
    // 1.0.0 had twenty. 2.0.0 added five that are observable rather than argued,
    // which is why the same assertion is now a different number: the test has to
    // fail if a dimension is silently dropped.
    expect(AQI_DIMENSIONS).toHaveLength(25);
  });

  it('declares a distinct job for every dimension added in 2.0.0', () => {
    // The five new dimensions overlap conceptually with existing ones. If that
    // overlap is not written down, the rubric quietly double-counts.
    const withDistinct = AQI_DIMENSIONS.filter((d) => d.distinctFrom);
    expect(withDistinct.length).toBeGreaterThanOrEqual(5);
    for (const d of withDistinct) {
      expect(d.distinctFrom!.length, d.key).toBeGreaterThan(40);
    }
  });

  it('every dimension asks a question that ends in a question mark', () => {
    for (const d of AQI_DIMENSIONS) {
      expect(d.question.trim().endsWith('?'), d.key).toBe(true);
    }
  });

  it('has no duplicate keys', () => {
    const keys = AQI_DIMENSIONS.map((d) => d.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('bands cover 0..1000 contiguously', () => {
    const sorted = [...AQI_BANDS].sort((a, b) => a.min - b.min);
    let expectMin = 0;
    for (const b of sorted) {
      expect(b.min).toBe(expectMin);
      expect(b.max).toBeGreaterThanOrEqual(b.min);
      expectMin = b.max + 1;
    }
    expect(expectMin).toBe(AQI_MAX + 1);
  });
});

describe('AQI: a score cannot exist without its context', () => {
  it('refuses a score with no evidence', () => {
    expect(() =>
      dimension('category_clarity', 50, {
        basis: 'structural', confidence: 'medium', evidence: [],
        improvement: 'do a thing', failureCondition: 'this is wrong if',
      }),
    ).toThrow(/without evidence/);
  });

  it('refuses a score with no improvement action', () => {
    expect(() =>
      dimension('category_clarity', 50, {
        basis: 'structural', confidence: 'medium', evidence: ev,
        improvement: '', failureCondition: 'this is wrong if',
      }),
    ).toThrow(/improvement/);
  });

  it('refuses a score with no failure condition', () => {
    expect(() =>
      dimension('category_clarity', 50, {
        basis: 'structural', confidence: 'medium', evidence: ev,
        improvement: 'do a thing', failureCondition: '',
      }),
    ).toThrow(/failure condition/);
  });

  it('refuses an unknown dimension', () => {
    expect(() =>
      dimension('vibes' as never, 50, {
        basis: 'heuristic', confidence: 'low', evidence: ev,
        improvement: 'i', failureCondition: 'f',
      }),
    ).toThrow(/unknown AQI dimension/);
  });

  it('clamps out-of-range scores rather than accepting them', () => {
    const hi = dimension('category_clarity', 400, {
      basis: 'measured', confidence: 'high', evidence: ev, improvement: 'i', failureCondition: 'f',
    });
    const lo = dimension('category_clarity', -20, {
      basis: 'measured', confidence: 'high', evidence: ev, improvement: 'i', failureCondition: 'f',
    });
    expect(hi.score).toBe(100);
    expect(lo.score).toBe(0);
  });
});

describe('AQI: arithmetic is reproducible by hand', () => {
  it('points are score × weight ÷ 100', () => {
    const d = dimension('category_clarity', 50, {
      basis: 'structural', confidence: 'medium', evidence: ev, improvement: 'i', failureCondition: 'f',
    });
    expect(d.weight).toBe(85);
    expect(d.points).toBe(43);
  });

  it('a perfect score on every dimension totals exactly the maximum', () => {
    const dims = AQI_DIMENSIONS.map((spec) =>
      dimension(spec.key as never, 100, {
        basis: 'measured', confidence: 'high', evidence: ev, improvement: 'i', failureCondition: 'f',
      }),
    );
    const result = computeAqi(dims);
    expect(result.total).toBe(AQI_MAX);
    expect(result.band.label).toBe('Exceptional');
  });

  it('a zero score on every dimension totals zero', () => {
    const dims = AQI_DIMENSIONS.map((spec) =>
      dimension(spec.key as never, 0, {
        basis: 'unavailable', confidence: 'low', evidence: ev, improvement: 'i', failureCondition: 'f',
      }),
    );
    expect(computeAqi(dims).total).toBe(0);
  });

  it('missing dimensions are filled as unavailable at zero, not dropped', () => {
    const partial = [
      dimension('category_clarity', 100, {
        basis: 'measured', confidence: 'high', evidence: ev, improvement: 'i', failureCondition: 'f',
      }),
    ];
    const result = computeAqi(partial);
    expect(result.dimensions).toHaveLength(25);
    expect(result.total).toBe(85);
    const rest = result.dimensions.filter((d) => d.key !== 'category_clarity');
    expect(rest.every((d) => d.basis === 'unavailable')).toBe(true);
  });

  it('drops would inflate the percentage, so they must not happen', () => {
    // If we simply averaged the dimensions we had, one perfect dimension would be
    // "100%". The protocol treats an unevaluated dimension as zero instead.
    const one = computeAqi([
      dimension('category_clarity', 100, {
        basis: 'measured', confidence: 'high', evidence: ev, improvement: 'i', failureCondition: 'f',
      }),
    ]);
    expect(one.total).toBeLessThan(AQI_MAX / 4);
  });
});

describe('AQI: leverage is not the same as weakness', () => {
  it('ranks by points lost, which accounts for weight', () => {
    const dims = [
      // weight 80, score 50 → 40 points lost
      dimension('category_clarity', 50, {
        basis: 'measured', confidence: 'high', evidence: ev, improvement: 'i', failureCondition: 'f',
      }),
      // weight 30, score 0 → 30 points lost
      dimension('privacy_safety', 0, {
        basis: 'measured', confidence: 'high', evidence: ev, improvement: 'i', failureCondition: 'f',
      }),
    ];
    const result = computeAqi(dims);
    // The filled-in dimensions score zero, so "weakest overall" is one of those.
    // The useful comparison is between the two dimensions we actually scored.
    const scored = result.dimensions.filter((d) => d.key === 'category_clarity' || d.key === 'privacy_safety');
    expect([...scored].sort((a, b) => a.score - b.score)[0].key).toBe('privacy_safety');
    // Leverage disagrees with weakness, which is the point: privacy_safety is the
    // lowest score, but category_clarity is where 40 points sit versus 30.
    const lev = topLostPoints(result, 20).filter(
      (d) => d.key === 'category_clarity' || d.key === 'privacy_safety',
    );
    expect(lev[0].key).toBe('category_clarity');
  });

  it('reports a do-not-launch block when a dimension demands it', () => {
    const dims = [
      dimension('honesty_integrity', 10, {
        basis: 'measured', confidence: 'high', evidence: ev,
        improvement: 'i', failureCondition: 'f', doNotLaunchYet: true,
      }),
    ];
    expect(computeAqi(dims).blocked).toBe(true);
  });

  it('is not blocked by an ordinary low score', () => {
    const dims = [
      dimension('category_clarity', 10, {
        basis: 'measured', confidence: 'high', evidence: ev, improvement: 'i', failureCondition: 'f',
      }),
    ];
    expect(computeAqi(dims).blocked).toBe(false);
  });
});

describe('AQI: bands', () => {
  it('maps boundary values to the documented bands', () => {
    expect(bandFor(0).label).toBe('Not ready');
    expect(bandFor(249).label).toBe('Not ready');
    expect(bandFor(250).label).toBe('Fragile');
    expect(bandFor(449).label).toBe('Fragile');
    expect(bandFor(450).label).toBe('Workable');
    expect(bandFor(649).label).toBe('Workable');
    expect(bandFor(650).label).toBe('Strong');
    expect(bandFor(824).label).toBe('Strong');
    expect(bandFor(825).label).toBe('Exceptional');
    expect(bandFor(1000).label).toBe('Exceptional');
  });

  it('always carries the disclaimer that it is not a forecast', () => {
    const r = computeAqi([]);
    expect(r.disclaimer).toMatch(/not a forecast/i);
    expect(r.disclaimer).toMatch(/not a probability/i);
  });
});
