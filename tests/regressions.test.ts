/**
 * Regressions found by auditing the shipped surface, one test per bug.
 *
 * Each of these was a real defect that the existing 227 tests did not catch, and the
 * reason is instructive: the unit tests exercised the functions, and every one of
 * these bugs lived in the wiring between a function and a person.
 *
 *   A. `analyze ./REAADME.md` (a typo) fell through to raw-text and scored the
 *      literal path string, at exit 0, with no indication that no file was read.
 *   B. `viral-engine nonsense-command` did the same thing with the command name,
 *      so a mistyped subcommand became a confident analysis of the typo.
 *   C. `submit-outcome typo.json` printed the template and exited 0.
 *   D. `npm run check:honesty` pointed at a file that did not exist, so the command
 *      named after the project's central commitment had never run.
 *   E. The honesty scanner could not tell a mention from a claim, so the documents
 *      that explain the banned claims failed their own check, 11 times.
 *   F. The generator emitted two fields the published schema forbade, and a document
 *      whose text could not be determined was `null` where the schema required a
 *      string — see tests/schema-validation.test.ts.
 *   G. The provenance channel enum listed 25 plausible artifact names and none of the
 *      four values the ingest layer actually produces.
 *   H. `npm run python:test` had never worked.
 *   I/J. The protocol reference and the generated launch copy advertised ODS 1.0 and
 *      20 dimensions, and the report footer said ODS 1.0.
 */
import { describe, it, expect } from 'vitest';
import { classifyInput, ingest } from '../packages/core/src/ingest/index.js';
import { checkInbound } from '../packages/core/src/honesty.js';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const run = (args: string[]): { code: number; out: string } => {
  try {
    const out = execFileSync('npx', ['tsx', 'apps/cli/src/index.ts', ...args], {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 120_000,
    });
    return { code: 0, out };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
};

/* ---------- A: a path that does not exist ---------- */

describe('A — a missing path is not raw text', () => {
  it('classifies a nonexistent path as missing, not as text', () => {
    expect(classifyInput('./REAADME.md').kind).toBe('missing-path');
    expect(classifyInput('/nonexistent/path.md').kind).toBe('missing-path');
  });

  it('throws instead of scoring the string', async () => {
    await expect(ingest('./REAADME.md', { offline: true })).rejects.toThrow(/no such file or directory/);
  });

  it('exits 1 and says nothing was analysed', () => {
    const r = run(['analyze', './REAADME.md', '--offline']);
    expect(r.code).toBe(1);
    expect(r.out).toContain('Nothing was analysed');
  });

  it('still accepts a bare word as text, because people paste sentences', async () => {
    expect(classifyInput('viral-engine').kind).toBe('raw-text');
    const r = await ingest('a productivity app for busy professionals', { offline: true });
    expect(r.source.kind).toBe('free-text');
  });
});

/* ---------- B: an unknown command ---------- */

describe('B — an unknown command is not a document', () => {
  it('exits 2 rather than analysing the command name', () => {
    const r = run(['nonsense-command']);
    expect(r.code).toBe(2);
    expect(r.out).toContain('unknown command');
    expect(r.out).not.toMatch(/\d+\/1000/); // no score was produced
  });

  it('suggests the near-miss command', () => {
    const r = run(['analze', './README.md']);
    expect(r.code).toBe(2);
    expect(r.out).toContain('did you mean "analyze"');
  });

  it('still treats a bare file, URL, or sentence as analyze', () => {
    for (const target of ['./README.md', 'https://example.com', 'a sentence with spaces']) {
      const r = run([target, '--offline']);
      expect(r.code, `bare target "${target}" should analyse`).toBe(0);
    }
  });
});

/* ---------- C: submit-outcome with a missing file ---------- */

describe('C — submit-outcome does not silently ignore a bad path', () => {
  it('exits 2 for a file that does not exist', () => {
    const r = run(['submit-outcome', '/tmp/definitely-not-a-record.json']);
    expect(r.code).toBe(2);
    expect(r.out).toContain('no such file');
  });

  it('still prints the template when given no argument', () => {
    const r = run(['submit-outcome']);
    expect(r.code).toBe(0);
    expect(r.out).toContain('RECORD WHAT HAPPENED');
  });
});

/* ---------- D: the honesty script exists ---------- */

describe('D — every script in package.json resolves to a real file', () => {
  it('has no dangling script references', async () => {
    const { readFileSync } = await import('node:fs');
    const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> };
    const missing: string[] = [];
    for (const [name, cmd] of Object.entries(pkg.scripts)) {
      for (const m of cmd.matchAll(/(?:tsx|node)\s+([\w./-]+\.(?:ts|mjs|js))/g)) {
        if (!existsSync(m[1])) missing.push(`${name} → ${m[1]}`);
      }
    }
    expect(missing, `scripts pointing at files that do not exist: ${missing.join(', ')}`).toEqual([]);
  });

  it('runs check:honesty to completion', () => {
    // Spawned as a program, not through the CLI's argv parsing: passing a script
    // path to `apps/cli` makes it analyse the path as a document, which is correct
    // behaviour and the wrong way to run a script.
    let out = '';
    let code = 0;
    try {
      out = execFileSync('npx', ['tsx', 'scripts/self-honesty-check.ts'], {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 120_000,
      });
    } catch (err) {
      const e = err as { status?: number; stdout?: string; stderr?: string };
      code = e.status ?? 1;
      out = `${e.stdout ?? ''}${e.stderr ?? ''}`;
    }
    expect(code).toBe(0);
    expect(out).toContain('scanned');
    expect(out).toContain('blocker(s)');
  });
});

/* ---------- E: a mention is not a claim ---------- */

describe('E — the honesty scanner distinguishes a quotation from a claim', () => {
  const block = (text: string) => checkInbound(text).findings.filter((f) => f.severity === 'blocker');

  it('passes a claim inside straight double quotes', () => {
    expect(block('Calling it "guaranteed viral growth" is banned.')).toHaveLength(0);
  });

  it('passes a claim inside curly quotes and backticks', () => {
    expect(block('The phrase \u201Cguaranteed viral growth\u201D is banned.')).toHaveLength(0);
    expect(block('| `guaranteed viral growth` | fix it | why |')).toHaveLength(0);
  });

  it('still blocks an unquoted claim', () => {
    expect(block('Our tool gives you guaranteed viral growth.').length).toBeGreaterThan(0);
  });

  it('still blocks a claim on a line that also contains unrelated quotes', () => {
    expect(block('We are "excited" to offer guaranteed viral growth to everyone.')).not.toHaveLength(0);
  });

  it('does not let an unclosed quote swallow the rest of the document', () => {
    expect(block('And then he said "the trick is. We offer guaranteed viral growth.')).not.toHaveLength(0);
  });
});

describe('the tool does not ship stale version numbers in its own output', () => {
  const cli = (...args: string[]) =>
    execFileSync('npx', ['tsx', 'apps/cli/src/index.ts', ...args], { encoding: 'utf8', stdio: 'pipe' });

  it('protocol reference advertises the ODS version it actually emits', () => {
    // `viral-engine protocol` said "OPEN DIFFUSION SPEC 1.0" while every document it
    // produced declared ods_version 2.0.0 — the reference contradicting the artefact.
    const out = cli('protocol');
    expect(out).not.toContain('SPEC 1.0');
    expect(out).toContain('SPEC 2.0.0');
  });

  it('generated launch assets do not advertise the retired dimension count', async () => {
    // The asset generator is the copy people paste into Show HN. It said "20 dimensions"
    // long after the index had 25.
    const src = readFileSync('packages/agents/src/asset-alchemist.ts', 'utf8');
    expect(src).not.toMatch(/\b20 dimensions\b/);
    expect(src).not.toContain('current as of ODS 1.0');
  });

  it('the markdown report footer names the current spec version', () => {
    const src = readFileSync('packages/core/src/report/ods-markdown.ts', 'utf8');
    expect(src).not.toContain('ODS 1.0 ·');
  });
});
