/**
 * Agents 13, 14, 15 — Accessibility Guardian, Privacy Sentinel, Abuse Sentinel.
 *
 * These three exist because the alternatives are worse:
 *  - An accessibility check bolted on at the end is decoration.
 *  - A privacy claim without a network counter is a promise.
 *  - An abuse policy that lives in a README is a wish.
 *
 * Each sentinel returns a *verdict with a mechanism* — something the user can
 * observe or test — rather than a reassurance.
 */
import type { AgentContext, AgentOutcome } from './types.js';
import { screenForAbuse } from './types.js';

/* ---------------- 13. Accessibility Guardian ---------------- */

export interface AccessibilityReport {
  score: number;
  readingLevel: string;
  issues: Array<{ issue: string; severity: 'serious' | 'moderate' | 'minor'; fix: string; wcag?: string }>;
  plainLanguageRewrite: string | null;
  screenReaderNotes: string[];
  /** What was not tested. */
  untested: string[];
}

export function accessibilityGuardian(ctx: AgentContext): AgentOutcome<AccessibilityReport> {
  const text = ctx.text;
  const sentences = text.split(/[.!?]+\s/).filter((s) => s.trim().length > 0);
  const words = text.trim().split(/\s+/).filter(Boolean);
  const longSentences = sentences.filter((s) => s.split(/\s+/).length > 28);
  const longWords = words.filter((w) => w.replace(/[^a-z]/gi, '').length >= 12);
  const avgWords = sentences.length ? words.length / sentences.length : 0;

  // Flesch-Kincaid grade level. Approximate, English-only, stated as such.
  const syllables = words.reduce((a, w) => a + countSyllables(w), 0);
  const grade = sentences.length && words.length
    ? 0.39 * avgWords + 11.8 * (syllables / words.length) - 15.59
    : 0;

  const issues: AccessibilityReport['issues'] = [];
  if (longSentences.length > 2) {
    issues.push({
      issue: `${longSentences.length} sentences over 28 words`,
      severity: 'moderate',
      fix: 'Split at the first conjunction. Under 25 words is the target; under 20 is better.',
      wcag: 'WCAG 2.2 SC 3.1.5 (AAA) reading level',
    });
  }
  if (longWords.length > words.length * 0.04) {
    issues.push({
      issue: `${longWords.length} words of 12+ characters`,
      severity: 'moderate',
      fix: 'Replace with the shorter word you would use out loud. "Utilise" → "use".',
    });
  }
  const images = [...text.matchAll(/!\[([^\]]*)\]\(([^)]+)\)|<img([^>]*)>/gi)];
  /**
   * Alt text that names the medium instead of the content is not alt text.
   * "image", "screenshot", "photo" tell a screen-reader user what they already
   * know from the fact that it is an image element, and say nothing about what
   * the image communicates.
   */
  const NON_DESCRIPTIVE = /^\s*(?:an?\s+)?(?:image|img|picture|photo|screenshot|screen shot|figure|graphic|icon|logo|banner|chart|diagram|alt|placeholder|todo|tbd|[\w-]+\.(?:png|jpe?g|gif|webp|svg))\s*$/i;
  const badAlt = (alt: string | undefined): boolean => {
    const a = (alt ?? '').trim();
    return a.length < 3 || NON_DESCRIPTIVE.test(a);
  };
  const missingAlt = images.filter((m) => {
    const inlineAlt = m[3]?.match(/alt\s*=\s*["']([^"']*)["']/)?.[1];
    return badAlt(m[1] ?? inlineAlt);
  });
  if (missingAlt.length) {
    issues.push({
      issue: `${missingAlt.length} image(s) without alt text`,
      severity: 'serious',
      fix: 'Describe what the image communicates, not that it is an image. Empty alt is correct only for decoration.',
      wcag: 'WCAG 2.2 SC 1.1.1',
    });
  }
  if (/^\s*[#>*-]/m.test(text) === false && words.length > 300) {
    issues.push({
      issue: 'no headings in a long document',
      severity: 'moderate',
      fix: 'Add headings every 150–250 words so screen-reader users can navigate by structure.',
      wcag: 'WCAG 2.2 SC 1.3.1, 2.4.6',
    });
  }
  if (/\b(?:click here|read more|here)\b\s*[.)]/i.test(text)) {
    issues.push({
      issue: 'non-descriptive link text',
      severity: 'serious',
      fix: 'Link text must make sense out of context: "the ODS schema", not "here".',
      wcag: 'WCAG 2.2 SC 2.4.4',
    });
  }
  if (/[A-Z]{3,}(?![^.]{0,40}(?:=|means|stands for))/.test(text.slice(0, 800))) {
    issues.push({
      issue: 'acronym used before it is defined',
      severity: 'minor',
      fix: 'Spell it out once, in the same sentence, then abbreviate freely.',
    });
  }

  const serious = issues.filter((i) => i.severity === 'serious').length;
  const moderate = issues.filter((i) => i.severity === 'moderate').length;
  const score = Math.max(0, 100 - serious * 22 - moderate * 10 - issues.filter((i) => i.severity === 'minor').length * 4);

  const report: AccessibilityReport = {
    score,
    readingLevel: grade > 0 ? `grade ${grade.toFixed(1)} (Flesch-Kincaid, English only, approximate)` : 'unavailable',
    issues,
    plainLanguageRewrite: longSentences[0] ? splitSentence(longSentences[0]) : null,
    screenReaderNotes: [
      'Headings carry the structure. A screen-reader user navigates by heading list first, so a heading that says "Introduction" costs them a jump.',
      'Every image needs alt text that states what it communicates. The scorecard image should describe the result in words, not describe the pixels.',
      'Tables need a header row. If the scorecard is a table, the first row must be marked as headers or it reads as a list of numbers.',
      'Avoid emoji as the only carrier of meaning. A red square is not a warning to a screen reader.',
    ],
    untested: [
      'No real screen reader was used (NVDA, VoiceOver, Orca). This is a text heuristic.',
      'Colour contrast of the artifact itself was not measured.',
      'Keyboard navigation was not tested.',
      'Non-English readability formulas were not applied; the Flesch-Kincaid numbers are invalid outside English.',
      'Cognitive accessibility (dyslexia-friendly spacing, plain-language levels below grade 8) was not assessed.',
    ],
  };

  return {
    agent: 'accessibility-guardian',
    findings: issues.map((i) => ({
      claim: i.issue,
      evidence: 'text analysis of the artifact',
      basis: 'measured' as const,
      confidence: i.wcag ? 'medium' : 'low',
      action: i.fix,
    })),
    limitations: report.untested,
    output: report,
  };
}

function countSyllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (w.length <= 3) return 1;
  const groups = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups?.length ?? 1);
}

function splitSentence(s: string): string {
  const parts = s.split(/,\s+(?:which|that|and|but)\s+/i);
  if (parts.length < 2) return s.trim();
  return parts.map((p) => p.trim().replace(/^./, (c) => c.toUpperCase()) + '.').join(' ');
}

/* ---------------- 14. Privacy Sentinel ---------------- */

export interface PrivacyReport {
  networkCalls: number;
  offlineCapable: boolean;
  dataSentElsewhere: string[];
  localOnlyPaths: string[];
  warnings: string[];
  /** Plain-language privacy statement the user can publish. */
  oneSentencePolicy: string;
}

export function privacySentinel(
  ctx: AgentContext,
  opts: { offline?: boolean; provider?: string } = {},
): AgentOutcome<PrivacyReport> {
  const networkCalls = ctx.networkCalls ?? 0;
  const warnings: string[] = [];

  if (!opts.offline && networkCalls > 0) {
    warnings.push(
      `${networkCalls} outbound request(s) were made. In offline mode this number is 0 and the analysis is identical except for category saturation.`,
    );
  }
  if (opts.provider && opts.provider !== 'none' && opts.provider !== 'ollama' && opts.provider !== 'llama-cpp') {
    warnings.push(
      `A hosted provider (${opts.provider}) was selected. Your document text was sent to it. Use --provider ollama or --offline to keep the text on this machine.`,
    );
  }
  if (/\b(?:api[_-]?key|secret|password|token)\s*[:=]\s*\S{8,}/i.test(ctx.text)) {
    warnings.push('The input appears to contain a credential. It has NOT been redacted in the report. Rotate it if this report is shared.');
  }
  if (/\b[\w.+-]+@[\w-]+\.[\w.]{2,}\b/.test(ctx.text)) {
    warnings.push('The input contains at least one email address. Publish the report with it removed before sharing.');
  }

  return {
    agent: 'privacy-sentinel',
    findings: warnings.map((w) => ({
      claim: w,
      evidence: 'scan of this run',
      basis: 'measured' as const,
      confidence: 'high' as const,
      action: 'Act on this before publishing the report.',
    })),
    limitations: [
      'This cannot prove the absence of tracking in the artifact. It only reports this engine\'s own behaviour.',
      'It does not redact anything automatically, because automatic redaction can silently change the meaning of a quote.',
    ],
    output: {
      networkCalls,
      offlineCapable: true,
      dataSentElsewhere: networkCalls === 0 ? [] : ['the URL or repository you asked it to fetch'],
      localOnlyPaths: [
        'viral-engine analyze ./file --offline',
        'viral-engine local-mode   (writes a config that forbids egress)',
        '--provider ollama       (proxies prose generation through your own machine)',
      ],
      warnings,
      oneSentencePolicy:
        networkCalls === 0
          ? 'This ran entirely on your machine. Nothing was sent anywhere.'
          : `This run fetched ${networkCalls} public URL(s) and sent nothing else. Add --offline to make that zero.`,
    },
  };
}

/* ---------------- 15. Abuse Sentinel ---------------- */

export interface AbuseReport {
  verdict: 'clear' | 'caution' | 'refuse';
  refusals: Array<{ code: string; reason: string; alternative: string }>;
  risks: Array<{ risk: string; why: string; mitigation: string }>;
  /** What this system will never do, regardless of instruction. */
  hardLimits: string[];
}

export function abuseSentinel(ctx: AgentContext): AgentOutcome<AbuseReport> {
  const scan = screenForAbuse(ctx.text);
  const risks: AbuseReport['risks'] = [];

  if (/\b(?:launch|post|share)\b/i.test(ctx.text) && !/\b(?:one|single|specific)\b/i.test(ctx.text)) {
    risks.push({
      risk: 'Unspecific distribution plan',
      why: 'A plan without a named channel degrades into posting everywhere, which reads as spam even when each post is acceptable.',
      mitigation: 'Name one channel and one asset. Write the others down as "later".',
    });
  }
  if (/\b(?:urgency|limited|now or never|before it'?s too late)\b/i.test(ctx.text)) {
    risks.push({
      risk: 'Manufactured urgency',
      why: 'Urgency that is not real is a dark pattern, and the audience that notices stops trusting everything else you say.',
      mitigation: 'Replace with the actual constraint, or remove it.',
    });
  }
  risks.push({
    risk: 'Repurposing as an outreach machine',
    why: 'Any positioning tool can be turned into a generator for cold DMs. This engine caps outreach at three contacts and never emits a list of individuals.',
    mitigation: 'If you need more than three contacts, the artifact needs a better category, not a bigger list.',
  });
  risks.push({
    risk: 'Score used as a credential',
    why: 'A high AQI can be quoted to imply an outcome the index does not measure.',
    mitigation: 'The badge text is fixed and says "no guaranteed outcomes". Do not edit it; the point is that it is reproducible, not that it is impressive.',
  });

  return {
    agent: 'abuse-sentinel',
    findings: risks.map((r) => ({
      claim: r.risk,
      evidence: r.why,
      basis: 'heuristic' as const,
      confidence: 'medium' as const,
      action: r.mitigation,
    })),
    limitations: ['Intent is not observable. This screens the artifact, not the person.'],
    output: {
      verdict: scan ? 'refuse' : risks.length > 2 ? 'caution' : 'clear',
      refusals: scan ? [{ code: scan.code, reason: scan.reason, alternative: scan.alternative }] : [],
      risks,
      hardLimits: [
        'Will not generate a list of individuals to contact.',
        'Will not write text designed to deceive, including "illustrative" fake numbers.',
        'Will not optimise for engagement volume over the audience\'s interest.',
        'Will not analyse private material the user does not hold the rights to.',
        'Will not help evade a platform\'s moderation, rate limits, or bans.',
        'Will not produce astroturfing, sockpuppet, or vote-manipulation content.',
        'Will not scrape personal data, and will not accept scraped data as input.',
      ],
    },
  };
}
