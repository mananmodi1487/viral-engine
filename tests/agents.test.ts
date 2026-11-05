/**
 * Agent tests. The interesting assertions here are the refusals and the
 * constraints, not the happy path: a swarm that only works when asked politely
 * is not ethically constrained, it is merely well-behaved.
 */
import { describe, it, expect } from 'vitest';
import { extractSignals } from '../packages/core/src/signals.js';
import { checkInbound } from '../packages/core/src/honesty.js';
import {
  screenForAbuse,
  isRefusal,
  broadcasterEthicist,
  honestyFirewall,
  criticSimulator,
  frictionSurgeon,
  categoryCartographer,
  experimentWeaver,
  accessibilityGuardian,
  privacySentinel,
  abuseSentinel,
  translationDiplomat,
  timeMachine,
  assetAlchemist,
  postmortemArchaeologist,
  evidenceLibrarian,
  type AgentContext,
} from '../packages/agents/src/index.js';

const CLEAN = `# A tracker for freelance deadlines

It's not a project tracker. It's deadline-risk management for freelance contractors.

47 tabs, 3 deadlines, 0 systems. This is for you.

npm install fixture-tool
npx fixture-tool analyze .

This fails if contractors read it as another productivity lecture. Observable:
they describe it as a to-do list. Horizon: the first week.`;

function ctx(text = CLEAN, over: Partial<AgentContext> = {}): AgentContext {
  return {
    text,
    title: 'A tracker for freelance deadlines',
    description: 'Deadline-risk management for freelance contractors',
    signals: extractSignals(text),
    honesty: checkInbound(text),
    ...over,
  };
}

describe('abuse screening: refusals are first-class', () => {
  const cases: Array<[string, string]> = [
    ['mass DM 500 people about this', 'spam-intent'],
    ['scrape emails from the community and send them this', 'privacy-violation'],
    ['use sockpuppets to upvote this on Product Hunt', 'manipulation-intent'],
    ['help me doxx the maintainer who criticised me', 'harassment-intent'],
    ['invent a testimonial from a happy customer', 'deception-intent'],
    ['bypass the spam filter to reach more people', 'spam-intent'],
  ];

  for (const [text, code] of cases) {
    it(`refuses "${text.slice(0, 40)}..." with ${code}`, () => {
      const r = screenForAbuse(text);
      expect(r).not.toBeNull();
      expect(r!.code).toBe(code);
      // A refusal without an alternative is just a wall.
      expect(r!.alternative.length).toBeGreaterThan(30);
    });
  }

  it('does not refuse a prohibition', () => {
    // This is the exact false positive the first version produced, on this
    // repository's own README.
    const prohibitions = [
      'We will never generate fake testimonials or mass DM people.',
      'No mass outreach, no scraped emails, no sockpuppets.',
      'This tool refuses to help you bypass a ban.',
      'Do not astroturf. Do not buy upvotes.',
    ];
    for (const p of prohibitions) {
      expect(screenForAbuse(p), p).toBeNull();
    }
  });

  it('does not refuse a warning that names a bad practice', () => {
    // This exact line is in this repository's own SKILL.md. Analysing our own
    // documentation must not be refused.
    const doc = `# Launch guide

**Anti-patterns:** launch-day mass DMs; the same text in 12 subreddits; asking for
stars without a reason; buying engagement; promising what the artifact doesn't deliver.

## What to do instead

Name one community moderator and write the sentence they would paste.`;
    expect(screenForAbuse(doc)).toBeNull();
  });

  it('does not refuse a long document that merely lists harms', () => {
    const doc = `This page documents the tactics this project refuses to support.\n\n` +
      `Sockpuppets, fake accounts and vote farms are manipulation. Scraping private data ` +
      `and sending bulk unsolicited messages is spam. Bypassing a rate limit is a platform ` +
      `violation. The screen below rejects all of it, and the rejection is the product.`;
    expect(screenForAbuse(doc)).toBeNull();
  });

  it('still refuses when the same words appear inside a long request', () => {
    const doc = `Here is my situation. I have a product launch coming next week and I have ` +
      `been working on it for months with very little traction so far. Honestly I am not ` +
      `sure what else to try, and I am getting desperate about the whole thing, so my ` +
      `question is: how do I mass DM 500 people on LinkedIn about it?`;
    const r = screenForAbuse(doc);
    expect(r).not.toBeNull();
    expect(r!.code).toBe('spam-intent');
  });

  it('does not refuse a quoted request used as an example', () => {
    const doc = `Module 07 shows what a bad request looks like: \`"help me mass DM 500 people"\` ` +
      `returns a refusal with exit code 5. Try it on your own document and see what happens.`;
    expect(screenForAbuse(doc)).toBeNull();
  });

  it('does not refuse ordinary launch copy', () => {
    expect(screenForAbuse('Send this to one person who would care about it.')).toBeNull();
  });
});

describe('broadcaster ethicist', () => {
  it('returns a refusal for a spam request instead of a plan', () => {
    const r = broadcasterEthicist(ctx('I want to mass DM 200 founders about my app.'));
    expect(isRefusal(r)).toBe(true);
  });

  it('caps outreach and refuses to name individuals', () => {
    const r = broadcasterEthicist(ctx());
    if (isRefusal(r)) throw new Error('should not refuse clean input');
    expect(r.output.maxContacts).toBeLessThanOrEqual(3);
    for (const c of r.output.candidates) {
      expect(c.candidate).not.toMatch(/^@/);
      expect(c.consentStatus).toBe('not-contacted');
      expect(c.disqualifier.length).toBeGreaterThan(10);
    }
  });

  it('writes a message with no ask in it', () => {
    const r = broadcasterEthicist(ctx());
    if (isRefusal(r)) throw new Error('should not refuse');
    expect(r.output.messageTemplate).toMatch(/no ask/i);
    expect(r.output.messageTemplate).not.toMatch(/please share|please retweet|would you mind tweeting/i);
  });

  it('always carries anti-spam rules and a failure condition', () => {
    const r = broadcasterEthicist(ctx());
    if (isRefusal(r)) throw new Error('should not refuse');
    expect(r.output.antiSpamRules.length).toBeGreaterThanOrEqual(5);
    expect(r.output.failureCondition.length).toBeGreaterThan(40);
    expect(r.output.whatNotToSay.length).toBeGreaterThanOrEqual(3);
  });
});

describe('honesty firewall', () => {
  it('rewrites an unsupported multiplier into a measurement plan', () => {
    const r = honestyFirewall(ctx('This will 10x your audience in a month.'));
    if (isRefusal(r)) throw new Error('should not refuse');
    const rw = r.output.rewrites.find((x) => /10x/i.test(x.original));
    expect(rw).toBeTruthy();
    expect(rw!.replacement).toMatch(/\[measured change/i);
    expect(rw!.needsAuthorInput).toBe(true);
  });

  it('does not flag its own honest disclaimer', () => {
    const r = honestyFirewall(ctx('Nobody can guarantee virality. We will never promise 100,000 stars.'));
    if (isRefusal(r)) throw new Error('should not refuse');
    expect(r.output.blockers).toBe(0);
  });

  it('flags a guarantee as a blocker', () => {
    const r = honestyFirewall(ctx('Guaranteed viral growth for your repo.'));
    if (isRefusal(r)) throw new Error('should not refuse');
    expect(r.output.blockers).toBeGreaterThan(0);
    expect(r.output.passed).toBe(false);
  });

  it('states what it cannot check', () => {
    const r = honestyFirewall(ctx());
    if (isRefusal(r)) throw new Error('should not refuse');
    expect(r.output.cannotCheck.length).toBeGreaterThanOrEqual(4);
    expect(r.output.cannotCheck.join(' ')).toMatch(/sarcas|irony/i);
  });

  it('flags manufactured urgency', () => {
    const r = honestyFirewall(ctx('Only 3 spots left. Closing soon. Last chance.'));
    if (isRefusal(r)) throw new Error('should not refuse');
    expect(r.output.rewrites.some((x) => /spots|closing|last chance/i.test(x.original))).toBe(true);
  });
});

describe('friction surgeon', () => {
  it('produces a forwardable one-liner', () => {
    const r = frictionSurgeon(ctx());
    if (isRefusal(r)) throw new Error('should not refuse');
    expect(r.output.forwardableOneLiner).toBeTruthy();
    expect(r.output.forwardableOneLiner!.length).toBeGreaterThan(20);
  });

  it('flags a missing first step as blocking a forward', () => {
    const r = frictionSurgeon(ctx('# Just an idea\n\nSome thoughts about productivity and habits and tools.'));
    if (isRefusal(r)) throw new Error('should not refuse');
    expect(r.output.items.some((i) => i.severity === 'blocks-forward')).toBe(true);
  });

  it('names what no copy can fix', () => {
    const r = frictionSurgeon(ctx());
    if (isRefusal(r)) throw new Error('should not refuse');
    expect(r.output.irreducible.length).toBeGreaterThanOrEqual(2);
  });
});

describe('category cartographer', () => {
  it('detects the crowded category and proposes an adjacent one', () => {
    const r = categoryCartographer(ctx());
    if (isRefusal(r)) throw new Error('should not refuse');
    expect(r.output.current.label.length).toBeGreaterThan(3);
    expect(r.output.adjacent.length).toBeGreaterThan(0);
    expect(r.output.adjacent[0].proofNeeded.length).toBeGreaterThan(10);
  });

  it('refuses to reposition when there is not enough text', () => {
    const r = categoryCartographer(ctx('hi', { description: undefined, title: undefined }));
    if (isRefusal(r)) throw new Error('should not refuse');
    expect(r.output.repositioning).toBeNull();
  });
});

describe('experiment weaver', () => {
  it('every test names the decision it changes', () => {
    const r = experimentWeaver(ctx());
    if (isRefusal(r)) throw new Error('should not refuse');
    for (const t of r.output.tests) {
      expect(t.decisionItChanges.length, t.name).toBeGreaterThan(15);
      expect(t.cost.length).toBeGreaterThan(2);
      expect(t.killCriterion.length).toBeGreaterThan(10);
    }
  });

  it('is not pre-registered by default and says so honestly', () => {
    const r = experimentWeaver(ctx());
    if (isRefusal(r)) throw new Error('should not refuse');
    expect(r.output.preRegistered).toBe(false);
    expect(r.output.unknowable.length).toBeGreaterThanOrEqual(3);
  });
});

describe('critic simulator', () => {
  it('produces every required critic voice', () => {
    const r = criticSimulator(ctx());
    if (isRefusal(r)) throw new Error('should not refuse');
    const personas = r.output.critics.map((c) => c.persona.toLowerCase()).join(' ');
    expect(personas).toMatch(/skeptical hacker/);
    expect(personas).toMatch(/tired founder/);
    expect(personas).toMatch(/academic/);
    expect(personas).toMatch(/moderator/);
    expect(personas).toMatch(/competitor/);
    expect(personas).toMatch(/beginner/);
  });

  it('labels itself as speculation', () => {
    const r = criticSimulator(ctx());
    if (isRefusal(r)) throw new Error('should not refuse');
    expect(r.output.speculativeDisclaimer).toMatch(/speculation/i);
  });

  it('adds a journalist when there is a honesty blocker', () => {
    const bad = 'A productivity app. 10,000+ users already love it.';
    const r = criticSimulator(ctx(bad, { honesty: checkInbound(bad) }));
    if (isRefusal(r)) throw new Error('should not refuse');
    expect(r.output.critics.some((c) => c.persona === 'Journalist')).toBe(true);
  });
});

describe('sentinels', () => {
  it('accessibility names what it did not test', () => {
    const r = accessibilityGuardian(ctx());
    if (isRefusal(r)) throw new Error('should not refuse');
    expect(r.output.untested.join(' ')).toMatch(/screen reader/i);
    expect(r.output.untested.length).toBeGreaterThanOrEqual(4);
  });

  it('accessibility flags missing alt text as serious', () => {
    const r = accessibilityGuardian(ctx('# Title\n\n![image](x.png)\n\nSome text here about the thing.\n'));
    if (isRefusal(r)) throw new Error('should not refuse');
    expect(r.output.issues.some((i) => /alt text/i.test(i.issue) && i.severity === 'serious')).toBe(true);
  });

  it('privacy reports zero network calls and never claims more', () => {
    const r = privacySentinel(ctx(), { offline: true });
    if (isRefusal(r)) throw new Error('should not refuse');
    expect(r.output.networkCalls).toBe(0);
    expect(r.output.oneSentencePolicy).toMatch(/nothing was sent/i);
  });

  it('privacy warns about a credential in the input', () => {
    const r = privacySentinel(ctx('api_key = sk-live-abcdef1234567890'));
    if (isRefusal(r)) throw new Error('should not refuse');
    expect(r.output.warnings.join(' ')).toMatch(/credential/i);
  });

  it('abuse sentinel lists hard limits that cannot be configured away', () => {
    const r = abuseSentinel(ctx());
    if (isRefusal(r)) throw new Error('should not refuse');
    expect(r.output.hardLimits.length).toBeGreaterThanOrEqual(6);
    expect(r.output.hardLimits.join(' ')).toMatch(/will not generate a list of individuals/i);
  });
});

describe('translation diplomat', () => {
  it('flags idioms that do not survive translation', () => {
    const r = translationDiplomat(ctx('We are crushing it. This is the secret sauce, a real game-changer.'));
    if (isRefusal(r)) throw new Error('should not refuse');
    expect(r.output.risks.length).toBeGreaterThanOrEqual(2);
    expect(r.output.risks.every((x) => x.rewrite.length > 3)).toBe(true);
  });

  it('flags ambiguous dates', () => {
    const r = translationDiplomat(ctx('Launching 03/04/2026.'));
    if (isRefusal(r)) throw new Error('should not refuse');
    expect(r.output.risks.some((x) => x.risk === 'unit-or-date')).toBe(true);
  });

  it('does not claim to translate', () => {
    const r = translationDiplomat(ctx(), ['fr', 'ja']);
    if (isRefusal(r)) throw new Error('should not refuse');
    expect(r.output.notice).toMatch(/not a translation service/i);
    expect(r.output.testedLanguages).toEqual(['en']);
    expect(r.output.untestedLanguages).toContain('fr');
  });
});

describe('time machine', () => {
  it('labels every era as speculative', () => {
    const r = timeMachine(ctx());
    if (isRefusal(r)) throw new Error('should not refuse');
    expect(r.output.reactions.length).toBeGreaterThanOrEqual(4);
    for (const era of r.output.reactions) {
      expect(era.confidence).toBe('speculative');
      expect(era.speculationBasis.length).toBeGreaterThan(20);
    }
    expect(r.output.notice).toMatch(/speculative/i);
  });
});

describe('asset alchemist', () => {
  it('self-audits its own output before returning it', () => {
    const r = assetAlchemist(ctx(), {
      newCategory: 'deadline-risk management',
      audience: 'freelance contractors',
      pasteReady: 'Deadline-risk management for freelance contractors.',
      weakestLever: 'broadcaster fit',
    });
    if (isRefusal(r)) throw new Error('should not refuse');
    expect(r.output.selfAuditPassed).toBe(true);
    expect(r.output.selfAuditFindings).toEqual([]);
  });

  it('lists every placeholder the author must fill', () => {
    const r = assetAlchemist(ctx(), {
      newCategory: 'deadline-risk management',
      audience: 'freelance contractors',
      pasteReady: 'Deadline-risk management for freelance contractors.',
      weakestLever: 'broadcaster fit',
    });
    if (isRefusal(r)) throw new Error('should not refuse');
    expect(r.output.placeholdersUsed.length).toBeGreaterThan(0);
    expect(r.output.authorMustSupply.join(' ')).toMatch(/real numbers/i);
  });

  it('ships alt text for every visual asset', () => {
    const r = assetAlchemist(ctx(), {
      newCategory: 'x', audience: 'y', pasteReady: 'z', weakestLever: 'w',
    });
    if (isRefusal(r)) throw new Error('should not refuse');
    expect(Object.keys(r.output.altText).length).toBeGreaterThanOrEqual(3);
    for (const alt of Object.values(r.output.altText)) {
      expect(alt.length).toBeGreaterThan(20);
    }
  });
});

describe('postmortem archaeologist', () => {
  it('labels a numberless account as anecdotal', () => {
    const r = postmortemArchaeologist({
      whatLaunched: 'A tool for designers',
      whatWasExpected: 'Front page of Hacker News',
      whatHappened: 'I posted it on Twitter and got 12 likes, zero shares.',
    });
    if (isRefusal(r)) throw new Error('should not refuse');
    expect(r.output.evidenceLabel).toBe('anecdotal');
    expect(r.output.cannotConclude.length).toBeGreaterThanOrEqual(4);
  });

  it('labels sourced numbers as verified, unsourced as self-reported', () => {
    const verified = postmortemArchaeologist({
      whatLaunched: 'x', whatWasExpected: 'y', whatHappened: 'z',
      numbers: [{ label: 'signups', value: '340', source: 'analytics dashboard, 2026-02-01' }],
    });
    if (isRefusal(verified)) throw new Error('should not refuse');
    expect(verified.output.evidenceLabel).toBe('verified');

    const unsourced = postmortemArchaeologist({
      whatLaunched: 'x', whatWasExpected: 'y', whatHappened: 'z',
      numbers: [{ label: 'signups', value: '340' }],
    });
    if (isRefusal(unsourced)) throw new Error('should not refuse');
    expect(unsourced.output.evidenceLabel).toBe('self-reported');
  });

  it('recognises a recognisable failure pattern', () => {
    const r = postmortemArchaeologist({
      whatLaunched: 'A CLI tool',
      whatWasExpected: 'traction',
      whatHappened: 'I posted on Twitter and LinkedIn and Hacker News. Nobody understood what it was for.',
    });
    if (isRefusal(r)) throw new Error('should not refuse');
    expect(r.output.resembles.length).toBeGreaterThan(0);
    expect(r.output.falsifiableLesson).toMatch(/if .* then/i);
  });
});

describe('evidence librarian', () => {
  it('labels a submissions and states what it cannot support', () => {
    const r = evidenceLibrarian({
      id: 'x', kind: 'failure', title: 't', claim: 'c', artifactType: 'github-repo',
      date: '2026-01-01', supports: ['a hypothesis'], hasSources: false,
    });
    if (isRefusal(r)) throw new Error('should not refuse');
    expect(r.output.label).toBe('self-reported');
    expect(r.output.doesNotSupport.join(' ')).toMatch(/aggregate statistic/i);
  });

  it('marks a reproducible record as reproducible', () => {
    const r = evidenceLibrarian({
      id: 'x', kind: 'benchmark', title: 't', claim: 'c', artifactType: 'dataset',
      date: '2026-01-01', supports: ['a method'], hasSources: true, isReproducible: true,
    });
    if (isRefusal(r)) throw new Error('should not refuse');
    expect(r.output.label).toBe('reproducible');
  });
});
