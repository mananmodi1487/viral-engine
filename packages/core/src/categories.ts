/**
 * Category detection and saturation estimation.
 *
 * Saturation comes in two flavours and they must never be confused:
 *  - 'measured': we counted something real (GitHub search total_count).
 *  - 'unknown': we could not reach the network or the query was too vague.
 *
 * There is no third option where we guess a number and present it as measured.
 */
import type { CategoryDiagnosis, EvidenceBasis } from './schemas.js';
import type { Signals } from './signals.js';

/**
 * Crowded categories, keyed by the words that usually signal them.
 * This is a heuristic map built from observation, not a measured taxonomy —
 * hence every use of it is labelled basis: 'heuristic'.
 */
export const CROWDED_CATEGORIES: Array<{
  slug: string;
  matches: RegExp;
  label: string;
  whyCrowded: string;
}> = [
  {
    slug: 'productivity',
    matches: /\b(?:productivity|habit|to-?do|task manage|note-?taking|focus timer|pomodoro)\b/i,
    label: 'productivity / habit tooling',
    whyCrowded: 'tens of thousands of competitors and no shared enemy',
  },
  {
    slug: 'ai-wrapper',
    matches: /\b(?:ai|gpt|llm|prompt|copilot|agent)\b/i,
    label: 'AI tooling',
    whyCrowded: 'a new entrant ships weekly; "AI-powered" no longer distinguishes anything',
  },
  {
    slug: 'newsletter',
    matches: /\b(?:newsletter|substack|email course|weekly digest)\b/i,
    label: 'newsletter',
    whyCrowded: 'low marginal cost to start, so supply massively exceeds attention',
  },
  {
    slug: 'growth-tool',
    matches: /\b(?:growth|viral|marketing|seo|content strategy|audience building)\b/i,
    label: 'growth / marketing tooling',
    whyCrowded: 'the category has a credibility problem before you even arrive',
  },
  {
    slug: 'dev-tool',
    matches: /\b(?:cli|sdk|framework|library|typescript|python package|boilerplate)\b/i,
    label: 'developer tooling',
    whyCrowded: 'high substitutability; developers switch only for a sharp, specific gain',
  },
  {
    slug: 'course',
    matches: /\b(?:course|bootcamp|masterclass|curriculum|tutorial series)\b/i,
    label: 'course / education',
    whyCrowded: 'trust is the bottleneck, and the category is full of overclaiming',
  },
];

export interface SaturationResult {
  saturation: CategoryDiagnosis['saturation'];
  basis: EvidenceBasis;
  evidence: string;
}

/**
 * Interprets a GitHub search total_count as a saturation band.
 *
 * These thresholds are heuristics chosen so that "thousands" reads as saturated
 * and "a few dozen" reads as uncrowded. They are not derived from a paper and
 * are labelled as heuristic wherever they influence a score.
 */
export function bandFromRepoCount(count: number): SaturationResult {
  const band: CategoryDiagnosis['saturation'] =
    count > 5000 ? 'saturated' : count > 800 ? 'high' : count > 150 ? 'moderate' : 'low';
  return {
    saturation: band,
    basis: 'measured',
    evidence: `GitHub search returned ${count.toLocaleString()} repositories for the topic query`,
  };
}

export function unknownSaturation(reason: string): SaturationResult {
  return {
    saturation: 'unknown',
    basis: 'unavailable',
    evidence: `${reason}. No network estimate was made — check the category manually with a GitHub topic search.`,
  };
}

export function detectCrowdedCategory(signals: Signals, text: string): { slug: string; label: string; whyCrowded: string } {
  const hay = `${text}`.toLowerCase();
  let best = { slug: 'unspecified', label: 'an unnamed category', whyCrowded: 'the document does not name a category, which is itself the problem' };
  let bestScore = 0;
  for (const c of CROWDED_CATEGORIES) {
    const m = hay.match(new RegExp(c.matches.source, 'gi'));
    const score = (m?.length ?? 0) + (signals.properNouns.includes(c.slug) ? 1 : 0);
    if (score > bestScore) {
      bestScore = score;
      best = { slug: c.slug, label: c.label, whyCrowded: c.whyCrowded };
    }
  }
  return best;
}

/**
 * Adjacent-category candidates. Written as reasoning prompts per crowded
 * category rather than invented specifics, because the honest answer depends on
 * details the tool does not have.
 */
const ADJACENT: Record<string, Array<{ name: string; whyLessCrowded: string; tension: number; risk: string }>> = {
  productivity: [
    {
      name: 'risk reduction for a specific deadline',
      whyLessCrowded: 'nobody owns "the thing that stops you missing a deadline"',
      tension: 4,
      risk: 'requires evidence that the tool actually changes an outcome, not just a streak',
    },
    {
      name: 'reputation management for one role',
      whyLessCrowded: 'category is usually sold to executives, not to the role that needs it',
      tension: 4,
      risk: 'you must be able to name the reputational stake without sounding like a guru',
    },
    {
      name: 'compliance or audit preparation',
      whyLessCrowded: 'boring, budgeted, and almost no consumer-grade entrants',
      tension: 3,
      risk: 'the claim gets checked by people whose job is checking claims',
    },
  ],
  'ai-wrapper': [
    {
      name: 'a diagnostic, not a generator',
      whyLessCrowded: 'the market is saturated with creation tools and starved of judgement tools',
      tension: 4,
      risk: 'diagnostics must be right; a wrong diagnosis is worse than no advice',
    },
    {
      name: 'workflow change literacy for one profession',
      whyLessCrowded: 'almost all content is generic "AI will/won\'t take jobs" commentary',
      tension: 5,
      risk: 'you need one first-hand observation or it reads as commentary',
    },
  ],
  'growth-tool': [
    {
      name: 'spread diagnostics for people who already published',
      whyLessCrowded: 'the category sells creation; almost nobody sells post-mortem',
      tension: 4,
      risk: 'diagnostics cannot promise outcomes, which is unfamiliar to this audience',
    },
    {
      name: 'category-selection advice',
      whyLessCrowded: 'positions above the tooling layer, where trust is higher',
      tension: 3,
      risk: 'sounds like consulting, so it must ship an artifact, not just advice',
    },
  ],
  newsletter: [
    {
      name: 'a reference page that ranks on its own',
      whyLessCrowded: 'search intent is far less contested than inbox attention',
      tension: 2,
      risk: 'slow compounder; it will not produce a launch-day spike',
    },
    {
      name: 'a named framework people cite',
      whyLessCrowded: 'named concepts outlive posts and are rarely claimed in this niche',
      tension: 3,
      risk: 'the name has to be sayable out loud or it will not be repeated',
    },
  ],
  'dev-tool': [
    {
      name: 'one job done extremely well',
      whyLessCrowded: 'most dev tools sell breadth, which is a hard claim to verify',
      tension: 3,
      risk: 'narrow tools must be obviously narrow, or they read as incomplete',
    },
    {
      name: 'the reference implementation for a contested practice',
      whyLessCrowded: 'nobody else is claiming the standard',
      tension: 4,
      risk: 'you will be argued with in public, so the method must be defensible',
    },
  ],
  course: [
    {
      name: 'a free diagnostic that earns the right to teach',
      whyLessCrowded: 'the category is overclaiming, so demonstrated competence is scarce',
      tension: 4,
      risk: 'the free tool must be genuinely useful alone, or it reads as a lead magnet',
    },
  ],
  unspecified: [
    {
      name: 'the job the reader is already budgeting for',
      whyLessCrowded: 'unnamed categories are uncontested by definition',
      tension: 3,
      risk: 'you must name it in one sentence or the reader will file you under something else',
    },
  ],
};

export function adjacentCategories(slug: string): CategoryDiagnosis['adjacentCategories'] {
  const list = ADJACENT[slug] ?? ADJACENT.unspecified;
  return list.map((a) => ({
    name: a.name,
    whyLessCrowded: a.whyLessCrowded,
    tensionScore: a.tension,
    credibilityRisk: a.risk,
  }));
}

/**
 * Builds the positioning proposal. Deliberately phrased as a template with the
 * real subject matter filled in, rather than a confident invented sentence —
 * the tool cannot know the user's actual category better than they can.
 */
export function proposePositioning(
  current: string,
  adjacentName: string,
  audience: string,
): string {
  return `It's not ${current}. It's ${adjacentName} — for ${audience}.`;
}

/** Extracts the most likely audience phrase from identity markers, or a placeholder. */
export function inferAudience(signals: Signals): string {
  const named = signals.identityMarkers.slice(0, 2).map((t) => t.term);
  if (named.length > 0) {
    // Identity markers may already end in "who" ("professionals who"), so avoid
    // producing "professionals who who are looking for...".
    const phrase = named.join(' / ').replace(/\s+who$/, '');
    return `${phrase} who are already looking for something like this`;
  }
  return '[name the specific person, e.g. "second-year CS students in placement season"]';
}
