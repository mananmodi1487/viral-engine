#!/usr/bin/env tsx
/**
 * Contract tests for the HTTP API.
 *
 * These are not in the vitest suite on purpose. The test runner's worker cannot
 * spawn a listening server in every environment this repository is used in, and a
 * flaky test that fails for a reason unrelated to the code is worse than no test:
 * people start skipping the suite. This script starts the real server on a spare
 * port, makes real requests, and exits non-zero on a broken contract.
 *
 *   npm run test:api
 *
 * The checks are the ones a client would notice:
 *   - the health endpoint reports the version the protocol actually ships
 *   - every endpoint that must not invent data returns a null, not a zero
 *   - the share payload carries its caveats and an accessible card
 *   - the modes refuse an unknown mode rather than guessing
 *   - nothing in any response contains a banned claim
 */
import { spawn } from 'node:child_process';
import { join } from 'node:path';

const PORT = Number(process.env.API_TEST_PORT ?? 4188);
const BASE = `http://127.0.0.1:${PORT}`;

const BANNED = [
  'guaranteed viral',
  'guaranteed 100k stars',
  'hack the algorithm',
  'secret trick',
  'overnight success',
  'explode your growth',
  'unbeatable',
  'magic',
  'proven to make viral',
];

let failures = 0;
const seen: string[] = [];

function check(name: string, ok: boolean, detail = ''): void {
  seen.push(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
}

async function waitForServer(): Promise<boolean> {
  for (let i = 0; i < 120; i++) {
    try {
      const r = await fetch(`${BASE}/api/health`);
      if (r.ok) return true;
    } catch {
      /* not listening yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

const post = (path: string, body: unknown) =>
  fetch(`${BASE}${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

async function main(): Promise<number> {
  const proc = spawn(join(process.cwd(), 'node_modules', '.bin', 'tsx'), ['apps/web/src/server.ts'], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(PORT) },
    stdio: 'ignore',
  });

  try {
    if (!(await waitForServer())) {
      console.error('the web server did not start within 30 seconds');
      return 1;
    }

    /* ---- health ---- */
    const health = (await (await fetch(`${BASE}/api/health`)).json()) as Record<string, unknown>;
    check('health reports ODS 2.0.0', health.odsVersion === '2.0.0', String(health.odsVersion));
    check('health reports AQI 2.0.0', health.aqiVersion === '2.0.0', String(health.aqiVersion));
    check('health reports no telemetry', health.telemetry === false);
    check('health reports no auth', health.auth === false);

    /* ---- artifact types ---- */
    const types = (await (await fetch(`${BASE}/api/types`)).json()) as {
      count: number;
      types: Array<{ characteristicFailure: string; ingest: string }>;
    };
    check('33+ artifact types', types.count >= 33, String(types.count));
    check(
      'every type declares its own failure',
      types.types.every((t) => t.characteristicFailure.length > 40),
    );
    check(
      'non-text types are labelled honestly',
      types.types.filter((t) => t.ingest !== 'text').length > 0,
    );

    /* ---- calibration ---- */
    const cal = (await (await fetch(`${BASE}/api/calibration`)).json()) as {
      n: number;
      rho: number | null;
      conclusion: string;
    };
    check('calibration reports n', typeof cal.n === 'number', String(cal.n));
    check('calibration does not invent a coefficient with no data', cal.n > 0 || cal.rho === null);
    check('calibration states the absence as the finding', cal.conclusion.includes('absence of a computed number'));

    /* ---- stress test ---- */
    const stress = (await (await fetch(`${BASE}/api/stress-test`)).json()) as {
      disclaimer: string;
      killCriteria: Array<{ scope: string }>;
      adoptionHypotheses: Array<{ confidence: string }>;
    };
    check('stress test leads with its disclaimer', stress.disclaimer.toLowerCase().includes('not a forecast'));
    check(
      'every kill criterion is scoped to promotion, never to the project',
      stress.killCriteria.length >= 3 && stress.killCriteria.every((k) => /promotion|claim/.test(k.scope.toLowerCase())),
    );
    check(
      'every adoption hypothesis is low-confidence',
      stress.adoptionHypotheses.every((h) => ['low', 'very low'].includes(h.confidence)),
    );

    /* ---- share ---- */
    const shareRes = await post('/api/share', {
      text: 'A linter for launch copy, for founders who have shipped something nobody noticed.',
      offline: true,
    });
    const share = (await shareRes.json()) as {
      cardSvg: string;
      cardAlt: string;
      whatThisDoesNotProve: string[];
      forwardableWasGenerated: boolean;
      badgeMarkdown: string;
      thread: string[];
    };
    check('share returns 200', shareRes.status === 200, String(shareRes.status));
    check('card has an accessible title', share.cardSvg.includes('<title'));
    check('card has an accessible description', share.cardSvg.includes('<desc'));
    check('card has no external image fetch', !share.cardSvg.includes('<image'));
    check('alt text is substantive', share.cardAlt.length > 80, `${share.cardAlt.length} chars`);
    check('caveats ship with the payload', share.whatThisDoesNotProve.length >= 4);
    check('badge is labelled a rubric', share.badgeMarkdown.toLowerCase().includes('rubric'));
    check('thread has four posts', share.thread.length === 4, String(share.thread.length));
    check('forwardable line states whether it was generated', typeof share.forwardableWasGenerated === 'boolean');

    /* ---- modes ---- */
    const roasted = (await (
      await post('/api/mode', { mode: 'roast', text: 'We are excited to announce a revolutionary platform for everyone.' })
    ).json()) as { body: string; limits: string[] };
    check('roast finds the marketing words', roasted.body.includes('revolutionary'));
    check('roast says it is not about the author', roasted.body.includes('was about you'));
    check('roast states its limits', roasted.limits.length > 0);

    const badMode = await post('/api/mode', { mode: 'nonsense', text: 'x' });
    check('unknown mode is a 400, not a guess', badMode.status === 400, String(badMode.status));

    /* ---- error handling ---- */
    const empty = await post('/api/score', {});
    check('empty analysis is a 400', empty.status === 400, String(empty.status));
    const emptyBody = (await empty.json()) as { error: string };
    check('the error says what to send', emptyBody.error.includes('target'));

    /* ---- the banned strings, across every response body collected ---- */
    const collected = [health, types, cal, stress, share, roasted].map((x) => JSON.stringify(x)).join('\n').toLowerCase();
    for (const b of BANNED) check(`no banned string "${b}" in any response`, !collected.includes(b));
  } finally {
    proc.kill('SIGTERM');
  }

  console.log(seen.join('\n'));
  console.log('');
  console.log(`${seen.length - failures}/${seen.length} API contract checks passed`);
  return failures === 0 ? 0 : 1;
}

process.exit(await main());
