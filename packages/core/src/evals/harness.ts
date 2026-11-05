/**
 * Layer 8 — Evaluation harness.
 *
 * The question this answers: does the engine actually detect the twelve things
 * it claims to detect, or does it just produce confident prose?
 *
 * Two rules govern this file, and they are the reason it is published rather
 * than kept in a private notebook:
 *
 *  1. **Report false positives.** A detector that flags everything has perfect
 *     recall and is worthless. Precision, recall and the false-positive rate are
 *     all printed, and the dataset includes cases that must NOT be flagged.
 *  2. **Publish the misses.** `results.failures` lists every case the engine got
 *     wrong, by name. A benchmark that only reports its wins is marketing.
 *
 * The dataset is plain JSONL so anyone can add a case, rerun, and argue with a
 * number instead of a vibe.
 */
import { extractSignals } from '../signals.js';
import { checkInbound } from '../honesty.js';
import { detectCrowdedCategory, adjacentCategories } from '../categories.js';
import { screenForAbuse } from '../../../agents/src/types.js';
import { GENERIC_AUDIENCE } from '../signals.js';

/**
 * The generic-audience list, read once. `extractSignals` already tokenised it, so
 * this is only used to subtract universal nouns from the identity markers.
 */
const GENERIC_AUDIENCE_TERMS: string[] = GENERIC_AUDIENCE;

/**
 * Consultant-speak. Deliberately a list, not a length heuristic: the previous
 * version measured the share of ten-letter words, which punished normal
 * professional vocabulary ("contractor", "productivity") and never once caught
 * the words that actually make a sentence unreadable.
 */
/**
 * Alt text that only names the medium tells a screen-reader user what the element
 * already is, not what it shows. Treated as missing.
 */
const NON_DESCRIPTIVE_ALT =
  /^(?:an?\s+)?(?:image|img|picture|photo|screenshot|screen shot|figure|graphic|icon|logo|banner|chart|diagram|alt|placeholder|todo|tbd|[\w-]+\.(?:png|jpe?g|gif|webp|svg))$/;

const JARGON_SPEAK =
  /\b(?:orthogonal\w*|latency-optimis\w*|leverage[sd]?|synerg\w*|paradigm\w*|holistic\w*|best-in-class|mission-critical|value-add\w*|end-to-end solution|actionable insights?|scalable solution\w*|robust framework|seamless(?:ly)? integrat\w*|next-generation|cutting-edge|state-of-the-art|idempotent|orchestration layer|declarative configuration|heterogeneous|event-sourced|substrate|instantiation|topolog\w*|utilisation|utilization|operationalis\w*|operationaliz\w*)\b/g;

/** The twelve detection targets. These are the claims the README makes. */
export const TARGETS = [
  'weak_category',
  'unclear_audience',
  'missing_broadcaster',
  'inflated_claims',
  'fake_social_proof',
  'missing_failure_condition',
  'high_share_friction',
  'manipulative_language',
  'poor_launch_timing',
  'inaccessible_copy',
  'privacy_risk',
  'abuse_risk',
] as const;

export type Target = (typeof TARGETS)[number];

export interface EvalCase {
  id: string;
  /** Why this case exists. A test without a reason is a test that will be deleted. */
  rationale: string;
  input: string;
  /** Targets the engine MUST detect. */
  expect: Target[];
  /** Targets the engine must NOT detect. This is where precision lives. */
  mustNot: Target[];
  difficulty: 'easy' | 'medium' | 'hard';
  /** Known limitation: the engine is expected to fail this case. Kept in the dataset. */
  knownMiss?: string;
}

export interface Detectors {
  [target: string]: boolean;
}

/**
 * Runs every detector against one input and returns which targets fired.
 *
 * Deterministic: same input, same answers, no model involved. That is what makes
 * a precision number meaningful rather than decorative.
 */
export function detect(input: string, opts: { saturationCount?: number | null } = {}): Detectors {
  const signals = extractSignals(input);
  const honesty = checkInbound(input);
  const crowded = detectCrowdedCategory(signals, input);
  const text = input.toLowerCase();

  const out: Record<string, boolean> = {};

  /* --- weak category: no "not X, but Y" pairing, and either a crowded class or
         copy too short to have positioned anything. --- */
  out.weak_category =
    !signals.hasCategoryPairing && (crowded.slug !== 'unspecified' || signals.wordCount < 30);

  /* --- unclear audience: no role named, or only a universal noun was named --- */
  const specificIdentity = signals.identityMarkers.filter(
    (m) => !GENERIC_AUDIENCE_TERMS.some((g) => m.term.toLowerCase() === g),
  );
  out.unclear_audience = specificIdentity.length === 0;

  /* --- missing broadcaster: no community vocabulary, no named carrier role --- */
  out.missing_broadcaster =
    signals.tribeMarkers.length === 0 &&
    !/\b(?:maintainer|moderator|newsletter|curator|editor|host)\b/i.test(input);

  /* --- inflated claims: a blocker or overclaim finding, or an explicit
         hack-the-algorithm promise, which no honesty rule matches by design
         (the rule looks for numbers, not for verbs). --- */
  out.inflated_claims =
    honesty.findings.some(
      (f) =>
        f.severity === 'blocker' ||
        (f.severity === 'warning' && /multiplier|superlative|overnight|guarantee/i.test(f.rule)),
    ) ||
    /\bhack(?:ing)?\s+(?:the\s+)?algorithm\b|\bgrowth\s+hack\b|\bsecret\s+(?:hack|trick|weapon)\b/i.test(input);

  /* --- fake social proof: unsourced adoption figures, testimonial attribution
         shapes, borrowed-logo claims. --- */
  out.fake_social_proof =
    /\b\d{3,}\+?\s+(?:users|professionals|creators|customers|downloads|companies)\b/i.test(input) ||
    /\btrusted\s+by\s+[A-Z]/.test(input) ||
    /\bas\s+seen\s+(?:on|in)\s+[A-Z]/.test(input) ||
    /["\u201c][^"\u201d]{12,140}["\u201d]\s*[\u2014\u2013-]\s*[A-Z][\w.'\u2019-]+(?:\s+[A-Z][\w.'\u2019-]+){0,3}/.test(input);

  /* --- missing failure condition --- */
  out.missing_failure_condition =
    !signals.hasFailureCondition &&
    !/\b(?:this fails if|kill criteria|kill criterion|failure condition|fails when)\b/i.test(input);

  /* --- high share friction: a long ordered setup path, or a wall of prose with
         nothing quotable in it. --- */
  const orderedSteps = (input.match(/^\s*(?:\d+[.)]|step\s+\d+|[-*])\s+/gim) ?? []).length;
  const sequencedProse = (input.match(/\bthen\b/gi) ?? []).length;
  out.high_share_friction =
    signals.installSteps > 3 ||
    orderedSteps >= 5 ||
    sequencedProse >= 3 ||
    (signals.wordCount > 200 && !/^>\s/m.test(input) && signals.headingCount < 2);

  /* --- manipulative language: urgency, outrage bait, manufactured scarcity --- */
  out.manipulative_language =
    /\b(?:limited time|only \d+ (?:spots|seats)|closing soon|last chance|act now|before it'?s too late)\b/i.test(input) ||
    /\b(?:outrageous|you won'?t believe|shocking truth|they don'?t want you to know)\b/i.test(input) ||
    honesty.findings.some((f) => /urgency|scarcity|dark/i.test(f.rule));

  /* --- poor launch timing: self-described unstable, or no install/first-run path --- */
  out.poor_launch_timing =
    signals.installSteps === 0 ||
    /\b(?:experimental|unstable|wip|work in progress|alpha|pre-?release|not ready)\b/i.test(input);

  /* --- inaccessible copy: consultant-speak, or marathon sentences, or images
         whose alt text is absent or merely names the medium. --- */
  const jargonHits = [...new Set((input.toLowerCase().match(JARGON_SPEAK) ?? []))];
  const sentences = input.split(/[.!?]+\s+|[.!?]+$/).map((x) => x.trim()).filter((x) => x.length > 0);
  const avgSentenceWords = sentences.length
    ? sentences.reduce((a, x) => a + x.split(/\s+/).filter(Boolean).length, 0) / sentences.length
    : 0;
  const altTexts = [...input.matchAll(/!\[([^\]]*)\]\(/g)].map((m) => m[1].trim().toLowerCase());
  const badAlt =
    /<img(?![^>]*alt=)/i.test(input) ||
    altTexts.some((a) => a === '' || NON_DESCRIPTIVE_ALT.test(a));
  out.inaccessible_copy =
    jargonHits.length >= 2 ||
    (avgSentenceWords > 30 && signals.wordCount > 40) ||
    badAlt ||
    signals.jargonDensity > 0.3;

  /* --- privacy risk: trackers, credential-shaped strings, harvesting language --- */
  out.privacy_risk =
    /(?:google-analytics|gtag\(|fbq\(|hotjar|mixpanel|segment\.io)/i.test(input) ||
    /\b(?:api[_-]?key|secret|password)\s*[:=]\s*\S{8,}/i.test(input) ||
    /\b(?:collect|harvest|scrape)s?\s+(?:their\s+)?(?:emails?|personal data|contact details)\b/i.test(input);

  /* --- abuse risk: the same screen the broadcaster agent uses --- */
  out.abuse_risk = screenForAbuse(input) !== null;

  /* Sanity: the dataset must be able to distinguish a clean document. */
  void text;
  void adjacentCategories(crowded.slug);
  void opts;
  return out;
}

export interface CaseResult {
  id: string;
  difficulty: EvalCase['difficulty'];
  rationale: string;
  expected: Target[];
  mustNot: Target[];
  detected: Target[];
  truePositives: Target[];
  falseNegatives: Target[];
  falsePositives: Target[];
  knownMiss?: string;
  passed: boolean;
}

export interface TargetMetrics {
  target: Target;
  support: number;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  falsePositiveRate: number;
}

export interface EvalReport {
  cases: number;
  passed: number;
  failed: number;
  passRate: number;
  metrics: TargetMetrics[];
  macro: { precision: number; recall: number; f1: number; falsePositiveRate: number };
  failures: CaseResult[];
  knownMisses: CaseResult[];
  /** What the numbers do and do not mean. Always printed with them. */
  limitations: string[];
  generatedAt: string;
}

export function runEval(cases: EvalCase[], now: () => Date = () => new Date()): EvalReport {
  const results: CaseResult[] = cases.map((c) => {
    const d = detect(c.input);
    const detected = TARGETS.filter((t) => d[t]);
    const truePositives = c.expect.filter((t) => d[t]);
    const falseNegatives = c.expect.filter((t) => !d[t]);
    const falsePositives = c.mustNot.filter((t) => d[t]);
    return {
      id: c.id,
      difficulty: c.difficulty,
      rationale: c.rationale,
      expected: c.expect,
      mustNot: c.mustNot,
      detected,
      truePositives,
      falseNegatives,
      falsePositives,
      knownMiss: c.knownMiss,
      passed: falseNegatives.length === 0 && falsePositives.length === 0,
    };
  });

  const metrics: TargetMetrics[] = TARGETS.map((target) => {
    const support = cases.filter((c) => c.expect.includes(target)).length;
    const negatives = cases.filter((c) => c.mustNot.includes(target)).length;
    const tp = results.filter((r) => r.truePositives.includes(target)).length;
    const fn = results.filter((r) => r.falseNegatives.includes(target)).length;
    const fp = results.filter((r) => r.falsePositives.includes(target)).length;
    return {
      target,
      support,
      truePositives: tp,
      falsePositives: fp,
      falseNegatives: fn,
      precision: tp + fp === 0 ? 1 : round(tp / (tp + fp)),
      recall: tp + fn === 0 ? 1 : round(tp / (tp + fn)),
      falsePositiveRate: negatives === 0 ? 0 : round(fp / negatives),
    };
  });

  const withSupport = metrics.filter((m) => m.support > 0);
  const macro = {
    precision: round(mean(withSupport.map((m) => m.precision))),
    recall: round(mean(withSupport.map((m) => m.recall))),
    f1: 0,
    falsePositiveRate: round(mean(metrics.map((m) => m.falsePositiveRate))),
  };
  macro.f1 = round((2 * macro.precision * macro.recall) / (macro.precision + macro.recall || 1));

  const passed = results.filter((r) => r.passed).length;

  return {
    cases: cases.length,
    passed,
    failed: results.length - passed,
    passRate: round(passed / results.length),
    metrics,
    macro,
    failures: results.filter((r) => !r.passed && !r.knownMiss),
    knownMisses: results.filter((r) => !r.passed && r.knownMiss),
    limitations: [
      'The dataset was written by the same people who wrote the detectors. That is a conflict of interest and it inflates every number here.',
      'n is small. These are hand-written cases, not a random sample of the internet.',
      'Detectors are keyword and structure rules. They detect the shape of a problem, not the problem. A well-written weak category passes.',
      'No human rated usefulness in this run. "Detected" is not the same as "helped".',
      'Multilingual quality is untested: every case is English.',
      'Local-mode quality is identical to hosted, because no case uses a model. That is a property of the design, not a measurement.',
      'Passing this harness means the engine notices the right things in these 30 documents. It does not mean it will notice them in yours.',
    ],
    generatedAt: now().toISOString(),
  };
}

function mean(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

/** Markdown table of the metrics, for the published benchmark file. */
export function metricsTable(report: EvalReport): string {
  const rows = report.metrics
    .map(
      (m) =>
        `| \`${m.target}\` | ${m.support} | ${m.precision.toFixed(3)} | ${m.recall.toFixed(3)} | ${m.falsePositiveRate.toFixed(3)} |`,
    )
    .join('\n');
  return [
    '| Target | Cases | Precision | Recall | False-positive rate |',
    '|---|---:|---:|---:|---:|',
    rows,
    `| **Macro** | ${report.cases} | **${report.macro.precision.toFixed(3)}** | **${report.macro.recall.toFixed(3)}** | **${report.macro.falsePositiveRate.toFixed(3)}** |`,
  ].join('\n');
}
