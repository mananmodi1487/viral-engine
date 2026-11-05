/**
 * Agent 3 — Broadcaster Ethicist.
 *
 * The Broadcaster Rule (Goel et al.), with a consent layer bolted on top, because
 * the rule as usually stated is one sentence away from a DM spam playbook.
 *
 * "Find the one person who would pass this on" is good advice.
 * "Find the one person who would pass this on and message 200 people until one
 * replies" is the same advice with the ethics removed.
 *
 * This agent therefore:
 *  - never names a private individual
 *  - names a *role plus a discovery method*
 *  - requires a `consent_posture` for every candidate
 *  - refuses when the request is spray-and-pray
 *  - writes the no-ask message, because the ask is what makes it spam
 */
import type { AgentContext, AgentOutcome } from './types.js';
import { screenForAbuse, refuse } from './types.js';

export interface BroadcasterCandidate {
  candidate: string;
  whereToFind: string;
  whyTheyMightCare: string;
  whatMakesThemLookGood: string;
  consentStatus: 'not-contacted' | 'opted-in' | 'declined' | 'unknown';
  contactChannel: string;
  /** What would make this candidate wrong. Every candidate needs one. */
  disqualifier: string;
}

export interface BroadcasterBriefOutput {
  primaryType: string;
  candidates: BroadcasterCandidate[];
  stake: string;
  shareAssetNeeded: string;
  /** Sent once, no ask, easy to ignore. */
  messageTemplate: string;
  /** The sentence that turns a brief into spam. */
  whatNotToSay: string[];
  antiSpamRules: string[];
  likelyAmplifier: string;
  consentPosture: 'no-contact' | 'one-to-one-consent' | 'public-invitation';
  /** Hard cap this agent recommends. Not a suggestion. */
  maxContacts: number;
  failureCondition: string;
}

export function broadcasterEthicist(ctx: AgentContext): AgentOutcome<BroadcasterBriefOutput> {
  const abuse = screenForAbuse(ctx.text + ' ' + (ctx.declared?.broadcaster ?? ''));
  if (abuse) return abuse;

  const hasCommunity = ctx.signals.tribeMarkers.length > 0;
  const isRepo = /github|repo|readme|npm|pypi/i.test(ctx.text.slice(0, 600));

  const candidates: BroadcasterCandidate[] = isRepo
    ? [
        {
          candidate: 'Maintainer of a larger, adjacent repository',
          whereToFind: 'Topic search for the closest category, sorted by stars. Look for 2k–15k stars and recent merges from outside contributors — that is the signal they accept outside work.',
          whyTheyMightCare: 'Your tool removes a step their users do by hand. That is a recurring issue in their tracker, and a fix they did not have to build.',
          whatMakesThemLookGood: 'Linking it makes them the maintainer who found the missing piece, not the one who shipped another feature.',
          consentStatus: 'not-contacted',
          contactChannel: 'Their preferred channel as stated in CONTRIBUTING.md or their profile. If they state "no unsolicited DMs", that is the answer.',
          disqualifier: 'If your tool competes with theirs, this candidate is a liability. Check before writing anything.',
        },
        {
          candidate: 'Curator of an awesome-list or topic index',
          whereToFind: 'Lists that accept pull requests. Read their CONTRIBUTING rules before submitting — a rejected PR to a good list is a permanent no.',
          whyTheyMightCare: 'Their value is coverage. A missing useful tool is a gap in their index.',
          whatMakesThemLookGood: 'A clean entry that fits their format exactly, with a correct one-line description and a licence.',
          consentStatus: 'not-contacted',
          contactChannel: 'A pull request, which is a public, reviewable, refusable channel by design.',
          disqualifier: 'If the tool needs an API key to do anything, indexes will not take it.',
        },
      ]
    : [
        {
          candidate: 'One practitioner who already writes about this problem',
          whereToFind: 'Search the exact problem phrasing on a newsletter platform and on the platform where your audience argues about it. Pick someone who has published on this twice or more — one post is an interest, two is a beat.',
          whyTheyMightCare: 'They need material, and a concrete diagnostic is easier to write about than another opinion.',
          whatMakesThemLookGood: 'Citing a tool that produces a checkable output rather than another framework makes them look rigorous.',
          consentStatus: 'not-contacted',
          contactChannel: 'Reply to something they published, or the contact method they list. Not a cold DM to a handle you found in a follower list.',
          disqualifier: 'If your artifact is about their work and the diagnosis is negative, do not open with it.',
        },
        {
          candidate: 'Community moderator of the single most relevant niche community',
          whereToFind: 'The largest forum/Discord/subreddit for the exact audience. Read the pinned self-promotion rules before anything else. If promotion is banned, the answer is no.',
          whyTheyMightCare: 'Moderators are judged on whether their community gets useful material rather than ads.',
          whatMakesThemLookGood: 'A build-log post with a working demo and no signup wall makes them look like a good curator.',
          consentStatus: 'not-contacted',
          contactChannel: 'Whatever the rules specify. Usually a designated self-promo thread, sometimes modmail.',
          disqualifier: 'If the community bans self-promotion, do not test it. Being banned costs more than the post was worth.',
        },
      ];

  const audience = ctx.declared?.audience ?? 'the people this is for';

  const output: BroadcasterBriefOutput = {
    primaryType: hasCommunity
      ? 'A person who already curates for the community this names'
      : 'A practitioner with a beat, not an influencer with a following',
    candidates,
    stake:
      'Sharing this has to be a position they already hold, not a favour they are doing you. If you cannot state which of their existing arguments this settles, there is no stake and there is no broadcast.',
    shareAssetNeeded:
      'A one-line summary they can paste verbatim, plus one screenshot that needs no caption. Two items. A third reads as a press kit and stops the forward.',
    messageTemplate:
      `Hi — I made a small ${isRepo ? 'tool' : 'diagnostic'} that ${describeJob(ctx)}.\n\n` +
      `Relevant to your readers because ${whatItRemoves(ctx)}. One link, no signup: <link>\n\n` +
      `No ask. If it is redundant with something you already recommend, I would rather know that.\n\n` +
      `— <your name>`,
    whatNotToSay: [
      'Never ask for a share, a star, an upvote, or a "shoutout" in the first message. The ask converts a gift into a transaction and makes ignoring it rude.',
      'Never send the same text to more than one person unchanged.',
      'Never lead with what is wrong with their work.',
      'Never claim your thing replaces theirs.',
      'Never attach installation instructions. If it needs steps, it is not ready for a broadcaster.',
      'Never follow up more than once, and only if they replied the first time.',
    ],
    antiSpamRules: [
      'One person, one message, once. If no reply: stop. Silence is a complete answer.',
      'Write from a real identity with a real reply-to. No alias, no automation, no mailbox that bounces.',
      'Respect the channel they specified. If they say "email only", a DM is a violation.',
      'Respect platforms\' self-promotion rules over your judgement that your thing is useful.',
      'Never buy, scrape, or infer contact details. If you cannot find an address they published, you do not have consent to contact them.',
      'Keep a record of who you contacted and how they responded, so "I forgot I already sent that" never happens.',
      'If someone declines, thank them and never contact them again about this.',
    ],
    likelyAmplifier:
      'Their own next piece of work, or a pinned link that keeps working for months. Not a retweet — a durable surface they control.',
    consentPosture: 'one-to-one-consent',
    maxContacts: 3,
    failureCondition:
      'This brief fails if the recipient reads it as a favour request or as a pitch. The test is whether the message is still worth sending if you knew, in advance, that they would never reply.',
  };

  return {
    agent: 'broadcaster-ethicist',
    findings: [
      {
        claim: hasCommunity
          ? 'The artifact names a community, so an amplifier is discoverable.'
          : 'The artifact names no community, so any broadcaster list would be invented.',
        evidence: hasCommunity
          ? `tribe cues: ${ctx.signals.tribeMarkers.slice(0, 4).map((t) => t.term).join(', ')}`
          : 'no tribe/community vocabulary found',
        basis: 'structural',
        confidence: hasCommunity ? 'medium' : 'high',
        action: hasCommunity
          ? 'Identify one real person in that community and check their stated contact preference before writing.'
          : 'Name the community in the first screen. Without it, the only way to find broadcasters is to guess, and guessed outreach is spam.',
      },
      {
        claim: `The agent caps outreach at ${output.maxContacts} contacts for this artifact.`,
        evidence: 'policy constant in broadcaster-ethicist.ts, not a user setting',
        basis: 'structural',
        confidence: 'high',
        action: 'Write those three messages by hand. If a fifth feels necessary, the problem is the artifact, not the list.',
      },
    ],
    limitations: [
      'No broadcaster was contacted, and none consented. Every candidate is a hypothesis about a role, not a person.',
      'The engine cannot verify that any specific individual exists or is appropriate. It refuses to name individuals for exactly that reason.',
      'Stake is inferred from framing. Only the broadcaster knows their actual motivation.',
    ],
    output,
  };
}

function describeJob(ctx: AgentContext): string {
  const first = (ctx.description ?? ctx.text).split(/[.!?\n]/)[0]?.trim() ?? '';
  if (first.length > 20) return first.slice(0, 120).replace(/\s+\S*$/, '');
  return 'does one specific job for one specific kind of person';
}

function whatItRemoves(ctx: AgentContext): string {
  const step = ctx.signals.installSteps;
  if (ctx.signals.shareFrictionMarkers.length)
    return `it removes ${ctx.signals.shareFrictionMarkers[0].term}, which is the step people currently skip`;
  if (step > 0) return `it replaces ${step} manual step(s) with one command`;
  return 'it answers a question they currently answer by guessing';
}

export { refuse };
