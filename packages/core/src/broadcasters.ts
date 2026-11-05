/**
 * The Broadcaster Rule engine.
 *
 * Derived from Goel, Watts & Goldstein (2012, 2016): popularity tracks the size
 * of the single largest broadcast more than it tracks chain reactions. The
 * practical consequence is that a plan which only raises the average share rate
 * is optimising the wrong statistic.
 *
 * This module therefore refuses to emit advice unless it can name a *kind* of
 * broadcaster, where to find them, and why they would bother. "Post on social
 * media" is not a broadcaster and is rejected by the type system.
 */
import type { BroadcasterBrief, SourceDocument } from './schemas.js';

export interface BroadcasterChoice extends BroadcasterBrief {}

interface Ctx {
  source: SourceDocument;
  categoryLabel: string;
  pasteReady: string;
  audience: string;
  signalsWordCount: number;
}

const KIND_BY_INPUT: Record<string, BroadcasterBrief['kind']> = {
  'github-repo': 'maintainer',
  url: 'practitioner-with-audience',
  'readme-text': 'aggregator',
  'free-text': 'community-moderator',
};

/**
 * Returns one primary broadcaster and up to two alternates. Exactly one is
 * required by the schema; the alternates exist because the primary may not exist
 * for a given niche, and a plan with no fallback is a plan that quietly fails.
 */
export function chooseBroadcasters(ctx: Ctx): BroadcasterBrief[] {
  const primary = primaryBroadcaster(ctx);
  const alternates = alternateBroadcasters(ctx);
  return [primary, ...alternates];
}

function primaryBroadcaster(ctx: Ctx): BroadcasterBrief {
  const kind = KIND_BY_INPUT[ctx.source.kind] ?? 'practitioner-with-audience';

  if (ctx.source.kind === 'github-repo') {
    return {
      target: 'A maintainer of a larger repository in the same neighbourhood',
      kind: 'maintainer',
      whereToFind:
        'GitHub topic search for your closest category, sorted by stars; look for maintainers with 2k-15k stars who actively merge outside contributions',
      whyTheyCare: `Your tool removes work their users do by hand. In "${ctx.categoryLabel}" that is a recurring complaint in their issue tracker.`,
      whatMakesThemLookGood:
        'Linking your tool makes them the maintainer who found the missing piece, not the one who built another feature.',
      assetToSend:
        'A 20-second screen recording of the before/after plus the one-line summary. No install instructions in the first message.',
      messageTemplate:
        `Hi — I built a small ${ctx.categoryLabel} tool that does <one specific job> in one command.\n\n` +
        `Relevant to your users because <the specific recurring issue it removes>. Demo: <link>\n\n` +
        `No ask — just thought it might save you an issue or two. Happy to be told it is redundant.`,
      whatNotToSay: [
        'Do not ask for a star, a retweet or a "shoutout" in the first message.',
        'Do not claim it replaces their project.',
        'Do not send a wall of installation steps.',
      ],
      likelyAmplifier:
        'Their changelog or "ecosystem" section. That is a durable surface that keeps sending traffic without them doing anything again.',
      failureCondition:
        'This fails if the maintainer reads it as a competitor rather than a complement. Signal complementarity explicitly, or abandon this broadcaster and use the alternate.',
    };
  }

  return {
    target: 'One practitioner who already writes about this problem for a living',
    kind,
    whereToFind:
      'Search the exact problem phrasing on a newsletter platform and on the platform where your audience already argues about it; pick someone who has published on this twice or more',
    whyTheyCare: `They need material, and a concrete ${ctx.categoryLabel} diagnostic is easier to write about than another opinion piece.`,
    whatMakesThemLookGood:
      'They cite a tool that produces a specific, checkable output rather than another framework.',
    assetToSend:
      'The one-page diagnosis for their own project, run through the tool unasked. Showing beats telling.',
    messageTemplate:
      `Hi — I ran your <project/post> through a spread diagnostic I built. It came back with:\n\n` +
      `${ctx.pasteReady}\n\n` +
      `Useful or noise? No ask either way — happy to delete this if it is the latter.`,
    whatNotToSay: [
      'Do not lead with what is wrong with their work.',
      'Do not attach a press release or a media kit.',
      'Do not ask them to share before they have replied once.',
    ],
    likelyAmplifier:
      'Their next post, where one line about your tool reaches more of your audience than a month of posting does.',
    failureCondition:
      'This fails if the diagnosis is generic. A practitioner will spot boilerplate in one sentence; only send it if the output names something specific to their project.',
  };
}

function alternateBroadcasters(ctx: Ctx): BroadcasterBrief[] {
  return [
    {
      target: 'A community moderator in the single most relevant niche community',
      kind: 'community-moderator',
      whereToFind:
        'The largest Discord/forum/subreddit for the exact audience. Read the pinned self-promotion rules before anything else.',
      whyTheyCare: 'Moderators are judged on whether their community gets useful material rather than ads.',
      whatMakesThemLookGood:
        'Posting a tool with a working demo and no signup wall makes them look like they curate well.',
      assetToSend:
        'A build-log style post (what you made, what it told you, what it got wrong) — not an announcement.',
      messageTemplate:
        `Built a ${ctx.categoryLabel} diagnostic over the weekend. It told me something I did not want to hear about my own project: ${ctx.pasteReady}\n\n` +
        `Sharing in case it is useful to others here. Rules-permitting, of course — happy to delete if it is off-topic.`,
      whatNotToSay: [
        'Do not post the same text to several communities on the same day.',
        'Do not DM members to promote the post.',
        'Do not ignore a self-promo ban because "it is genuinely useful".',
      ],
      likelyAmplifier: 'A pinned message or a wiki link, which keeps working for months.',
      failureCondition:
        'This fails if the community bans self-promotion. Check the rules first; being banned costs more than the post was worth.',
    },
    {
      target: 'An aggregator that indexes tools in this space',
      kind: 'aggregator',
      whereToFind:
        'Awesome-lists, topic indexes and tool directories that accept pull requests or submissions.',
      whyTheyCare: 'Their value is coverage; a missing useful tool is a gap in their index.',
      whatMakesThemLookGood: 'A clean entry with a correct one-line description.',
      assetToSend: `One line: "${ctx.pasteReady}" plus a link and the license.`,
      messageTemplate:
        `Submitting for the list: <name> — ${ctx.pasteReady}\n\nMIT licensed, no signup, works offline. Happy to adjust the description to your format.`,
      whatNotToSay: [
        'Do not submit before the tool actually works end to end.',
        'Do not submit to ten lists in an hour; it reads as spam.',
      ],
      likelyAmplifier: 'Search traffic to the list, which compounds without you.',
      failureCondition:
        'This fails if the tool needs an API key to do anything. Indexes prefer zero-friction entries.',
    },
  ];
}
