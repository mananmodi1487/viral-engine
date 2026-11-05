/**
 * The 20-dimension Attempt Quality Index, computed from deterministic signals.
 *
 * Inheritance from v1 that must not be lost:
 *  - a score is a pure function of extracted signals
 *  - every score carries its basis, so a reader knows whether it was counted,
 *    ruled, or judged
 *  - `unavailable` is used rather than guessing
 *  - every dimension carries a failure condition
 *
 * New in v2: every dimension also carries evidence, assumptions, missing data,
 * and one improvement action, because a number you cannot argue with is a number
 * you cannot learn from.
 */
import {
  dimension,
  computeAqi,
  type AqiDimension,
  type AqiResult,
} from '../../../protocol/src/aqi.js';
import type { Signals } from '../signals.js';
import type { HonestyCheck } from '../schemas.js';
import { detectCrowdedCategory, adjacentCategories } from '../categories.js';

export interface AqiInputs {
  signals: Signals;
  honesty: HonestyCheck;
  /** Raw text, for the few checks that need exact phrasing. */
  text: string;
  saturationKnown: boolean;
  saturationEvidence: string;
  hasDescription: boolean;
  /** Present when the user supplied context the document does not contain. */
  declaredAudience?: string;
  declaredBroadcaster?: string;
  /** Accessibility result from the accessibility package, when run. */
  accessibilityScore?: number;
  accessibilityBasis?: 'measured' | 'heuristic' | 'unavailable';
  lang?: string;
}

const clamp = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));
const sat = (n: number, floor: number, span: number): number =>
  Math.max(0, Math.min(span, span * (1 - Math.exp(-Math.max(0, n) / floor))));

/* ---------- individual dimensions ---------- */

function categoryClarity(s: Signals, hasDescription: boolean): AqiDimension {
  let score = 34;
  const evidence: string[] = [];
  if (hasDescription) { score += 14; evidence.push('a one-line description exists'); }
  else evidence.push('no one-line description to carry the category');
  if (s.identityMarkers.length) { score += 10; evidence.push(`names an audience: ${s.identityMarkers.slice(0, 2).map((t) => t.term).join(', ')}`); }
  if (s.hasCategoryPairing) { score += 20; evidence.push('contains an explicit "not X, but Y" pairing'); }
  else evidence.push('no explicit contrast with the category it is leaving');
  if (s.jargonDensity > 0.12) { score -= 14; evidence.push(`jargon density ${(s.jargonDensity * 100).toFixed(0)}% exceeds the 12% readability line`); }
  if (s.wordCount < 40) { score -= 10; evidence.push(`only ${s.wordCount} words — too little to establish a category`); }
  return dimension('category_clarity', score, {
    basis: 'structural',
    confidence: evidence.length >= 3 ? 'medium' : 'low',
    evidence,
    assumptions: ['A reader meets the first screen first; later clarity cannot repair an unclear first line.'],
    missingData: ['No comprehension test with a real outside reader was run.'],
    improvement: s.hasCategoryPairing
      ? 'Sharpen the pairing so the new category names a job the audience already budgets for.'
      : 'Add one sentence of the form: "It is not <crowded category>. It is <new category> — for <specific person>."',
    failureCondition: 'This score is wrong if readers still describe the artifact as "just another X" in unprompted feedback.',
  });
}

function categoryOpportunity(s: Signals, text: string, saturationKnown: boolean, saturationEvidence: string): AqiDimension {
  const crowded = detectCrowdedCategory(s, text);
  const adjacent = adjacentCategories(crowded.slug);
  const best = [...adjacent].sort((a, b) => b.tensionScore - a.tensionScore)[0];
  let score = 45;
  const evidence = [`detected category: ${crowded.label} (heuristic map)`, `saturation evidence: ${saturationEvidence}`];
  if (saturationKnown) { score += 15; evidence.push('a measured count was available, not a guess'); }
  else evidence.push('saturation is unknown — no count could be measured');
  if (best) { score += Math.min(28, best.tensionScore * 7); evidence.push(`best adjacent category: ${best.name} (tension ${best.tensionScore}/5)`); }
  if (s.hasCategoryPairing) { score += 12; evidence.push('the document already claims an adjacent category'); }
  return dimension('category_opportunity', score, {
    basis: saturationKnown ? 'measured' : 'heuristic',
    confidence: saturationKnown ? 'medium' : 'low',
    evidence,
    assumptions: ['Category maps are built from keyword families, not a measured taxonomy.'],
    missingData: saturationKnown ? [] : ['No competitor count. The opportunity estimate is directional only.'],
    improvement: 'Claim the adjacent category in the first sentence, and name one real thing you are not.',
    failureCondition: 'This fails if the adjacent category sounds emptier but the audience has no budget, vocabulary, or gathering place for it.',
  });
}

function audienceSpecificity(s: Signals, declared?: string): AqiDimension {
  const evidence: string[] = [];
  let score = 30;
  if (declared) { score += 30; evidence.push(`user declared an audience: ${declared}`); }
  if (s.identityMarkers.length) { score += 18; evidence.push(`identity cues: ${s.identityMarkers.slice(0, 3).map((t) => t.term).join(', ')}`); }
  else evidence.push('no identity cue ("for developers", "for teachers", "for people who...")');
  if (s.tribeMarkers.length) { score += 14; evidence.push(`community/tribe cues: ${s.tribeMarkers.slice(0, 3).map((t) => t.term).join(', ')}`); }
  if (s.wordCount > 0 && !s.identityMarkers.length && !declared) {
    evidence.push('audience must be inferred, which the engine will not do silently');
  }
  return dimension('audience_specificity', score, {
    basis: declared ? 'user-supplied' : 'structural',
    confidence: declared ? 'high' : 'low',
    evidence,
    assumptions: ['A named role is not the same as a named person; only the latter can be approached.'],
    missingData: declared ? [] : ['No user-declared audience. Specificity is inferred from vocabulary alone.'],
    improvement: 'Name one role AND where they gather. "Indie game developers who ship to itch.io" beats "creators".',
    failureCondition: 'This fails if a reader who fits the audience does not recognise themselves in the first two sentences.',
  });
}

function broadcasterFit(s: Signals, declared?: string): AqiDimension {
  let score = 26;
  const evidence: string[] = [];
  if (declared) { score += 30; evidence.push(`user named a broadcaster kind: ${declared}`); }
  if (s.tribeMarkers.length) { score += 20; evidence.push(`names ${s.tribeMarkers.length} community cue(s)`); }
  else evidence.push('names no community, so there is no obvious amplifier');
  if (s.properNouns.length >= 3) { score += 16; evidence.push(`${s.properNouns.length} recurring proper nouns — citable anchors`); }
  else evidence.push('few proper nouns: little for a broadcaster to anchor on');
  if (s.wordCount <= 900) { score += 12; evidence.push(`${s.wordCount} words — quotable in one screen`); }
  else evidence.push(`${s.wordCount} words — a broadcaster must read it to describe it`);
  if (s.hasFirstPersonReceipt) { score += 10; evidence.push('first-person receipt a broadcaster can attribute'); }
  return dimension('broadcaster_fit', score, {
    basis: 'structural',
    confidence: 'low',
    evidence,
    assumptions: ['Community vocabulary is a proxy for a broadcaster existing, not proof that one would share.'],
    missingData: ['No real broadcaster has been contacted. Consent status is unknown.'],
    improvement: 'Name one real broadcaster and write the sentence they would paste. If you cannot, there is no amplifier.',
    failureCondition: 'This fails if the named broadcaster reads the message as a favour request rather than as something that serves their people.',
  });
}

function broadcastStake(s: Signals, declared?: string): AqiDimension {
  let score = 30;
  const evidence: string[] = [];
  if (declared) { score += 18; evidence.push('the broadcaster\'s stake was stated explicitly'); }
  if (s.hasEnemy) { score += 16; evidence.push('a named enemy gives the broadcaster a position to take'); }
  if (s.hasFirstPersonReceipt) { score += 16; evidence.push('first-person evidence makes citing it safe'); }
  if (s.highArousal.reduce((a, b) => a + b.count, 0) > 0) { score += 10; evidence.push('activating language present (awe/relief class)'); }
  if (!s.tribeMarkers.length) { score -= 8; evidence.push('no community named, so "their people" cannot be identified'); }
  evidence.push('stake is inferred from framing; no broadcaster was asked');
  return dimension('broadcast_stake', score, {
    basis: 'heuristic',
    confidence: 'low',
    evidence,
    assumptions: ['People pass on things that make them look good, useful, or consistent. This is a robust pattern, not a measured law for any individual.'],
    missingData: ['No interview with a broadcaster about why they actually shared something.'],
    improvement: 'Answer in one line: "Sharing this makes <broadcaster> look like the person who <creditable thing>."',
    failureCondition: 'This fails if sharing it would cost the broadcaster standing with their own audience — the stake is then negative.',
  });
}

function shareFriction(s: Signals, hasForwardable: boolean): AqiDimension {
  let score = 100;
  const evidence: string[] = [];
  const friction = s.shareFrictionMarkers.reduce((a, b) => a + b.count, 0);
  if (friction > 0) { const p = Math.min(40, sat(friction, 2, 40)); score -= p; evidence.push(`${friction} prerequisite/configuration cue(s) raise the cost of a first try`); }
  else evidence.push('no prerequisite or configuration language found');
  if (s.installSteps > 3) { score -= 16; evidence.push(`${s.installSteps} setup steps before first value`); }
  else if (s.installSteps === 0) { score -= 12; evidence.push('no explicit first command; a reader must infer where to start'); }
  else evidence.push(`${s.installSteps} setup step(s) — within a one-screen budget`);
  if (s.codeBlockCount > 8) { score -= 12; evidence.push(`${s.codeBlockCount} code blocks: hard to screenshot, hard to quote`); }
  if (hasForwardable) { score += 8; evidence.push('a self-contained forwardable block exists'); }
  else evidence.push('no self-contained block a reader could forward without commentary');
  return dimension('share_friction_reduction', score, {
    basis: 'measured',
    confidence: 'medium',
    evidence,
    assumptions: ['Counted cues are proxies for effort; effort, not text length, is what stops a forward.'],
    improvement: s.installSteps > 3
      ? 'Cut the path to first value to one command; move every prerequisite into a details block.'
      : 'Add one screenshot-ready artifact a reader can forward with no explanation attached.',
    failureCondition: 'This fails if a friendly reader says "I would have sent it, but I could not work out what to say about it."',
  });
}

function emotionalTruth(s: Signals, honesty: HonestyCheck): AqiDimension {
  const arousal = s.highArousal.reduce((a, b) => a + b.count, 0);
  const deact = s.deactivating.reduce((a, b) => a + b.count, 0);
  const outrage = honesty.findings.filter((f) => /outrage|manufactured/i.test(f.rule)).length;
  const net = arousal - deact;
  let score = 38 + sat(Math.max(0, net), 2, 42) - Math.min(24, deact * 6) - outrage * 25;
  const evidence = [
    `${arousal} high-arousal term(s), ${deact} deactivating term(s)`,
    net <= 0 ? 'no activating language: no physical impulse to forward' : 'activating language present',
  ];
  if (s.hasEnemy) { score += 8; evidence.push('enemy framing raises tension'); }
  if (outrage > 0) evidence.push(`manufactured-outrage pattern detected ${outrage}x — this is a lie about stakes`);
  return dimension('emotional_truth', score, {
    basis: 'heuristic',
    confidence: 'low',
    evidence,
    assumptions: ['Berger & Milkman (2012): high-arousal emotions increase sharing; sadness deactivates. Lexicon counting is a coarse proxy for arousal.'],
    missingData: ['No measurement of how readers actually felt.'],
    improvement: net <= 0
      ? 'Name one concrete stake: what does the reader lose by ignoring this, in their own words?'
      : 'Keep the arousal honest. Anger travels and erodes trust; prefer awe or relief over outrage.',
    failureCondition: 'This fails if the emotion is manufactured — readers forgive dull copy and never forgive being played.',
  });
}

function proofReadiness(s: Signals, honesty: HonestyCheck): AqiDimension {
  let score = 50;
  const evidence: string[] = [];
  const blockers = honesty.findings.filter((f) => f.severity === 'blocker').length;
  const warnings = honesty.findings.filter((f) => f.severity === 'warning').length;
  if (blockers) { score -= Math.min(50, blockers * 22); evidence.push(`${blockers} claim(s) a reader could publicly disprove`); }
  else { score += 15; evidence.push('no unbacked claims detected'); }
  if (warnings) { score -= Math.min(18, warnings * 6); evidence.push(`${warnings} warning-level claim(s)`); }
  if (s.receiptClaims.length) { score += 12; evidence.push(`${s.receiptClaims.length} specific figure(s) present — verifiable if sourced`); }
  if (s.hasFirstPersonReceipt) { score += 12; evidence.push('first-person evidence of the work'); }
  if (s.hasFailureCondition) { score += 10; evidence.push('already states a failure condition'); }
  return dimension('proof_readiness', score, {
    basis: 'measured',
    confidence: 'medium',
    evidence,
    assumptions: ['A claim needs a source the reader can reach, not a source the author has.'],
    improvement: blockers
      ? 'Replace every unbacked figure with [your real number] and say how you will measure it.'
      : 'Add the failure condition: "This fails if ___." Cheapest credibility available.',
    failureCondition: 'This fails if one number is wrong. A single fabricated figure converts a launch into a correction thread, and the correction is what gets screenshotted.',
  });
}

function launchTiming(s: Signals, honesty: HonestyCheck): AqiDimension {
  let score = 45;
  const evidence: string[] = [];
  if (s.installSteps >= 1 && s.installSteps <= 3) { score += 22; evidence.push('a first-run path exists and is short'); }
  else if (s.installSteps > 3) { score += 4; evidence.push('a first-run path exists but is long'); }
  else evidence.push('no first-run path: a launch would land on an unclear start');
  if (s.shareFrictionMarkers.some((m) => /experimental|unstable|wip|alpha|beta/.test(m.term))) {
    score -= 18; evidence.push('self-described as unstable, which suppresses trial');
  }
  if (s.hasFailureCondition) { score += 14; evidence.push('kill criteria already written down'); }
  if (honesty.findings.some((f) => f.severity === 'blocker')) { score -= 20; evidence.push('honesty blockers present — launching now burns the attempt'); }
  return dimension('launch_timing', score, {
    basis: 'heuristic',
    confidence: 'low',
    evidence,
    assumptions: ['There is no universal good week. This measures readiness, not calendar luck.'],
    missingData: ['No external calendar awareness (competitor launches, news cycles, holidays).'],
    improvement: 'Decide the one channel and the one asset before launch day. "Post everywhere" is not a plan.',
    failureCondition: 'This fails if you launch to prove you launched. A wasted attempt costs more than a delayed one because you only get one first impression.',
  });
}

function honestyIntegrity(honesty: HonestyCheck, text: string): AqiDimension {
  const blockers = honesty.findings.filter((f) => f.severity === 'blocker').length;
  const warnings = honesty.findings.filter((f) => f.severity === 'warning').length;
  const notes = honesty.findings.filter((f) => f.severity === 'note').length;
  const score = clamp(100 - (blockers * 38 + warnings * 12 + notes * 4));
  const evidence = [`${blockers} blocker(s), ${warnings} warning(s), ${notes} note(s) in the honesty scan`];
  if (/testimonial|"[\w ]+"\s*[—-]\s*(?:CEO|founder|CTO)/i.test(text)) evidence.push('testimonial-shaped text present; verify each one exists');
  return dimension('honesty_integrity', score, {
    basis: 'measured',
    confidence: 'medium',
    evidence,
    assumptions: ['Pattern matching finds shapes, not lies. A human must read blocker findings in context.'],
    missingData: ['We cannot verify whether the claims you make are true — only whether they are the shape of unverifiable claims.'],
    improvement: blockers
      ? 'Remove every blocker before publishing. No exceptions, no "illustrative" figures.'
      : 'Keep it. The absence of overclaiming is the differentiator, not a constraint.',
    failureCondition: 'This fails if a claim that we could not detect turns out to be false. The honesty audit reduces risk; it does not certify truth.',
    doNotLaunchYet: blockers > 0,
  });
}

function failureAwareness(s: Signals, text: string): AqiDimension {
  let score = 20;
  const evidence: string[] = [];
  const hasFailure = /\b(?:this fails if|fails if|will fail when|failure condition|kill criteria|kill criterion)\b/i.test(text);
  const hasObservable = /\b(?:observable|you will see|you would see|signal|metric below|drops below|no replies|no forwards)\b/i.test(text);
  const hasHorizon = /\b(?:\d+\s*(?:hours?|days?|weeks?)|first 24 hours|within a month|by week \d)\b/i.test(text);
  if (hasFailure) { score += 30; evidence.push('states a failure condition explicitly'); }
  else evidence.push('no failure condition anywhere in the document');
  if (hasObservable) { score += 22; evidence.push('describes an observable signal'); }
  else evidence.push('no observable signal: failure could not be detected, only felt');
  if (hasHorizon) { score += 18; evidence.push('gives a time horizon'); }
  else evidence.push('no horizon: a failure condition without a date is a mood');
  if (s.hasFailureCondition) { score += 8; }
  return dimension('failure_awareness', score, {
    basis: hasFailure ? 'measured' : 'structural',
    confidence: hasFailure ? 'medium' : 'low',
    evidence,
    assumptions: ['A criterion written before launch cannot be rationalised afterwards. That is its only value.'],
    improvement: 'Add: "This fails if <observable thing> has not happened <horizon>." Write it in the file, not in your head.',
    failureCondition: 'This dimension itself fails if the stated criterion is post-hoc: rewritten after the result to look prophetic.',
  });
}

function experimentability(text: string, hasTests: boolean): AqiDimension {
  let score = 28;
  const evidence: string[] = [];
  const mentionsTest = /\b(?:test|experiment|pilot|dry run|soft launch|pre-launch|5 people|ten people)\b/i.test(text);
  if (mentionsTest) { score += 20; evidence.push('mentions a test or pilot'); } else evidence.push('no test or pilot mentioned');
  if (hasTests) { score += 32; evidence.push('a structured experiment plan was generated for this artifact'); }
  if (/\b(?:survey|interview|reply|ask \d|show it to)\b/i.test(text)) { score += 12; evidence.push('mentions talking to real people before launch'); }
  else evidence.push('no plan to put it in front of a human before launch');
  return dimension('experimentability', score, {
    basis: 'structural',
    confidence: 'low',
    evidence,
    assumptions: ['The cheapest test is usually showing the artifact to five specific people and watching where they stop.'],
    missingData: hasTests ? [] : ['No experiment plan was generated in this run.'],
    improvement: 'Run one test that costs under an hour: five people in the target role read the first screen and repeat back what it is.',
    failureCondition: 'This fails if the test cannot change the plan. A test whose outcome you would ignore is theatre.',
  });
}

function accessibilityDim(input: AqiInputs): AqiDimension {
  const s = input.signals;
  if (typeof input.accessibilityScore === 'number') {
    return dimension('accessibility', input.accessibilityScore, {
      basis: input.accessibilityBasis ?? 'measured',
      confidence: 'medium',
      evidence: ['computed by packages/core/src/accessibility on the rendered output'],
      improvement: 'Fix the highest-severity accessibility finding from the accessibility report.',
      failureCondition: 'This fails if a screen-reader user cannot navigate the primary artifact.',
    });
  }
  let score = 58;
  const evidence: string[] = [];
  const longSentences = (input.text.match(/[^.!?]{140,}[.!?]/g) ?? []).length;
  if (longSentences > 3) { score -= 16; evidence.push(`${longSentences} sentences over 140 characters`); }
  else evidence.push('sentence length is within a readable range');
  if (s.jargonDensity > 0.12) { score -= 18; evidence.push(`jargon density ${(s.jargonDensity * 100).toFixed(0)}%`); }
  const hasImages = /!\[[^\]]*\]\(|<img\s/i.test(input.text);
  const hasAlt = /!\[[^\]]{3,}\]\(|<img[^>]+alt=["'][^"']{3,}/i.test(input.text);
  if (hasImages && !hasAlt) { score -= 14; evidence.push('images without alt text'); }
  else if (hasImages) evidence.push('images appear to carry alt text');
  if (input.lang && !/^en\b/i.test(input.lang)) evidence.push(`non-English content (${input.lang}): readability heuristics are English-tuned and less reliable`);
  return dimension('accessibility', score, {
    basis: 'heuristic',
    confidence: 'low',
    evidence,
    assumptions: ['Readability proxies are not a substitute for testing with assistive technology.'],
    missingData: ['No screen-reader test was run.', 'No contrast or keyboard-navigation check of the artifact itself.'],
    improvement: 'Add alt text to every image, split sentences over ~25 words, and define each term of art on first use.',
    failureCondition: 'This fails if a disabled reader hits a barrier in the artifact before reaching the value.',
  });
}

function privacySafety(input: AqiInputs, networkCalls: number): AqiDimension {
  let score = 74;
  const evidence: string[] = [];
  if (networkCalls === 0) { score += 20; evidence.push('this analysis made zero outbound network requests'); }
  else { score -= Math.min(24, networkCalls * 3); evidence.push(`${networkCalls} outbound request(s) were made`); }
  if (/\b(?:personal data|email address|phone|gdpr|consent)\b/i.test(input.text)) {
    score -= 6; evidence.push('mentions personal data or consent — review what the artifact collects');
  }
  const tracking = /(?:google-analytics|gtag\(|fbq\(|hotjar|mixpanel|segment\.io)/i.test(input.text);
  if (tracking) { score -= 20; evidence.push('third-party tracking detected in the artifact'); }
  return dimension('privacy_safety', score, {
    basis: 'measured',
    confidence: 'high',
    evidence,
    assumptions: ['A tool cannot prove the artifact is privacy-safe; it can prove its own network behaviour.'],
    missingData: ['Data flows inside the artifact itself were not audited.'],
    improvement: "Ship the artifact's own privacy statement in one sentence a non-lawyer can read.",
    failureCondition: 'This fails if the artifact collects data it does not need, or if analysis required uploading the user\'s private material.',
  });
}

function abuseResistance(input: AqiInputs): AqiDimension {
  let score = 70;
  const evidence: string[] = [];
  const risky = /\b(?:mass (?:dm|message|email)|scrape|automate (?:posts|dms)|bulk outreach|bot|astroturf|fake accounts?)\b/i.test(input.text);
  if (risky) { score -= 35; evidence.push('language associated with mass or automated outreach'); }
  else evidence.push('no mass-outreach or automation language detected');
  const consent = /\b(?:consent|opt[- ]in|permission|asked first|respect(?:s|ing)? (?:their|the) (?:rules|time))\b/i.test(input.text);
  if (consent) { score += 12; evidence.push('explicit consent language present'); }
  else evidence.push('no consent language present');
  if (input.declaredBroadcaster) { score += 6; evidence.push('a specific broadcaster was named, which is incompatible with spray-and-pray'); }
  return dimension('abuse_resistance', score, {
    basis: 'structural',
    confidence: 'medium',
    evidence,
    assumptions: ['The engine can detect the shape of abuse, not intent.'],
    improvement: 'Add the sentence: "I will contact at most N people, once, with something useful, and stop if they do not reply."',
    failureCondition: 'This fails if the technique works better at scale. Then it is a spam engine wearing diagnostics.',
  });
}

function culturalResonance(s: Signals, text: string, lang?: string): AqiDimension {
  let score = 52;
  const evidence: string[] = [];
  const idioms = (text.toLowerCase().match(/\b(?:crushing it|ninja|rockstar|10x|hustle|grind|silver bullet|move the needle)\b/g) ?? []);
  if (idioms.length) { score -= Math.min(20, idioms.length * 7); evidence.push(`${idioms.length} idiom(s) that do not travel across cultures or generations`); }
  else evidence.push('no culture-bound idioms detected');
  if (s.properNouns.length >= 3) { score += 10; evidence.push('refers to named things a specific culture can place'); }
  if (lang && !/^en\b/i.test(lang)) { evidence.push(`non-English (${lang}): cultural fit was not assessed by a native reader`); score -= 8; }
  return dimension('cultural_resonance', score, {
    basis: 'heuristic',
    confidence: 'low',
    evidence,
    assumptions: ['Cultural fit is judged by a human who belongs to the culture. This is a vocabulary check.'],
    missingData: ['No native-speaker review.', 'No assessment of how the framing reads outside the author\'s subculture.'],
    improvement: 'State the claim without slang, then ask one person outside your field whether it means what you think.',
    failureCondition: 'This fails if the joke, reference, or status claim only parses inside one community — outside it, the artifact reads as noise or as an insult.',
  });
}

function languageSimplicity(s: Signals, text: string): AqiDimension {
  let score = 88;
  const evidence: string[] = [];
  if (s.jargonDensity > 0.12) { score -= Math.min(30, (s.jargonDensity - 0.12) * 220); evidence.push(`jargon density ${(s.jargonDensity * 100).toFixed(0)}%`); }
  else evidence.push(`jargon density ${(s.jargonDensity * 100).toFixed(0)}% is within range`);
  const avgSentence = s.sentenceCount ? s.wordCount / s.sentenceCount : 0;
  if (avgSentence > 26) { score -= 16; evidence.push(`average sentence ${avgSentence.toFixed(0)} words`); }
  else evidence.push(`average sentence ${avgSentence.toFixed(0)} words`);
  const acronyms = new Set((text.match(/\b[A-Z]{2,6}\b/g) ?? []));
  if (acronyms.size > 8) { score -= 12; evidence.push(`${acronyms.size} distinct acronyms`); }
  return dimension('language_simplicity', score, {
    basis: 'measured',
    confidence: 'medium',
    evidence,
    assumptions: ['Jargon is field-relative: "transformer" is plain to one reader and opaque to another.'],
    missingData: ['No comprehension test with a reader outside the field.'],
    improvement: 'Define every term of art the first time it appears, in the same sentence, in under eight words.',
    failureCondition: 'This fails if a smart reader outside the field has to look something up before understanding what the thing is.',
  });
}

function assetCompleteness(hasForwardable: boolean, assetCount: number): AqiDimension {
  let score = 24;
  const evidence: string[] = [];
  if (hasForwardable) { score += 24; evidence.push('a forwardable one-liner exists'); } else evidence.push('no forwardable one-liner');
  if (assetCount > 0) { score += Math.min(34, assetCount * 7); evidence.push(`${assetCount} launch asset(s) generated`); }
  else evidence.push('no launch assets generated in this run');
  return dimension('asset_completeness', score, {
    basis: 'structural',
    confidence: 'medium',
    evidence,
    assumptions: ['Assets must be usable without editing to lower friction; placeholders still require the author\'s work.'],
    improvement: 'Ship the one-line summary, one screenshot, and one citable paragraph. That is the whole kit.',
    failureCondition: 'This fails if every asset contains a [placeholder] the author never fills in — the forwarder then has to write it, which is the friction you were removing.',
  });
}

function postLaunchLearnability(text: string): AqiDimension {
  let score = 30;
  const evidence: string[] = [];
  if (/\b(?:post-?mortem|retrospective|what we learned|after launch|outcome)\b/i.test(text)) { score += 24; evidence.push('mentions recording what happened'); }
  else evidence.push('no plan to write down what happened');
  if (/\b(?:which sentence got quoted|replies|first 20|signal to track)\b/i.test(text)) { score += 14; evidence.push('names a signal worth reading'); }
  if (/\b(?:update trigger|next attempt|iterate)\b/i.test(text)) { score += 10; evidence.push('mentions updating the plan'); }
  return dimension('post_launch_learnability', score, {
    basis: 'structural',
    confidence: 'low',
    evidence,
    assumptions: ['An attempt that produces no written lesson costs you the attempt and the lesson.'],
    improvement: 'Write the postmortem skeleton before launch: three questions you will answer one week later, whatever happens.',
    failureCondition: 'This fails if the only record of the launch is a tweet about it.',
  });
}

function ethicalDefensibility(honesty: HonestyCheck, abuseScore: number, text: string): AqiDimension {
  let score = 72;
  const evidence: string[] = [];
  const blockers = honesty.findings.filter((f) => f.severity === 'blocker').length;
  if (blockers) { score -= Math.min(52, blockers * 26); evidence.push(`${blockers} honesty blocker(s) — the audience would object if they saw the method`); }
  else evidence.push('no honesty blockers');
  if (abuseScore < 50) { score -= 18; evidence.push('abuse-resistance signals are weak'); }
  if (/\b(?:fake|astroturf|sockpuppet|manufactured)\b/i.test(text)) { score -= 20; evidence.push('mentions manufactured behaviour'); }
  if (/\b(?:transparent|disclose|honest|we will say)\b/i.test(text)) { score += 8; evidence.push('mentions disclosure or transparency'); }
  return dimension('ethical_defensibility', score, {
    basis: 'structural',
    confidence: 'medium',
    evidence,
    assumptions: ['The test is: would the target audience accept this plan if they read it verbatim?'],
    improvement: 'Write the one sentence you would have to hide for the plan to work. That sentence is the plan\'s real problem.',
    failureCondition: 'This fails if the plan depends on the audience not finding out how it was made.',
    doNotLaunchYet: blockers > 0,
  });
}

/* ---------- assembly ---------- */

export function scoreAqi(input: AqiInputs & { networkCalls?: number; hasForwardable?: boolean; assetCount?: number }): AqiResult {
  const { signals: s, honesty, text } = input;
  const networkCalls = input.networkCalls ?? 0;
  const hasForwardable = input.hasForwardable ?? /(?:^|\n)\s*>?\s*.{20,160}[.!]?\s*(?:\n|$)/.test(text);
  const assetCount = input.assetCount ?? 0;

  const dims = [
    categoryClarity(s, input.hasDescription),
    categoryOpportunity(s, text, input.saturationKnown, input.saturationEvidence),
    audienceSpecificity(s, input.declaredAudience),
    broadcasterFit(s, input.declaredBroadcaster),
    broadcastStake(s, input.declaredBroadcaster),
    shareFriction(s, hasForwardable),
    emotionalTruth(s, honesty),
    proofReadiness(s, honesty),
    launchTiming(s, honesty),
    honestyIntegrity(honesty, text),
    failureAwareness(s, text),
    experimentability(text, false),
    accessibilityDim(input),
    privacySafety(input, networkCalls),
    abuseResistance(input),
    culturalResonance(s, text, input.lang),
    languageSimplicity(s, text),
    assetCompleteness(hasForwardable, assetCount),
    postLaunchLearnability(text),
    ethicalDefensibility(honesty, abuseResistance(input).score, text),
  ];

  return computeAqi(dims);
}
