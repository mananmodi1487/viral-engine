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
