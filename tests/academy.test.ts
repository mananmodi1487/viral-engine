/**
 * The academy checker, executed as a student would execute it.
 *
 * This file exists because of a real defect: `check.ts` read `ingested.source.text`,
 * a field that does not exist, so every check ran against `undefined` and every
 * exercise reported "you did not do X". Nothing crashed, so nothing looked broken —
 * which is the worst kind of bug in an educational tool, because the student
 * believes it: they blame their own document and go and rewrite a sentence that
 * was already fine.
 *
 * A unit test on the checker's internals would not have caught it, because the
 * internals were fine. Running the program the way a person runs it does.
 *
 * Three modules are exercised rather than all fifteen purely for runtime: each run
 * pays a `tsx` compile. The three chosen cover a structural check (01), a
 * document-level check (04), and a check that calls the honesty scanner (07).
 */
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const FIXTURE = `# A tool for people who have already been ignored once

This is not a marketing course. It is a linter for the sentence you were about to
publish, for founders who have shipped something nobody noticed.

> It is a checklist with arithmetic, and it says so.

This fails if the reader cannot name the person they would send it to. The kill
criterion is two weeks with no reply from any of the five named people.

Run it with \`npm i -g viral-engine\` and then \`viral-engine analyze ./README.md\`.
`;

function runChecker(module: string) {
  const dir = mkdtempSync(join(tmpdir(), 'academy-'));
  const file = join(dir, 'artifact.md');
  writeFileSync(file, FIXTURE, 'utf8');
  try {
    const out = execFileSync('npx', ['tsx', 'academy/exercises/check.ts', module, file], {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { code: 0, out };
  } catch (err) {
    const e = err as { status?: number; stdout?: string; stderr?: string };
    return { code: e.status ?? 1, out: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

describe('academy checker, run as a student runs it', () => {
  for (const module of ['01', '04', '07']) {
    it(`module ${module} reads the artifact and never reports a defect`, () => {
      const { code, out } = runChecker(module);
      expect(out, `module ${module} crashed a checker:\n${out}`).not.toContain('DEFECT');
      expect(out).not.toContain('extracted no text');
      expect([0, 1]).toContain(code);
      expect(out).toContain('Module:');
    });
  }

  it('produces at least one verdict rather than nothing', () => {
    const { out } = runChecker('01');
    expect(out).toMatch(/PASS|NOT YET/);
  });

  it('refuses an empty artifact instead of judging it', () => {
    const dir = mkdtempSync(join(tmpdir(), 'academy-empty-'));
    const file = join(dir, 'empty.md');
    writeFileSync(file, '   ', 'utf8');
    try {
      execFileSync('npx', ['tsx', 'academy/exercises/check.ts', '01', file], { cwd: process.cwd(), stdio: 'pipe' });
      throw new Error('expected a non-zero exit');
    } catch (err) {
      const e = err as { status?: number; stderr?: string };
      expect(e.status).toBe(2);
      expect(String(e.stderr)).toContain('extracted no text');
    }
  });
});
