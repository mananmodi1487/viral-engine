/**
 * Agents 8 & 9 — Launch Simulator and Critic Simulator.
 *
 * Both are template-driven on purpose. A model asked to "simulate a skeptical
 * Hacker News commenter" produces a plausible-sounding critic, which is worse
 * than useless because it flatters: the simulated critic usually raises exactly
 * the objection the author already had an answer for.
 *
 * These are instead assembled from the artifact's own detected weaknesses. The
 * critic can only say something the engine can point at, which means the output
 * is *at best* incomplete — and that limitation is stated in the result rather
 * than hidden.
 */
import type { AgentContext, AgentOutcome } from './types.js';

export interface CriticVoice {
  persona: string;
  /** What they would say first. */
  firstLine: string;
  /** What they would say if they kept going. */
  deeper: string;
  /** Whether this reaction is fatal, survivable, or actually good news. */
  severity: 'fatal' | 'serious' | 'survivable' | 'useful';
  /** What to change before publishing, if anything. */
  repair: string | null;
  /** What cannot be repaired with words. */
  irreducible: string | null;
}

export interface SimulationOutput {
  critics: CriticVoice[];
  supporterTake: string;
  /** The single most likely misreading. Misreadings are the real cost of a launch. */
  mostLikelyMisreading: string;
  /** Ranked by integrity: which option is safest. */
  rankedIntegrityOptions: string[];
  speculativeDisclaimer: string;
}

export function criticSimulator(ctx: AgentContext): AgentOutcome<SimulationOutput> {
  const s = ctx.signals;
  const hasProof = s.receiptClaims.length > 0 || s.hasFirstPersonReceipt;
  const hasFailure = s.hasFailureCondition;
  const vague = s.identityMarkers.length === 0;
  const blockers = ctx.honesty.findings.filter((f) => f.severity === 'blocker');

  const critics: CriticVoice[] = [
    {
      persona: 'Skeptical hacker',
      firstLine: vague
        ? '"Who is this for? I read the first screen twice and I still do not know if it is for me."'
        : `"Fine, but ${s.properNouns.length < 3 ? 'what does it actually do differently from the obvious alternative' : `how is this different from ${s.properNouns[0]}?`}"`,
      deeper:
        '"The claim is a category, not a mechanism. Show me the code path, the measurement, or the input that produces the output, and I will believe the rest."',
      severity: vague ? 'fatal' : 'serious',
      repair: vague
        ? 'Name one role and one situation in the first sentence. "For X when Y" is enough.'
        : 'Add one sentence naming the mechanism, and one line saying what the obvious alternative does differently.',
      irreducible: null,
    },
    {
      persona: 'Tired founder',
      firstLine: '"Another one of these. I have installed four of them this year and kept none."',
      deeper:
        '"I do not need a better explanation. I need the first 30 seconds to be worth more than the 30 seconds I spent reading about them."',
      severity: 'survivable',
      repair: s.installSteps === 0
        ? 'Put one command on the first screen that produces something visible immediately.'
        : 'Cut the path to first value to one command, and show what it outputs.',
      irreducible: null,
    },
    {
      persona: 'Academic reviewer',
      firstLine: hasProof
        ? '"The framing is interesting. What is the effect size, and against what baseline?"'
        : '"There is no method section. Whatever this measures, it does not measure that."',
      deeper:
        '"You are using a score to stand in for an outcome. Unless you show that the score correlates with the outcome, the score is an assertion in a nice font."',
      severity: hasProof ? 'survivable' : 'serious',
      repair: 'State explicitly that the index is a rubric, not a forecast, and say what evidence would falsify your framing. Put it near the score, not in a footnote.',
      irreducible: 'If you have no outcome data, no wording fixes that. You can only be honest about it — which is what the limitations block is for.',
    },
    {
      persona: 'Community moderator',
      firstLine: '"Is this a contribution or an advertisement? I have to decide in about four seconds."',
      deeper: '"If it is self-promotion, it goes in the self-promotion thread, and if there is no thread, it does not go."',
      severity: 'serious',
      repair: 'Read the pinned rules first. Post in the designated place, with a build-log framing rather than an announcement, and no signup wall.',
      irreducible: 'If the community bans self-promotion, no framing makes it not self-promotion. Respect the ban.',
    },
    ...(blockers.length
      ? [{
          persona: 'Journalist',
          firstLine: `"You claim ${blockers[0].matched.length < 60 ? `"${blockers[0].matched}"` : 'a specific result'}. What is the source?"`,
          deeper: '"I am going to ask for the source before I write anything. If there is no source, the story becomes that there was no source."',
          severity: 'fatal' as const,
          repair: blockers[0].suggestion,
          irreducible: null,
        }]
      : []),
    {
      persona: 'Competitor',
      firstLine: `"This is ${s.wordCount > 900 ? 'a long way of saying' : 'basically'} something that already exists${s.properNouns[0] ? `, and ${s.properNouns[0]} does it better` : ''}."`,
      deeper: '"Their category is the same as mine, which means the comparison works in my favour. I will make it."',
      severity: 'serious',
      repair: 'Name the thing you are not, in the first screen. A competent "not this" claim removes the competitor\'s best move.',
      irreducible: null,
    },
    {
      persona: 'Confused beginner',
      firstLine: '"I think I understand, but I am not sure what I would do with it."',
      deeper: '"I am the person who would share this if I got it, and I did not get it. I am not going to share something I might be describing wrong."',
      severity: vague ? 'fatal' : 'serious',
      repair: 'Add one worked example with a real input and its real output. Examples convert explanation into recognition.',
      irreducible: null,
    },
  ];

  const output: SimulationOutput = {
    critics,
    supporterTake: hasFailure
      ? '"They told me how it could fail before I asked. That is either confidence or honesty, and either way it is unusual."'
      : '"Nice, but I have no idea whether it works. The author sounds certain, which makes me slightly less likely to try it."',
    mostLikelyMisreading: vague
      ? 'A reader who is not the target audience will assume it is for them, try it, and be disappointed — and their disappointment will be the loudest comment.'
      : `Someone will read "${s.properNouns[0] ?? s.hypeTerms[0]?.term ?? 'the category word'}" as the whole product and compare it to the largest incumbent. Expect that comment even if the comparison is wrong.`,
    rankedIntegrityOptions: [
      'Safest: fix the fatal critic responses, then launch to one broadcaster and one channel.',
      'Second: launch with the limitations block prominent, and invite correction in the first line.',
      'Riskiest but still honest: launch as a question ("is this the right framing?") rather than as a claim.',
      'Not supported: launch with urgency scarcity, or with an unbacked number to make the claim land harder.',
    ],
    speculativeDisclaimer:
      'This is a simulation built from detected weaknesses in the text, not a model of any real audience. It is speculation labelled as speculation. Real reactions are usually weirder and less coherent than any of these.',
  };

  return {
    agent: 'critic-simulator',
    findings: critics.filter((c) => c.severity === 'fatal' || c.severity === 'serious').map((c) => ({
      claim: `${c.persona} would push back hard`,
      evidence: c.firstLine,
      basis: 'heuristic' as const,
      confidence: 'low' as const,
      action: c.repair ?? 'Accept this one; no edit fixes it.',
    })),
    limitations: [
      'Simulated critics are assembled from detected text weaknesses. They are not sampled from any real community.',
      'This cannot predict whether a specific person will share something. No simulation can.',
      'The critics are systematically harsher than reality on tone and systematically kinder on timing.',
    ],
    output,
  };
}

/**
 * Antifragile mode: the strongest criticism the engine can construct, then the
 * repair. Separate from `criticSimulator` because the intent is different —
 * this one is adversarial on purpose and is meant to be run before launch.
 */
export function antifragile(ctx: AgentContext): AgentOutcome<{ attacks: Array<{ attack: string; survives: boolean; repair: string }> }> {
  const s = ctx.signals;
  const attacks = [
    {
      attack: `"This could be done with ${Math.max(2, Math.round(s.wordCount / 400))} paragraphs and a checklist. The tool is overhead."`,
      survives: s.wordCount > 800,
      repair: 'Say in one line what the tool does that a checklist cannot: it recomputes when the input changes, and it refuses to flatter.',
    },
    {
      attack: `"The score is arbitrary. Twenty dimensions with weights someone invented is not a measurement."`,
      survives: true,
      repair: 'Agree with it, in the document. Publish the weights, publish the limitations, and call it a rubric.',
    },
    {
      attack: `"The honesty policy is a marketing angle. Every tool says it refuses to lie."`,
      survives: false,
      repair: 'Point at the mechanism rather than the promise: the honesty check runs on the tool\'s own output, and a blocker fails the build. That is a testable claim, and there is a test.',
    },
    {
      attack: `"Nobody asked for a protocol for this."`,
      survives: false,
      repair: 'Do not argue. Ship the schema, and let the first third-party implementation be the argument. A protocol with one implementation is a product.',
    },
    {
      attack: `"${s.tribeMarkers.length ? 'This only works for people who already write about this.' : 'This has no community, so the advice is generic.'}"`,
      survives: s.tribeMarkers.length > 0,
      repair: 'Publish worked examples in three different domains. One domain is an anecdote; three is a method.',
    },
  ];
  return {
    agent: 'antifragile',
    findings: attacks.map((a) => ({
      claim: a.attack,
      evidence: 'generated attack, ranked by whether the current artifact survives it',
      basis: 'heuristic' as const,
      confidence: 'low' as const,
      action: a.repair,
    })),
    limitations: ['Attacks are generated from the artifact\'s own detected structure, so they share its blind spots.'],
    output: { attacks },
  };
}
