#!/usr/bin/env node
/**
 * Runs the Python binding's test suite, with an honest failure when it cannot.
 *
 * The previous npm script was `python3 -m pytest ... || python3 -m unittest ...`.
 * Three things were wrong with it:
 *
 *   1. the fallback `unittest` invocation pointed at a directory that was not a
 *      package, so it failed before discovering anything;
 *   2. a missing `pytest` produced "No module named pytest" on stderr, which the
 *      `||` treated as a reason to run the fallback rather than a problem to report;
 *   3. `2>/dev/null` was tried at one point, which turned a missing dependency into
 *      silence — the worst possible outcome for a test command.
 *
 * This version reports what is missing, says how to fix it, and exits non-zero.
 * `PYTHON=/path/to/python npm run python:test` selects an interpreter.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const python = process.env.PYTHON || 'python3';
const cwd = 'packages/protocol/python';

if (!existsSync(cwd)) {
  console.error(`cannot find ${cwd}; run this from the repository root`);
  process.exit(2);
}

const has = (mod) => spawnSync(python, ['-c', `import ${mod}`], { stdio: 'ignore' }).status === 0;

if (!has('pydantic')) {
  console.error(`${python} cannot import pydantic, so the binding's tests cannot run.`);
  console.error('');
  console.error('  pip install pydantic');
  console.error('  # or use a virtualenv:');
  console.error('  python3 -m venv .venv');
  console.error('  .venv/bin/pip install pydantic pytest');
  console.error('  PYTHON=.venv/bin/python npm run python:test');
  console.error('');
  console.error('This is reported as a failure rather than skipped: a test suite that did');
  console.error('not run is not a passing test suite.');
  process.exit(1);
}

const usePytest = has('pytest');
const args = usePytest ? ['-m', 'pytest', '-q'] : ['-m', 'unittest', 'discover', '-s', 'tests', '-t', '.'];
console.error(`${python} ${args.join(' ')}  (in ${cwd})`);

const run = spawnSync(python, args, { cwd, stdio: 'inherit' });
if (run.error) {
  console.error(`could not run ${python}: ${run.error.message}`);
  process.exit(1);
}
process.exit(run.status ?? 1);
