import { describe, it, expect } from 'vitest';
import { extractSignals, scoreDocument, checkInbound, SCORE_KEYS } from '@viral-engine/core';

const score = (text: string, opts: Partial<{ hasDescription: boolean; saturationKnown: boolean }> = {}) => {
  const signals = extractSignals(text);
  const honesty = checkInbound(text);
  return scoreDocument({
    signals,
    honesty,
    hasDescription: opts.hasDescription ?? true,
    hasTopics: false,
    saturationKnown: opts.saturationKnown ?? false,
  });
};

describe('scoring: determinism', () => {
  it('returns identical scores for identical input', () => {
    const text = 'It is not a note app. It is exam triage for students. Star it if useful.';
    const a = score(text);
    const b = score(text);
    expect(a.overall).toBe(b.overall);
    expect(a.dimensions.map((d) => d.score)).toEqual(b.dimensions.map((d) => d.score));
  });

  it('always returns exactly one dimension per declared key', () => {
    const card = score('anything at all');
    expect(card.dimensions).toHaveLength(SCORE_KEYS.length);
    expect(card.dimensions.map((d) => d.key).sort()).toEqual([...SCORE_KEYS].sort());
  });

  it('keeps every score within 0-100', () => {
    const card = score('guaranteed viral 10,000 users revolutionary seamless ' + 'word '.repeat(3000));
    for (const d of card.dimensions) {
      expect(d.score).toBeGreaterThanOrEqual(0);
      expect(d.score).toBeLessThanOrEqual(100);
    }
  });
});

describe('scoring: directional behaviour', () => {
  it('rewards an explicit category pairing', () => {
    const without = score('A tool for teams that want to ship faster.');
    const withPairing = score("It's not a project tracker. It's deadline-risk management for contractors.");
    const a = without.dimensions.find((d) => d.key === 'categoryClarity')!;
    const b = withPairing.dimensions.find((d) => d.key === 'categoryClarity')!;
    expect(b.score).toBeGreaterThan(a.score);
  });

  it('punishes honesty blockers through proof readiness and risk', () => {
    const clean = score('It is not a habit app. It is risk management for students.');
    const dirty = score('Guaranteed viral growth, 10,000 users, trusted by Harvard Business Review.');
    const cleanProof = clean.dimensions.find((d) => d.key === 'proofReadiness')!;
    const dirtyProof = dirty.dimensions.find((d) => d.key === 'proofReadiness')!;
    const cleanRisk = clean.dimensions.find((d) => d.key === 'honestyRisk')!;
    const dirtyRisk = dirty.dimensions.find((d) => d.key === 'honestyRisk')!;
    expect(cleanProof.score).toBeGreaterThan(dirtyProof.score);
    expect(dirtyRisk.score).toBeGreaterThan(cleanRisk.score);
    expect(dirty.overall).toBeLessThan(clean.overall);
  });

  it('reduces share-friction score as prerequisites increase', () => {
    const easy = score('Download and run it.');
    const hard = score(
      'Prerequisites: install dependencies, configure environment variable, setup docker, before you begin read the configuration guide.',
    );
    const a = easy.dimensions.find((d) => d.key === 'shareFriction')!;
    const b = hard.dimensions.find((d) => d.key === 'shareFriction')!;
    expect(a.score).toBeGreaterThan(b.score);
  });

  it('rewards activating language over deactivating language', () => {
    const active = score('Shocking, alarming, furious — this changed everything.');
    const flat = score('Sadly, it was a quiet and wistful, gentle update.');
    const a = active.dimensions.find((d) => d.key === 'emotionalStake')!;
    const b = flat.dimensions.find((d) => d.key === 'emotionalStake')!;
    expect(a.score).toBeGreaterThan(b.score);
  });
});

describe('scoring: basis honesty', () => {
  it('labels the emotional dimension as a heuristic, not a measurement', () => {
    const card = score('anything');
    const emo = card.dimensions.find((d) => d.key === 'emotionalStake')!;
    expect(emo.basis).toBe('heuristic');
  });

  it('labels share friction as measured', () => {
    const card = score('npm install foo');
    expect(card.dimensions.find((d) => d.key === 'shareFriction')!.basis).toBe('measured');
  });

  it('flags low confidence when saturation is unknown', () => {
    const card = score('some text', { saturationKnown: false });
    expect(card.lowConfidence).toBe(true);
  });

  it('gives every dimension a fix', () => {
    const card = score('minimal');
    for (const d of card.dimensions) expect(d.fix.length).toBeGreaterThan(10);
  });
});
