/**
 * Agent 1 — Category Cartographer.
 *
 * Answers: what category does this artifact actually compete in, and is there a
 * less crowded category it could credibly claim?
 *
 * Inherited from v1's categories.ts. The addition is the *credibility check*:
 * a proposed category must be one the author can actually defend. An empty
 * category you cannot prove you belong in is worse than a crowded one you own,
 * because the first critical reply exposes the costume.
 */
import { detectCrowdedCategory, adjacentCategories } from '../../core/src/categories.js';
import type { AgentContext, AgentOutcome } from './types.js';

export interface CategoryMap {
  current: {
    label: string;
    slug: string;
    whyCrowded: string;
    basis: 'heuristic';
    signals: string[];
  };
  adjacent: Array<{
    name: string;
    whyLessCrowded: string;
    tensionScore: number;
    credibilityRisk: string;
    /** What would have to be true for this claim to survive contact with a critic. */
    proofNeeded: string;
  }>;
  recommended: string | null;
  recommendationReason: string;
  /** The one-sentence repositioning, or null when there is not enough evidence. */
  repositioning: string | null;
}

const PROOF_FOR: Record<string, string> = {
  'placement-risk management': 'a dated example of a placement deadline you personally navigated or observed',
  default: 'one artifact you can show that the crowded category does not produce: a measurement, a diagram, a before/after',
};

export function categoryCartographer(ctx: AgentContext): AgentOutcome<CategoryMap> {
  const crowded = detectCrowdedCategory(ctx.signals, ctx.text);
  const adjacent = adjacentCategories(crowded.slug);
  const sorted = [...adjacent].sort((a, b) => b.tensionScore - a.tensionScore);
  const chosen = sorted[0];

  const signals: string[] = [];
  const words = ctx.text.toLowerCase();
  const probes: Array<[string, RegExp]> = [
    ['mentions an audience identity', /\b(?:for|built for|made for)\s+\w+/i],
    ['claims a mechanism', /\b(?:because|works by|the reason)\b/i],
    ['names competitors or incumbents', /\b(?:unlike|instead of|compared to|alternative to)\b/i],
    ['states a category explicitly', /\b(?:it'?s not|this isn'?t|we are not)\b/i],
  ];
  for (const [label, re] of probes) if (re.test(words)) signals.push(label);

  const map: CategoryMap = {
    current: {
      label: crowded.label,
      slug: crowded.slug,
      whyCrowded: crowded.whyCrowded,
      basis: 'heuristic',
      signals,
    },
    adjacent: sorted.slice(0, 3).map((a) => ({
      name: a.name,
      whyLessCrowded: a.whyLessCrowded,
      tensionScore: a.tensionScore,
      credibilityRisk: a.credibilityRisk,
      proofNeeded: PROOF_FOR[a.name] ?? PROOF_FOR.default,
    })),
    recommended: crowded.slug === 'unspecified' ? null : (chosen?.name ?? null),
    recommendationReason: chosen
      ? `${chosen.name} has tension score ${chosen.tensionScore}/5 against ${crowded.label}, and it names a job rather than a tool class. A job survives feature changes; a tool class does not.`
      : 'No category could be detected with enough confidence to recommend a move. Say what the thing is before repositioning it.',
    repositioning:
      ctx.description || ctx.signals.wordCount > 40
        ? `It is not ${crowded.label}. It is ${chosen?.name ?? '[the job the reader already budgets for]'}.`
        : null,
  };

  return {
    agent: 'category-cartographer',
    findings: [
      {
        claim: `Structurally, this artifact reads as ${crowded.label}.`,
        evidence: signals.length ? signals.join('; ') : 'no explicit category language found; classified from vocabulary',
        basis: 'heuristic',
        confidence: crowded.slug === 'unspecified' ? 'low' : 'medium',
        action: `Test the claim by deleting every instance of "${crowded.label.split(' ')[0]}" from your copy. If the meaning survives, you never needed the category word.`,
      },
      ...(chosen
        ? [{
            claim: `${chosen.name} is less crowded and still credible for this artifact.`,
            evidence: `adjacency map entry, tension ${chosen.tensionScore}/5; credibility risk: ${chosen.credibilityRisk}`,
            basis: 'heuristic' as const,
            confidence: 'low' as const,
            action: `Put the claim in the first sentence, then immediately show ${absurdProof(chosen.name)}.`,
          }]
        : []),
    ],
    limitations: [
      'The category map is a keyword taxonomy, not a measured market. "Crowded" means "many repos use this vocabulary", not "no room".',
      'No competitor was fetched or reviewed in this run, so no claim is made about any specific product.',
      'Credibility risk is judgement. It is the most likely critique, not a certainty.',
    ],
    output: map,
  };
}

function absurdProof(name: string): string {
  return `the one thing only someone in "${name}" could show you`;
}
