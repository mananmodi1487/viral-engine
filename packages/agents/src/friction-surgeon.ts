/**
 * Agent 4 — Friction Surgeon.
 *
 * Sharing is work. The person doing it must locate the artifact, decide what it
 * means, compose a sentence explaining it, and accept a small social risk. Each
 * of those is a place to fail.
 *
 * This agent goes after the *last* one, which is the one nobody fixes: the
 * forwarder has no words. Nearly every "why did nobody share it" postmortem
 * bottoms out at "I would have shared it but I did not know how to describe it
 * without sounding like an ad".
 */
import type { AgentContext, AgentOutcome } from './types.js';

export interface FrictionItem {
  friction: string;
  evidence: string;
  /** What exactly to change. Not "improve clarity". */
  fix: string;
  /** How much this specific item costs, in the forwarder's own terms. */
  costToForwarder: string;
  severity: 'blocks-forward' | 'raises-effort' | 'minor';
}

export interface FrictionReport {
  score: number;
  basis: 'measured';
  items: FrictionItem[];
  /** The single asset that would remove the most friction. */
  highestLeverageFix: string;
  forwardableOneLiner: string | null;
  /** Honest: what would still be hard even after fixes. */
  irreducible: string[];
}

export function frictionSurgeon(ctx: AgentContext): AgentOutcome<FrictionReport> {
  const s = ctx.signals;
  const items: FrictionItem[] = [];

  if (s.installSteps === 0) {
    items.push({
      friction: 'No visible first step',
      evidence: 'no command, no "try it", no link target found in the text',
      fix: 'Put the single first action on the first screen, in the form a reader would type it.',
      costToForwarder: 'They must invent the next step for their reader, and risk being wrong.',
      severity: 'blocks-forward',
    });
  } else if (s.installSteps > 3) {
    items.push({
      friction: `${s.installSteps} steps before first value`,
      evidence: `${s.installSteps} setup/prerequisite cues counted`,
      fix: 'Collapse to one command. Move every prerequisite into a collapsed "details" block below the fold.',
      costToForwarder: 'They must decide whether their reader will bother. Most decide no.',
      severity: 'blocks-forward',
    });
  } else {
    items.push({
      friction: 'First step is short, but buried',
      evidence: `${s.installSteps} setup step(s) present; position in the document not guaranteed`,
      fix: 'Move the first command above every explanation of what the tool is.',
      costToForwarder: 'Small: they can point at it, if they can find it.',
      severity: 'minor',
    });
  }

  if (s.codeBlockCount > 8) {
    items.push({
      friction: 'Un-screenshottable',
      evidence: `${s.codeBlockCount} code blocks; screenshots of code rarely survive being forwarded`,
      fix: 'Add one figure or diagram that can be screenshotted alone and still mean something.',
      costToForwarder: 'They have nothing visual to attach, so they send a bare link.',
      severity: 'raises-effort',
    });
  }

  if (s.wordCount > 900) {
    items.push({
      friction: 'No quotable unit',
      evidence: `${s.wordCount} words, ${s.sentenceCount} sentences`,
      fix: 'Add a 40-word block at the top that is complete on its own: subject, mechanism, who it is for.',
      costToForwarder: 'They must summarise it themselves, and summarising somebody else\'s work is unpaid labour.',
      severity: 'raises-effort',
    });
  }

  if (!s.tribeMarkers.length) {
    items.push({
      friction: 'No recognisable "for us" signal',
      evidence: 'no community/tribe vocabulary found',
      fix: 'Name the community explicitly in the first screen so a broadcaster can see their own readers in it.',
      costToForwarder: 'They cannot tell whether it is for their people, so they skip it to stay safe.',
      severity: 'blocks-forward',
    });
  }

  if (!hasAnyNumber(s.quantitativeClaims, ctx.text)) {
    items.push({
      friction: 'Nothing specific to cite',
      evidence: 'no figure, date, or named artefact a forwarder could quote',
      fix: 'Add one verifiable specific: a date, a measurement you took, or a named thing you built. Specific is memorable; adjectives are not.',
      costToForwarder: 'A forward with no specific reads as an opinion, and forwarding an opinion costs standing.',
      severity: 'raises-effort',
    });
  }

  const blockers = items.filter((i) => i.severity === 'blocks-forward').length;
  const score = Math.max(0, Math.min(100, 100 - blockers * 26 - items.filter((i) => i.severity === 'raises-effort').length * 12 - items.filter((i) => i.severity === 'minor').length * 4));

  const oneLiner = buildOneLiner(ctx);

  const report: FrictionReport = {
    score,
    basis: 'measured',
    items,
    highestLeverageFix:
      blockers > 0
        ? items.find((i) => i.severity === 'blocks-forward')!.fix
        : 'Add the forwardable one-liner. It is the only asset whose absence is invisible until launch.',
    forwardableOneLiner: oneLiner,
    irreducible: [
      'Some artifacts are genuinely hard to describe in one line — a novel, a piece of music, an interactive toy. For those, the honest asset is a 10-second demonstration, not a sentence. This engine cannot produce one.',
      'If the artifact requires trust before use (health, money, safety), forwarding it is a social risk that no copy fixes. The fix there is credentials, not words.',
    ],
  };

  return {
    agent: 'friction-surgeon',
    findings: items.map((i) => ({
      claim: i.friction,
      evidence: i.evidence,
      basis: 'measured' as const,
      confidence: 'medium' as const,
      action: i.fix,
    })),
    limitations: [
      'Friction is counted from text. A beautiful artifact with poor text may score worse here than it deserves.',
      'No human forwarder was observed. The costs listed are inferred from the shape of the task.',
    ],
    output: report,
  };
}

function hasAnyNumber(claims: string[], text: string): boolean {
  return claims.length > 0 || /\b\d{4}\b|\b\d+(?:\.\d+)?%/.test(text);
}

/**
 * The forwardable one-liner.
 *
 * Structure: [what it is] for [specific person], so [the job it does].
 * Deliberately blunt. A clever one-liner requires the forwarder to vouch for the
 * joke, which is a higher cost than pasting a plain sentence.
 */
export function buildOneLiner(ctx: AgentContext): string | null {
  const desc = (ctx.description ?? '').trim();
  const title = (ctx.title ?? '').trim();
  const audience = ctx.declared?.audience ?? guessAudience(ctx);

  if (!desc && !title) return null;

  const subject = title || desc.split(/[.,]/)[0];
  const job = desc && desc.length > 12 ? desc.replace(/\.$/, '') : null;

  /*
   * Returning a sentence with `[name the person who needs this most]` in it looked
   * like helpfulness and was the opposite: it is a template, so the reader still has
   * to write the thing they came for, and if they paste it unedited it publishes a
   * placeholder. Where the template would be full of holes, the honest output is
   * `null` plus the reason, and the caller renders that as an instruction to the
   * author rather than as copy.
   *
   * A one-liner with a hole in it is not a one-liner.
   */
  if (job && audience) return `${subject} — ${job}. For ${audience}.`;
  if (job) return null;
  return null;
}

/** Why there is no one-liner, when there is none. Rendered next to the empty slot. */
export function whyNoOneLiner(ctx: AgentContext): string | null {
  const desc = (ctx.description ?? '').trim();
  const title = (ctx.title ?? '').trim();
  if (!desc && !title) return 'The artifact has no description and no title, so there is nothing to compress.';
  if (!ctx.declared?.audience && !guessAudience(ctx)) {
    return 'No audience is named anywhere in the artifact, so the sentence would end with a blank for the author to fill in — which is exactly the work the author came here to have done. Name one person in the artifact and this fills itself.';
  }
  return null;
}

function guessAudience(ctx: AgentContext): string | null {
  const marker = ctx.signals.identityMarkers[0];
  if (marker) return marker.term.replace(/^for\s+/, '');
  const tribe = ctx.signals.tribeMarkers[0];
  if (tribe) return `people in ${tribe.term}`;
  return null;
}
