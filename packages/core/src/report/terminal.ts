/**
 * Terminal formatter. Optimised for the first 20 lines, because that is all
 * most people will read before deciding whether to keep the tool.
 */
import type { DiagnosisReport } from '../schemas.js';

const C = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

export interface TerminalOptions {
  colour?: boolean;
  width?: number;
}

export function toTerminal(r: DiagnosisReport, opts: TerminalOptions = {}): string {
  const colour = opts.colour !== false;
  const c = (code: keyof typeof C, s: string): string => (colour ? `${C[code]}${s}${C.reset}` : s);
  const L: string[] = [];

  const weakest = [...r.scorecard.dimensions]
    .filter((d) => d.key !== 'honestyRisk')
    .sort((a, b) => a.score - b.score)[0];

  const scoreColour = (n: number): keyof typeof C => (n >= 60 ? 'green' : n >= 40 ? 'yellow' : 'red');

  L.push('');
  L.push(`${c('bold', 'viral-engine')} ${c('dim', `v${r.generator.version}`)}  ${c('dim', r.source.ref)}`);
  L.push(c('dim', '─'.repeat(66)));
  L.push('');

  L.push(`  ${c('bold', `${r.scorecard.overall}/100`)}  ${c('dim', 'overall')}`);
  L.push(`  ${c('dim', 'weakest lever:')} ${c(scoreColour(weakest.score), `${weakest.label} (${weakest.score}/100)`)}`);
  L.push('');

  for (const d of r.scorecard.dimensions) {
    const n = d.score;
    const filled = Math.round(n / 5);
    const bar = '█'.repeat(filled) + '░'.repeat(20 - filled);
    const col = d.key === 'honestyRisk' ? (n > 40 ? 'red' : 'green') : scoreColour(n);
    // Truncate rather than let a long label push the bar out of alignment.
    const label = (d.label.length > 38 ? d.label.slice(0, 37) + '…' : d.label).padEnd(38);
    L.push(`  ${label}${c(col, bar)} ${String(n).padStart(3)} ${c('dim', d.basis)}`);
  }
  L.push('');

  if (!r.honesty.passed) {
    L.push(`  ${c('red', '✗ honesty blockers — fix before publishing')}`);
    r.honesty.findings
      .filter((f) => f.severity === 'blocker')
      .slice(0, 4)
      .forEach((f) => L.push(`    ${c('red', '·')} ${f.rule}: ${c('dim', `"${f.matched}"`)}`));
    L.push('');
  }

  if (r.launchPlan.doNotLaunchYet) {
    L.push(`  ${c('yellow', '⚠ DO NOT LAUNCH YET')} ${c('dim', r.launchPlan.doNotLaunchReason ?? '')}`);
    L.push('');
  }

  L.push(`  ${c('dim', 'category')}     ${r.category.currentCategory} ${c('dim', `(${r.category.saturation})`)}`);
  L.push(`  ${c('dim', 'proposed')}     ${c('cyan', r.category.proposedPositioning)}`);
  L.push('');
  L.push(`  ${c('dim', 'broadcaster')}  ${r.broadcasters[0].target}`);
  L.push(`  ${c('dim', 'send them')}    ${c('dim', r.broadcasters[0].assetToSend.slice(0, 120))}`);
  L.push('');
  L.push(`  ${c('dim', 'fix first')}    ${weakest.fix}`);
  L.push('');
  L.push(c('dim', '─'.repeat(66)));
  L.push(`  ${c('dim', 'next:')} ${c('cyan', 'viral-engine analyze ' + r.source.ref + ' --format md -o report.md')}`);
  L.push('');

  return L.join('\n');
}

/** Compact one-screen summary for CI logs and PR comments. */
export function toCiSummary(r: DiagnosisReport): string {
  const weakest = [...r.scorecard.dimensions]
    .filter((d) => d.key !== 'honestyRisk')
    .sort((a, b) => a.score - b.score)[0];
  const blockers = r.honesty.findings.filter((f) => f.severity === 'blocker');
  const warns = r.honesty.findings.filter((f) => f.severity === 'warning');
  return [
    `overall ${r.scorecard.overall}/100`,
    `weakest ${weakest.label} ${weakest.score}/100`,
    `honesty ${blockers.length ? `${blockers.length} blocker(s)` : 'clean'}`,
    warns.length ? `${warns.length} warning(s)` : '',
  ]
    .filter(Boolean)
    .join(' · ');
}
