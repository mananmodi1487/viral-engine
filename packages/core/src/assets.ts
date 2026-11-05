/**
 * Launch asset generation.
 *
 * Deliberately template-driven, not model-driven. A model writing your Show HN
 * post will produce something that reads like every other Show HN post, and it
 * will happily invent a user count to fill the slot. Templates with explicit
 * placeholders do neither.
 *
 * Every template here ends in a checkable claim or an honest placeholder.
 */
import type { LaunchAsset } from './schemas.js';

export interface AssetContext {
  name: string;
  category: string;
  newCategory: string;
  audience: string;
  pasteReady: string;
  weakestLever: string;
}

export function generateAssets(ctx: AssetContext): LaunchAsset[] {
  const { name, newCategory, audience, pasteReady } = ctx;

  return [
    {
      channel: 'show-hn',
      budget: 'one paragraph under 200 words; plain title',
      text:
        `Show HN: ${name} — ${newCategory}\n\n` +
        `I built this because ${audience} keep hitting the same problem, and the existing tools all solve it by adding more surface area.\n\n` +
        `${name} does one thing: ${newCategory}. It runs offline by default, has no signup, and produces a report you can read in a minute.\n\n` +
        `The honest limitation: it cannot tell you whether your idea is good. It can tell you which lever is weakest and what to fix first — and it will say "do not launch yet" if that is the answer.\n\n` +
        `Everything is MIT licensed. Feedback welcome, especially where the diagnosis is wrong.`,
      notes:
        'Title must be plain and non-promotional. Do not put "viral" in the title — it triggers the category distrust you are trying to escape.',
    },
    {
      channel: 'x-thread',
      budget: 'first post under 240 characters',
      text:
        `1/ ${pasteReady}\n\n` +
        `2/ Most launch advice optimises the hook. The diffusion data says the hook is rarely the bottleneck.\n\n` +
        `3/ Across ~1B diffusion events, cascades over 100 nodes were about 0.025%. Popularity tracks the largest single broadcast, not the chain (Goel, Watts & Goldstein).\n\n` +
        `4/ So the question is not "how do I go viral". It is "who is the one person who would pass this on, and what do they need from me".\n\n` +
        `5/ I built ${name} to answer that: it scores seven levers, names the weakest, and writes the broadcaster brief.\n\n` +
        `6/ It never invents numbers. If it does not know something it says so, which makes it less impressive and more useful.\n\n` +
        `7/ Run it on something you already published: <link>\n\n` +
        `If it tells you something you did not want to hear, that is the tool working.`,
      notes: 'Post 3 carries the credibility. If you drop the citation, the thread becomes opinion.',
    },
    {
      channel: 'linkedin',
      budget: '1200-1800 characters performs best',
      text:
        `I stopped asking "how do I get this in front of more people" and started asking a harder question.\n\n` +
        `${pasteReady}\n\n` +
        `The reframe matters because the first question has no answer. The second one has a specific answer, and it is usually "change the category, not the copy".\n\n` +
        `I built a small tool that runs the diagnosis: it scores category clarity, broadcaster fit, share friction, and proof readiness, then names the single weakest lever.\n\n` +
        `It refuses to invent statistics. When it does not know something it says "unavailable" rather than guessing, which is why the numbers are less satisfying and more trustworthy.\n\n` +
        `It also has a "do not launch yet" output. That is a feature, not a bug: one unpolished launch attempt per project is the real constraint.\n\n` +
        `<link>`,
      notes: 'Lead with the reframe. LinkedIn rewards first-person, so do not make this read like a launch announcement.',
    },
    {
      channel: 'product-hunt',
      budget: 'tagline under 60 characters',
      text:
        `Tagline: Find out why nobody shared it\n\n` +
        `Description: ${name} scores your launch on seven levers, names the weakest one, and writes the broadcaster brief. Runs locally, no signup, refuses to invent statistics. Valid output includes "do not launch yet".`,
      notes: 'The tagline is a question, not a claim. Claims invite comparison; questions invite a click.',
    },
    {
      channel: 'landing-hero',
      budget: 'headline under 10 words, subhead under 25',
      text:
        `# ${pasteReady}\n\n` +
        `Score seven levers, find the bottleneck, and get the broadcaster brief. Free, local, and it will tell you not to launch.`,
      notes: 'The paste-ready line is the headline because it is the most compressed true thing you have.',
    },
    {
      channel: 'email-subject',
      budget: 'under 50 characters, no false urgency',
      text: [
        `Why nobody forwarded it`,
        `Your category is the problem, not your writing`,
        `A diagnosis you can run in 60 seconds`,
        `The weakest lever (and how to find yours)`,
      ].join('\n'),
      notes: 'No countdown language. Subject lines that promise urgency get opened once and trusted never.',
    },
    {
      channel: 'chat-announcement',
      budget: 'under 120 words for Discord/Slack',
      text:
        `Built a small thing that diagnoses why a launch did not spread. It scores seven levers and names the weakest one — mine came back as "broadcaster fit", which was annoying and correct.\n\n` +
        `Runs locally, no signup, no API key needed: <link>\n\n` +
        `It refuses to invent stats, and it will tell you not to launch. Feedback welcome, especially if it is wrong about yours.`,
      notes: 'Share the result about yourself first. It gives others permission to share theirs.',
    },
    {
      channel: 'broadcaster-paste',
      budget: 'one sentence, no link required',
      text: pasteReady,
      notes:
        'This is the single most important asset. If a broadcaster cannot repeat this sentence from memory, nothing else here matters.',
    },
  ];
}

/**
 * The paste-ready line: the compressed claim, built from the diagnosis rather
 * than from adjectives. Falls back to a bracketed placeholder when the input
 * does not give us enough to say anything specific.
 */
export function buildPasteReady(ctx: {
  newCategory: string;
  audience: string;
  currentCategory: string;
}): string {
  const { newCategory, audience, currentCategory } = ctx;
  if (newCategory.includes('[') || audience.includes('[')) {
    return 'It is not [the crowded category]. It is [the job the reader already budgets for] — and here is how to tell which one you are in.';
  }
  return `Most ${currentCategory} products are competing on features. This one is ${newCategory} — for ${audience}.`;
}
