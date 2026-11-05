/**
 * Terminal renderer. Optimised for the first 20 lines, because that is all most
 * people read before deciding whether to keep using a tool.
 *
 * The verdict comes first. A tool that makes you scroll to find out it is telling
 * you not to launch has misunderstood its own thesis.
 */
import type { OdsDocument } from '../analyze/ods.js';

const C = {
  reset: '\x1b[0m', dim: '\x1b[2m', bold: '\x1b[1m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m', magenta: '\x1b[35m',
};

export interface TerminalOptions { colour?: boolean; verbose?: boolean; width?: number }

export function odsToTerminal(doc: OdsDocument, opts: TerminalOptions = {}): string {
  const colour = opts.colour !== false;
  const c = (k: keyof typeof C, s: string): string => (colour ? `${C[k]}${s}${C.reset}` : s);
  const L: string[] = [];
  const dims = [...doc.scorecard.dimensions];
  const weakest = [...dims].sort((a, b) => a.score - b.score)[0];
  const leverage = [...dims]
    .map((d) => ({ d, lost: Math.round(((100 - d.score) * d.weight) / 100) }))
    .sort((a, b) => b.lost - a.lost)
    .slice(0, 3);

  L.push('');
  L.push(`${c('bold', 'viral-engine commons')} ${c('dim', `v${doc.generator.version} · ODS ${doc.ods_version}`)}  ${c('dim', doc.artifact.name)}`);
  L.push(c('dim', '─'.repeat(70)));
  L.push('');

  const bandColour = doc.scorecard.total >= 650 ? 'green' : doc.scorecard.total >= 450 ? 'yellow' : 'red';
  L.push(`  ${c('bold', `${doc.scorecard.total}/1000`)}  ${c(bandColour, doc.scorecard.band)}   ${c('dim', `weakest: ${weakest.label} (${weakest.score}/100)`)}`);
  L.push('');

  if (doc.ethics_review.do_not_launch_yet) {
    L.push(`  ${c('red', '⛔ DO NOT LAUNCH YET')}`);
    const reason = doc.ethics_review.do_not_launch_reason ?? '';
    for (const line of wrap(reason, 64)) L.push(`  ${c('dim', line)}`);
    L.push('');
  }

  L.push(`  ${c('dim', 'where the leverage is (points lost, not score):')}`);
  leverage.forEach(({ d, lost }, i) => {
    L.push(`  ${i + 1}. ${pad(d.label, 30)} ${c('bold', `${lost} pts`)} ${c('dim', `of ${d.weight}`)}`);
  });
  L.push('');

  L.push(`  ${c('dim', 'all twenty dimensions')}`);
  for (const d of dims) {
    const filled = Math.round(d.score / 5);
    const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);
    const col = d.score >= 65 ? 'green' : d.score >= 40 ? 'yellow' : 'red';
    const label = (d.label.length > 30 ? d.label.slice(0, 29) + '…' : d.label).padEnd(30);
    L.push(`  ${label} ${c(col, bar)} ${String(d.score).padStart(3)} ${c('dim', `${d.points}/${d.weight}`)}`);
  }
  L.push('');

  L.push(`${c('bold', '  THE ONE-LINE FORWARD')}`);
  L.push(`  ${doc.launch_assets.one_line_broadcast_summary ?? c('dim', '(none could be built — no forwardable unit found)')}`);
  L.push('');

  L.push(`${c('bold', '  FIX FIRST')}`);
  L.push(`  ${weakest.improvement}`);
  L.push('');

  if (doc.friction_analysis && (doc.friction_analysis as Record<string, unknown>).reasons) {
    const reasons = (doc.friction_analysis as { reasons: Array<{ friction: string; fix: string }> }).reasons;
    if (reasons.length) {
      L.push(`${c('bold', '  SHARE FRICTION')}`);
      for (const r of reasons.slice(0, 4)) L.push(`  ${c('dim', '·')} ${r.friction}`);
      L.push('');
    }
  }

  const h = doc.honesty_audit;
  const blockers = h.findings.filter((f) => f.severity === 'blocker').length;
  L.push(
    `${c('bold', '  HONESTY')}  ${h.passed ? c('green', 'passed') : c('red', `failed — ${blockers} blocker(s)`)}` +
      c('dim', ` · ${doc.generator.network_calls} network call(s)`),
  );
  L.push('');

  if (opts.verbose) {
    L.push(c('dim', '─'.repeat(70)));
    L.push('');
    L.push(`${c('bold', '  LIMITATIONS')} ${c('dim', '(always printed in verbose mode)')}`);
    for (const l of doc.limitations.slice(0, 12)) L.push(`  ${c('dim', '·')} ${l}`);
    L.push('');
  } else {
    L.push(c('dim', `  ${doc.limitations.length} stated limitations · --verbose to read them · --format md|json|html for the full report`));
    L.push('');
  }

  return L.join('\n');
}

function pad(s: string, n: number): string {
  return s.length >= n ? s.slice(0, n - 1) + '…' : s.padEnd(n);
}

function wrap(s: string, n: number): string[] {
  const words = s.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > n) {
      if (line) lines.push(line);
      line = w;
    } else line = (line + ' ' + w).trim();
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

/** Compact single-block output for CI logs and PR comments. */
export function odsToCiSummary(doc: OdsDocument): string {
  const blockers = doc.honesty_audit.findings.filter((f) => f.severity === 'blocker').length;
  const weakest = [...doc.scorecard.dimensions].sort((a, b) => a.score - b.score)[0];
  const lines = [
    `AQI ${doc.scorecard.total}/1000 (${doc.scorecard.band}) · honesty ${doc.honesty_audit.passed ? 'passed' : 'FAILED'} (${blockers} blocker(s))`,
    `weakest: ${weakest.label} ${weakest.score}/100 — ${weakest.improvement}`,
  ];
  if (doc.ethics_review.do_not_launch_yet) lines.push(`⛔ DO NOT LAUNCH YET: ${doc.ethics_review.do_not_launch_reason}`);
  return lines.join('\n');
}
