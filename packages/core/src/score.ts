/**
 * Deterministic scoring.
 *
 * Design constraints, in priority order:
 *  1. Reproducible: same input always yields the same score. No randomness, no model.
 *  2. Explainable: every dimension carries a rationale that points at the evidence.
 *  3. Honest about its own basis: each dimension declares whether it came from a
 *     measurement, a structural rule, or a judgement.
 *
 * Scores are 0-100 where higher is better, EXCEPT honestyRisk where higher is worse.
 * That asymmetry is intentional and is surfaced in the report; collapsing both into
 * "higher is better" is how scorecards start lying to people.
 */
import type { Signals } from './signals.js';
import type { Scorecard, ScoreDimension, EvidenceBasis } from './schemas.js';
import type { HonestyCheck } from './schemas.js';

const clamp = (n: number, lo = 0, hi = 100): number => Math.max(lo, Math.min(hi, Math.round(n)));

/** Saturating contribution: rises quickly then flattens, capped at `max`. */
const saturate = (value: number, half: number, max: number): number =>
  max * (value / (value + half));

export interface ScoreInputs {
  signals: Signals;
  honesty: HonestyCheck;
  hasDescription: boolean;
  hasTopics: boolean;
  repoStars?: number;
  /** True when we could reach the network to estimate saturation. */
  saturationKnown: boolean;
}

function dim(
  key: ScoreDimension['key'],
  label: string,
  score: number,
  basis: EvidenceBasis,
  rationale: string,
  fix: string,
): ScoreDimension {
  return { key, label, score: clamp(score), basis, rationale, fix };
}

/**
 * Category clarity.
 * Structural: rewards an explicit category pairing ("it's not X, it's Y"),
 * a description that names a specific audience, and penalises jargon drift.
 */
function categoryClarity(s: Signals, hasDescription: boolean): ScoreDimension {
  let score = 35;
  const reasons: string[] = [];
  if (s.hasCategoryPairing) {
    score += 30;
    reasons.push('contains an explicit "it\'s not X, it\'s Y" category pairing');
  } else {
    reasons.push('no explicit category pairing ("it\'s not X, it\'s Y") found');
  }
  if (hasDescription) {
    score += 12;
    reasons.push('a one-line description exists');
  } else {
    reasons.push('no one-line description to carry the category');
  }
  if (s.identityMarkers.length > 0) {
    score += 10;
    reasons.push(`names an audience (${s.identityMarkers.slice(0, 2).map((t) => t.term).join(', ')})`);
  } else {
    reasons.push('does not name a specific audience');
  }
  if (s.jargonDensity > 0.12) {
    score -= 12;
    reasons.push(`jargon density ${(s.jargonDensity * 100).toFixed(0)}% is above the 12% readability threshold`);
  }
  return dim(
    'categoryClarity',
    'Category Clarity',
    score,
    'structural',
    reasons.join('; '),
    s.hasCategoryPairing
      ? 'Sharpen the pairing so the new category is a job the audience already budgets for.'
      : 'Add one sentence of the form: "It\'s not <crowded category>. It\'s <new category> — for <specific person>."',
  );
}

/**
 * Broadcaster fit.
 * Structural proxy: a document that names communities, gives a paste-ready line,
 * and is short enough to quote is easier for a broadcaster to pass on.
 */
function broadcasterFit(s: Signals): ScoreDimension {
  let score = 30;
  const reasons: string[] = [];
  if (s.tribeMarkers.length > 0) {
    score += 22;
    reasons.push(`names ${s.tribeMarkers.length} community/tribe cue(s)`);
  } else {
    reasons.push('names no community, so there is no obvious amplifier');
  }
  if (s.properNouns.length >= 3) {
    score += 18;
    reasons.push(`references ${s.properNouns.length} recurring proper nouns (citable, recognisable)`);
  } else {
    reasons.push('few recurring proper nouns — little for a broadcaster to anchor on');
  }
  if (s.wordCount <= 900) {
    score += 15;
    reasons.push(`at ${s.wordCount} words it is quotable in one screen`);
  } else {
    score += Math.max(0, 15 - Math.round((s.wordCount - 900) / 200));
    reasons.push(`at ${s.wordCount} words a broadcaster must read it to describe it`);
  }
  if (s.hasFirstPersonReceipt) {
    score += 15;
    reasons.push('contains a first-person receipt, which a broadcaster can attribute');
  }
  return dim(
    'broadcasterFit',
    'Broadcaster Fit',
    score,
    'structural',
    reasons.join('; '),
    'Name one real broadcaster and write the sentence they would paste. If you cannot, there is no amplifier.',
  );
}

/**
 * Share friction — inverted: a clean, self-explanatory artifact scores HIGH.
 * Measured from setup language, prerequisites and copy length.
 */
function shareFriction(s: Signals): ScoreDimension {
  let score = 100;
  const reasons: string[] = [];
  const friction = s.shareFrictionMarkers.reduce((a, b) => a + b.count, 0);
  if (friction > 0) {
    const penalty = Math.min(45, saturate(friction, 2, 45));
    score -= penalty;
    reasons.push(`${friction} prerequisite/configuration cue(s) raise the cost of a first try`);
  } else {
    reasons.push('no prerequisite or configuration language found');
  }
  if (s.installSteps > 3) {
    score -= 15;
    reasons.push(`${s.installSteps} setup steps before first value`);
  } else if (s.installSteps === 0) {
    score -= 10;
    reasons.push('no explicit first command, so a reader must infer where to start');
  } else {
    reasons.push(`${s.installSteps} setup step(s) — within one-screen budget`);
  }
  if (s.codeBlockCount > 8) {
    score -= 12;
    reasons.push(`${s.codeBlockCount} code blocks: hard to screenshot, hard to quote`);
  }
  return dim(
    'shareFriction',
    'Share Friction',
    score,
    'measured',
    reasons.join('; '),
    s.installSteps > 3
      ? 'Cut the path to first value to one command, and move everything else into a "details" block.'
      : 'Add one screenshot-ready artifact a reader can forward without explanation.',
  );
}

/**
 * Emotional stake.
 * Berger & Milkman (2012): high-arousal emotion raises sharing; deactivating
 * emotion lowers it. This counts arousal vs deactivating terms. It is a coarse
 * proxy for activation, not a measurement of it — hence basis 'heuristic'.
 */
function emotionalStake(s: Signals): ScoreDimension {
  const arousal = s.highArousal.reduce((a, b) => a + b.count, 0);
  const deact = s.deactivating.reduce((a, b) => a + b.count, 0);
  const net = arousal - deact;
  const raw = 40 + saturate(Math.max(0, net), 2, 45) - Math.min(25, deact * 6);
  const reasons = [
    `${arousal} high-arousal term(s), ${deact} deactivating term(s)`,
    net <= 0
      ? 'no activating language: readers have no physical impulse to forward it'
      : 'activating language present (awe/anger/anxiety class)',
  ];
  if (s.hasEnemy) reasons.push('contains an enemy framing, which raises tension');
  return dim(
    'emotionalStake',
    'Emotional Stake',
    raw,
    'heuristic',
    reasons.join('; '),
    net <= 0
      ? 'Add one concrete stake: what does the reader lose by ignoring this, in their own words?'
      : 'Keep the arousal honest — anger travels but erodes trust. Prefer awe or relief over outrage.',
  );
}

/**
 * Proof readiness — can every claim survive being checked?
 * Blockers in the honesty scan push this down hard.
 */
function proofReadiness(s: Signals, honesty: HonestyCheck): ScoreDimension {
  let score = 50;
  const reasons: string[] = [];
  const blockers = honesty.findings.filter((f) => f.severity === 'blocker').length;
  const warnings = honesty.findings.filter((f) => f.severity === 'warning').length;
  if (blockers > 0) {
    score -= Math.min(50, blockers * 22);
    reasons.push(`${blockers} claim(s) a reader could publicly disprove`);
  } else {
    score += 15;
    reasons.push('no unbacked claims detected');
  }
  if (warnings > 0) {
    score -= Math.min(20, warnings * 6);
    reasons.push(`${warnings} warning-level claim(s)`);
  }
  if (s.receiptClaims.length > 0) {
    score += 12;
    reasons.push(`${s.receiptClaims.length} specific figure(s) present — verifiable if sourced`);
  }
  if (s.hasFirstPersonReceipt) {
    score += 12;
    reasons.push('first-person evidence of the work');
  }
  if (s.hasFailureCondition) {
    score += 11;
    reasons.push('already states a failure condition');
  }
  return dim(
    'proofReadiness',
    'Proof Readiness',
    score,
    'measured',
    reasons.join('; '),
    blockers > 0
      ? 'Replace every unbacked figure with `[your real number]` and state how you will measure it.'
      : 'Add the failure condition: "This fails if ___." It is the cheapest credibility you can buy.',
  );
}

/**
 * Launch timing — a judgement dressed as a checklist.
 * Rewards a working first-run path and penalises instability language.
 */
function launchTiming(s: Signals): ScoreDimension {
  let score = 45;
  const reasons: string[] = [];
  if (s.installSteps >= 1 && s.installSteps <= 3) {
    score += 25;
    reasons.push('a first-run path exists and is short');
  } else if (s.installSteps > 3) {
    score += 5;
    reasons.push('a first-run path exists but is long');
  } else {
    reasons.push('no first-run path: a launch would land on an unclear start');
  }
  if (/\b(?:wip|experimental|unstable|in development|alpha|beta)\b/i.test('')) {
    // placeholder branch retained for symmetry with signals
  }
  if (s.shareFrictionMarkers.some((m) => /experimental|unstable|wip|alpha/.test(m.term))) {
    score -= 18;
    reasons.push('self-described as unstable, which suppresses trial');
  }
  if (s.hasFailureCondition) {
    score += 15;
    reasons.push('kill criteria already written down');
  }
  return dim(
    'launchTiming',
    'Launch Timing',
    score,
    'heuristic',
    reasons.join('; '),
    'Decide the one channel and the one asset before launch day. "Post everywhere" is not a plan.',
  );
}

/**
 * Honesty risk — HIGHER IS WORSE. Deliberately inverted and labelled.
 */
function honestyRisk(honesty: HonestyCheck): ScoreDimension {
  const blockers = honesty.findings.filter((f) => f.severity === 'blocker').length;
  const warnings = honesty.findings.filter((f) => f.severity === 'warning').length;
  const notes = honesty.findings.filter((f) => f.severity === 'note').length;
  const score = Math.min(100, blockers * 35 + warnings * 12 + notes * 4);
  return dim(
    'honestyRisk',
    'Honesty Risk (lower is better)',
    score,
    'measured',
    blockers + warnings + notes === 0
      ? 'no hype or unbacked-claim patterns detected'
      : `${blockers} blocker(s), ${warnings} warning(s), ${notes} note(s) in the honesty scan`,
    blockers > 0
      ? 'Remove every blocker before publishing. A single fabricated figure converts your launch thread into a correction thread.'
      : 'Keep it. The absence of overclaiming is the differentiator, not a constraint.',
  );
}

export function scoreDocument(inputs: ScoreInputs): Scorecard {
  const { signals, honesty, hasDescription, saturationKnown } = inputs;

  const dimensions: ScoreDimension[] = [
    categoryClarity(signals, hasDescription),
    broadcasterFit(signals),
    shareFriction(signals),
    emotionalStake(signals),
    proofReadiness(signals, honesty),
    launchTiming(signals),
    honestyRisk(honesty),
  ];

  // Overall treats honestyRisk as inverted so a clean document is not punished.
  const positive = dimensions.filter((d) => d.key !== 'honestyRisk');
  const positiveMean = positive.reduce((a, d) => a + d.score, 0) / positive.length;
  const risk = dimensions.find((d) => d.key === 'honestyRisk')!;
  const overall = clamp(positiveMean * (1 - risk.score / 200));

  const lowConfidence =
    !saturationKnown || dimensions.some((d) => d.basis === 'heuristic' && d.score < 45);

  return { overall, dimensions, lowConfidence };
}

/** Human-readable one-liner used by the CLI and the HTML report. */
export function summariseScorecard(card: Scorecard): string {
  const weakest = [...card.dimensions]
    .filter((d) => d.key !== 'honestyRisk')
    .sort((a, b) => a.score - b.score)[0];
  return `overall ${card.overall}/100 · weakest lever: ${weakest.label} ${weakest.score}/100`;
}
