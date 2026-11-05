/**
 * The 100k-star stress test.
 *
 * This module exists because the brief asked for one and because the honest
 * version of it is genuinely useful: a model of *mechanism*, not of outcome.
 *
 * What it deliberately does not do:
 *
 *  - It does not predict stars. There is no model of attention here, no training
 *    data, and no fitted curve. Any number it produced about reach would be
 *    invented, which is the one thing this repository forbids.
 *  - It does not know your launch. It reads the system it is part of and reasons
 *    about what usually happens to infrastructure-shaped tools with a protocol
 *    surface, a local-first default, and a refusal in them.
 *
 * What it does do: names the mechanisms that have historically carried tools like
 * this, the mechanisms that have killed them, the indicators that would tell you
 * which is happening, and the kill criteria for the *promotion* — not the project.
 *
 * Everything in here is labelled `speculative`. That label is not decoration: a
 * reader must be able to tell this apart from the measured parts of the product.
 */

export type SpeculationBasis =
  | 'structural' // follows from how the software is built
  | 'analogy' // follows from what happened to comparable things
  | 'mechanism'; // follows from a named mechanism in the diffusion literature

export interface Hypothesis {
  id: string;
  claim: string;
  basis: SpeculationBasis;
  /** The specific thing this reasoning rests on. Not "studies show". */
  grounds: string;
  /** How you would notice it is happening, early. */
  leadingIndicators: string[];
  /** How you would notice it is not. */
  counterIndicators: string[];
  confidence: 'low' | 'very low';
}

export interface FailureMode {
  id: string;
  mode: string;
  /** What it looks like from outside. */
  looksLike: string;
  /** The earliest signal, before the outcome is obvious. */
  earlySignal: string;
  /** What to do about it, if it appears. */
  response: string;
}

export interface IndicatorGroup {
  window: 'first 48 hours' | 'first 2 weeks' | 'first 90 days';
  indicators: Array<{ name: string; why: string; misleadingIf: string }>;
}

export interface KillCriterion {
  statement: string;
  observable: string;
  horizon: string;
  /** What "killing" means here: killing the promotion, not the project. */
  scope: string;
}

export interface StressTest {
  /** The claim this whole document refuses to make, stated first. */
  disclaimer: string;
  whatThisIs: string;
  adoptionHypotheses: Hypothesis[];
  failureModes: FailureMode[];
  indicators: IndicatorGroup[];
  killCriteria: KillCriterion[];
  /** The honest memo. Two paragraphs, no numbers, no promises. */
  memo: { ifItWorks: string; ifItFails: string };
  whatWouldMakeItInfrastructure: string[];
  whatWouldMakePeopleDistrustIt: string[];
}

export function stressTest(): StressTest {
  return {
    disclaimer:
      'This is a stress test, not a forecast. Nothing here predicts stars, downloads, or attention. ' +
      'It contains no fitted model and no market data. Every claim below is labelled speculative, and ' +
      'the repository will not quote a number about adoption as though it were a result.',

    whatThisIs:
      'A structured exercise in asking "if this were adopted widely, what would probably be carrying it, ' +
      'and if it failed, what would probably have killed it?" Its only use is to decide what to measure ' +
      'early and when to stop promoting.',

    adoptionHypotheses: [
      {
        id: 'H1',
        claim: 'The refusal is the shareable part, not the score.',
        basis: 'mechanism',
        grounds:
          'A tool that tells you not to launch is a position, and positions are more useful to a sharer ' +
          'than credentials because they can be cited in an argument. A number is only useful to the person ' +
          'who owns it.',
        leadingIndicators: [
          'Forwards quote the "do not launch yet" reason rather than the total.',
          'People post their *low* scores, which nobody does with a grade they are ashamed of.',
          'Replies argue with a specific dimension rather than with the tool.',
        ],
        counterIndicators: [
          'People post only high scores, which turns the badge into a credential and destroys the mechanism.',
          'The refusal is softened in a later release to reduce friction. This is the failure, arriving as a feature.',
        ],
        confidence: 'low',
      },
      {
        id: 'H2',
        claim: 'The schema spreads further than the CLI.',
        basis: 'analogy',
        grounds:
          'Tooling gets forked; formats get implemented. If a second team writes a validator, the protocol ' +
          'outlives any single implementation — and that has been true of formats with far less care taken.',
        leadingIndicators: [
          'An implementation exists that the author did not write.',
          'Someone files a bug about the specification rather than about the tool.',
          'A document in the wild has an `x_` extension field nobody here defined.',
        ],
        counterIndicators: [
          'Everyone imports the package instead of reading the schema. Then it is a library with extra steps.',
          'The Go and Rust bindings stay unrun long enough that the "four implementations" claim is quietly dropped.',
        ],
        confidence: 'low',
      },
      {
        id: 'H3',
        claim: 'Local-first is a requirement for a specific, motivated minority, and a non-factor for everyone else.',
        basis: 'structural',
        grounds:
          'This tool reads unpublished work. For a person under an NDA, in a regulated industry, or simply ' +
          'careful, sending a draft to a server is disqualifying, and no amount of convenience fixes it.',
        leadingIndicators: [
          'Issues asking for offline or local-model support that are opened by people with company accounts.',
          'Forks that hard-remove the network path entirely.',
        ],
        counterIndicators: [
          'Local mode is slower or worse, and people drift to the hosted path once it exists.',
          'Nobody notices that `--offline` is the default. A property nobody values does not carry adoption.',
        ],
        confidence: 'low',
      },
      {
        id: 'H4',
        claim: 'The academy, not the CLI, is what reaches non-developers.',
        basis: 'mechanism',
        grounds:
          'A command line excludes most of the population. A fifteen-module method with checkers that run ' +
          'against your own document is usable by a teacher, a nonprofit, or a student who will never run npm.',
        leadingIndicators: [
          'Academy pages are linked to from course syllabi or reading lists.',
          'Translations appear before plugin contributions do.',
        ],
        counterIndicators: [
          'The academy is only read by developers who already use the CLI, which means it is documentation, not education.',
          'Module completion is self-reported and unverifiable, so any completion number is a claim about clicks rather than about learning.',
        ],
        confidence: 'very low',
      },
      {
        id: 'H5',
        claim: 'The evidence commons will stay small, and that will limit how seriously the numbers are taken.',
        basis: 'structural',
        grounds:
          'Failures are submitted at a fraction of the rate of wins, and this repository cannot fix that ' +
          'incentive. A published benchmark with 32 self-written cases is not evidence of usefulness, and a ' +
          'reader who understands statistics will say so.',
        leadingIndicators: [
          'External submissions arrive as wins far more often than failures.',
          'The known-miss list shrinks because cases are deleted rather than because they are fixed.',
        ],
        counterIndicators: [
          'Someone submits a failure that contradicts a documented decision. That is the good outcome.',
          'Every submission is a win with a screenshot and no baseline, which would make the commons a testimonials page and worth less than nothing.',
        ],
        confidence: 'low',
      },
    ],

    failureModes: [
      {
        id: 'F1',
        mode: 'Hype capture',
        looksLike: 'The README gains a big number, the bands get friendlier, and "do not launch yet" becomes rare.',
        earlySignal: 'A pull request that changes a weight without a changelog entry.',
        response:
          'Reject it under governance §4. A rubric change is a protocol version change, which is expensive on purpose.',
      },
      {
        id: 'F2',
        mode: 'Fork death',
        looksLike: 'Three forks with three rubrics, all calling themselves AQI, none comparable.',
        earlySignal: 'A fork ships a different weights file under the same `aqi_version`.',
        response:
          'Publish the comparator. `viral-engine compare a.json b.json` already refuses to compare across rubric versions, which is the only defence available to a protocol with no trademark enforcement.',
      },
      {
        id: 'F3',
        mode: 'Utility drift',
        looksLike: 'The tool becomes a launch-copy generator with a score attached, because that is what people asked for.',
        earlySignal: 'Most usage is the `assets` command and almost none is `honesty-audit`.',
        response:
          'Keep the refusal in the asset path. If generation ever becomes cheaper than diagnosis, the product has flipped into the thing it criticises.',
      },
      {
        id: 'F4',
        mode: 'Benchmark theatre',
        looksLike: 'A precision of 0.99 quoted in a footer with no mention that one author wrote both sides.',
        earlySignal: 'The limitations section gets shorter between releases.',
        response:
          'The limitations are generated by the harness, not written by hand, and a test fails if the list drops below five entries.',
      },
      {
        id: 'F5',
        mode: 'Abandonment without a sunset',
        looksLike: 'Install instructions that no longer work, on a domain that renews for one more year.',
        earlySignal: 'The CI badge goes stale.',
        response:
          'The sunset plan is written and the final release is designed to be installable offline. Do it before it is needed, because the person who needs it will be someone else.',
      },
      {
        id: 'F6',
        mode: 'Capture by a funder',
        looksLike: 'A sponsorship with a "strategic alignment" clause.',
        earlySignal: 'A funding disclosure row with a non-empty "conditions" cell.',
        response: 'Publish the conditions column. The table exists so this is visible before it is expensive.',
      },
    ],

    indicators: [
      {
        window: 'first 48 hours',
        indicators: [
          {
            name: 'Forwards by people the author did not ask',
            why: 'The only indicator that is not a function of promotion.',
            misleadingIf: 'They are all from one friend group, in which case it is a warm intro, not a signal.',
          },
          {
            name: 'First-run command failures reported',
            why: 'A broken first command is the single most common cause of a quiet launch.',
            misleadingIf: 'Nobody reports it because nobody got that far.',
          },
          {
            name: 'Score quoted correctly, with its disclaimer',
            why: 'Tells you whether the framing survived contact with a stranger.',
            misleadingIf: 'It is quoted correctly but by people who already agreed with the thesis.',
          },
        ],
      },
      {
        window: 'first 2 weeks',
        indicators: [
          {
            name: 'Issues opened by people other than the author',
            why: 'The cheapest signal that someone used it on their own artifact.',
            misleadingIf: 'They are all one-line typo reports from a single contributor.',
          },
          {
            name: 'Documents in the wild with an `x_` field',
            why: 'Evidence the schema is being extended rather than merely consumed.',
            misleadingIf: 'The extension is a timestamp added by a single wrapper.',
          },
          {
            name: 'Someone disagrees with a documented decision, in public',
            why: 'The healthiest possible signal, and the one that leads to a better protocol.',
            misleadingIf: 'The disagreement is about tone rather than substance.',
          },
        ],
      },
      {
        window: 'first 90 days',
        indicators: [
          {
            name: 'An independent implementation',
            why: 'The only proof that the protocol is a protocol.',
            misleadingIf: 'It is a thin wrapper around this package, which proves nothing.',
          },
          {
            name: 'A second maintainer with merge rights',
            why: 'The only indicator that the project outlives its author.',
            misleadingIf: 'They have not merged anything.',
          },
          {
            name: 'A failure record submitted by someone else',
            why: 'Harder to get than a win, and worth more.',
            misleadingIf: 'It is a disguised promotion for the thing that "failed".',
          },
        ],
      },
    ],

    killCriteria: [
      {
        statement: 'Stop promoting this if nobody forwards it without being asked.',
        observable:
          'In 14 days, fewer than 5 forwards originate from people with no prior relationship to the author.',
        horizon: '14 days after the launch',
        scope:
          'Kills the *promotion*, not the project. The response is to rewrite the description and re-run the five-reader protocol, not to stop building.',
      },
      {
        statement: 'Stop using the benchmark as evidence if the dataset has not grown from outside.',
        observable: 'Zero external cases merged 60 days after publication.',
        horizon: '60 days',
        scope:
          'Kills the claim, not the number. Precision from a self-written dataset stays published but stops being cited.',
      },
      {
        statement: 'Treat the governance as failed if the council stays vacant past twelve months.',
        observable: 'Fewer than three seats filled, one year after the charter is published.',
        horizon: '12 months',
        scope:
          'Kills the claim to have governance. The commitments in LICENSE and the git history survive; the council charter becomes a historical document.',
      },
    ],

    memo: {
      ifItWorks:
        'The most likely cause would not be the software. It would be that a specific person with a ' +
        'specific audience found the refusal useful enough to quote, and that the quote carried the ' +
        'framing with it — "this scores the quality of the attempt and will tell you not to launch" — ' +
        'because that sentence is portable and a score is not. The second cause would be the schema: ' +
        'if anyone implements ODS independently, the format outlives the tool, and formats spread through ' +
        'people who never install anything. Everything else — the 25 dimensions, the agents, the academy — ' +
        'would be the substance that made the quote worth repeating, not the reason it repeated.',
      ifItFails:
        'The most likely cause would be that it is a diagnostic in a market that pays for prescriptions. ' +
        'People ask what to do; this answers what is wrong and occasionally says "not yet", which is correct ' +
        'and unwelcome. The second cause would be that the first command did not work on a clean machine for ' +
        'someone who then told nine people. The third would be that the honest framing — a rubric, not a ' +
        'prediction — is a worse pitch than the dishonesty it replaces, and the market punished it for that. ' +
        'None of those would mean the work was wrong. They would mean attention went elsewhere, which is the ' +
        'default outcome and not a finding.',
    },

    whatWouldMakeItInfrastructure: [
      'A document format that other tools emit without asking permission.',
      'A refusal that people cite as a reason to trust the output.',
      'An install path that still works in three years without the author.',
      'A second maintainer, and then a third.',
      'Being boring: nobody writes a post about their CI linter either, and it is in every repository.',
    ],

    whatWouldMakePeopleDistrustIt: [
      'A number quoted without its rubric version.',
      'A "supported" label on a binding nobody ever ran.',
      'A benchmark with no failures in it.',
      'A paywall appearing in a project that said free forever.',
      'An ethics council that exists in the README and has no members.',
      'Rewording a document until its own audit passes.',
    ],
  };
}
