/**
 * The analyzer: pure orchestration.
 *
 * Deterministic by default. A provider may be supplied to add prose, but it can
 * never change a score, add a broadcaster, or remove a failure condition — those
 * are computed and validated locally. That boundary is what keeps an LLM from
 * being able to fabricate its way into the report.
 */
import type {
  DiagnosisReport,
  SourceDocument,
  LaunchPlan,
  FailureCondition,
} from './schemas.js';
import { validateReport, assertFailureConditions } from './schemas.js';
import { extractSignals } from './signals.js';
import { scoreDocument, summariseScorecard } from './score.js';
import { checkInbound, checkOutbound, extractGeneratedText } from './honesty.js';
import {
  detectCrowdedCategory,
  adjacentCategories,
  proposePositioning,
  inferAudience,
  bandFromRepoCount,
  unknownSaturation,
} from './categories.js';
import { chooseBroadcasters } from './broadcasters.js';
import { generateAssets, buildPasteReady } from './assets.js';
import type { Provider, ProviderName } from './providers/index.js';
import { completeWithRetry, buildDiagnosisPrompt } from './providers/index.js';

export const VERSION = '1.0.0';

export interface AnalyzeOptions {
  /** Optional provider for prose. Omit for the deterministic path. */
  provider?: Provider;
  /** Injected so tests never touch the network. */
  saturationCount?: number | null;
  /** Reason to record when saturationCount is null. */
  saturationUnavailableReason?: string;
  now?: () => Date;
}

function buildLaunchPlan(args: {
  source: SourceDocument;
  honestyBlocked: boolean;
  scorecardOverall: number;
  assets: ReturnType<typeof generateAssets>;
}): LaunchPlan {
  const { source, honestyBlocked, scorecardOverall, assets } = args;

  const checklist: LaunchPlan['checklist'] = [
    {
      step: 'Replace the one-line description with the proposed positioning sentence.',
      gate: 'blocker',
      reasoning: 'The description is the only text most people will ever read; if it names the wrong category, nothing downstream recovers.',
    },
    {
      step: 'Produce one screenshot-ready artifact from real data (no personal information).',
      gate: 'blocker',
      reasoning: 'A share with no artifact requires the sharer to write an explanation. That is the friction that kills most sharing.',
    },
    {
      step: 'Write down the failure condition before launch, not after.',
      gate: 'blocker',
      reasoning: 'A plan without a kill criterion cannot be evaluated; it can only be rationalised.',
    },
    {
      step: 'Send the asset to one named broadcaster and ask for nothing.',
      gate: 'warning',
      reasoning: 'Broadcast drives popularity more than chains do (Goel et al.), but the first message must not ask for a favour.',
    },
    {
      step: honestyBlocked
        ? 'Fix every honesty blocker: any unbacked figure becomes [your real number] plus the measurement plan.'
        : 'Re-run the honesty scan on the final copy before publishing.',
      gate: 'blocker',
      reasoning: honestyBlocked
        ? 'One fabricated figure converts a launch thread into a correction thread, and the correction is the part that gets screenshotted.'
        : 'Copy drifts during editing; a late "10x" is how a clean draft becomes a liability.',
    },
    {
      step: 'Pick one channel and one asset. Write the other channels into SUMMARY.md as "later".',
      gate: 'warning',
      reasoning: 'Simultaneous multi-channel launches split attention and make every channel look like a failure.',
    },
    {
      step: 'Read the first 20 replies manually and note which sentence gets quoted back.',
      gate: 'info',
      reasoning: 'The quoted sentence is the next post; the reply sentiment tells you whether the frame landed or backfired.',
    },
  ];

  const doNotLaunchYet = honestyBlocked || scorecardOverall < 35;

  return {
    checklist,
    assets,
    killCriteria: [
      {
        statement: 'The output reads as generic advice rather than a diagnosis of this specific document.',
        observable: 'A reader cannot tell which project the report was about without being told.',
        horizon: 'Immediately, on your own read-through',
      },
      {
        statement: 'A reply corrects a factual claim in the launch copy.',
        observable: 'Any comment disputing a number, a testimonial, or a capability.',
        horizon: 'First 24 hours',
      },
      {
        statement: 'People engage with the frame but nobody forwards it.',
        observable: 'Replies and likes present, shares and DMs absent after 7 days.',
        horizon: '7 days',
      },
      {
        statement: 'Installs happen but nobody returns.',
        observable: '7-day return rate below 30%.',
        horizon: '30 days',
      },
    ],
    doNotLaunchYet,
    doNotLaunchReason: doNotLaunchYet
      ? honestyBlocked
        ? 'Honesty blockers are present. Publishing now risks a public correction; fix the claims first.'
        : 'Overall score is below 35. The likely outcome is a launch that produces no signal, which is worse than a delayed one because it burns the attempt.'
      : undefined,
  };
}

export async function analyze(source: SourceDocument, opts: AnalyzeOptions = {}): Promise<DiagnosisReport> {
  const now = opts.now ?? (() => new Date());
  const text = [source.title, source.description, source.body].filter(Boolean).join('\n\n');
  const signals = extractSignals(text);
  const honesty = checkInbound(text);

  const crowded = detectCrowdedCategory(signals, text);
  const saturation =
    typeof opts.saturationCount === 'number'
      ? bandFromRepoCount(opts.saturationCount)
      : unknownSaturation(
          opts.saturationUnavailableReason ?? 'network unavailable or saturation query not supplied',
        );

  const audience = inferAudience(signals);
  const adjacent = adjacentCategories(crowded.slug);
  const chosen = [...adjacent].sort((a, b) => b.tensionScore - a.tensionScore)[0];
  const proposedPositioning = proposePositioning(crowded.label, chosen.name, audience);

  const scorecard = scoreDocument({
    signals,
    honesty,
    hasDescription: Boolean(source.description) || signals.wordCount > 40,
    hasTopics: source.topics.length > 0,
    repoStars: source.topics.length ? source.topics.length : undefined,
    saturationKnown: saturation.basis === 'measured',
  });

  const pasteReady = buildPasteReady({
    newCategory: chosen.name,
    audience,
    currentCategory: crowded.label,
  });

  const broadcasters = chooseBroadcasters({
    source,
    categoryLabel: crowded.label,
    pasteReady,
    audience,
    signalsWordCount: signals.wordCount,
  });

  const weakest = [...scorecard.dimensions]
    .filter((d) => d.key !== 'honestyRisk')
    .sort((a, b) => a.score - b.score)[0];

  const assets = generateAssets({
    name: source.title ?? source.ref,
    category: crowded.label,
    newCategory: chosen.name,
    audience,
    pasteReady,
    weakestLever: weakest.label,
  });

  const shareFriction = [
    {
      friction: 'Setup cost before first value',
      evidence: `${signals.installSteps} explicit setup step(s); ${signals.shareFrictionMarkers.reduce((a, b) => a + b.count, 0)} prerequisite cue(s) detected`,
      fix:
        signals.installSteps > 3
          ? 'Collapse to a single command and move prerequisites into a collapsible section.'
          : 'State the first command before any explanation of what the tool is.',
    },
    {
      friction: 'Quotability',
      evidence: `${signals.wordCount} words, ${signals.headingCount} headings, ${signals.codeBlockCount} code blocks`,
      fix:
        signals.wordCount > 900
          ? 'Add a 40-word summary at the top that can be screenshotted on its own.'
          : 'Add one self-contained screenshot-ready block; short documents still often lack a forwardable unit.',
    },
    {
      friction: 'Broadcaster clarity',
      evidence: signals.tribeMarkers.length
        ? `${signals.tribeMarkers.length} tribe/community cue(s) found`
        : 'no community or tribe cue found in the document',
      fix: 'Name the community explicitly in the first screen. A broadcaster needs to recognise their own readers.',
    },
  ];

  let report: DiagnosisReport = {
    schemaVersion: '1.0.0',
    generatedAt: now().toISOString(),
    generator: {
      name: 'viral-engine',
      version: VERSION,
      mode: 'deterministic',
    },
    source,
    scorecard,
    category: {
      currentCategory: crowded.label,
      currentCategoryBasis: crowded.slug === 'unspecified' ? 'unavailable' : 'heuristic',
      saturation: saturation.saturation,
      saturationBasis: saturation.basis,
      saturationEvidence: saturation.evidence,
      adjacentCategories: adjacent,
      proposedPositioning,
      proofRequired: `The frame "${chosen.name}" only survives if you can show ${chosen.credibilityRisk}. If you cannot, the frame is a costume and the first critical reply will say so.`,
      failureCondition: {
        statement: `This positioning fails if ${audience} reads it as another version of ${crowded.label}.`,
        observable: 'Replies describe the product as "just another X" or ask how it differs from a named incumbent.',
        horizon: 'First 24 hours after publishing',
      },
    },
    broadcasters,
    shareFriction,
    honesty,
    launchPlan: buildLaunchPlan({
      source,
      honestyBlocked: !honesty.passed,
      scorecardOverall: scorecard.overall,
      assets,
    }),
    pasteReady,
    failureCondition: {
      statement: `This plan fails if the diagnosis is not specific to ${source.ref}.`,
      observable: 'The report would read identically if you swapped in a different project.',
      horizon: 'Immediately',
    },
    limitations: [
      'Category saturation is a keyword heuristic; only the numeric band comes from a measurement.',
      'Emotional stake is estimated from a keyword lexicon, not measured arousal (Berger & Milkman 2012 is the basis, the lexicon is a proxy).',
      'No claim is made about whether the underlying product is good, useful, or wanted.',
      `Saturation: ${saturation.evidence}`,
    ],
  };

  // Optional prose pass. Cannot alter scores, broadcasters, or failure conditions.
  if (opts.provider) {
    try {
      const findings = [
        `weakest lever: ${weakest.label} at ${weakest.score}/100 (${weakest.rationale})`,
        `category: ${crowded.label}; proposed: ${chosen.name}`,
        `honesty blockers: ${honesty.findings.filter((f) => f.severity === 'blocker').length}`,
        `summary: ${summariseScorecard(scorecard)}`,
      ].join('\n');
      const result = await completeWithRetry(opts.provider, buildDiagnosisPrompt(source, findings));
      report = {
        ...report,
        generator: { ...report.generator, mode: 'llm-assisted', provider: result.provider, model: result.model },
        limitations: [
          ...report.limitations,
          `Narrative generated by ${result.provider}/${result.model}. Scores and broadcaster selection remain deterministic and were not model-generated.`,
        ],
      };
      // Keep the prose available without letting it drive any scored field.
      (report as DiagnosisReport & { narrative?: string }).narrative = result.text;
    } catch (err) {
      report = {
        ...report,
        limitations: [
          ...report.limitations,
          `Provider unavailable (${(err as Error).message}). Report was produced deterministically; scores are unaffected.`,
        ],
      };
    }
  }

  // Outbound honesty gate: we must pass our own scan.
  // Scan only what we generated. Quoting the user's document is not a violation.
  const produced = extractGeneratedText(report as unknown as Parameters<typeof extractGeneratedText>[0]);
  const outbound = checkOutbound(produced);
  if (!outbound.passed) {
    const blockers = outbound.findings.filter((f) => f.severity === 'blocker');
    throw new Error(
      `Internal honesty violation — the generator produced text that fails its own policy:\n` +
        blockers.map((b) => `  - ${b.rule}: "${b.matched}"`).join('\n') +
        '\nThis is a bug. Please report it with the input that triggered it.',
    );
  }

  const validated = validateReport(report);
  assertFailureConditions(validated);
  return validated;
}

export type { ProviderName };
export type { Provider };
