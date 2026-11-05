/**
 * Agents 10 & 11 — Postmortem Archaeologist and Evidence Librarian.
 *
 * The Archaeologist turns a failed attempt into a lesson without blame, and
 * without the two failure modes that make most postmortems useless:
 *  - the "we learned a lot" postmortem, which extracts no falsifiable claim
 *  - the "here is my framework" postmortem, which converts one anecdote into a
 *    general law
 *
 * The Librarian stores those lessons with an evidence label so that ten
 * anecdotes never silently become a statistic.
 */
import type { AgentContext, AgentOutcome } from './types.js';

export type EvidenceLabel =
  | 'self-reported'
  | 'verified'
  | 'reproducible'
  | 'anecdotal'
  | 'unclear'
  | 'contested'
  | 'private-redacted';

export interface PostmortemInput {
  whatLaunched: string;
  whatWasExpected: string;
  whatHappened: string;
  /** Numbers the author has. Empty is acceptable and must not be filled in. */
  numbers?: Array<{ label: string; value: string; source?: string }>;
  daysSinceLaunch?: number;
}

export interface PostmortemOutput {
  /** The one falsifiable claim this attempt produced. */
  falsifiableLesson: string;
  /** What was tried, in the order it was tried. */
  whatWasTried: string[];
  /** Which AQI dimension most likely explains the outcome. */
  suspectDimensions: Array<{ key: string; reason: string; confidence: 'low' | 'medium' }>;
  /** The failure mode this attempt most resembles. */
  resembles: Array<{ pattern: string; why: string; source: string }>;
  /** What this attempt CANNOT tell us. The most important section. */
  cannotConclude: string[];
  /** Blameless, specific, and checkable. */
  nextAttemptChange: string;
  evidenceLabel: EvidenceLabel;
  evidenceLabelReason: string;
}

const FAILURE_PATTERNS: Array<{ pattern: string; why: string; source: string; test: RegExp }> = [
  {
    pattern: 'No broadcaster existed',
    why: 'The work was posted to an audience in general rather than sent to one person with a reason to carry it. Popularity tracks the largest single broadcast (Goel et al.), and there was none.',
    source: 'Goel, Watts & Goldstein (2012, 2016)',
    test: /\b(?:posted|tweeted|shared)\b.*\b(?:on (?:twitter|x|linkedin|reddit|hn|hacker news))\b/i,
  },
  {
    pattern: 'Category not named',
    why: 'Readers had to invent a category for the artifact, and the one they invented was the crowded one. "Just another X" is the symptom.',
    source: 'Category design; see research/category-design.md',
    test: /\b(?:nobody|no one|people)\b[^.]{0,40}\b(?:understood|got it|knew what)\b/i,
  },
  {
    pattern: 'Forward had no words',
    why: 'The artifact was linkable but not describable, so forwarding required the forwarder to write the sentence — which is unpaid labour with social risk.',
    source: 'Share friction analysis; see research/share-friction.md',
    test: /\b(?:shared|reposted|retweeted)\b[^.]{0,30}\b(?:zero|none|nobody)\b/i,
  },
  {
    pattern: 'Engagement without adoption',
    why: 'Likes and replies measure the frame; returns measure the product. Optimising the first can hide a broken second.',
    source: 'Attempt Quality Index, dimension: post_launch_learnability',
    test: /\b(?:likes|upvotes|replies|views)\b[^.]{0,40}\b(?:but|however|yet)\b/i,
  },
  {
    pattern: 'Wrong room',
    why: 'The artifact was correct and the audience was wrong. This looks identical to "bad product" for about three weeks.',
    source: 'Community fit; see research/diffusion-patterns.md',
    test: /\b(?:wrong (?:audience|community|subreddit|forum)|not (?:my|the) (?:audience|people))\b/i,
  },
  {
    pattern: 'Launched into a saturated moment',
    why: 'A large event in the same category absorbed the attention budget for the week.',
    source: 'Saturation radar (limited: cannot detect events)',
    test: /\b(?:same day|same week|overshadowed|drowned out)\b/i,
  },
];

export function postmortemArchaeologist(input: PostmortemInput): AgentOutcome<PostmortemOutput> {
  const narrative = `${input.whatLaunched} ${input.whatWasExpected} ${input.whatHappened}`;
  const matched = FAILURE_PATTERNS.filter((p) => p.test.test(narrative));

  const hasNumbers = (input.numbers?.length ?? 0) > 0;
  const label: EvidenceLabel = hasNumbers
    ? input.numbers!.every((n) => n.source)
      ? 'verified'
      : 'self-reported'
    : 'anecdotal';

  const suspectDimensions = matched.length
    ? matched.map((m) => ({
        key: dimensionFor(m.pattern),
        reason: m.why,
        confidence: 'medium' as const,
      }))
    : [
        { key: 'broadcaster_fit', reason: 'The most common cause, and the hardest to rule out without evidence.', confidence: 'low' as const },
        { key: 'category_clarity', reason: 'Second most common, and detectable by asking five people what it is.', confidence: 'low' as const },
      ];

  return {
    agent: 'postmortem-archaeologist',
    findings: [
      {
        claim: `This attempt most resembles: ${matched.map((m) => m.pattern).join(', ') || 'no recognisable pattern'}.`,
        evidence: 'narrative pattern matching against six known failure modes',
        basis: 'heuristic',
        confidence: 'low',
        action: 'Pick the one pattern you can actually test next time, and design that test before the next attempt.',
      },
      {
        claim: `Evidence label assigned: ${label}.`,
        evidence: hasNumbers ? `${input.numbers!.length} number(s) supplied, ${input.numbers!.filter((n) => n.source).length} with a source` : 'no numbers supplied',
        basis: 'structural',
        confidence: 'high',
        action: label === 'anecdotal' ? 'Add one number with a source, or accept that this is a story and label it as one.' : 'Keep the sources attached when you publish.',
      },
    ],
    limitations: [
      'A postmortem is a reconstruction, not a record. Memory edits toward a coherent story.',
      'No counterfactual exists: we cannot know whether the other choice would have worked.',
      'One attempt cannot distinguish a bad plan from bad luck.',
    ],
    output: {
      falsifiableLesson: `Next attempt: if ${nextTest(input)} then the plan was the problem; if it holds, the plan was fine and the reach was not.`,
      whatWasTried: summariseAttempts(input),
      suspectDimensions,
      resembles: matched.map((m) => ({ pattern: m.pattern, why: m.why, source: m.source })),
      cannotConclude: [
        'That the artifact is bad. Reach and quality are different questions, and failed reach answers only the second one negatively.',
        'That the category was wrong. Without a second attempt in a different category, this is a guess.',
        'That the timing was wrong. There is no counterfactual launch.',
        'That the audience does not want it. Absence of response from people who never saw it is not a signal.',
        'Anything about the population. n = 1.',
      ],
      nextAttemptChange: matched.length
        ? `Change exactly one thing: ${changeFor(matched[0].pattern)}. Changing two makes the next result uninterpretable.`
        : 'Change exactly one thing, and write down which before you launch. If you cannot name it, do not launch again yet.',
      evidenceLabel: label,
      evidenceLabelReason: hasNumbers
        ? input.numbers!.every((n) => n.source)
          ? 'All supplied numbers carry a source.'
          : 'Numbers were supplied but not all are sourced; treated as self-reported until verified.'
        : 'No numbers were supplied, so this is a narrative account of one attempt.',
    },
  };
}

function dimensionFor(pattern: string): string {
  const map: Record<string, string> = {
    'No broadcaster existed': 'broadcaster_fit',
    'Category not named': 'category_clarity',
    'Forward had no words': 'share_friction_reduction',
    'Engagement without adoption': 'post_launch_learnability',
    'Wrong room': 'audience_specificity',
    'Launched into a saturated moment': 'category_opportunity',
  };
  return map[pattern] ?? 'ethical_defensibility';
}

function changeFor(pattern: string): string {
  const map: Record<string, string> = {
    'No broadcaster existed': 'send it to one named person before any public post',
    'Category not named': 'rewrite the first sentence as "not X, but Y, for Z"',
    'Forward had no words': 'add a 40-word block that is complete on its own',
    'Engagement without adoption': 'measure returns instead of reactions for one week',
    'Wrong room': 'post in one different community, with the same copy',
    'Launched into a saturated moment': 'wait two weeks and repost with the same copy',
  };
  return map[pattern] ?? 'state the failure condition before launch';
}

function summariseAttempts(input: PostmortemInput): string[] {
  const list = [input.whatLaunched];
  if (input.daysSinceLaunch) list.push(`${input.daysSinceLaunch} day(s) of observation`);
  if (input.numbers?.length) list.push(...input.numbers.map((n) => `${n.label}: ${n.value}${n.source ? ` (${n.source})` : ' (unsourced)'}`));
  return list;
}

function nextTest(input: PostmortemInput): string {
  return `five people in the target role can repeat what ${input.whatLaunched.slice(0, 60)} is and who it is for`;
}

/* ---------------- 11. Evidence Librarian ---------------- */

export interface EvidenceRecord {
  id: string;
  kind: 'win' | 'failure' | 'postmortem' | 'benchmark' | 'case-study' | 'failed-launch' | 'pattern' | 'incident';
  title: string;
  claim: string;
  label: EvidenceLabel;
  labelReason: string;
  artifactType: string;
  date: string;
  /** What this record can be used to argue. */
  supports: string[];
  /** What it must NOT be used to argue. Prevents anecdote-to-statistic drift. */
  doesNotSupport: string[];
  /** Present only when the author consented to being named. */
  author?: string;
  redactions: string[];
}

export function evidenceLibrarian(
  record: Omit<EvidenceRecord, 'label' | 'labelReason' | 'doesNotSupport' | 'redactions'> & {
    hasSources: boolean;
    isReproducible?: boolean;
    redact?: string[];
  },
): AgentOutcome<EvidenceRecord> {
  const label: EvidenceLabel = record.isReproducible
    ? 'reproducible'
    : record.hasSources
      ? 'verified'
      : 'self-reported';

  const labelReason =
    label === 'reproducible'
      ? 'The method and inputs are published, so anyone can rerun it.'
      : label === 'verified'
        ? 'Every number carries a source a reader can check.'
        : 'The author reports this; nothing here has been independently checked.';

  return {
    agent: 'evidence-librarian',
    findings: [
      {
        claim: `Record labelled "${label}".`,
        evidence: labelReason,
        basis: 'structural',
        confidence: 'high',
        action: 'Publish the label with the number, in the same sentence. A number separated from its label becomes a fact.',
      },
    ],
    limitations: [
      'The librarian labels records; it does not verify them. Verification requires a second party.',
      'Labels are self-declared at submission time and reviewed by a human. There is no automated truth oracle.',
    ],
    output: {
      ...record,
      label,
      labelReason,
      doesNotSupport: [
        'Any claim about the population. One case is one case.',
        'Any causal claim. Nothing here was randomised.',
        'Any aggregate statistic. Summing self-reported numbers produces a fabricated number.',
        'Any generalisation across platforms, languages, or cultures.',
      ],
      redactions: record.redact ?? [],
    },
  };
}

export function evidenceContextSummary(ctx: AgentContext): string {
  return `Artifact: ${ctx.title ?? 'untitled'} (${ctx.signals.wordCount} words, ${ctx.signals.installSteps} setup step(s)).`;
}
