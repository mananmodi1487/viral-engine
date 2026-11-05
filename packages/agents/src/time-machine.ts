/**
 * Time Machine Mode.
 *
 * Simulates how a positioning would have landed in a different era of the
 * internet, and how it might land on a platform that does not exist yet.
 *
 * Every output here is *speculative by construction*. The value is not accuracy —
 * it is that moving the artifact to a different norm exposes which parts of your
 * framing are load-bearing arguments and which are just period-appropriate
 * decoration.
 *
 * The `confidence` field is `speculative` for every era except the one we can
 * actually observe, and there is exactly one of those.
 */
import type { AgentContext, AgentOutcome } from './types.js';

export interface EraReaction {
  era: string;
  platform: string;
  /** What would have worked about this framing then. */
  lands: string[];
  /** What would have failed, and why. */
  fails: string[];
  /** The version of this artifact that would have fit. */
  periodRewrite: string;
  confidence: 'speculative';
  /** What makes this a guess rather than a model. */
  speculationBasis: string;
}

export interface TimeMachineOutput {
  reactions: EraReaction[];
  invariant: string;
  whatThisExerciseReveals: string;
  notice: string;
}

export function timeMachine(ctx: AgentContext): AgentOutcome<TimeMachineOutput> {
  const s = ctx.signals;
  const hasCitation = /\b(?:19|20)\d{2}\b|\bet al\b|\([A-Z][a-z]+,? \d{4}\)/.test(ctx.text);
  const hasDemo = s.codeBlockCount > 0 || /screenshot|demo|video/i.test(ctx.text);
  const hasMetrics = s.quantitativeClaims.length > 0;

  const reactions: EraReaction[] = [
    {
      era: '2012 Hacker News',
      platform: 'HN, ~2012',
      lands: [
        hasCitation ? 'Cites a paper. In 2012 the front page rewarded "here is data" over "here is my framework".' : 'Short, technical, no landing page.',
        hasDemo ? 'Has something you can run. Runnable beat readable.' : 'Written, not marketed.',
      ],
      fails: [
        'Anything with a signup before value. That norm was already dead by 2012.',
        'Category language. "Positioning" was not a word people used about their own repos; you described what it did.',
        hasMetrics ? 'Unsourced metrics would have been taken apart in the comments, politely and thoroughly.' : 'Being vague about the mechanism.',
      ],
      periodRewrite: `Ask HN: ${shorten(ctx.title ?? 'this')} — ${s.installSteps > 0 ? `${s.installSteps}-step setup, MIT licensed` : 'written up, no code yet'}. ${hasCitation ? 'Based on the diffusion literature.' : ''}`.trim(),
      confidence: 'speculative',
      speculationBasis: 'Reconstructed from remembered norms and archived front pages. Not measured against a dataset of 2012 threads.',
    },
    {
      era: '2016 Product Hunt',
      platform: 'Product Hunt, ~2016',
      lands: [
        'A one-line tagline that promises a small, concrete outcome.',
        'A gallery: screenshots mattered more than the description.',
        'A maker comment that tells the story of building it.',
      ],
      fails: [
        'A protocol or a spec. Product Hunt rewarded products with a price and a button.',
        'Honesty about limitations. "This will tell you not to launch" was a bad pitch in 2016.',
        hasCitation ? 'Citations. They read as academic on a page built for browsing.' : 'Long copy of any kind.',
      ],
      periodRewrite: `Tagline: ${shorten(ctx.description ?? ctx.title ?? 'this', 60)}\n\nFirst comment: "Built this after ${s.wordCount > 100 ? 'writing too much and shipping too little' : 'trying it the obvious way first'}. Free, no signup."`,
      confidence: 'speculative',
      speculationBasis: 'Product Hunt norms circa 2016, reconstructed from memory of the period. No dataset was consulted.',
    },
    {
      era: '2020 Twitter threads',
      platform: 'X/Twitter, ~2020',
      lands: [
        'A first line with a specific, uncomfortable observation.',
        'A numbered structure with one idea per post.',
        'A receipt: a real number from the author\'s own work.',
      ],
      fails: [
        'Nuance in the headline. Threads rewarded a claim you could screenshot.',
        'Failure conditions. They read as weakness in a medium built on certainty.',
        'Links in the first post. Reach dropped.',
      ],
      periodRewrite: `1/ ${ctx.signals.hasCategoryPairing ? 'It is not the category you think. It is a different one.' : 'Most people fix the copy. The copy was never the problem.'}\n2/ The data says X.\n3/ So I built this.\n4/ Here is what it told me about my own work: [a real number]\n5/ Link in the last post.`,
      confidence: 'speculative',
      speculationBasis: 'Thread conventions of the period, reconstructed. Engagement mechanics were never publicly documented and changed repeatedly.',
    },
    {
      era: '2026, AI-saturated internet',
      platform: 'The current moment',
      lands: [
        'A mechanism you can inspect. In a feed of generated prose, a runnable check is the scarce thing.',
        hasCitation ? 'A citation, because it is now the cheapest way to prove a human wrote it.' : 'Being short. Length now reads as generation.',
        'A stated limitation. It is the one thing a language model will not volunteer about itself.',
      ],
      fails: [
        'Any listicle shape. It is the shape of the thing people are tired of.',
        'Confident tone without evidence. It now reads as machine-written by default.',
        'A category word with no mechanism behind it. The vocabulary has been inflated past usefulness.',
      ],
      periodRewrite: `# ${ctx.title ?? 'This'} — what it does, what it does not do, and how to check it in one command.\n\nFailure condition: this is useless if ${s.hasFailureCondition ? 'the stated condition happens' : 'you cannot name one thing it replaces'}.`,
      confidence: 'speculative',
      speculationBasis: 'Current norms, observed but not measured. This is the era we are least able to see clearly, which is a reason for caution rather than confidence.',
    },
    {
      era: 'A platform that does not exist yet',
      platform: 'Hypothetical',
      lands: [
        'Whatever can be verified by a third party without trusting the author. That property has survived every platform change so far.',
        'A named human who will vouch for it personally. Also durable.',
      ],
      fails: [
        'Anything that depends on the current ranking mechanics, the current format, or the current vocabulary.',
        'Anything that depends on attention being cheap.',
      ],
      periodRewrite: '(Cannot be written. Any attempt would be a guess about a platform\'s norms, and guessing norms is how people arrive late to every platform.)',
      confidence: 'speculative',
      speculationBasis: 'Extrapolation from two properties that survived 2012–2026. Two data points is not a trend, and this is presented as a hypothesis.',
    },
  ];

  return {
    agent: 'time-machine',
    findings: [
      {
        claim: 'The parts of this framing that survive all five eras are the load-bearing parts.',
        evidence: reactions.map((r) => `${r.era}: ${r.lands.length} land, ${r.fails.length} fail`).join('; '),
        basis: 'heuristic',
        confidence: 'low',
        action: 'Keep only what survives every column. Everything else is period decoration, and period decoration is what dates fastest.',
      },
    ],
    limitations: [
      'Every reaction is speculation, including the 2026 one. Norms are reconstructed from memory, not measured.',
      'This says nothing about whether the artifact would have succeeded. Norms and outcomes are different questions.',
      'Survivorship bias: the eras shown are the ones with visible archives.',
    ],
    output: {
      reactions,
      invariant: hasCitation
        ? 'The citation is the invariant. A claim with a source outlives every platform it is posted to.'
        : 'The invariant is missing: nothing in this artifact would still be true if the platform norms changed, which they will.',
      whatThisExerciseReveals:
        'Move the artifact across eras and the decoration peels off. Whatever is left is the argument. If nothing is left, you have a format, not a claim.',
      notice: 'All eras are speculative and labelled as such. None of these are predictions, and none were validated against archived data.',
    },
  };
}

function shorten(s: string, n = 80): string {
  const clean = s.replace(/\s+/g, ' ').trim();
  return clean.length <= n ? clean : clean.slice(0, n).replace(/\s+\S*$/, '') + '…';
}
