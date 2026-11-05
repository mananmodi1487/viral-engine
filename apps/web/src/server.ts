/**
 * Web application.
 *
 * Deliberately dependency-free: node:http plus the packages. A tool whose thesis
 * is "remove friction" should not ask you to install 400MB of framework to read a
 * report, and a public-interest tool should be auditable by one person in an
 * afternoon. This file is that audit.
 *
 * Routes
 *   GET  /                        home
 *   GET  /analyze                 form
 *   POST /api/analyze             JSON in, { doc, html } out
 *   POST /api/analyze-form        form POST, full HTML page out (works with JS off)
 *   POST /api/score | /category | /broadcaster | /friction | /assets
 *        /experiment | /simulate | /honesty-audit | /report | /outcomes
 *   POST /api/render              re-render a supplied doc as markdown | html
 *   GET  /api/evidence            index of the evidence directory
 *   GET  /api/protocol/schema     ODS JSON Schema
 *   GET  /api/protocol/weights    AQI weights
 *   GET  /api/health              liveness
 *   GET  /scorecard /protocol /academy /evidence /case-studies /museum /api /local
 *        /privacy /accessibility /manifest.webmanifest /sw.js /icon.svg
 *
 * No telemetry. No cookies. No external requests. Binds 0.0.0.0 so a container
 * preview proxy can reach it.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ingest,
  analyzeOds,
  odsToHtml,
  odsToMarkdown,
  odsToTerminal,
  odsToCiSummary,
  AQI_DIMENSIONS,
  AQI_MAX,
  AQI_VERSION,
  AQI_BANDS,
} from '../../../packages/core/src/index.js';
import type { OdsDocument } from '../../../packages/core/src/index.js';
import { layout, esc } from './layout.js';
import * as pages from './pages.js';

const PORT = Number(process.env.PORT ?? 4173);
const HOST = process.env.HOST ?? '0.0.0.0';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

/* ---------- rate limiting: abuse prevention only, never monetisation ---------- */
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = Number(process.env.VIRAL_ENGINE_RATE_MAX ?? 60);
const hits = new Map<string, { count: number; reset: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.reset) {
    hits.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_MAX;
}

/* ---------- tiny helpers ---------- */

function send(res: ServerResponse, status: number, body: string, type = 'text/html; charset=utf-8'): void {
  res.writeHead(status, {
    'content-type': type,
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    // No external origins are ever needed by this page, so the policy can be strict.
    'content-security-policy':
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors *",
    'permissions-policy': 'geolocation=(), camera=(), microphone=(), interest-cohort=()',
  });
  res.end(body);
}

function json(res: ServerResponse, status: number, body: unknown): void {
  send(res, status, JSON.stringify(body), 'application/json; charset=utf-8');
}

async function readBody(req: IncomingMessage, limit = 1_000_000): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => {
      size += c.length;
      if (size > limit) {
        reject(new HttpError(413, 'Request body too large. Send under 100KB of text, or run locally where the limit is your RAM.'));
        req.destroy();
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface AnalyzeBody {
  target?: string;
  text?: string;
  audience?: string;
  channel?: string;
  language?: string;
  offline?: boolean;
  strict?: boolean;
  saturationCount?: number;
}

async function buildDoc(body: AnalyzeBody): Promise<{ doc: OdsDocument; degraded: string[]; ms: number }> {
  const t0 = Date.now();
  if (!body.target && !body.text) {
    throw new HttpError(400, 'Nothing to analyse. Send `target` (a URL, repo, or path) or `text`.');
  }
  if ((body.text?.length ?? 0) > 100_000) {
    throw new HttpError(413, 'Text is over 100KB. Split it, or run locally.');
  }
  const offline = body.offline !== false;

  const ing = await ingest(body.target ?? '', { offline, text: body.text });
  const doc = await analyzeOds(ing.source, {
    offline,
    networkCalls: offline ? 0 : ing.source.fetchedFrom === 'network' ? 1 : 0,
    saturationCount: body.saturationCount,
    saturationUnavailableReason: offline
      ? 'offline mode — saturation was not queried, so crowding is unknown rather than guessed'
      : 'no saturation query was run',
    declared: { audience: body.audience, channel: body.channel },
    language: body.language ?? 'en',
    channel: body.channel,
  });

  if (body.strict) {
    const warnings = doc.honesty_audit.findings.filter((f) => f.severity === 'warning').length;
    if (warnings > 0) {
      doc.ethics_review.do_not_launch_yet = true;
      doc.ethics_review.do_not_launch_reason =
        `Strict honesty mode: ${warnings} warning-level claim(s) present. ${doc.ethics_review.do_not_launch_reason ?? ''}`.trim();
    }
  }

  return { doc, degraded: ing.degraded, ms: Date.now() - t0 };
}

/* ---------- result fragment for the analyzer ---------- */

function resultFragment(doc: OdsDocument, ms: number): string {
  const dims = [...doc.scorecard.dimensions];
  const leverage = dims
    .map((d) => ({ d, lost: Math.round(((100 - d.score) * d.weight) / 100) }))
    .sort((a, b) => b.lost - a.lost)
    .slice(0, 5);

  const barClass = (n: number): string => (n >= 65 ? '' : n >= 40 ? ' warn' : ' bad');

  return `
<div class="panel">
  <p class="tiny muted" style="margin:0 0 8px">Result · ${ms}ms · ${doc.generator.network_calls} network call(s) · ODS ${esc(doc.ods_version)} · AQI ${esc(doc.scorecard.aqi_version)}</p>
  <div class="kpi">
    <div><div class="big">${doc.scorecard.total}</div><div class="small muted">of ${doc.scorecard.max} · ${esc(doc.scorecard.band)}</div></div>
    <div><div class="small muted">weakest dimension</div><div style="font-weight:700;font-size:18px">${esc(leverage[0].d.label)}</div><div class="small muted">${leverage[0].d.score}/100 · ${leverage[0].lost} of ${leverage[0].d.weight} points lost</div></div>
  </div>
  <p class="small" style="margin:14px 0 0"><strong>Fix first:</strong> ${esc(leverage[0].d.improvement)}</p>
  <p class="tiny muted" style="margin:8px 0 0">${esc(doc.scorecard.disclaimer)}</p>
</div>

${doc.ethics_review.do_not_launch_yet
  ? `<div class="stop"><strong>⛔ Do not launch yet.</strong><br>${esc(doc.ethics_review.do_not_launch_reason ?? '')}</div>`
  : ''}

<div class="panel">
  <h3 style="margin-top:0">Where the leverage is</h3>
  <p class="small muted">Ranked by points lost, not by score. A weak dimension with a small weight is not worth your week.</p>
  <table>
    <thead><tr><th>Dimension</th><th>Score</th><th class="num">Points lost</th><th>Basis</th></tr></thead>
    <tbody>
    ${leverage.map(({ d, lost }) => `<tr>
      <td><strong>${esc(d.label)}</strong><div class="tiny muted">${esc(d.improvement)}</div></td>
      <td style="min-width:140px"><div class="bar-track" role="img" aria-label="${d.score} out of 100"><div class="bar-fill${barClass(d.score)}" style="width:${d.score}%"></div></div><span class="tiny muted">${d.score}/100</span></td>
      <td class="num">${lost} / ${d.weight}</td>
      <td><span class="pill">${esc(d.basis)}</span></td>
    </tr>`).join('\n')}
    </tbody>
  </table>
  <details><summary>All ${dims.length} dimensions, with evidence</summary>
    <table>
      <thead><tr><th>Dimension</th><th class="num">Score</th><th class="num">Points</th><th>Evidence</th></tr></thead>
      <tbody>
      ${dims.map((d) => `<tr>
        <td>${esc(d.label)}</td>
        <td class="num">${d.score}</td>
        <td class="num">${d.points}/${d.weight}</td>
        <td class="tiny">${esc(d.evidence.join('; '))}</td>
      </tr>`).join('\n')}
      </tbody>
    </table>
  </details>
</div>

<div class="panel">
  <h3 style="margin-top:0">The one-line forward</h3>
  <pre>${esc(doc.launch_assets.one_line_broadcast_summary ?? '(no forwardable unit could be built — see friction)')}</pre>
  <p class="small muted">This is the sentence a broadcaster can paste. If it is missing, that absence is the diagnosis.</p>
</div>

<div class="panel">
  <h3 style="margin-top:0">Category</h3>
  <p class="small"><strong>Currently competing in:</strong> ${esc(doc.current_positioning.claimed_category)}</p>
  <p class="small"><strong>Saturation:</strong> ${esc(String((doc.category_analysis as Record<string, unknown>).saturation_estimate))} (${esc(String((doc.category_analysis as Record<string, unknown>).saturation_basis))})</p>
  <p class="small"><strong>Proposed:</strong> ${esc(String((doc.category_analysis as Record<string, unknown>).proposed_positioning ?? '—'))}</p>
</div>

<div class="panel">
  <h3 style="margin-top:0">The broadcaster</h3>
  <p class="small muted">Popularity tracks the largest single broadcast, not the chain. So this names one role, not a list.</p>
  ${((doc.broadcaster_analysis as unknown as { specific_broadcaster_candidates: Array<Record<string, string>> }).specific_broadcaster_candidates ?? [])
    .slice(0, 1)
    .map((c) => `<p class="small"><strong>${esc(c.candidate)}</strong><br><span class="muted">${esc(c.where_to_find)}</span></p>`)
    .join('\n')}
  <p class="small"><strong>Consent posture:</strong> ${esc(String((doc.broadcaster_analysis as Record<string, unknown>).consent_posture))} · outreach capped at ${esc(String((doc.broadcaster_analysis as Record<string, unknown>).max_contacts ?? 3))} contacts</p>
</div>

<div class="panel">
  <h3 style="margin-top:0">Honesty</h3>
  <p class="small"><span class="pill ${doc.honesty_audit.passed ? 'ok' : 'bad'}">${doc.honesty_audit.passed ? 'passed' : 'failed'}</span> ${doc.honesty_audit.findings.length} finding(s)</p>
  ${doc.honesty_audit.findings.slice(0, 5).map((f) => `<p class="small"><strong>${esc(f.severity)}</strong> · <code>${esc(f.matched)}</code><br><span class="muted">${esc(f.suggestion)}</span></p>`).join('\n')}
</div>

<div class="row">
  <button type="button" class="btn" data-download="markdown">Download Markdown</button>
  <button type="button" class="btn ghost" data-download="json">Download JSON (ODS)</button>
  <button type="button" class="btn ghost" data-download="html">Download HTML</button>
</div>
<p class="tiny muted" style="margin-top:12px">The JSON is a valid ODS document. Anyone can re-render it, diff it, or validate it against the published schema without asking us.</p>
`;
}

/* ---------- evidence index ---------- */

function evidenceIndex(): Array<{ folder: string; count: number; files: string[] }> {
  const base = join(ROOT, 'evidence');
  if (!existsSync(base)) return [];
  return readdirSync(base)
    .filter((d) => {
      try {
        return readdirSync(join(base, d)).length >= 0;
      } catch {
        return false;
      }
    })
    .map((folder) => {
      let files: string[] = [];
      try {
        files = readdirSync(join(base, folder)).filter((f) => /\.(md|json|ya?ml)$/i.test(f)).slice(0, 20);
      } catch {
        files = [];
      }
      return { folder, count: files.length, files };
    });
}

/* ---------- static assets ---------- */

const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Viral Engine Commons">
<rect width="64" height="64" rx="14" fill="#0d1117"/>
<path d="M14 46 L28 18 L34 32 L42 22 L50 46" fill="none" stroke="#3fb950" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>
<circle cx="50" cy="46" r="4" fill="#58a6ff"/>
</svg>`;

const MANIFEST = JSON.stringify({
  name: 'Viral Engine Commons',
  short_name: 'Diffusion',
  description: 'Free, open, offline-first diffusion diagnostics. No account, no telemetry.',
  start_url: '/',
  display: 'standalone',
  background_color: '#0b0f14',
  theme_color: '#0b0f14',
  icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
});

const SERVICE_WORKER = `
// Cache-first for the shell, network-only for API. A cached API response would be
// a stale diagnosis presented as a current one, which is exactly the failure mode
// this project exists to criticise.
const SHELL = 'vec-v1';
const PAGES = ['/', '/analyze', '/scorecard', '/protocol', '/academy', '/evidence', '/museum', '/api', '/local', '/privacy', '/accessibility'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(SHELL).then(c => c.addAll(PAGES)).then(() => self.skipWaiting()).catch(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== SHELL).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.pathname.startsWith('/api/')) return;              // never cache an analysis
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(SHELL).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match('/analyze')))
  );
});
`;

/* ---------- router ---------- */

const STATIC_PAGES: Record<string, () => string> = {
  '/': () => layout({ title: 'Free, open diffusion diagnostics', description: 'Find out why your work did not spread, and fix the one thing that would change it. Free forever, offline-first, no account.', path: '/', body: pages.homePage() }),
  '/analyze': () => layout({ title: 'Analyzer', description: 'Paste a repo, URL, PDF, or draft and get a 20-dimension diagnosis in under a minute. Offline by default.', path: '/analyze', body: pages.analyzePage(), script: pages.ANALYZE_SCRIPT }),
  '/scorecard': () => layout({ title: 'The 1000-point index', description: 'Twenty weighted dimensions summing to 1000. Published weights, reproducible arithmetic, stated limitations.', path: '/scorecard', body: pages.scorecardPage() }),
  '/protocol': () => layout({ title: 'Open Diffusion Spec', description: 'A public, evidence-labelled schema for describing an artifact and its diffusion state. Apache-2.0.', path: '/protocol', body: pages.protocolPage() }),
  '/academy': () => layout({ title: 'Free academy', description: 'Fifteen short modules on category, broadcasters, friction, and honest hooks. CC BY 4.0.', path: '/academy', body: pages.academyPage() }),
  '/evidence': () => layout({ title: 'Evidence Commons', description: 'Labelled wins and failures. No aggregate until an aggregate would be honest.', path: '/evidence', body: pages.evidencePage() }),
  '/case-studies': () => layout({ title: 'Case studies', description: 'Structured accounts of real attempts, each labelled by evidence quality.', path: '/case-studies', body: pages.evidencePage() }),
  '/museum': () => layout({ title: 'Failed Launch Museum', description: 'Honest losses, teaching from mechanism rather than blame. Composites are labelled.', path: '/museum', body: pages.museumPage() }),
  '/api': () => layout({ title: 'API', description: 'Free public API, no key, no account, no paid tier. Rate-limited for abuse only.', path: '/api', body: pages.apiPage() }),
  '/local': () => layout({ title: 'Local mode', description: 'Runs with no network, no key, no account, and no model. The provider layer is optional prose.', path: '/local', body: pages.localPage() }),
  '/privacy': () => layout({ title: 'Privacy dashboard', description: 'What each mode sends, described from the code rather than from a policy.', path: '/privacy', body: pages.privacyPage() }),
  '/accessibility': () => layout({ title: 'Accessibility settings', description: 'Preferences stored only in your browser, plus an honest list of what was not tested.', path: '/accessibility', body: pages.accessibilityPage(), script: pages.PREFS_SCRIPT }),
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const path = url.pathname;
  const ip = String(req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? 'unknown').split(',')[0];

  try {
    /* ---- static-ish ---- */
    if (req.method === 'GET') {
      if (path === '/icon.svg') return send(res, 200, ICON_SVG, 'image/svg+xml');
      if (path === '/manifest.webmanifest') return send(res, 200, MANIFEST, 'application/manifest+json');
      if (path === '/sw.js') return send(res, 200, SERVICE_WORKER, 'text/javascript; charset=utf-8');
      if (path === '/favicon.ico') return send(res, 204, '');
      if (path === '/robots.txt') {
        return send(res, 200, 'User-agent: *\nAllow: /\n\n# This site has no tracking, so there is nothing here to disallow.\n', 'text/plain; charset=utf-8');
      }
      if (path === '/api/health') {
        return json(res, 200, { ok: true, name: 'viral-engine-commons', odsVersion: '1.0.0', aqiVersion: AQI_VERSION, telemetry: false, auth: false });
      }
      if (path === '/api/protocol/schema') {
        const p = join(ROOT, 'packages', 'protocol', 'ods.schema.json');
        return send(res, 200, readFileSync(p, 'utf8'), 'application/schema+json; charset=utf-8');
      }
      if (path === '/api/protocol/weights') {
        const p = join(ROOT, 'protocol', 'aqi-weights.json');
        return send(res, 200, readFileSync(p, 'utf8'), 'application/json; charset=utf-8');
      }
      if (path === '/api/protocol/dimensions') {
        return json(res, 200, {
          aqiVersion: AQI_VERSION,
          max: AQI_MAX,
          dimensions: AQI_DIMENSIONS,
          bands: AQI_BANDS,
          formula: 'attempt_quality = round(sum(sub_score_i * weight_i / 100))',
        });
      }
      if (path === '/api/evidence') {
        return json(res, 200, {
          note: 'Evidence records are labelled. No aggregate statistic is published until enough labelled records exist to make one honest.',
          folders: evidenceIndex(),
        });
      }
      if (STATIC_PAGES[path]) {
        return send(res, 200, STATIC_PAGES[path]());
      }
    }

    /* ---- POST endpoints ---- */
    if (req.method === 'POST' && path.startsWith('/api/')) {
      if (rateLimited(ip)) {
        return json(res, 429, {
          error: 'Rate limit: 60 requests per minute per IP. This is abuse prevention, not monetisation — there is no paid tier and nothing to buy. Run it locally for no limit.',
          localCommand: 'git clone https://github.com/mananmodi1487/viral-engine && cd viral-engine && npm ci && npm run serve',
        });
      }

      const raw = await readBody(req);
      const isForm = (req.headers['content-type'] ?? '').includes('application/x-www-form-urlencoded');

      /* form fallback: full page, works with JavaScript disabled */
      if (path === '/api/analyze-form') {
        const params = new URLSearchParams(raw);
        const body: AnalyzeBody = {
          target: params.get('target') || undefined,
          text: params.get('text') || undefined,
          audience: params.get('audience') || undefined,
          channel: params.get('channel') || undefined,
          language: params.get('language') || 'en',
          offline: params.get('offline') === '1',
          strict: params.get('strict') === '1',
        };
        const { doc, ms } = await buildDoc(body);
        return send(res, 200, layout({
          title: `Attempt quality — ${doc.artifact.name}`,
          description: 'Attempt Quality Index report.',
          path: '/analyze',
          body: `<p class="small"><a href="/analyze">← New analysis</a></p>${resultFragment(doc, ms)}<details><summary>Full report</summary>${odsToHtml(doc).split('<main')[1]?.split('</main>')[0] ?? ''}</details>`,
        }));
      }

      let body: AnalyzeBody = {};
      if (!isForm && raw.trim()) {
        try {
          body = JSON.parse(raw) as AnalyzeBody;
        } catch {
          throw new HttpError(400, 'Body must be JSON, or form-encoded for /api/analyze-form.');
        }
      }

      if (path === '/api/render') {
        const { doc, format } = body as unknown as { doc: OdsDocument; format: 'markdown' | 'html' | 'terminal' };
        if (!doc?.scorecard) throw new HttpError(400, 'Missing doc.');
        if (format === 'markdown') return send(res, 200, odsToMarkdown(doc), 'text/markdown; charset=utf-8');
        if (format === 'html') return send(res, 200, odsToHtml(doc));
        if (format === 'terminal') return send(res, 200, odsToTerminal(doc, { colour: false }), 'text/plain; charset=utf-8');
        throw new HttpError(400, 'format must be markdown | html | terminal');
      }

      if (path === '/api/outcomes') {
        return handleOutcomes(res, body as unknown as Record<string, unknown>);
      }

      const { doc, ms } = await buildDoc(body);

      const pick: Record<string, () => unknown> = {
        '/api/analyze': () => ({ doc, html: resultFragment(doc, ms), ms }),
        '/api/score': () => ({
          total: doc.scorecard.total,
          max: doc.scorecard.max,
          band: doc.scorecard.band,
          aqi_version: doc.scorecard.aqi_version,
          do_not_launch_yet: doc.ethics_review.do_not_launch_yet,
          disclaimer: doc.scorecard.disclaimer,
          dimensions: doc.scorecard.dimensions.map((d) => ({
            key: d.key, score: d.score, points: d.points, weight: d.weight, basis: d.basis, confidence: d.confidence,
          })),
        }),
        '/api/category': () => ({ category: doc.category_analysis, positioning: doc.current_positioning }),
        '/api/broadcaster': () => doc.broadcaster_analysis,
        '/api/friction': () => doc.friction_analysis,
        '/api/assets': () => doc.launch_assets,
        '/api/experiment': () => ({ experiments: doc.experiments, failure_conditions: doc.failure_conditions }),
        '/api/simulate': () => doc.x_agents['critic-simulator'],
        '/api/honesty-audit': () => doc.honesty_audit,
        '/api/report': () => ({ markdown: odsToMarkdown(doc), html: odsToHtml(doc), ci: odsToCiSummary(doc) }),
      };

      const fn = pick[path];
      if (!fn) throw new HttpError(404, `No endpoint at ${path}. See /api for the list.`);
      return json(res, 200, fn());
    }

    send(res, 404, layout({
      title: 'Not found',
      description: 'That page does not exist.',
      path: '',
      body: `<h1>404</h1><p class="lede">That page does not exist. Nothing was logged about your visit, which is the one upside.</p><p><a class="btn" href="/">Home</a> <a class="btn ghost" href="/analyze">Analyzer</a></p>`,
    }));
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    const message = (err as Error).message;
    const refused = /^Refused:/.test(message);
    if (req.url?.startsWith('/api/')) {
      return json(res, refused ? 403 : status, {
        error: message,
        ...(refused
          ? {
              refused: true,
              note: 'The abuse sentinel refused this request. It is a refusal of the request, not a judgement of you. The alternative in the message is the supported path and also the one that works.',
            }
          : {}),
      });
    }
    send(res, refused ? 403 : status, layout({
      title: refused ? 'Refused' : 'Error',
      description: message.slice(0, 160),
      path: '',
      body: `<h1>${refused ? 'Refused' : 'Something went wrong'}</h1><pre>${esc(message)}</pre><p><a class="btn ghost" href="/analyze">Back to the analyzer</a></p>`,
    }));
  }
});

function handleOutcomes(res: ServerResponse, body: Record<string, unknown>): void {
  const required = ['id', 'artifact_type', 'what_happened', 'evidence_label', 'what_you_would_change'];
  const labels = ['self-reported', 'verified', 'reproducible', 'anecdotal', 'unclear', 'contested', 'private-redacted'];
  const missing = required.filter((k) => !body[k]);
  const problems: string[] = [];
  if (missing.length) problems.push(`missing required field(s): ${missing.join(', ')}`);
  if (body.evidence_label && !labels.includes(String(body.evidence_label))) {
    problems.push(`evidence_label must be one of ${labels.join(' | ')}`);
  }
  const numbers = (body.numbers as Array<Record<string, unknown>> | undefined) ?? [];
  const unsourced = numbers.filter((n) => !n.source);
  if (unsourced.length) {
    problems.push(`${unsourced.length} number(s) have no source. Sources are not required, but the record will be labelled self-reported.`);
  }
  json(res, problems.length ? 422 : 200, {
    valid: problems.length === 0,
    problems,
    label: unsourced.length ? 'self-reported' : body.evidence_label,
    does_not_support: [
      'Any claim about the population. One case is one case.',
      'Any causal claim. Nothing here was randomised.',
      'Any aggregate statistic. Summing self-reported numbers produces a fabricated number.',
    ],
    next: 'Open a pull request adding this record to evidence/wins/ or evidence/failures/. Read evidence/README.md first.',
  });
}

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, HOST, () => {
    const dims = AQI_DIMENSIONS.length;
    console.log(`viral-engine commons · web`);
    console.log(`  http://${HOST}:${PORT}`);
    console.log(`  AQI ${AQI_VERSION} · ${dims} dimensions · max ${AQI_MAX}`);
    console.log(`  no telemetry · no cookies · no external requests`);
    if (process.env.VIRAL_ENGINE_RATE_MAX) console.log(`  rate limit ${RATE_MAX}/min per IP (abuse prevention only)`);
  });
}

export { server };
