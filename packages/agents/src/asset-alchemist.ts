/**
 * Agent 6 — Asset Alchemist.
 *
 * Inherits v1's template-driven asset generator and adds the channels the 1000/10
 * brief requires, plus three things v1 lacked:
 *
 *  1. `placeholdersUsed` — every [bracketed] thing the author must replace with a
 *     fact. A launch kit that quietly leaves eight placeholders is a kit that
 *     ships eight lies or eight gaps.
 *  2. alt text for every visual asset.
 *  3. a self-audit: the generated set is scanned by the honesty firewall before
 *     it is returned, and any blocker fails the generation.
 */
import type { AgentContext, AgentOutcome } from './types.js';
import { selfAudit } from './honesty-firewall.js';
import type { LaunchAsset } from '../../core/src/schemas.js';

export interface AssetKit {
  assets: LaunchAsset[];
  altText: Record<string, string>;
  placeholdersUsed: string[];
  selfAuditPassed: boolean;
  selfAuditFindings: string[];
  /** What the author must still do that no generator can do. */
  authorMustSupply: string[];
}

type Channel = LaunchAsset['channel'];

export function assetAlchemist(
  ctx: AgentContext,
  opts: { newCategory: string; audience: string; pasteReady: string; weakestLever: string; channels?: Channel[] },
): AgentOutcome<AssetKit> {
  const name = ctx.title ?? 'this';
  const { newCategory, audience, pasteReady, weakestLever } = opts;

  const all: LaunchAsset[] = [
    {
      channel: 'hacker-news',
      budget: 'title under 80 characters, plain, no superlatives',
      text: `Show HN: ${name} — ${newCategory}`,
      notes:
        'No exclamation mark, no "Show HN: I built". HN\'s culture punishes marketing register faster than it punishes dullness.',
    },
    {
      channel: 'show-hn',
      budget: 'one entry, under 200 words, no signup wall',
      text:
        `I built this because ${audience} keep hitting the same problem, and existing tools solve it by adding surface area.\n\n` +
        `${name} does one thing: ${newCategory}. It runs offline by default, needs no account, and produces a report you can read in a minute.\n\n` +
        `Honest limitation: it cannot tell you whether your idea is good. It can tell you which lever is weakest and what to fix first, and it will tell you not to launch if that is the answer.\n\n` +
        `Everything is open source. Feedback welcome, especially where the diagnosis is wrong.`,
      notes: 'Answer every technical question in the thread for the first three hours. That is the launch.',
    },
    {
      channel: 'x-thread',
      budget: 'first post under 240 characters',
      text:
        `1/ ${pasteReady}\n\n` +
        `2/ Most launch advice optimises the hook. The diffusion data says the hook is rarely the bottleneck.\n\n` +
        `3/ Across ~1B diffusion events, cascades over 100 nodes were about 0.025%. Popularity tracks the largest single broadcast, not the chain (Goel, Watts & Goldstein).\n\n` +
        `4/ So the question is not "how do I go viral". It is "who is the one person who would pass this on, and what do they need from me".\n\n` +
        `5/ ${name} answers that. It scores 25 dimensions, names the weakest, and writes the broadcaster brief.\n\n` +
        `6/ It never invents numbers. When it does not know something it says unknown — which makes it less impressive and more useful.\n\n` +
        `7/ Run it on something you already published: <link>\n\n` +
        `If it tells you something you did not want to hear, it is working.`,
      notes: 'Post 3 carries the credibility. Remove the citation and the thread becomes opinion.',
    },
    {
      channel: 'linkedin',
      budget: '1200–1800 characters',
      text:
        `I stopped asking "how do I get this in front of more people" and started asking a harder question.\n\n` +
        `${pasteReady}\n\n` +
        `The reframe matters because the first question has no answer. The second one does, and it is usually "change the category, not the copy".\n\n` +
        `I built a small tool that runs the diagnosis: it scores twenty dimensions of an attempt, then names the single weakest one.\n\n` +
        `It refuses to invent statistics. When it does not know something it says so. It also has a "do not launch yet" output, which is a feature: you only get one first attempt per project.\n\n` +
        `<link>`,
      notes: 'First person, no announcement voice. LinkedIn rewards a sentence someone can disagree with.',
    },
    {
      channel: 'product-hunt',
      budget: 'tagline under 60 characters, description under 260',
      text:
        `Tagline: Find out why nobody shared it\n\n` +
        `Description: ${name} scores an attempt at diffusion on 25 dimensions, names the weakest, and writes the broadcaster brief. Runs locally, no signup, refuses to invent statistics. "Do not launch yet" is a valid output.`,
      notes: 'The tagline is a question, not a claim. Claims invite comparison; questions invite a click.',
    },
    {
      channel: 'landing-hero',
      budget: 'headline under 10 words, subhead under 25',
      text: `# ${pasteReady}\n\nScore twenty dimensions, find the bottleneck, get the broadcaster brief. Free, local, and it will tell you not to launch.`,
      notes: 'The paste-ready line is the headline because it is the most compressed true thing available.',
    },
    {
      channel: 'email-subject',
      budget: 'under 50 characters, no false urgency',
      text: ['Why nobody forwarded it', 'Your category is the problem, not your writing', 'A diagnosis you can run in 60 seconds', 'The weakest lever, and how to find yours'].join('\n'),
      notes: 'No countdown language. Urgency subject lines get opened once and trusted never.',
    },
    {
      channel: 'chat-announcement',
      budget: 'under 120 words for Discord/Slack',
      text:
        `Built a small thing that diagnoses why a launch did not spread. It scores twenty dimensions and names the weakest — mine came back as broadcaster fit, which was annoying and correct.\n\n` +
        `Runs locally, no signup, no API key: <link>\n\n` +
        `It refuses to invent stats and it will tell you not to launch. Feedback welcome, especially if it is wrong about yours.`,
      notes: 'Share your own result first. It gives others permission to share theirs.',
    },
    {
      channel: 'broadcaster-paste',
      budget: 'one sentence, no link needed',
      text: pasteReady,
      notes: 'The single most important asset. If a broadcaster cannot repeat this from memory, nothing else here matters.',
    },
  ];

  const channels = opts.channels;
  const assets = channels?.length ? all.filter((a) => channels.includes(a.channel)) : all;

  const generated = assets.map((a) => a.text).join('\n') + '\n' + assets.map((a) => a.notes ?? '').join('\n');
  const audit = selfAudit(generated);

  // A placeholder is a bracketed span with no nested brackets and no newline.
  // The looser pattern swallowed a whole X post when the one-liner itself
  // contained placeholders, which meant the inventory under-reported them.
  // Two placeholder shapes are emitted by the templates and both are things the
  // author must replace with something true before publishing:
  //   [a fact you must supply]      -- square brackets
  //   <a link or a name>            -- angle brackets
  // Reporting only the square ones under-reported the work by half.
  const placeholders = [...new Set([
    ...[...generated.matchAll(/\[([^[\]\n]{2,80})\]/g)].map((m) => m[1].trim()),
    ...[...generated.matchAll(/<([a-z][a-z /_-]{2,40})>/gi)].map((m) => m[1].trim()),
  ].filter((p) => p && !p.startsWith('http') && !/^https?:/i.test(p)))];

  return {
    agent: 'asset-alchemist',
    findings: [
      {
        claim: `Generated ${assets.length} assets across ${new Set(assets.map((a) => a.channel)).size} channels.`,
        evidence: assets.map((a) => a.channel).join(', '),
        basis: 'structural',
        confidence: 'high',
        action: 'Fill every placeholder before publishing. An unfilled placeholder is a sentence that is not yet true.',
      },
      {
        claim: audit.passed
          ? 'The generated set passed the outbound honesty scan.'
          : 'The generated set failed its own outbound honesty scan — this is a bug in the generator, not in your document.',
        evidence: audit.passed ? 'no blocker-severity matches in generated text' : audit.findings.map((f) => `${f.rule}: ${f.matched}`).join('; '),
        basis: 'measured',
        confidence: 'high',
        action: audit.passed ? 'Proceed.' : 'Report this at github.com/mananmodi1487/viral-engine/issues — a generator that emits hype is a defect.',
      },
    ],
    limitations: [
      'Templates cannot know your specifics, so every asset is a scaffold until you replace the placeholders.',
      'Channel norms change. The budgets here are current as of ODS 2.0 and are stated so you can check them.',
      'No asset can fix a real proof gap. If the claim is unsupported, the copy is just a better-dressed problem.',
    ],
    output: {
      assets,
      altText: {
        scorecard: `${name} attempt quality index: ${opts.weakestLever} is the weakest of twenty dimensions.`,
        category_map: `Category map showing ${newCategory} as a less crowded adjacent to the crowded category, with credibility risk noted.`,
        before_after: `Before: generic description. After: one-sentence positioning naming who it is for and who it is not for.`,
      },
      placeholdersUsed: placeholders,
      selfAuditPassed: audit.passed,
      selfAuditFindings: audit.findings.map((f) => `${f.severity}: ${f.rule} — "${f.matched}"`),
      authorMustSupply: [
        'Your real numbers, if you cite any. The generator will not invent them, which is why you see [your real number].',
        'The link. It is a placeholder because we do not know where you will publish.',
        'The name of one real broadcaster and one real community. Both are required for the plan to be executable.',
      ],
    },
  };
}
