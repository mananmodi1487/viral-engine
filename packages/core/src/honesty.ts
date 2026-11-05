/**
 * Programmatic honesty enforcement.
 *
 * Two directions of enforcement:
 *  1. Inbound — scan the user's document for claims that will get them called out.
 *  2. Outbound — scan our own generated report before it reaches the user.
 *
 * The outbound pass is the unusual one and the reason this file exists: a tool
 * that tells people not to fabricate must not fabricate in its own output.
 */
import type { HonestyCheck, HonestyFinding } from './schemas.js';
import { HYPE } from './signals.js';

export interface ReplacementRule {
  pattern: RegExp;
  label: string;
  suggestion: string;
  severity: 'blocker' | 'warning' | 'note';
}

/**
 * Ordered by how badly each one tends to end. "blocker" means a public callout
 * is a realistic outcome, not merely a style problem.
 */
export const REPLACEMENT_RULES: ReplacementRule[] = [
  {
    pattern: /\bguarantee[ds]?\b[^.]{0,40}\b(?:viral|growth|stars|success)\b/gi,
    label: 'guaranteed virality',
    severity: 'blocker',
    suggestion:
      'Replace with a claim you can defend: "raises the odds by fixing the two things you control — category and share friction." You cannot promise an outcome.',
  },
  {
    pattern: /\b(?:guaranteed|100%)\s+(?:viral|success|results?)\b/gi,
    label: 'guaranteed outcome',
    severity: 'blocker',
    suggestion: 'Name the mechanism instead of the outcome: "this changes which category you compete in."',
  },
  {
    // Only fires when the figure is attached to a promise. "Nobody can promise
    // 100K stars" is an honest sentence and must not be flagged.
    pattern:
      /\b(?:guarantee\w*|will|going to|going after|hit|reach|promise[sd]?|on track for)\b[^.]{0,40}\b(?:100k|100,000|100000)\s*\+?\s*stars\b|\b(?:100k|100,000|100000)\s*\+?\s*stars\b[^.]{0,40}\b(?:guarantee\w*|in a (?:week|month|year)|on track)\b/gi,
    label: 'star target as a promise',
    severity: 'blocker',
    suggestion:
      'Roughly 150-200 repositories have ever passed 100K stars. Present a target as a north star, never as a forecast: "the plan targets 1,000 in 90 days."',
  },
  {
    pattern: /\bhack(?:ing|ed)?\s+the\s+algorithm\b/gi,
    label: 'algorithm hacking',
    severity: 'warning',
    suggestion:
      'Platforms change rankings weekly. Say what is durable: "optimise for the largest single broadcast" (Goel et al.).',
  },
  {
    pattern: /\bsecret\s+(?:trick|hack|sauce|weapon)\b/gi,
    label: 'secret trick framing',
    severity: 'warning',
    suggestion:
      'If the mechanism is real, name it. If it needs "secret", it is probably a heuristic — label it a heuristic.',
  },
  {
    pattern: /\bovernight\s+success\b/gi,
    label: 'overnight success',
    severity: 'warning',
    suggestion: 'Describe the actual timeline of the work. The interesting part is usually the boring part.',
  },
  {
    pattern: /\b(?:10|100)x\s+your\s+(?:audience|growth|revenue|reach)\b/gi,
    label: 'unsourced multiplier',
    severity: 'warning',
    suggestion: 'Give the baseline and the measurement window, or drop the multiplier entirely.',
  },
  {
    pattern: /\b(?:revolutionary|game[- ]chang(?:er|ing)|world[- ]class|best[- ]in[- ]class|cutting[- ]edge|next[- ]generation)\b/gi,
    label: 'empty superlative',
    severity: 'note',
    suggestion:
      'Adjectives are not evidence. Replace with the one specific thing that is different, in under 12 words.',
  },
  {
    pattern: /\b(?:seamless|effortless|blazing|lightning[- ]fast|unlimited|instant results)\b/gi,
    label: 'vague performance claim',
    severity: 'note',
    suggestion: 'State a measured number with its context, or cut it.',
  },
  {
    pattern: /\b(?:10,000|10000|50,000|1,000,000|1m)\+?\s+(?:users|professionals|creators|customers)\b/gi,
    label: 'unsourced adoption figure',
    severity: 'blocker',
    suggestion:
      'Replace with `[your real number]` and say what you will measure. A figure you cannot source is a liability with a due date.',
  },
  {
    pattern: /\b(?:as\s+seen\s+(?:on|in)|trusted\s+by)\s+[A-Z]/g,
    label: 'unverifiable endorsement',
    severity: 'warning',
    suggestion: 'Link the actual mention, or remove the line. Readers check.',
  },
];

/** Additional outbound-only rules: things we must never emit ourselves. */
export const OUTBOUND_RULES: ReplacementRule[] = [
  {
    pattern: /\b(?:testimonial|quote)\b[^.]{0,80}\b(?:happy|delighted|amazing)\b/gi,
    label: 'invented testimonial shape',
    severity: 'blocker',
    suggestion:
      'Never generate a testimonial. Generated praise is fabrication, even when labelled illustrative — remove it.',
  },
  {
    pattern: /\b\d[\d,]*\s+(?:users|stars|downloads|customers)\b/gi,
    label: 'unbacked figure in generated output',
    severity: 'blocker',
    suggestion:
      'Generated numbers must be traceable to the input document or to a cited source. Use a placeholder instead.',
  },
];

/**
 * Negation guard.
 *
 * "Nobody can promise 100K stars" and "no guaranteed virality" are the sentences
 * this repo exists to publish. Flagging them would make the checker the problem,
 * so a match is discarded when the preceding clause negates it.
 */
const NEGATION = /(?:\bno\b|\bnot\b|\bnever\b|\bcannot\b|\bcan't\b|\bnobody\b|\bwithout\b|\bavoid\w*\b|\bdon't\b|\bdoesn't\b|\bwon't\b|\bfails? to\b|\bagainst\b|\brather than\b|\binstead of\b)[^.!?]{0,48}$/i;

function isNegated(text: string, index: number): boolean {
  const start = Math.max(0, index - 70);
  const preceding = text.slice(start, index);
  return NEGATION.test(preceding);
}

function scan(
  text: string,
  rules: ReplacementRule[],
  where: string,
): HonestyFinding[] {
  const findings: HonestyFinding[] = [];
  for (const rule of rules) {
    const re = new RegExp(rule.pattern.source, rule.pattern.flags.includes('g') ? rule.pattern.flags : rule.pattern.flags + 'g');
    let m: RegExpExecArray | null;
    let shown = 0;
    while ((m = re.exec(text)) && shown < 3) {
      if (isNegated(text, m.index)) continue;
      findings.push({
        severity: rule.severity,
        matched: m[0].trim(),
        where,
        rule: rule.label,
        suggestion: rule.suggestion,
      });
      shown += 1;
    }
  }
  return findings;
}

/**
 * Scans the input document for claims likely to draw a public correction.
 * `blocker` findings mean: fix before publishing, not after.
 */
export function checkInbound(text: string): HonestyCheck {
  const findings = scan(text, REPLACEMENT_RULES, 'input');
  // Plain hype lexicon terms without an explicit rule become notes.
  const hay = text.toLowerCase();
  for (const term of HYPE) {
    const idx = hay.indexOf(term);
    if (idx !== -1) {
      const already = findings.some((f) => f.matched.toLowerCase().includes(term));
      if (!already && !isNegated(text, idx)) {
        findings.push({
          severity: 'note',
          matched: term,
          where: 'input',
          rule: 'hype lexicon',
          suggestion: `"${term}" is a claim, not evidence. Replace with the specific mechanism or delete it.`,
        });
      }
    }
  }
  const blockers = findings.filter((f) => f.severity === 'blocker');
  return {
    passed: blockers.length === 0,
    findings: dedupe(findings),
    scannedFor: [...REPLACEMENT_RULES.map((r) => r.label), 'hype lexicon'],
  };
}

/**
 * Scans our own report text. Any blocker here is a bug in the generator and
 * should fail the build, not merely warn the user.
 */
/**
 * Projects only the fields this tool *generated*, so the outbound scan never
 * flags text that legitimately quotes the user's own document (for example an
 * honesty finding that echoes a phrase, or an honest disclaimer on the input).
 */
export function extractGeneratedText(report: {
  pasteReady?: string;
  category?: { proposedPositioning?: string; proofRequired?: string; adjacentCategories?: Array<{ name?: string; whyLessCrowded?: string; credibilityRisk?: string }> };
  broadcasters?: Array<Record<string, unknown>>;
  shareFriction?: Array<{ friction?: string; evidence?: string; fix?: string }>;
  launchPlan?: { assets?: Array<{ text?: string; notes?: string }>; checklist?: Array<{ step?: string; reasoning?: string }> };
  scorecard?: { dimensions?: Array<{ rationale?: string; fix?: string }> };
}): string {
  const parts: string[] = [];
  if (report.pasteReady) parts.push(report.pasteReady);
  if (report.category) {
    parts.push(report.category.proposedPositioning ?? '', report.category.proofRequired ?? '');
    for (const a of report.category.adjacentCategories ?? []) {
      parts.push(a.name ?? '', a.whyLessCrowded ?? '', a.credibilityRisk ?? '');
    }
  }
  for (const b of report.broadcasters ?? []) {
    for (const v of Object.values(b)) {
      if (typeof v === 'string') parts.push(v);
      else if (Array.isArray(v)) parts.push(v.filter((x): x is string => typeof x === 'string').join(' '));
    }
  }
  for (const f of report.shareFriction ?? []) parts.push(f.friction ?? '', f.evidence ?? '', f.fix ?? '');
  for (const a of report.launchPlan?.assets ?? []) parts.push(a.text ?? '', a.notes ?? '');
  for (const c of report.launchPlan?.checklist ?? []) parts.push(c.step ?? '', c.reasoning ?? '');
  for (const d of report.scorecard?.dimensions ?? []) parts.push(d.rationale ?? '', d.fix ?? '');
  return parts.join('\n');
}

export function checkOutbound(text: string): HonestyCheck {
  const findings = [
    ...scan(text, OUTBOUND_RULES, 'generated-output'),
    ...scan(text, REPLACEMENT_RULES.filter((r) => r.severity === 'blocker'), 'generated-output'),
  ];
  return {
    passed: findings.filter((f) => f.severity === 'blocker').length === 0,
    findings: dedupe(findings),
    scannedFor: [...OUTBOUND_RULES.map((r) => r.label), 'blocker inbound rules'],
  };
}

function dedupe(findings: HonestyFinding[]): HonestyFinding[] {
  const seen = new Set<string>();
  const out: HonestyFinding[] = [];
  for (const f of findings) {
    const key = `${f.where}|${f.rule}|${f.matched.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(f);
  }
  const order = { blocker: 0, warning: 1, note: 2 } as const;
  return out.sort((a, b) => order[a.severity] - order[b.severity]);
}

/** Convenience for tests and the CLI gate. */
export function hasBlockers(check: HonestyCheck): boolean {
  return check.findings.some((f) => f.severity === 'blocker');
}
