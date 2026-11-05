/**
 * Agent 2 — Saturation Radar.
 *
 * The most dangerous agent in the set, because it is the one users most want to
 * hear a confident number from, and confidence is exactly what it cannot
 * honestly provide offline.
 *
 * Therefore: it measures one real thing when it can (a GitHub search count),
 * labels the band as a band, and returns `unknown` with the reason otherwise.
 * There is no code path that produces a plausible-sounding estimate.
 */
import type { AgentContext, AgentOutcome } from './types.js';
import { bandFromRepoCount } from '../../core/src/categories.js';

export interface RadarResult {
  query: string | null;
  count: number | null;
  band: 'low' | 'moderate' | 'high' | 'saturated' | 'unknown';
  basis: 'measured' | 'unavailable';
  evidence: string;
  /** What a count does and does not mean. */
  interpretation: string;
  missingData: string[];
  /** The honest way to get a better number. */
  howToImprove: string;
}

export async function saturationRadar(
  ctx: AgentContext,
  opts: { count?: number | null; offline?: boolean; reason?: string } = {},
): Promise<AgentOutcome<RadarResult>> {
  const terms = [...ctx.signals.properNouns.slice(0, 2), ...ctx.signals.tribeMarkers.slice(0, 2).map((t) => t.term)];
  const query = (ctx.description ?? ctx.title ?? terms.join(' ')).split(/\s+/).slice(0, 5).join(' ').trim() || null;

  if (typeof opts.count === 'number') {
    const band = bandFromRepoCount(opts.count);
    return {
      agent: 'saturation-radar',
      findings: [{
        claim: `GitHub reports ${opts.count} repositories matching "${query}".`,
        evidence: 'GitHub search API total_count, this run',
        basis: 'measured',
        confidence: 'medium',
        action: 'Treat this as one platform\'s vocabulary density, not a market size.',
      }],
      limitations: RADAR_LIMITS,
      output: {
        query,
        count: opts.count,
        band: band.saturation === 'unknown' ? 'unknown' : (band.saturation as RadarResult['band']),
        basis: 'measured',
        evidence: band.evidence,
        interpretation:
          'This counts repositories whose text matches those words on one platform. It does not count products, budgets, attention, or quality. A low count can mean "unclaimed" or "nobody wants it" — the number cannot tell you which.',
        missingData: ['Product Hunt, npm, PyPI, academic literature, and non-English repositories were not searched.'],
        howToImprove: 'Search two more platforms by hand and write both counts down. Three observations beat one measurement.',
      },
    };
  }

  return {
    agent: 'saturation-radar',
    findings: [{
      claim: 'Saturation is unknown. No count was measured.',
      evidence: opts.reason ?? (opts.offline ? 'offline mode' : 'no count supplied'),
      basis: 'unavailable',
      confidence: 'high',
      action: 'Supply a count with --saturation-count, or run online. Until then, do not let any saturation claim into your copy.',
    }],
    limitations: RADAR_LIMITS,
    output: {
      query,
      count: null,
      band: 'unknown',
      basis: 'unavailable',
      evidence: opts.reason ?? 'no measurement available',
      interpretation:
        'Unknown is the honest answer here, and it is a useful one: it means you have not checked, and a category claim in your copy is currently a guess.',
      missingData: ['All external sources. This run measured nothing outside its own input.'],
      howToImprove: 'Run the same analysis with network access, or paste a repo count from a search you did yourself.',
    },
  };
}

const RADAR_LIMITS = [
  'Counts keyword matches, not competition. A thousand repos that share a word are not a thousand competitors.',
  'One platform only. Absence from GitHub is not absence from the world.',
  'Bands are heuristics chosen for usefulness, not thresholds derived from research.',
];
