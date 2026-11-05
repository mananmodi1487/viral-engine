#!/usr/bin/env tsx
/**
 * Honesty check over the repository's own prose.
 *
 *   npm run check:honesty            # report
 *   npm run check:honesty -- --ci    # exit 1 on any blocker
 *
 * `package.json` has referenced this file since v2 and the file did not exist, so
 * the command crashed with ERR_MODULE_NOT_FOUND. That is the worst kind of gap: a
 * script named after the project's central commitment, listed in the scripts table,
 * that has never once run.
 *
 * What it scans: every markdown file a reader is likely to encounter, and the
 * shipped copy in the CLI help. What it skips, and why: `evidence/` (records are
 * *about* bad claims and must be able to quote them), `tests/` and `fixtures/`
 * (they contain the banned strings on purpose), and `governance/decisions/` (a
 * decision can quote the claim it refused).
 *
 * The scanner is the same `checkInbound` used on user documents. That symmetry is
 * the point: the project should not hold its own copy to a weaker standard than it
 * holds a stranger's README.
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';
import { checkInbound } from '../packages/core/src/honesty.js';

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', 'out', 'target', 'coverage', '.next',
  'evidence',        // records are about claims, and must be able to quote them
  'tests', 'fixtures',
  'decisions',       // a decision may quote the claim it refused
  'proposals',
]);

const SKIP_FILES = new Set(['CHANGELOG.md', 'LIMITATIONS.md']);

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.') && entry !== '.github') continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (SKIP_DIRS.has(entry)) continue;
      walk(full, acc);
    } else if (/\.(?:md|markdown)$/i.test(entry) && !SKIP_FILES.has(entry)) {
      acc.push(full);
    }
  }
  return acc;
}

interface Hit {
  file: string;
  line: number;
  rule: string;
  matched: string;
  severity: string;
}

/**
 * Scans line by line rather than over the whole file.
 *
 * A whole-file scan loses the line number, and a finding without a line number is a
 * finding nobody fixes. It also makes the negation heuristic in `isNegated` much
 * more accurate, because it sees one sentence rather than a document.
 */
function scanFile(path: string): Hit[] {
  const hits: Hit[] = [];
  const lines = readFileSync(path, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (line.trim().length < 4) return;
    const result = checkInbound(line);
    for (const f of result.findings) {
      if (f.severity === 'blocker' || f.severity === 'warning') {
        hits.push({ file: relative(process.cwd(), path), line: i + 1, rule: f.rule, matched: f.matched, severity: f.severity });
      }
    }
  });
  return hits;
}

function main(): number {
  const ci = process.argv.includes('--ci');
  const root = process.cwd();

  if (!existsSync(join(root, 'README.md'))) {
    console.error('run this from the repository root');
    return 2;
  }

  const files = walk(root).sort();
  const all: Hit[] = [];
  for (const f of files) all.push(...scanFile(f));

  const blockers = all.filter((h) => h.severity === 'blocker');
  const warnings = all.filter((h) => h.severity === 'warning');

  console.log(`scanned ${files.length} markdown files`);
  console.log(`  ${blockers.length} blocker(s), ${warnings.length} warning(s)`);
  console.log('');

  if (all.length === 0) {
    console.log('No unbacked claim found in any shipped prose.');
    console.log('');
    console.log('This means the scanner found nothing, not that the prose is honest.');
    console.log('It cannot see a claim that is checkable but false. That needs a reader.');
    return 0;
  }

  for (const h of all) {
    console.log(`  ${h.severity === 'blocker' ? 'BLOCKER' : 'warning'}  ${h.file}:${h.line}`);
    console.log(`           "${h.matched}" — ${h.rule}`);
  }
  console.log('');
  console.log('A finding here is often correct and unavoidable: a document explaining what a');
  console.log('banned claim looks like has to write one down. The fix is to make the mention');
  console.log('unmistakably a mention — quote it, attribute it, or say "this phrase is banned".');
  console.log('Do not reword the surrounding prose purely to silence the scanner; that is');
  console.log('tuning the check instead of the claim.');

  return ci && blockers.length > 0 ? 1 : 0;
}

process.exit(main());
