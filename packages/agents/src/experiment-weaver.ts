/**
 * Agent 7 — Experiment Weaver.
 *
 * Designs tests that could actually change the plan. The enemy here is the
 * self-deceiving experiment: one where the author already knows the result they
 * will report, or where the success criterion is written after the data arrives.
 *
 * Every test this agent emits must have: a cost in minutes, a success criterion,
 * a kill criterion, and the decision it changes. If it does not change a decision,
 * it is not an experiment, it is a ritual.
 */
import type { AgentContext, AgentOutcome } from './types.js';

export interface Test {
  name: string;
  hypothesis: string;
  method: string;
  cost: string;
  successCriterion: string;
  killCriterion: string;
  /** The decision this test exists to change. Empty is not allowed. */
  decisionItChanges: string;
}

export interface ExperimentPlan {
  tests: Test[];
  successCriteria: string[];
  killCriteria: Array<{ statement: string; observable: string; horizon: string }>;
  measurementPlan: string[];
  preRegistered: boolean;
  /** What will still be unknowable after these tests. */
  unknowable: string[];
}

export function experimentWeaver(ctx: AgentContext): AgentOutcome<ExperimentPlan> {
  const s = ctx.signals;
  const audience = ctx.declared?.audience ?? 'the person this is for';

  const tests: Test[] = [
    {
      name: 'Five-person read-back',
      hypothesis: `A ${audience} can repeat what this is, and who it is not for, after reading the first screen once.`,
      method: `Show only the first screen to five people in the target role. Ask: "What is this, and who is it for?" Do not explain anything while they read. Write down their words verbatim.`,
      cost: '45 minutes',
      successCriterion: 'At least 4 of 5 say the same thing back, and it is roughly what you intended.',
      killCriterion: 'Two or more describe it as "a tool for X" where X is not your category. The category is not landing.',
      decisionItChanges: 'Whether the headline ships or is rewritten before any distribution.',
    },
    {
      name: 'Forward test',
      hypothesis: 'Someone can pass this on without writing an explanation of their own.',
      method: `Send the artifact to one person who is not a close friend, with the message: "If you had to describe this to a colleague in one line, what would you say?" Compare their sentence to your paste-ready line.`,
      cost: '10 minutes',
      successCriterion: 'Their sentence contains the same category and the same audience as yours.',
      killCriterion: 'They describe a different product, or use only adjectives. The forwardable unit does not exist yet.',
      decisionItChanges: 'Whether you write the one-liner, or the artifact needs a figure instead.',
    },
    {
      name: 'Rules test',
      hypothesis: 'The community you intend to post in will accept it as a contribution, not an advert.',
      method: 'Read the pinned rules, find a post that was well received, and check whether it looks structurally like yours. Do not post yet.',
      cost: '15 minutes',
      successCriterion: 'A comparable post exists, was accepted, and stayed up.',
      killCriterion: 'Self-promotion is banned, or every accepted post is a release note from a known member.',
      decisionItChanges: 'The channel. Not the copy — the channel.',
    },
    {
      name: 'Critic dry run',
      hypothesis: 'The strongest objection can be answered in the artifact rather than in the replies.',
      method: 'Hand the artifact to the most skeptical person you know and ask for the first objection. Do not defend it.',
      cost: '20 minutes',
      successCriterion: 'You can point at a sentence in the artifact that already answers it.',
      killCriterion: 'The objection is the most interesting thing either of you said. The frame is not ready.',
      decisionItChanges: 'Whether the failure conditions and limitations are strong enough to launch.',
    },
  ];

  const plan: ExperimentPlan = {
    tests,
    successCriteria: [
      'A specific person, unprompted, describes this the way you describe it.',
      'One forward happens that you did not ask for.',
      'A stranger returns within a week of a first use.',
    ],
    killCriteria: [
      { statement: 'Nobody describes it the way you do.', observable: 'Five read-backs, five different descriptions.', horizon: 'Before launch, this week' },
      { statement: 'Engagement happens but nothing is forwarded.', observable: 'Replies and likes present, zero unprompted forwards in 7 days.', horizon: '7 days after launch' },
      { statement: 'It is shared, but by the wrong people.', observable: 'Shares come from a community you did not target, and none from the one you did.', horizon: '14 days' },
      { statement: 'A claim gets corrected in public.', observable: 'Any reply disputing a number, a testimonial, or a capability.', horizon: 'First 24 hours' },
      { statement: 'Installs happen and nobody returns.', observable: '7-day return rate under 30%.', horizon: '30 days' },
    ],
    measurementPlan: [
      'One number you can read weekly without a dashboard: unprompted forwards (mentions you did not seed).',
      'One qualitative signal: the sentence people quote back to you. That sentence is your next headline.',
      'One counter-signal: how many people describe it as something it is not. Rising mis-description means the category is failing.',
      'Write all three down before launch, in the file. Post-hoc criteria are how experiments become storytelling.',
    ],
    preRegistered: false,
    unknowable: [
      'Whether the audience has a latent need. A good test measures reception of an existing need, not creation of one.',
      'Whether a broadcaster would share it. Only the broadcaster knows, and asking ruins the test.',
      'Whether the timing was wrong. There is no counterfactual launch.',
    ],
  };

  return {
    agent: 'experiment-weaver',
    findings: [
      {
        claim: s.hasFailureCondition
          ? 'The artifact already carries a failure condition; tests can be built around it.'
          : 'The artifact has no failure condition, so no test can change a pre-committed decision.',
        evidence: s.hasFailureCondition ? 'failure-condition phrasing detected' : 'no "this fails if" or "kill criteria" phrasing found',
        basis: 'structural',
        confidence: 'medium',
        action: 'Write the kill criterion into the artifact itself, not into a notes app. The artifact is what survives your memory.',
      },
    ],
    limitations: [
      'These tests measure comprehension and willingness to forward. They do not measure demand.',
      'Small-n tests cannot distinguish "wrong positioning" from "wrong audience". Five people is a smoke test, not a study.',
      'Every criterion here can be rationalised away after the fact. That is why they must be written down first.',
    ],
    output: plan,
  };
}
