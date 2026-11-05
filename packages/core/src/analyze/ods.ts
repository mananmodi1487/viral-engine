/**
 * ODS orchestration.
 *
 * Composes the deterministic engine and the agent swarm into one Open Diffusion
 * Spec document. Ordering is deliberate:
 *
 *   1. deterministic signals and scores first — they cannot be influenced by prose
 *   2. agents that produce claims next
 *   3. sentinels last, because they must be able to veto the whole document
 *   4. a self-audit of our own generated text before anything is returned
 *
 * If the self-audit fails, the document still returns — but with
 * `ethics_review.do_not_launch_yet = true` and an explicit note that the
 * generator, not the user, produced a defect. Hiding that would defeat the point
 * of the project.
 */
import { extractSignals } from '../signals.js';
import { checkInbound } from '../honesty.js';
import { scoreAqi } from '../score/aqi.js';
import { detectCrowdedCategory, adjacentCategories, bandFromRepoCount } from '../categories.js';
import type { SourceDocument } from '../schemas.js';
import {
  categoryCartographer,
  saturationRadar,
  broadcasterEthicist,
  frictionSurgeon,
  honestyFirewall,
  assetAlchemist,
  experimentWeaver,
  criticSimulator,
  antifragile,
  translationDiplomat,
  accessibilityGuardian,
  privacySentinel,
  abuseSentinel,
  timeMachine,
  isRefusal,
  type AgentContext,
} from '../../../agents/src/index.js';
import { AQI_DISCLAIMER, topLostPoints, weakestDimension, type AqiResult } from '../../../protocol/src/aqi.js';

export const ODS_VERSION = '1.0.0';
export const GENERATOR_VERSION = '2.0.0';

export interface OdsOptions {
  /** Injected measurement. Omit and the radar reports `unknown`. */
  saturationCount?: number | null;
  saturationUnavailableReason?: string;
  offline?: boolean;
  networkCalls?: number;
  declared?: AgentContext['declared'];
  language?: string;
  channel?: string;
  now?: () => Date;
  /** Run the speculative extras (time machine, antifragile). Default true. */
  includeSpeculative?: boolean;
}

export interface FailureCondition {
  statement: string;
  observable: string;
  horizon: string;
}

export interface OdsDocument {
  ods_version: string;
  document_id: string;
  generated_at: string;
  generator: {
    name: string;
    version: string;
    mode: 'deterministic' | 'llm-assisted' | 'local-model' | 'hybrid';
    network_calls: number;
  };
  artifact: {
    id: string;
    name: string;
    type: string;
    url?: string;
    language: string;
    license?: string;
    summary?: string;
  };
  provenance: {
    inputs: Array<{ kind: string; ref: string; consent: string; degraded_reason?: string }>;
    ocr_or_transcription_used: boolean;
    network_calls: number;
  };
  current_positioning: {
    one_sentence_description: string;
    claimed_category: string;
    actual_category_signals: string[];
    target_audience: string[];
    core_promise: string;
    core_tension: string;
    emotional_stake: string;
    basis: string;
  };
  category_analysis: Record<string, unknown>;
  audience_analysis: Record<string, unknown>;
  broadcaster_analysis: Record<string, unknown>;
  friction_analysis: Record<string, unknown>;
  honesty_audit: {
    invented_stats_detected: boolean;
    fake_testimonials_detected: boolean;
    guaranteed_outcomes_detected: boolean;
    manufactured_outrage_detected: boolean;
    dark_patterns_detected: string[];
    required_fixes: string[];
    passed: boolean;
    findings: Array<{ severity: string; matched: string; where: string; rule: string; suggestion: string }>;
    scanned_for: string[];
  };
  scorecard: {
    aqi_version: string;
    max: number;
    total: number;
    band: string;
    disclaimer: string;
    dimensions: Array<{
      key: string;
      label: string;
      weight: number;
      score: number;
      points: number;
      basis: string;
      confidence: string;
      evidence: string[];
      assumptions: string[];
      missing_data: string[];
      improvement: string;
      failure_condition: string;
      do_not_launch_yet: boolean;
    }>;
  };
  launch_assets: Record<string, unknown>;
  experiments: Record<string, unknown>;
  failure_conditions: FailureCondition[];
  post_launch_learning: Record<string, unknown>;
  ethics_review: {
    ethical_risk_check: Array<{ risk: string; assessment: 'clear' | 'caution' | 'violation'; note?: string }>;
    do_not_launch_yet: boolean;
    do_not_launch_reason?: string;
    audience_could_read_this: boolean;
    reviewer: 'deterministic-rules' | 'human' | 'deterministic-rules+human';
  };
  accessibility: Record<string, unknown>;
  limitations: string[];
  /** Non-standard but permitted: the full agent payloads, for tools and plugins. */
  x_agents: Record<string, unknown>;
}

function slugId(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `ods-${(h >>> 0).toString(36)}`;
}

export function artifactTypeFrom(kind: string, ref: string): string {
  if (kind === 'github-repo') return 'github-repo';
  if (kind === 'local-folder') return 'raw-text';
  if (/\.pdf$/i.test(ref)) return 'pdf';
  if (/\.docx$/i.test(ref)) return 'raw-text';
  if (/producthunt/i.test(ref)) return 'product-hunt-launch';
  if (/news\.ycombinator/i.test(ref)) return 'hacker-news-post';
  if (/youtube|youtu\.be/i.test(ref)) return 'youtube-video';
  if (/twitter|x\.com/i.test(ref)) return 'x-thread';
  if (/figma/i.test(ref)) return 'figma-prototype';
  if (/notion/i.test(ref)) return 'notion-doc';
  if (/docs\.google/i.test(ref)) return 'google-doc';
  if (/apps\.apple|play\.google/i.test(ref)) return 'app-store-listing';
  if (/^https?:/i.test(ref)) return 'landing-page';
  return 'raw-text';
}

export async function analyzeOds(
  source: SourceDocument,
  opts: OdsOptions = {},
): Promise<OdsDocument> {
  const now = opts.now ?? (() => new Date());
  const text = [source.title, source.description, source.body].filter(Boolean).join('\n\n');
  const signals = extractSignals(text);
  const honesty = checkInbound(text);
  const networkCalls = opts.networkCalls ?? (source.fetchedFrom === 'network' ? 1 : 0);

  const ctx: AgentContext = {
    text,
    title: source.title,
    description: source.description,
    url: source.kind === 'url' ? source.ref : undefined,
    signals,
    honesty,
    declared: opts.declared,
    language: opts.language,
    networkCalls,
  };

  /* ---- 1. Agents that establish the frame ---- */
  const cartographer = categoryCartographer(ctx);
  const radar = await saturationRadar(ctx, {
    count: opts.saturationCount ?? undefined,
    offline: opts.offline,
    reason: opts.saturationUnavailableReason,
  });
  const friction = frictionSurgeon(ctx);
  const honestyVerdict = honestyFirewall(ctx);
  const broadcaster = broadcasterEthicist(ctx);

  if (isRefusal(broadcaster)) {
    throw new Error(
      `Refused: ${broadcaster.reason}\n\nInstead: ${broadcaster.alternative}`,
    );
  }
  if (isRefusal(cartographer) || isRefusal(radar) || isRefusal(friction) || isRefusal(honestyVerdict)) {
    throw new Error('An agent refused this input. This should be impossible for these agents; please report it.');
  }

  const oneLiner = friction.output.forwardableOneLiner ?? '';
  const saturated = typeof opts.saturationCount === 'number';

  /* ---- 2. Assets, experiments, critics ---- */
  const assetKit = assetAlchemist(ctx, {
    newCategory: cartographer.output.recommended ?? cartographer.output.current.label,
    audience: opts.declared?.audience ?? cartographer.output.adjacent[0]?.name ?? 'the person this is for',
    pasteReady: oneLiner || 'It is not [the crowded category]. It is [the job the reader already budgets for].',
    weakestLever: 'broadcaster fit',
    channels: opts.channel ? [opts.channel as never] : undefined,
  });
  const assets = isRefusal(assetKit) ? null : assetKit.output;
  const experiments = experimentWeaver(ctx);
  const critics = criticSimulator(ctx);
  const access = accessibilityGuardian(ctx);
  const privacy = privacySentinel(ctx, { offline: opts.offline, provider: 'none' });
  const abuse = abuseSentinel(ctx);

  if (isRefusal(experiments) || isRefusal(critics) || isRefusal(access) || isRefusal(privacy) || isRefusal(abuse)) {
    throw new Error('A sentinel refused this input.');
  }

  /* ---- 3. AQI, informed by what the agents found ---- */
  const aqi: AqiResult = scoreAqi({
    signals,
    honesty,
    text,
    saturationKnown: saturated,
    saturationEvidence:
      saturated ? `measured: ${opts.saturationCount} repositories` : (opts.saturationUnavailableReason ?? 'not measured'),
    hasDescription: Boolean(source.description) || signals.wordCount > 40,
    declaredAudience: opts.declared?.audience,
    declaredBroadcaster: opts.declared?.broadcaster,
    accessibilityScore: access.output.score,
    accessibilityBasis: 'heuristic',
    lang: opts.language,
    networkCalls,
    hasForwardable: Boolean(oneLiner),
    assetCount: assets?.assets.length ?? 0,
  });

  /* ---- 4. Speculative extras ---- */
  const includeSpeculative = opts.includeSpeculative !== false;
  const time = includeSpeculative ? timeMachine(ctx) : null;
  const anti = includeSpeculative ? antifragile(ctx) : null;
  const translation = translationDiplomat(ctx, opts.language ? [opts.language] : []);

  /* ---- 5. Self-audit of our own generated text ---- */
  const generatedText = [
    ...(assets?.assets.map((a) => a.text) ?? []),
    oneLiner,
    cartographer.output.repositioning ?? '',
    broadcaster.output.messageTemplate,
    ...critics.output.critics.map((c) => c.firstLine + ' ' + c.deeper),
    ...aqi.dimensions.map((d) => d.improvement),
  ].join('\n');
  const selfCheck = checkInbound(generatedText);
  const selfBlockers = selfCheck.findings.filter((f) => f.severity === 'blocker');

  /* ---- 6. Assemble ---- */
  const blocked =
    aqi.blocked ||
    !honesty.passed ||
    selfBlockers.length > 0 ||
    abuse.output.verdict === 'refuse';

  const blockedReason = !honesty.passed
    ? `${honesty.findings.filter((f) => f.severity === 'blocker').length} honesty blocker(s) in the artifact. Publishing now risks a public correction; fix the claims first.`
    : selfBlockers.length
      ? 'The generator produced text that failed its own honesty audit. This is our defect, not yours. Please report it; do not publish the generated assets as-is.'
      : abuse.output.verdict === 'refuse'
        ? 'The abuse sentinel refused part of this request. See ethics_review.'
        : aqi.total < 350
          ? `Attempt quality is ${aqi.total}/1000 (${aqi.band.label}). A launch now would produce no signal, which is worse than a delayed one because it burns the attempt.`
          : undefined;

  const weakest = weakestDimension(aqi);
  const leverage = topLostPoints(aqi, 3);

  const doc: OdsDocument = {
    ods_version: ODS_VERSION,
    document_id: slugId(text + source.ref),
    generated_at: now().toISOString(),
    generator: {
      name: 'viral-engine-commons',
      version: GENERATOR_VERSION,
      mode: 'deterministic',
      network_calls: networkCalls,
    },
    artifact: {
      id: slugId(source.ref),
      name: source.title ?? source.ref,
      type: artifactTypeFrom(source.kind, source.ref),
      url: source.kind === 'url' || source.kind === 'github-repo' ? source.ref : undefined,
      language: opts.language ?? 'en',
      summary: source.description,
    },
    provenance: {
      inputs: [
        {
          kind: source.kind,
          ref: source.ref,
          consent: source.kind === 'free-text' ? 'user-provided' : 'public-artifact',
          degraded_reason: source.degraded,
        },
      ],
      ocr_or_transcription_used: false,
      network_calls: networkCalls,
    },
    current_positioning: {
      one_sentence_description: source.description ?? firstSentence(text),
      claimed_category: cartographer.output.current.label,
      actual_category_signals: cartographer.output.current.signals,
      target_audience: opts.declared?.audience
        ? [opts.declared.audience]
        : signals.identityMarkers.slice(0, 4).map((t) => t.term),
      core_promise: oneLiner || '(no forwardable promise was detected — see friction_analysis)',
      core_tension: cartographer.output.adjacent[0]
        ? `The artifact reads as ${cartographer.output.current.label} but its least crowded credible position is ${cartographer.output.adjacent[0].name}.`
        : 'No tension detected between claimed and actual category.',
      emotional_stake:
        signals.highArousal.length > 0
          ? `activating vocabulary present (${signals.highArousal.slice(0, 3).map((t) => t.term).join(', ')})`
          : 'no activating language detected; the artifact asks for attention without offering a stake',
      basis: 'heuristic',
    },
    category_analysis: {
      saturation_estimate: radar.output.band === 'unknown' ? 'unknown' : radar.output.band,
      saturation_basis: radar.output.basis,
      competitors: [],
      adjacent_categories: cartographer.output.adjacent.map((a) => ({
        name: a.name,
        why_less_crowded: a.whyLessCrowded,
        credibility_risk: a.credibilityRisk,
        tension_score: a.tensionScore,
        proof_needed: a.proofNeeded,
      })),
      recommended_category: cartographer.output.recommended ?? cartographer.output.current.label,
      category_confidence: radar.output.basis === 'measured' ? 0.6 : 0.25,
      evidence: [radar.output.evidence, ...cartographer.output.current.signals],
      missing_data: radar.output.missingData,
      proposed_positioning: cartographer.output.repositioning,
      proof_required: cartographer.output.adjacent[0]?.proofNeeded,
      failure_condition: {
        statement: `This positioning fails if ${opts.declared?.audience ?? 'the intended audience'} reads it as another version of ${cartographer.output.current.label}.`,
        observable: 'Replies describe it as "just another X", or ask how it differs from a named incumbent.',
        horizon: 'First 24 hours after publishing',
      },
    },
    audience_analysis: {
      specificity: opts.declared?.audience
        ? 'named-role'
        : signals.identityMarkers.length
          ? 'segment'
          : 'demographic',
      named_people: signals.identityMarkers.slice(0, 5).map((t) => t.term),
      where_they_gather: signals.tribeMarkers.slice(0, 5).map((t) => t.term),
      what_they_already_believe: [],
      what_they_would_lose_by_sharing:
        signals.hasEnemy
          ? 'Nothing obvious: the artifact takes a side, so sharing it is a position they may already hold.'
          : 'Standing: with no specific claim, forwarding it means vouching for a description they would have to write themselves.',
      evidence: [signals.identityMarkers.length ? 'identity markers detected' : 'no identity markers detected'],
    },
    broadcaster_analysis: {
      primary_broadcaster_type: broadcaster.output.primaryType,
      specific_broadcaster_candidates: broadcaster.output.candidates.map((c) => ({
        candidate: c.candidate,
        where_to_find: c.whereToFind,
        why_they_might_care: c.whyTheyMightCare,
        what_makes_them_look_good: c.whatMakesThemLookGood,
        consent_status: c.consentStatus,
        contact_channel: c.contactChannel,
      })),
      broadcaster_stake: broadcaster.output.stake,
      share_asset_needed: broadcaster.output.shareAssetNeeded,
      consent_outreach_template: broadcaster.output.messageTemplate,
      consent_posture: broadcaster.output.consentPosture,
      what_not_to_say: broadcaster.output.whatNotToSay,
      anti_spam_rules: broadcaster.output.antiSpamRules,
      max_contacts: broadcaster.output.maxContacts,
      likely_amplifier: broadcaster.output.likelyAmplifier,
      failure_condition: {
        statement: broadcaster.output.failureCondition,
        observable: 'The recipient does not reply, or replies asking you to stop.',
        horizon: 'One message, one week. No follow-up unless they replied.',
      },
    },
    friction_analysis: {
      share_friction_score: 100 - friction.output.score,
      basis: 'measured',
      reasons: friction.output.items.map((i) => ({ friction: i.friction, evidence: i.evidence, fix: i.fix })),
      reductions: friction.output.items.map((i) => i.fix),
      forwardable_artifact_exists: Boolean(oneLiner),
    },
    honesty_audit: {
      invented_stats_detected: honestyVerdict.output.findings.some((f) => /unsourced|figure|statistic/i.test(f.rule)),
      fake_testimonials_detected: /testimonial/i.test(JSON.stringify(honestyVerdict.output.findings)),
      guaranteed_outcomes_detected: honestyVerdict.output.findings.some((f) => /guarantee|outcome|promise/i.test(f.rule)),
      manufactured_outrage_detected: /outrage/i.test(JSON.stringify(honestyVerdict.output.findings)),
      dark_patterns_detected: honestyVerdict.output.findings
        .filter((f) => /urgency|scarcity|dark/i.test(f.rule))
        .map((f) => f.rule),
      required_fixes: honestyVerdict.output.rewrites.map((r) => `"${r.original}" → ${r.replacement}`),
      passed: honestyVerdict.output.passed,
      findings: honestyVerdict.output.findings,
      scanned_for: honestyVerdict.output.checkedFor,
    },
    scorecard: {
      aqi_version: aqi.version,
      max: aqi.max,
      total: aqi.total,
      band: aqi.band.label,
      disclaimer: AQI_DISCLAIMER,
      dimensions: aqi.dimensions.map((d) => ({
        key: d.key,
        label: d.label,
        weight: d.weight,
        score: d.score,
        points: d.points,
        basis: d.basis,
        confidence: d.confidence,
        evidence: d.evidence,
        assumptions: d.assumptions,
        missing_data: d.missingData,
        improvement: d.improvement,
        failure_condition: d.failureCondition,
        do_not_launch_yet: d.doNotLaunchYet,
      })),
    },
    launch_assets: assets
      ? {
          hacker_news_title: assets.assets.find((a) => a.channel === 'hacker-news')?.text,
          show_hn_body: assets.assets.find((a) => a.channel === 'show-hn')?.text,
          x_thread: (assets.assets.find((a) => a.channel === 'x-thread')?.text ?? '').split('\n\n').filter(Boolean),
          linkedin_post: assets.assets.find((a) => a.channel === 'linkedin')?.text,
          product_hunt_tagline: 'Find out why nobody shared it',
          product_hunt_description: assets.assets.find((a) => a.channel === 'product-hunt')?.text,
          email_subject_lines: (assets.assets.find((a) => a.channel === 'email-subject')?.text ?? '').split('\n').filter(Boolean),
          discord_message: assets.assets.find((a) => a.channel === 'chat-announcement')?.text,
          landing_hero: assets.assets.find((a) => a.channel === 'landing-hero')?.text,
          one_line_broadcast_summary: oneLiner,
          alt_text: assets.altText,
          placeholders_used: assets.placeholdersUsed,
        }
      : {},
    experiments: {
      pre_launch_tests: experiments.output.tests.map((t) => ({
        name: t.name,
        hypothesis: t.hypothesis,
        method: t.method,
        cost: t.cost,
        success_criterion: t.successCriterion,
        kill_criterion: t.killCriterion,
        decision_it_changes: t.decisionItChanges,
      })),
      success_criteria: experiments.output.successCriteria,
      kill_criteria: experiments.output.killCriteria.map((k) => k.statement),
      kill_criteria_detail: experiments.output.killCriteria,
      measurement_plan: experiments.output.measurementPlan,
      pre_registered: experiments.output.preRegistered,
    },
    failure_conditions: [
      {
        statement: `This assessment fails if it would read identically for a different artifact.`,
        observable: 'Swapping the input produces the same recommendations.',
        horizon: 'Immediately, on your own read-through',
      },
      ...experiments.output.killCriteria,
    ],
    post_launch_learning: {
      signals_to_track: experiments.output.measurementPlan,
      questions_to_ask: [
        'Which sentence did people quote back to you? That sentence is the next headline.',
        'Did anyone forward it without being asked? Who, and into what room?',
        'How many people described it as something it is not?',
      ],
      update_triggers: [
        'A reply corrects a factual claim: fix within 24 hours, publicly.',
        'Three people describe the category differently from you: the category claim is failing.',
        'Engagement without forwards: the frame works and the forwarding asset does not exist.',
      ],
      outcome_recorded: false,
    },
    ethics_review: {
      ethical_risk_check: [
        { risk: 'Weaponisation as a spam generator', assessment: 'caution', note: 'Outreach is capped at three contacts by design; there is no bulk path.' },
        { risk: 'Score quoted as a credential', assessment: 'caution', note: 'The AQI is a rubric, not a forecast. The disclaimer ships in every document.' },
        { risk: 'Privacy of the analysed artifact', assessment: networkCalls === 0 ? 'clear' : 'caution', note: networkCalls === 0 ? 'Zero outbound requests.' : `${networkCalls} outbound request(s); use --offline for zero.` },
        { risk: 'Deception in generated assets', assessment: selfBlockers.length ? 'violation' : 'clear', note: selfBlockers.length ? 'Generator defect detected by the outbound scan.' : 'Outbound scan passed.' },
        ...abuse.output.risks.map((r) => ({ risk: r.risk, assessment: 'caution' as const, note: r.mitigation })),
      ],
      do_not_launch_yet: blocked,
      do_not_launch_reason: blockedReason,
      audience_could_read_this: honesty.passed && !blocked,
      reviewer: 'deterministic-rules',
    },
    accessibility: {
      reading_level: access.output.readingLevel,
      jargon_density: signals.jargonDensity,
      alt_text_present: !Object.values(access.output.issues).some((i) => i.issue.includes('alt text')),
      plain_language_rewrite: access.output.plainLanguageRewrite,
      screen_reader_notes: access.output.screenReaderNotes,
    },
    limitations: [
      ...new Set([
        'Scores are a rubric, not a prediction. A high score has launched into silence; a low score has spread.',
        `Saturation is ${saturated ? 'one platform\'s keyword count' : 'unknown in this run'}. It is not a market size.`,
        'Emotional stake is inferred from a keyword lexicon, not measured.',
        'No broadcaster was contacted and none consented. Every candidate is a hypothesis about a role.',
        'No human comprehension test was run.',
        'Only text was analysed. Images, audio, and video were not read.',
        ...privacy.output.warnings.map((w) => `Privacy: ${w}`),
        ...access.output.untested.map((u) => `Accessibility untested: ${u}`),
        ...radar.output.missingData.map((m) => `Missing data: ${m}`),
        'Time Machine and critic simulation are speculative and labelled as such.',
      ]),
      'This document is not legal, financial, or medical advice, and it is not a guarantee of any outcome.',
    ],
    x_agents: {
      'category-cartographer': cartographer.output,
      'saturation-radar': radar.output,
      'broadcaster-ethicist': broadcaster.output,
      'friction-surgeon': friction.output,
      'honesty-firewall': {
        passed: honestyVerdict.output.passed,
        rewrites: honestyVerdict.output.rewrites,
        cannotCheck: honestyVerdict.output.cannotCheck,
      },
      'experiment-weaver': experiments.output,
      'critic-simulator': critics.output,
      'antifragile': anti && !isRefusal(anti) ? anti.output : null,
      'accessibility-guardian': access.output,
      'privacy-sentinel': privacy.output,
      'abuse-sentinel': abuse.output,
      'translation-diplomat': translation && !isRefusal(translation) ? translation.output : null,
      'time-machine': time && !isRefusal(time) ? time.output : null,
      'agent-refusals': ([broadcaster, cartographer, radar, friction, honestyVerdict, assetKit, experiments, critics, access, privacy, abuse] as Array<
        { refused?: boolean } | undefined
      >)
        .filter((r): r is { refused: true; code: string; reason: string } => Boolean(r && (r as { refused?: boolean }).refused))
        .map((r) => ({ code: r.code, reason: r.reason })),
      weakest_dimension: weakest.key,
      top_leverage: leverage.map((d) => ({ key: d.key, lost_points: Math.round(((100 - d.score) * d.weight) / 100) })),
    },
  };

  return doc;
}

function firstSentence(text: string): string {
  const first = text.replace(/^#+\s.*/gm, '').trim().split(/(?<=[.!?])\s/)[0] ?? '';
  return first.length > 8 ? first.slice(0, 300) : '(no description found)';
}

/** Re-exported for the CLI's saturation path so both code paths interpret counts identically. */
export { bandFromRepoCount, detectCrowdedCategory, adjacentCategories };
