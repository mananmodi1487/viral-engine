/**
 * Agent 12 — Translation Diplomat.
 *
 * Not a translator. A warning system for the things that do not survive
 * translation, and a set of rules for producing copy that can be translated
 * without losing its meaning.
 *
 * The honest position: this engine cannot write good copy in a language it has
 * not been tested in. What it can do is tell you which sentences are structurally
 * untranslatable, so a human translator is not handed an impossible job.
 */
import type { AgentContext, AgentOutcome } from './types.js';

export interface TranslationRisk {
  fragment: string;
  risk: 'idiom' | 'pun' | 'cultural-reference' | 'status-claim' | 'grammatical-gender' | 'unit-or-date' | 'register';
  why: string;
  rewrite: string;
}

export interface TranslationReport {
  sourceLanguage: string;
  risks: TranslationRisk[];
  /** Rules that make copy translatable, in priority order. */
  translatabilityRules: string[];
  /** Languages where the reference implementation has tested phrasing, if any. */
  testedLanguages: string[];
  untestedLanguages: string[];
  notice: string;
}

const IDIOMS: Array<[RegExp, string]> = [
  [/\b(?:crushing it|kill it|knock it out of the park|home run)\b/gi, 'performing very well'],
  [/\b(?:move the needle|shift the dial)\b/gi, 'change the result measurably'],
  [/\b(?:low[- ]hanging fruit|quick win)\b/gi, 'the cheapest useful step'],
  [/\b(?:ninja|rockstar|wizard|guru)\b/gi, 'very experienced practitioner'],
  [/\b(?:secret sauce|magic|silver bullet)\b/gi, 'the specific mechanism'],
  [/\b(?:10x|ten-x)\b/gi, 'substantially more effective'],
  [/\b(?:grind|hustle|no days off)\b/gi, 'sustained work'],
  [/\b(?:game[- ]changer)\b/gi, 'a change in category'],
  [/\b(?:boil the ocean|herding cats|too many cooks)\b/gi, 'attempting something uncoordinated and too large'],
  [/\b(?:rock bottom|eleventh hour|last minute)\b/gi, 'at the deadline'],
];

const CULTURAL: Array<[RegExp, string]> = [
  [/\b(?:as seen on Product Hunt|#1 on Product Hunt)\b/gi, 'A launch-platform ranking. It carries status in a small startup subculture and means nothing outside it.'],
  [/\b(?:Y Combinator|YC-backed)\b/gi, 'A US accelerator. Reads as credibility in one ecosystem, as an unfamiliar acronym in most.'],
  [/\b(?:unicorn|10x engineer|FAANG)\b/gi, 'Silicon Valley status markers. They invert outside that culture.'],
  [/\b(?:Tuesday launch|launch day)\b/gi, 'Launch-day rituals are platform-specific. The norm does not transfer.'],
];

export function translationDiplomat(ctx: AgentContext, targetLanguages: string[] = []): AgentOutcome<TranslationReport> {
  const risks: TranslationRisk[] = [];
  const text = ctx.text;

  for (const [re, rewrite] of IDIOMS) {
    for (const m of text.matchAll(re)) {
      risks.push({
        fragment: m[0],
        risk: 'idiom',
        why: 'Idioms translate literally and fail loudly. A translator will either lose the meaning or invent a local idiom that changes your claim.',
        rewrite,
      });
    }
  }
  for (const [re, why] of CULTURAL) {
    for (const m of text.matchAll(re)) {
      risks.push({ fragment: m[0], risk: 'cultural-reference', why, rewrite: 'the specific, checkable thing it stands for' });
    }
  }
  if (/\b(?:he|she)\b[^.]{0,60}\b(?:developer|founder|engineer|user)\b/i.test(text)) {
    risks.push({
      fragment: 'gendered pronoun for a generic role',
      risk: 'grammatical-gender',
      why: 'Languages with grammatical gender force a choice that English can avoid. The choice becomes a statement about who the product is for.',
      rewrite: 'use a role noun, or restructure the sentence so no pronoun is required',
    });
  }
  if (/\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/.test(text)) {
    risks.push({
      fragment: 'slash-form date',
      risk: 'unit-or-date',
      why: '03/04/2026 is two different days depending on the reader. Ambiguity in a deadline claim is a credibility problem.',
      rewrite: '4 March 2026',
    });
  }
  if (/\b\d+(?:,\d{3})*(?:\.\d+)?\s*(?:k|m|bn)\b/i.test(text)) {
    risks.push({
      fragment: 'abbreviated magnitude (k/m/bn)',
      risk: 'unit-or-date',
      why: 'Magnitude abbreviations vary by language; "bn" is a thousand million in English and a false friend in several languages.',
      rewrite: 'the full number with thousands separators',
    });
  }
  if (/\b(?:you guys|folks|dude|bro)\b/gi.test(text)) {
    risks.push({
      fragment: 'informal collective address',
      risk: 'register',
      why: 'Register does not map cleanly. Informal address that reads as friendly in English can read as condescending, or as rude, in another language.',
      rewrite: 'neutral second person, or the specific role',
    });
  }

  const report: TranslationReport = {
    sourceLanguage: ctx.language ?? 'unknown',
    risks,
    translatabilityRules: [
      'One claim per sentence. Compound sentences get split differently by different translators, and the claim drifts.',
      'No idioms in the headline. The headline is the one sentence that must survive unchanged.',
      'Say "for [role]" explicitly. Implicit audiences disappear in translation because the cues were cultural.',
      'Avoid abbreviated magnitudes and slash dates. Both are ambiguous, and ambiguity in a number reads as evasion.',
      'Keep the failure condition literal. "This fails if X" must not become a softer sentence in another language.',
      'Never localise the honesty policy. The refusal to promise outcomes is not a tone choice.',
    ],
    testedLanguages: ['en'],
    untestedLanguages: targetLanguages.length ? targetLanguages.filter((l) => !/^en\b/i.test(l)) : ['(none requested)'],
    notice:
      'This is not a translation service. It flags sentences that will break in translation. No copy produced by this engine has been reviewed by a native speaker in any language other than English, and saying otherwise would be a lie. If you are publishing in another language, work with a speaker of that language who is also in your field — the two are not the same skill.',
  };

  return {
    agent: 'translation-diplomat',
    findings: risks.map((r) => ({
      claim: `${r.risk}: "${r.fragment}"`,
      evidence: r.why,
      basis: 'structural' as const,
      confidence: 'medium' as const,
      action: `Rewrite as: ${r.rewrite}`,
    })),
    limitations: [
      'English-tuned. The idiom and register lists are English source patterns, not a cross-linguistic model.',
      'No native-speaker review of any output.',
      'Right-to-left script, vertical script, and non-Latin typography were not considered.',
      'Cultural fit is not assessed. Only cultural *references* are flagged.',
    ],
    output: report,
  };
}
