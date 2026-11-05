/**
 * Agent 5 — Honesty Firewall.
 *
 * Inherits v1's honesty.ts (inbound rules, outbound self-scan, negation guard)
 * and adds the part v1 deferred: *rewrites*. Detecting "10x your audience" is
 * table stakes. Rewriting it into a sentence the author can actually defend is
 * the useful work, and the rewrite must be checkable rather than merely softer.
 *
 * Rule followed throughout: never replace an unsupported claim with a different
 * unsupported claim. Every rewrite either (a) removes the claim, (b) converts it
 * into a measurement plan, or (c) converts it into a placeholder the author must
 * fill with something real.
 */
import { checkInbound, checkOutbound, REPLACEMENT_RULES } from '../../core/src/honesty.js';
import type { HonestyCheck, HonestyFinding } from '../../core/src/schemas.js';
import type { AgentContext, AgentOutcome } from './types.js';

export interface Rewrite {
  original: string;
  replacement: string;
  /** Why the original is a liability, in one sentence a non-lawyer can act on. */
  why: string;
  /** True when the replacement still needs the author to supply a fact. */
  needsAuthorInput: boolean;
}

export interface HonestyVerdict {
  passed: boolean;
  blockers: number;
  warnings: number;
  notes: number;
  findings: HonestyFinding[];
  rewrites: Rewrite[];
  /** The single change that most reduces the chance of a public correction. */
  topFix: string;
  /** Categories checked, so a user knows what was not checked. */
  checkedFor: string[];
  /** What this agent cannot do. Never trim this list. */
  cannotCheck: string[];
}

const REWRITES: Array<{ match: RegExp; replacement: (m: string) => string; why: string; needsInput: boolean }> = [
  {
    match: /\bguarantee[ds]?\b[^.]{0,40}\b(?:viral|growth|stars|success)\b/gi,
    replacement: () => 'improves the two things you control — which category you compete in, and how cheap your work is to forward',
    why: 'No one can guarantee an outcome that depends on other people\'s decisions. The sentence invites a screenshot of your own words.',
    needsInput: false,
  },
  {
    match: /\b(?:10|100)x\s+(?:your\s+)?(?:audience|growth|revenue|reach|engagement)\b/gi,
    replacement: () => '[measured change from X to Y over Z weeks, with the method]',
    why: 'A multiplier with no baseline is the single most common thing a reply-guy checks first.',
    needsInput: true,
  },
  {
    match: /\b(?:10,000|10000|50,000|1,000,000|1m)\+?\s+(?:users|professionals|creators|customers|downloads)\b/gi,
    replacement: () => '[your real number, and where a reader can see it]',
    why: 'An adoption figure you cannot source is a liability with a due date.',
    needsInput: true,
  },
  {
    match: /\bhack(?:ing|ed)?\s+the\s+algorithm\b/gi,
    replacement: () => 'making one specific broadcast easy for one specific person',
    why: 'Platform rankings change weekly; the claim will be false by the time it is read.',
    needsInput: false,
  },
  {
    match: /\bovernight\s+success\b/gi,
    replacement: () => '[how long it actually took, and what happened in the middle]',
    why: 'It is almost never true, and the people who would share it know that.',
    needsInput: true,
  },
  {
    match: /\b(?:secret|underground)\s+(?:trick|hack|sauce|weapon|method)\b/gi,
    replacement: () => 'the mechanism: [name the actual mechanism]',
    why: 'If the mechanism is real, naming it is stronger than implying it is hidden.',
    needsInput: true,
  },
  {
    match: /\b(?:everyone|everybody)\s+(?:is|are)\s+(?:talking about|using)\b/gi,
    replacement: () => 'a specific group is starting to use this',
    why: 'Unverifiable consensus claims are the easiest thing in the world to disprove with one reply.',
    needsInput: false,
  },
  {
    match: /\b(?:limited time|only \d+ (?:spots|seats) left|closing soon|last chance)\b/gi,
    replacement: () => '[the actual constraint, and why it is real]',
    why: 'Manufactured scarcity is a dark pattern. It works once, then it costs you the audience that noticed.',
    needsInput: true,
  },
  {
    match: /\b(?:as\s+seen\s+(?:on|in)|trusted\s+by)\s+[A-Z][\w.&]*/g,
    replacement: () => '[link to the actual mention]',
    why: 'Readers check. An unlinked endorsement reads as invented even when it is true.',
    needsInput: true,
  },
  {
    match: /\b(?:this|it)\s+(?:will|is going to)\s+(?:change|revolutioni[sz]e|disrupt)\s+(?:everything|the industry|how we work)\b/gi,
    replacement: () => 'changes [one specific thing] for [one specific group]',
    why: 'Unfalsifiable scale claims make the whole document easier to dismiss.',
    needsInput: true,
  },
];

export function honestyFirewall(ctx: AgentContext): AgentOutcome<HonestyVerdict> {
  const inbound = checkInbound(ctx.text);
  const rewrites: Rewrite[] = [];

  for (const r of REWRITES) {
    const matches = [...ctx.text.matchAll(new RegExp(r.match.source, r.match.flags.includes('g') ? r.match.flags : r.match.flags + 'g'))];
    for (const m of matches.slice(0, 4)) {
      const original = m[0];
      if (isNegated(ctx.text, m.index ?? 0, original.length)) continue;
      rewrites.push({
        original,
        replacement: r.replacement(original),
        why: r.why,
        needsAuthorInput: r.needsInput,
      });
    }
  }

  const blockers = inbound.findings.filter((f) => f.severity === 'blocker').length;
  const warnings = inbound.findings.filter((f) => f.severity === 'warning').length;
  const notes = inbound.findings.filter((f) => f.severity === 'note').length;

  const verdict: HonestyVerdict = {
    passed: inbound.passed,
    blockers,
    warnings,
    notes,
    findings: inbound.findings,
    rewrites,
    topFix:
      blockers > 0
        ? (inbound.findings.find((f) => f.severity === 'blocker')?.suggestion ??
          'Remove every claim you cannot source. Replace with a placeholder and a measurement plan.')
        : warnings > 0
          ? 'Soften the warning-level claims to mechanisms you can describe. "10x" becomes "from X to Y, measured this way".'
          : 'Nothing to fix. Keep the document this boring about claims; it is the differentiator.',
    checkedFor: [
      'invented statistics (unsourced adoption and multiplier figures)',
      'fabricated testimonials (testimonial shapes in generated output)',
      'guaranteed outcomes (virality, growth, stars)',
      'manufactured urgency and scarcity',
      'manufactured outrage and engagement bait',
      'dark patterns (false scarcity, confirm-shaming shapes, forced continuity phrasing)',
      'algorithm-hacking language',
      'unverifiable endorsements',
      'missing failure condition',
    ],
    cannotCheck: [
      'Whether your specific figures are true. It checks shape, not truth.',
      'Whether a real testimonial is real. It can only flag an unlinked one.',
      'Whether a claim is misleading in context. Context requires a reader with domain knowledge.',
      'Whether the audience will consider something manipulative. That is a values question, not a string match.',
      'Anything in images, audio, or video. Only text is scanned.',
      'Sarcasm, irony, and quotation. A quoted bad claim is not a bad claim.',
    ],
  };

  return {
    agent: 'honesty-firewall',
    findings: inbound.findings.map((f) => ({
      claim: `${f.severity}: ${f.rule}`,
      evidence: `"${f.matched}"${f.where ? ` (${f.where})` : ''}`,
      basis: 'measured' as const,
      confidence: 'medium' as const,
      action: f.suggestion,
    })),
    limitations: verdict.cannotCheck,
    output: verdict,
  };
}

/**
 * Self-audit: the generator scans its own output before returning it.
 *
 * v1 shipped this and caught two real bugs with it, including the tool flagging
 * its own honest disclaimer. Retained verbatim in spirit: the outbound rules are
 * stricter than the inbound ones, and a blocker here is a bug in us, not in the
 * user's document.
 */
export function selfAudit(generated: string): { passed: boolean; findings: HonestyFinding[] } {
  const check: HonestyCheck = checkOutbound(generated);
  return { passed: check.passed, findings: check.findings };
}

export const RULE_LABELS = REPLACEMENT_RULES.map((r) => r.label);

const NEGATION =
  /(?:\bno\b|\bnot\b|\bnever\b|\bcannot\b|\bcan't\b|\bnobody\b|\bwithout\b|\bavoid\w*\b|\bdon't\b|\bdoesn't\b|\bwon't\b|\bfails? to\b|\bagainst\b|\brather than\b|\binstead of\b|\brefus\w*\b)[^.!?]{0,48}$/i;

/**
 * Checks both the clause before the match and the clause inside it. A guard that
 * only looks backwards flags "We will never promise 100,000 stars" -- which is
 * this project's own honesty policy -- as a violation.
 */
function isNegated(text: string, index: number, matchedLength = 0): boolean {
  if (NEGATION.test(text.slice(Math.max(0, index - 70), index))) return true;
  if (matchedLength > 0) {
    const inside = text.slice(index, index + matchedLength).replace(/[^\s]+$/, '');
    if (NEGATION.test(inside)) return true;
  }
  return false;
}
