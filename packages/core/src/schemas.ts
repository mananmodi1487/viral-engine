/**
 * Zod schemas for every artifact the engine emits.
 *
 * Two rules encoded here:
 *  1. A report cannot exist without failure conditions (enforced at the type level).
 *  2. LLM output is parsed through these before it is trusted, so a bad model call
 *     produces a validation error rather than a confident-sounding fabricated claim.
 */
import { z } from 'zod';

export const SCORE_KEYS = [
  'categoryClarity',
  'broadcasterFit',
  'shareFriction',
  'emotionalStake',
  'proofReadiness',
  'launchTiming',
  'honestyRisk',
] as const;

export const ScoreKey = z.enum(SCORE_KEYS);
export type ScoreKey = z.infer<typeof ScoreKey>;

/** Where a number came from. This is the anti-fabrication backbone of the tool. */
export const EvidenceBasis = z.enum([
  'measured', // computed from the input document itself
  'structural', // derived from a deterministic rule, no external data needed
  'heuristic', // a judgement call, labeled as such
  'user-supplied', // the user told us
  'unavailable', // could not be determined — must not be guessed
]);
export type EvidenceBasis = z.infer<typeof EvidenceBasis>;

export const ScoreDimension = z.object({
  key: ScoreKey,
  label: z.string(),
  score: z.number().min(0).max(100),
  basis: EvidenceBasis,
  /** Human-readable reason. Must cite what in the document produced the score. */
  rationale: z.string().min(1),
  /** Concrete, singular next action. Empty string is not allowed. */
  fix: z.string().min(1),
});
export type ScoreDimension = z.infer<typeof ScoreDimension>;

export const Scorecard = z.object({
  overall: z.number().min(0).max(100),
  dimensions: z.array(ScoreDimension).length(SCORE_KEYS.length),
  /** True when any dimension is 'unavailable' or 'heuristic' at a decisive weight. */
  lowConfidence: z.boolean(),
});
export type Scorecard = z.infer<typeof Scorecard>;

export const BroadcasterKind = z.enum([
  'maintainer',
  'newsletter',
  'community-moderator',
  'practitioner-with-audience',
  'aggregator',
]);

export const BroadcasterBrief = z.object({
  /** A role plus where to find them. Never a fabricated individual's name. */
  target: z.string().min(1),
  kind: BroadcasterKind,
  whereToFind: z.string().min(1),
  whyTheyCare: z.string().min(1),
  whatMakesThemLookGood: z.string().min(1),
  assetToSend: z.string().min(1),
  /** Ready-to-paste. Must not contain invented specifics about the person. */
  messageTemplate: z.string().min(1),
  whatNotToSay: z.array(z.string()).min(1),
  /** "Who is likely to actually do the passing along." Required by the Broadcaster Rule. */
  likelyAmplifier: z.string().min(1),
  failureCondition: z.string().min(1),
});
export type BroadcasterBrief = z.infer<typeof BroadcasterBrief>;

export const FailureCondition = z.object({
  statement: z.string().min(1),
  /** What you would observe if this failure is happening. */
  observable: z.string().min(1),
  /** After how long you would know. */
  horizon: z.string().min(1),
});
export type FailureCondition = z.infer<typeof FailureCondition>;

export const LaunchAsset = z.object({
  channel: z.enum([
    'hacker-news',
    'show-hn',
    'x-thread',
    'linkedin',
    'product-hunt',
    'landing-hero',
    'email-subject',
    'chat-announcement',
    'broadcaster-paste',
  ]),
  text: z.string().min(1),
  /** Character/word budget the channel actually enforces, when known. */
  budget: z.string().optional(),
  notes: z.string().optional(),
});
export type LaunchAsset = z.infer<typeof LaunchAsset>;

export const HonestyFinding = z.object({
  severity: z.enum(['blocker', 'warning', 'note']),
  matched: z.string(),
  where: z.string(),
  rule: z.string(),
  suggestion: z.string().min(1),
});
export type HonestyFinding = z.infer<typeof HonestyFinding>;

export const HonestyCheck = z.object({
  passed: z.boolean(),
  findings: z.array(HonestyFinding),
  /** Phrases we refuse to emit, scanned in our own output as well as the input. */
  scannedFor: z.array(z.string()),
});
export type HonestyCheck = z.infer<typeof HonestyCheck>;

export const CategoryDiagnosis = z.object({
  currentCategory: z.string().min(1),
  currentCategoryBasis: EvidenceBasis,
  saturation: z.enum(['unknown', 'low', 'moderate', 'high', 'saturated']),
  saturationBasis: EvidenceBasis,
  /** Deterministic evidence, e.g. GitHub repo count for a topic query. */
  saturationEvidence: z.string(),
  adjacentCategories: z.array(
    z.object({
      name: z.string().min(1),
      whyLessCrowded: z.string().min(1),
      tensionScore: z.number().min(0).max(5),
      credibilityRisk: z.string().min(1),
    }),
  ).min(1),
  proposedPositioning: z.string().min(1),
  proofRequired: z.string().min(1),
  failureCondition: FailureCondition,
});
export type CategoryDiagnosis = z.infer<typeof CategoryDiagnosis>;

export const LaunchPlan = z.object({
  checklist: z.array(
    z.object({
      step: z.string().min(1),
      gate: z.enum(['blocker', 'warning', 'info']),
      reasoning: z.string().min(1),
    }),
  ).min(1),
  assets: z.array(LaunchAsset).min(1),
  killCriteria: z.array(FailureCondition).min(1),
  /** True when the honest answer is to wait. A valid, first-class outcome. */
  doNotLaunchYet: z.boolean(),
  doNotLaunchReason: z.string().optional(),
});
export type LaunchPlan = z.infer<typeof LaunchPlan>;

export const InputKind = z.enum([
  'github-repo',
  'url',
  'readme-text',
  'free-text',
]);
export type InputKind = z.infer<typeof InputKind>;

export const SourceDocument = z.object({
  kind: InputKind,
  ref: z.string().min(1),
  title: z.string().optional(),
  description: z.string().optional(),
  body: z.string().min(1),
  topics: z.array(z.string()).default([]),
  stars: z.number().optional(),
  forks: z.number().optional(),
  /** Where the content came from, so a reader can judge staleness. */
  fetchedFrom: z.enum(['network', 'local-file', 'pasted']),
  /** Set when a network fetch failed and we fell back. */
  degraded: z.string().optional(),
});
export type SourceDocument = z.infer<typeof SourceDocument>;

export const DiagnosisReport = z.object({
  schemaVersion: z.literal('1.0.0'),
  generatedAt: z.string(),
  generator: z.object({
    name: z.string(),
    version: z.string(),
    mode: z.enum(['deterministic', 'llm-assisted']),
    provider: z.string().optional(),
    model: z.string().optional(),
  }),
  source: SourceDocument,
  scorecard: Scorecard,
  category: CategoryDiagnosis,
  broadcasters: z.array(BroadcasterBrief).min(1),
  shareFriction: z.array(
    z.object({
      friction: z.string().min(1),
      evidence: z.string().min(1),
      fix: z.string().min(1),
    }),
  ).min(1),
  honesty: HonestyCheck,
  launchPlan: LaunchPlan,
  /** The one-line summary a broadcaster could paste. */
  pasteReady: z.string().min(1),
  /** Top-level, always present, never optional. */
  failureCondition: FailureCondition,
  limitations: z.array(z.string()).min(1),
});
export type DiagnosisReport = z.infer<typeof DiagnosisReport>;

/** Validates a report and throws a readable error listing every problem. */
export function validateReport(value: unknown): DiagnosisReport {
  const parsed = DiagnosisReport.safeParse(value);
  if (parsed.success) return parsed.data;
  const lines = parsed.error.issues.map(
    (i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`,
  );
  throw new Error(`Report failed schema validation:\n${lines.join('\n')}`);
}

/** Reports must never ship without failure conditions. Belt and braces. */
export function assertFailureConditions(report: DiagnosisReport): void {
  const gaps: string[] = [];
  if (!report.failureCondition?.statement) gaps.push('report.failureCondition');
  if (!report.category.failureCondition?.statement) gaps.push('category.failureCondition');
  report.broadcasters.forEach((b, i) => {
    if (!b.failureCondition) gaps.push(`broadcasters[${i}].failureCondition`);
  });
  if (report.launchPlan.killCriteria.length === 0) gaps.push('launchPlan.killCriteria');
  if (gaps.length) {
    throw new Error(
      `Every recommendation needs a failure condition. Missing: ${gaps.join(', ')}`,
    );
  }
}
