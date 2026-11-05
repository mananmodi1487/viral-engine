/**
 * Attempt Quality Index (AQI) — the transparent 0–1000 rubric.
 *
 * Deliberately boring arithmetic. The point of a 1000-point index is not
 * precision; it is that anyone can recompute any number we publish and get the
 * same answer. If a score cannot be reproduced from the evidence strings beside
 * it, the score is decoration.
 *
 * Weights live in protocol/aqi-weights.json so Python, Go, Rust and third-party
 * implementations read the same numbers instead of copying them.
 */
import weightsFile from '../../../protocol/aqi-weights.json' with { type: 'json' };

export interface AqiDimensionSpec {
  key: string;
  label: string;
  weight: number;
  question: string;
  higherIsBetter: boolean;
}

export const AQI_VERSION: string = weightsFile.aqiVersion;
export const AQI_MAX: number = weightsFile.max;
export const AQI_DIMENSIONS: AqiDimensionSpec[] = weightsFile.dimensions as AqiDimensionSpec[];
export const AQI_BANDS: Array<{ min: number; max: number; label: string; meaning: string }> = weightsFile.bands;
export const AQI_DISCLAIMER: string = weightsFile.disclaimer;

export type AqiKey = (typeof AQI_DIMENSIONS)[number]['key'];

/** Internal invariant. A rubric whose weights do not sum to the stated maximum is a lie. */
export function assertWeightsSumToMax(): void {
  const sum = AQI_DIMENSIONS.reduce((a, d) => a + d.weight, 0);
  if (sum !== AQI_MAX) {
    throw new Error(`AQI weights sum to ${sum}, expected ${AQI_MAX}. See scripts/check-aqi-weights.mjs`);
  }
}

/** Where a number came from. Same contract as the v1 engine: never guess silently. */
export type EvidenceBasis =
  | 'measured'
  | 'structural'
  | 'heuristic'
  | 'user-supplied'
  | 'unavailable';

export type Confidence = 'low' | 'medium' | 'high';

export interface AqiDimension {
  key: AqiKey;
  label: string;
  weight: number;
  /** Raw sub-score 0–100, before weighting. */
  score: number;
  /** score * weight / 100, rounded. The points this dimension contributed. */
  points: number;
  basis: EvidenceBasis;
  confidence: Confidence;
  evidence: string[];
  assumptions: string[];
  missingData: string[];
  improvement: string;
  failureCondition: string;
  /** True when this dimension alone should block a launch. */
  doNotLaunchYet: boolean;
}

export interface AqiResult {
  version: string;
  max: number;
  total: number;
  band: { label: string; meaning: string };
  dimensions: AqiDimension[];
  /** True if any dimension demanded "do not launch yet". */
  blocked: boolean;
  /** Honest statement of what the number is not. Always present. */
  disclaimer: string;
}

export function bandFor(total: number): { label: string; meaning: string } {
  const band = AQI_BANDS.find((b) => total >= b.min && total <= b.max);
  return band ? { label: band.label, meaning: band.meaning } : { label: 'Unknown', meaning: 'Out of range.' };
}

const clamp = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));

/**
 * Builds a dimension, refusing to accept a score without the six pieces of
 * context the AQI promises: evidence, confidence, assumptions, missing data,
 * improvement, failure condition.
 */
export function dimension(
  key: AqiKey,
  score: number,
  parts: {
    basis: EvidenceBasis;
    confidence: Confidence;
    evidence: string[];
    assumptions?: string[];
    missingData?: string[];
    improvement: string;
    failureCondition: string;
    doNotLaunchYet?: boolean;
  },
): AqiDimension {
  const spec = AQI_DIMENSIONS.find((d) => d.key === key);
  if (!spec) throw new Error(`unknown AQI dimension "${key}"`);
  const s = clamp(score);
  if (!parts.evidence.length) throw new Error(`${key}: a score without evidence is a decoration`);
  if (!parts.improvement) throw new Error(`${key}: every dimension needs one improvement action`);
  if (!parts.failureCondition) throw new Error(`${key}: every dimension needs a failure condition`);
  return {
    key,
    label: spec.label,
    weight: spec.weight,
    score: s,
    points: Math.round((s * spec.weight) / 100),
    basis: parts.basis,
    confidence: parts.confidence,
    evidence: parts.evidence,
    assumptions: parts.assumptions ?? [],
    missingData: parts.missingData ?? [],
    improvement: parts.improvement,
    failureCondition: parts.failureCondition,
    doNotLaunchYet: parts.doNotLaunchYet ?? false,
  };
}

/**
 * Aggregates dimensions into the 0–1000 total.
 *
 * Missing dimensions score `unavailable` at 0 with low confidence rather than
 * being silently dropped — dropping them would inflate the percentage, which is
 * the most common way a rubric becomes dishonest.
 */
export function computeAqi(dimensions: AqiDimension[]): AqiResult {
  assertWeightsSumToMax();
  const seen = new Set(dimensions.map((d) => d.key));
  const missing = AQI_DIMENSIONS.filter((d) => !seen.has(d.key as AqiKey));
  const filled: AqiDimension[] = [
    ...dimensions,
    ...missing.map((m) =>
      dimension(m.key as AqiKey, 0, {
        basis: 'unavailable',
        confidence: 'low',
        evidence: ['not evaluated in this run'],
        missingData: [`${m.label} was not evaluated`],
        improvement: `Evaluate ${m.label}: ${m.question}`,
        failureCondition: 'An unevaluated dimension makes the total an upper bound, not a measurement.',
        doNotLaunchYet: false,
      }),
    ),
  ];

  const total = Math.min(AQI_MAX, filled.reduce((a, d) => a + d.points, 0));
  return {
    version: AQI_VERSION,
    max: AQI_MAX,
    total,
    band: bandFor(total),
    dimensions: AQI_DIMENSIONS.map((spec) => filled.find((d) => d.key === spec.key)!),
    blocked: filled.some((d) => d.doNotLaunchYet),
    disclaimer: AQI_DISCLAIMER,
  };
}

/** The single weakest dimension by normalised performance, ignoring weight. */
export function weakestDimension(result: AqiResult): AqiDimension {
  return [...result.dimensions].sort((a, b) => a.score - b.score)[0];
}

/** Dimensions contributing the most lost points — where the leverage actually is. */
export function topLostPoints(result: AqiResult, n = 3): AqiDimension[] {
  return [...result.dimensions]
    .map((d) => ({ d, lost: Math.round(((100 - d.score) * d.weight) / 100) }))
    .sort((a, b) => b.lost - a.lost)
    .slice(0, n)
    .map((x) => x.d);
}
