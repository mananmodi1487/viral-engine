/**
 * Tests for the v3 surface: artifact types, share payloads, the modes, and the
 * stress-test memo.
 *
 * Two things are being asserted here that are worth stating explicitly, because
 * they are the reasons these modules exist at all:
 *
 *  1. **No user-facing output may contain a banned claim.** Every payload, every
 *     mode, and the stress-test memo is scanned. The scan is against the same
 *     `checkOutbound` rules the rest of the product uses, so a share card cannot
 *     say something the honesty audit would refuse to let the README say.
 *  2. **Every artifact type declares its own failure.** A type without a
 *     characteristic failure is a type that will silently get a generic rubric.
 */
import { describe, it, expect } from 'vitest';
import {
  ARTIFACT_TYPES,
  artifactTypeSpec,
  guessArtifactType,
  buildSharePayloads,
  failureCard,
  roast,
  therapist,
  killYourDarling,
  explainLikeImFive,
  stressTest,
  checkOutbound,
  extractSignals,
  type ShareInput,
} from '../packages/core/src/index.js';
import { AQI_DIMENSIONS } from '../packages/protocol/src/aqi.js';

const BANNED = [
  'guaranteed viral',
  'guaranteed 100k stars',
  'hack the algorithm',
  'secret trick',
  'overnight success',
  'explode your growth',
  'unbeatable',
  'magic',
  'proven to make viral',
];

function assertNoBanned(text: string, where: string) {
  for (const b of BANNED) {
    expect(text.toLowerCase(), `${where} contains banned string "${b}"`).not.toContain(b);
  }
}

/* ---------- artifact types ---------- */

describe('artifact types', () => {
  it('declares at least 33 types, each with its own characteristic failure', () => {
    expect(ARTIFACT_TYPES.length).toBeGreaterThanOrEqual(33);
    for (const t of ARTIFACT_TYPES) {
      expect(t.characteristicFailure.length, `${t.key} needs a real failure`).toBeGreaterThan(60);
      expect(t.expects.length, `${t.key} needs present-or-fail requirements`).toBeGreaterThanOrEqual(2);
      expect(t.readerJob.length).toBeGreaterThan(20);
    }
  });

  it('is honest about the types it cannot read directly', () => {
    for (const key of ['screenshot', 'video'] as const) {
      const spec = artifactTypeSpec(key)!;
      expect(spec.ingest).not.toBe('text');
      expect(spec.workaround, `${key} must tell the user how to get text in offline`).toBeTruthy();
    }
  });

  it('guesses structure it can see and admits when it cannot', () => {
    expect(guessArtifactType('# Changelog\n\n## [1.2.0] - 2026-01-01\n').type).toBe('changelog');
    expect(guessArtifactType('Subject: the thing you asked about\n\nUnsubscribe here.\n').type).toBe('newsletter');
    expect(guessArtifactType('a short opaque note').type).toBe('document');
    expect(guessArtifactType('anything', 'grant-application').basis).toBe('declared');
  });

  it('refuses to silently accept an unknown declared type', () => {
    expect(guessArtifactType('text', 'not-a-real-type').basis).toBe('default');
  });
});

/* ---------- share payloads ---------- */

function input(over: Partial<ShareInput> = {}): ShareInput {
  const dims = AQI_DIMENSIONS.slice(0, 6).map((d, i) => ({
    ...d,
    score: 100 - i * 10,
    points: Math.round(((100 - i * 10) * d.weight) / 100),
    basis: 'test',
    confidence: 'medium' as const,
    evidence: [],
    assumptions: [],
    missingData: [],
    improvement: 'x',
    failureCondition: 'fails if x',
    doNotLaunchYet: i === 0,
  }));
  return {
    artifactName: 'a README',
    total: 520,
    band: 'Workable',
    aqiVersion: '2.0.0',
    dimensions: dims as ShareInput['dimensions'],
    forwardable: null,
    topLeverage: dims.slice(0, 3) as ShareInput['topLeverage'],
    failureCondition: {
      statement: 'This fails if the named broadcaster never needs the thing.',
      observable: 'no reply from any named person',
      horizon: 'two weeks',
    },
    asOf: '2026-11-05',
    ...over,
  };
}

describe('share payloads', () => {
  const p = buildSharePayloads(input());

  it('ships the disclaimer with every artefact', () => {
    expect(p.whatThisDoesNotProve.length).toBeGreaterThanOrEqual(4);
    expect(p.whatThisDoesNotProve.join(' ').toLowerCase()).toContain('not a forecast');
    expect(p.blurb.toLowerCase()).toContain('not a forecast of attention');
  });

  it('never emits a banned claim, in any of the eight artefacts', () => {
    for (const [name, text] of Object.entries({
      forward: p.forwardableLine,
      social: p.socialPost,
      thread: p.thread.join('\n'),
      badge: p.badgeMarkdown,
      blurb: p.blurb,
      alt: p.cardAlt,
      svg: p.cardSvg,
      caveats: p.whatThisDoesNotProve.join('\n'),
    })) assertNoBanned(text, name);
  });

  it('passes its own outbound honesty scan', () => {
    const check = checkOutbound([p.forwardableLine, p.socialPost, p.thread.join('\n'), p.blurb].join('\n'));
    expect(check.findings.filter((f) => f.severity === 'blocker')).toHaveLength(0);
  });

  it('rejects a forwardable line that is still a template', () => {
    const templated = buildSharePayloads(
      input({ forwardable: 'For [name the person who needs this most]. A tool for <your audience>.' }),
    );
    expect(templated.forwardableWasGenerated).toBe(true);
    expect(templated.forwardableLine).not.toContain('[');
    expect(templated.forwardableLine).not.toContain('<');
  });

  it('keeps a real one-liner when the artifact supplied one', () => {
    const real = buildSharePayloads(
      input({ forwardable: 'A linter for launch copy, for people who have already been ignored once.' }),
    );
    expect(real.forwardableWasGenerated).toBe(false);
    expect(real.forwardableLine).toContain('linter for launch copy');
  });

  it('produces an SVG with an accessible title and description, and no external fetches', () => {
    expect(p.cardSvg).toContain('<title');
    expect(p.cardSvg).toContain('<desc');
    expect(p.cardSvg).toContain('role="img"');
    expect(p.cardSvg).not.toMatch(/https?:\/\/(?!www\.w3\.org)/);
    expect(p.cardSvg).not.toContain('<image');
    expect(p.cardSvg).not.toContain('@import');
  });

  it('labels the badge as a rubric rather than a prediction', () => {
    expect(p.badgeMarkdown.toLowerCase()).toContain('rubric');
    expect(p.badgeJson.schemaVersion).toBe(1);
    expect(p.badgeJson.message).toMatch(/\/1000/);
  });

  it('states what the score does not prove on the card itself', () => {
    expect(p.cardSvg.toLowerCase()).toContain('not');
    expect(p.cardAlt.length).toBeGreaterThan(80);
  });

  it('builds a failure card from a failure condition, not from a score', () => {
    const f = failureCard('a README', { statement: 'This fails if nobody needs it.', observable: 'no replies', horizon: 'a month' });
    expect(f.svg).toContain('no replies');
    expect(f.alt).toContain('This fails if nobody needs it.');
    assertNoBanned(f.svg + f.alt, 'failure card');
  });
});

/* ---------- modes ---------- */

const SAMPLE = `It's not a note-taking app. It's a place where half-formed thoughts can be wrong in public.
We are excited to announce a revolutionary way to leverage your thinking, for everyone who wants to be more productive.`;

describe('modes', () => {
  const base = { text: SAMPLE, title: 'Sample', signals: extractSignals(SAMPLE) };

  it('roasts the copy and says so', () => {
    const out = roast(base);
    expect(out.mode).toBe('roast');
    expect(out.body).toContain('was about you');
    expect(out.keepInMind.join(' ')).toContain('compression');
    assertNoBanned(out.body, 'roast');
  });

  it('never splits a prose sentence out of markup or code', () => {
    const svg = `<svg viewBox="0 0 1200 630"><desc>a very long single line of generated SVG that is not prose at all and should never be quoted back as a sentence</desc></svg>\n\n${SAMPLE}`;
    const out = roast({ text: svg, signals: extractSignals(svg) });
    expect(out.body).not.toContain('viewBox');
    expect(out.body).not.toContain('<desc>');
  });

  it('refuses to diagnose the person', () => {
    const out = therapist(base);
    expect(out.body).toContain('not therapy');
    expect(out.limits.length).toBeGreaterThanOrEqual(2);
    expect(out.body).not.toMatch(/you are (depressed|anxious|burnt out)/i);
  });

  it('argues against a sentence and says what survives', () => {
    const out = killYourDarling(base);
    expect(out.body).toContain('What survives');
    expect(out.body.length).toBeGreaterThan(100);
    assertNoBanned(out.body, 'kill-my-darling');
  });

  it('takes a darling the user names, and says so when it cannot tell', () => {
    const named = killYourDarling(base, 'a place where half-formed thoughts can be wrong in public');
    expect(named.body).toContain('half-formed');
    const fallback = killYourDarling({ text: 'nothing emphatic here at all.', signals: extractSignals('nothing emphatic here at all.') });
    expect(fallback.limits.join(' ').toLowerCase()).toContain('most emphatic');
  });

  it('explains plainly without deleting the uncertainty', () => {
    const out = explainLikeImFive(base);
    expect(out.body).toContain('uncertainty');
    expect(out.body).toContain('What I did not do');
    expect(out.keepInMind.join(' ')).toContain('lossy');
    assertNoBanned(out.body, 'explain');
  });

  it('truncates on a word boundary, never mid-word', () => {
    const long = `It's not a spreadsheet. It's a place where a team can argue about a number without anyone's feelings getting attached to the number itself, for finance leads.`;
    const out = explainLikeImFive({ text: long, signals: extractSignals(long) });
    const line = out.body.split('\n').find((l) => l.includes('What it is'))!;
    const tail = line.split(':').pop()!.trim();
    expect(tail.endsWith('.')).toBe(true);
    expect(tail).not.toMatch(/[a-z]$/);
  });

  it('reports absence rather than inventing an audience', () => {
    const text = 'A tool.';
    const out = explainLikeImFive({ text, signals: extractSignals(text) });
    expect(out.body).toContain('never names a person');
  });
});

/* ---------- stress test ---------- */

describe('100k-star stress test', () => {
  const t = stressTest();
  const flat = JSON.stringify(t);

  it('opens with the disclaimer, not with a number', () => {
    expect(t.disclaimer.toLowerCase()).toContain('not a forecast');
    expect(flat).not.toMatch(/\b(?:will|expect to) (?:reach|hit|get) \d{3,}/i);
  });

  it('contains no banned string anywhere', () => {
    assertNoBanned(flat, 'stress test');
  });

  it('labels every adoption hypothesis speculative and low-confidence', () => {
    expect(t.adoptionHypotheses.length).toBeGreaterThanOrEqual(5);
    for (const h of t.adoptionHypotheses) {
      expect(['low', 'very low']).toContain(h.confidence);
      expect(h.counterIndicators.length, `${h.id} needs counter-indicators`).toBeGreaterThanOrEqual(2);
      expect(h.grounds.length).toBeGreaterThan(40);
    }
  });

  it('gives every indicator a way it could mislead', () => {
    const all = t.indicators.flatMap((g) => g.indicators);
    expect(all.length).toBeGreaterThanOrEqual(9);
    for (const i of all) expect(i.misleadingIf.length).toBeGreaterThan(20);
  });

  it('scopes every kill criterion to the promotion, never to the project', () => {
    expect(t.killCriteria.length).toBeGreaterThanOrEqual(3);
    for (const k of t.killCriteria) {
      expect(k.scope.toLowerCase()).toMatch(/promotion|claim/);
      expect(k.scope.toLowerCase()).not.toContain('delete the repository');
    }
  });

  it('names the likely cause of failure in the memo', () => {
    expect(t.memo.ifItFails.length).toBeGreaterThan(80);
    expect(t.memo.ifItWorks.length).toBeGreaterThan(80);
  });
});

/* ---------- migration ---------- */

import { migrateDocument } from '../packages/core/src/index.js';

describe('ODS migration', () => {
  const v1 = {
    ods_version: '1.0.0',
    artifact: { id: 'x', name: 'x', type: 'github-repo', language: 'en' },
    current_positioning: { one_sentence_description: 'x' },
    scorecard: {
      aqi_version: '1.0.0',
      max: 1000,
      total: 649,
      dimensions: [
        { key: 'category_clarity', label: 'Category clarity', weight: 80, score: 50, basis: 'structural', confidence: 'medium', evidence: [], improvement: 'x', failure_condition: 'y' },
      ],
    },
    honesty_audit: { passed: true },
    failure_conditions: [{ statement: 's', observable: 'o', horizon: 'h' }],
  };

  it('upgrades the envelope but keeps the old total and old weights', () => {
    const r = migrateDocument(v1);
    const card = r.document.scorecard as Record<string, unknown>;
    expect(r.document.ods_version).toBe('2.0.0');
    expect(card.total).toBe(649);
    expect(card.aqi_version).toBe('1.0.0');
    expect((card.dimensions as Array<{ weight: number }>)[0].weight).toBe(80);
  });

  it('marks the scorecard historical and points at the command that fixes it', () => {
    const card = migrateDocument(v1).document.scorecard as Record<string, unknown>;
    expect(card.status).toBe('historical');
    expect(card.rescore_required).toBe(true);
    expect(String(card.rescore_command)).toContain('analyze');
    expect(String(card.rescore_reason).toLowerCase()).toContain('must not be compared');
  });

  it('preserves the original in full', () => {
    const r = migrateDocument(v1);
    expect(r.document.x_migrated_from).toEqual(v1);
    expect(r.changes.join(' ')).toContain('preserved the original');
  });

  it('is a no-op on a current document', () => {
    const r = migrateDocument({ ...v1, ods_version: '2.0.0' });
    expect(r.noop).toBe(true);
    expect(r.changes).toHaveLength(0);
  });

  it('refuses an unknown version instead of guessing', () => {
    expect(() => migrateDocument({ ...v1, ods_version: '9.9.9' })).toThrow(/unrecognised/);
    expect(() => migrateDocument('nope')).toThrow(/JSON object/);
  });

  it('never invents a score for a pre-ODS report', () => {
    const r = migrateDocument({ schemaVersion: '1.0.0', source: { name: 'old' } });
    const card = r.document.scorecard as Record<string, unknown>;
    expect(card.total).toBe(0);
    expect(card.status).toBe('absent');
    expect(r.cannot.join(' ')).toContain('cannot be expanded');
  });

  it('prints a migration note that says nothing was scored', () => {
    const r = migrateDocument(v1);
    expect(String(r.document.migration_note).toLowerCase()).toContain('no dimension was scored');
  });
});

/* ---------- the reference the disclaimer makes ---------- */

describe('the limitations reference in the weights file resolves', () => {
  it('has a real limitations.md at the repository root', async () => {
    const { readFileSync, existsSync } = await import('node:fs');
    expect(existsSync('limitations.md')).toBe(true);
    const md = readFileSync('limitations.md', 'utf8');
    // The file must contain the claims, not merely exist. A stub would satisfy a
    // link checker and fail a reader.
    expect(md.toLowerCase()).toContain('not a prediction');
    expect(md.toLowerCase()).toContain('not comparable across versions');
    expect(md).toMatch(/25 dimensions/);
    expect(md.split('\n').length).toBeGreaterThan(30);
  });

  it('is the file the published disclaimer points at', async () => {
    const { readFileSync } = await import('node:fs');
    const weights = JSON.parse(readFileSync('protocol/aqi-weights.json', 'utf8')) as { disclaimer: string };
    expect(weights.disclaimer.toLowerCase()).toContain('limitations.md');
  });
});

/* ---------- calibration ---------- */

import { calibrate, spearman } from '../packages/core/src/index.js';

function rec(i: number, over: Record<string, unknown> = {}) {
  return {
    aqi: 400 + i * 10,
    aqiVersion: '2.0.0',
    outcome: i * 3,
    outcomeUnit: 'unique visitors in 14 days',
    outcomeDefinedBy: 'protocol' as const,
    label: 'self-reported' as const,
    horizonDays: 14,
    ...over,
  };
}

describe('calibration', () => {
  it('refuses to compute a correlation below the minimum sample', () => {
    const r = calibrate(Array.from({ length: 8 }, (_, i) => rec(i)));
    expect(r.n).toBe(8);
    expect(r.rho).toBeNull();
    expect(r.interval).toBeNull();
    expect(r.conclusion).toContain('absence of a computed number is the finding');
    expect(r.strata[0].note).toContain('below the minimum');
  });

  it('computes rho and an interval once n is large enough', () => {
    const r = calibrate(Array.from({ length: 40 }, (_, i) => rec(i)));
    expect(r.rho).not.toBeNull();
    expect(r.interval).not.toBeNull();
    expect(r.conclusion).toMatch(/rho = /);
    expect(r.conclusion).toContain('interval');
  });

  it('says so when the interval includes zero', () => {
    // Deterministic noise: outcomes uncorrelated with score.
    const rows = Array.from({ length: 60 }, (_, i) => rec(i, { outcome: (i * 37) % 61 }));
    const r = calibrate(rows);
    if (r.interval && r.interval[0] <= 0 && r.interval[1] >= 0) {
      expect(r.conclusion).toContain('includes zero');
      expect(r.conclusion).toContain('Do not quote the point estimate');
    }
  });

  it('reports a negative relationship rather than hiding it', () => {
    const rows = Array.from({ length: 60 }, (_, i) => rec(i, { outcome: 300 - i * 3 }));
    const r = calibrate(rows);
    expect(r.rho).toBeLessThan(0);
    expect(r.conclusion).toContain('negative');
  });

  it('flags mixed units and mixed versions instead of pooling them', () => {
    const rows = [
      ...Array.from({ length: 20 }, (_, i) => rec(i)),
      ...Array.from({ length: 20 }, (_, i) => rec(i, { outcomeUnit: 'newsletter signups' })),
      ...Array.from({ length: 5 }, (_, i) => rec(i, { aqiVersion: '1.0.0' })),
    ];
    const r = calibrate(rows);
    expect(r.sampleProblems.join(' ')).toContain('different units');
    expect(r.sampleProblems.join(' ')).toContain('rubric versions');
    expect(r.strata.map((s) => s.name).join(' | ')).toContain('2.0.0');
  });

  it('keeps verified rows in their own stratum and says when it is empty', () => {
    const r = calibrate(Array.from({ length: 40 }, (_, i) => rec(i)));
    const strong = r.strata.find((s) => s.name.includes('verified'));
    expect(strong?.n).toBe(0);
    expect(strong?.rho).toBeNull();
    expect(strong?.note).toContain('honest headline');
  });

  it('is deterministic, so a published interval can be checked', () => {
    const rows = Array.from({ length: 50 }, (_, i) => rec(i, { outcome: (i * 13) % 29 }));
    expect(calibrate(rows).interval).toEqual(calibrate(rows).interval);
  });

  it('handles ties and degenerate input without inventing a number', () => {
    expect(spearman([1, 2, 3], [1, 1, 1])).toBeNull();
    expect(spearman([1, 2], [1, 2])).toBeNull();
    const flat = calibrate(Array.from({ length: 40 }, (_, i) => rec(i, { aqi: 500 })));
    expect(flat.rho).toBeNull();
  });
});
