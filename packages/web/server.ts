/**
 * Web UI — deliberately dependency-free.
 *
 * A tool whose thesis is "remove friction" should not ask you to install 400MB
 * of framework to read a report. Three routes:
 *   GET  /            form + example
 *   POST /api/analyze { target?, text?, offline? } -> JSON report
 *   GET  /report?target=...  -> HTML report (same renderer as the CLI)
 *
 * Local mode: everything runs in this process. No telemetry, no third-party
 * requests, no analytics, no cookies.
 */
import { createServer } from 'node:http';
import { parse } from 'node:url';
import {
  analyze,
  loadSource,
  fetchTopicSaturation,
  resolveProvider,
  toHtml,
  toMarkdown,
} from '@viral-engine/core';

const PORT = Number(process.env.PORT ?? 4173);
/** Bind 0.0.0.0 so the sandbox preview proxy can reach it. */
const HOST = process.env.HOST ?? '0.0.0.0';

const EXAMPLES = [
  'mananmodi1487/viral-engine',
  'It\'s not a habit tracker. It\'s placement-risk management for students in placement season.',
  'A productivity app for busy professionals. Track habits, manage tasks, stay focused.',
];

function page(): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>viral-engine — diagnose why it did not spread</title>
<style>
:root{--bg:#0d1117;--card:#161b22;--line:#30363d;--fg:#e6edf3;--muted:#8b949e;--green:#3fb950;--amber:#d29922;--red:#f85149}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.6 ui-sans-serif,system-ui,sans-serif;padding:0}
.wrap{max-width:860px;margin:0 auto;padding:56px 20px 80px}
h1{font-size:30px;margin:0 0 8px;letter-spacing:-.02em}
.sub{color:var(--muted);margin:0 0 32px}
.card{background:var(--card);border:1px solid var(--line);border-radius:12px;padding:24px;margin:20px 0}
label{display:block;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted);margin:0 0 8px}
textarea,input[type=text]{width:100%;background:#0b0f14;border:1px solid var(--line);border-radius:8px;color:var(--fg);padding:12px;font:14px/1.5 ui-monospace,Menlo,monospace;resize:vertical}
textarea{min-height:120px}
.row{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin-top:16px}
button{background:var(--green);color:#04260f;border:0;border-radius:8px;padding:11px 20px;font-weight:700;font-size:14px;cursor:pointer}
button.ghost{background:transparent;border:1px solid var(--line);color:var(--muted);font-weight:500}
button:disabled{opacity:.5;cursor:progress}
.chk{display:flex;align-items:center;gap:8px;color:var(--muted);font-size:13px}
.chk input{accent-color:var(--green)}
.examples{display:flex;flex-direction:column;gap:8px;margin-top:12px}
.ex{text-align:left;background:#0b0f14;border:1px solid var(--line);color:var(--muted);border-radius:8px;padding:10px 12px;font:12px/1.45 ui-monospace,Menlo,monospace;cursor:pointer;font-weight:400}
.ex:hover{border-color:#3d444d;color:var(--fg)}
.big{font-size:44px;font-weight:800;line-height:1;letter-spacing:-.02em}
table{width:100%;border-collapse:collapse;font-size:13px;margin-top:14px}
th,td{text-align:left;padding:9px 10px;border-bottom:1px solid var(--line);vertical-align:top}
th{color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.06em}
.muted{color:var(--muted)}
.banner{border-radius:8px;padding:12px 16px;margin:16px 0;font-size:14px}
.banner.warn{background:#1c1400;border:1px solid var(--amber);color:#e3b341}
.banner.bad{background:#2b0f11;border:1px solid var(--red);color:#ff7b72}
.pill{display:inline-block;font-size:10px;text-transform:uppercase;letter-spacing:.05em;padding:2px 7px;border-radius:20px;background:#21262d;color:var(--muted);margin-left:6px}
pre{background:#0b0f14;border:1px solid var(--line);border-radius:8px;padding:14px;overflow:auto;font-size:12.5px;white-space:pre-wrap;word-break:break-word}
a{color:#58a6ff}
footer{margin-top:48px;color:var(--muted);font-size:12px;border-top:1px solid var(--line);padding-top:16px}
.spin{display:inline-block;width:14px;height:14px;border:2px solid var(--line);border-top-color:var(--green);border-radius:50%;animation:s .7s linear infinite;vertical-align:-2px;margin-right:8px}
@keyframes s{to{transform:rotate(360deg)}}
</style></head>
<body><div class="wrap">
<h1>viral-engine</h1>
<p class="sub">Diagnose why your work did not spread. Seven levers, one bottleneck, one broadcaster. No signup, no telemetry, no invented statistics.</p>

<div class="card">
  <label for="target">GitHub repo, URL, or paste your copy</label>
  <textarea id="target" placeholder="mananmodi1487/viral-engine&#10;— or —&#10;It's not a habit tracker. It's placement-risk management for students."></textarea>
  <div class="row">
    <button id="run">Run diagnosis</button>
    <button id="html" class="ghost">Open full HTML report</button>
    <div class="chk"><input type="checkbox" id="offline"><label for="offline" style="margin:0;text-transform:none;letter-spacing:0;font-size:13px">Local only (no network)</label></div>
  </div>
  <div class="examples">
    ${EXAMPLES.map((e) => `<button class="ex" data-ex="${encodeURIComponent(e)}">${e.replace(/</g, '&lt;').slice(0, 110)}${e.length > 110 ? '…' : ''}</button>`).join('')}
  </div>
</div>

<div id="out"></div>

<footer>
  Runs entirely in this process. No analytics, no cookies, no third-party requests.
  The report never promises virality — if the honest answer is "do not launch yet", it says so.
</footer>
</div>
<script>
const $ = (id) => document.getElementById(id);
document.querySelectorAll('.ex').forEach((b) => {
  b.addEventListener('click', () => { $('target').value = decodeURIComponent(b.dataset.ex); });
});

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

function render(r) {
  const dims = r.scorecard.dimensions.map((d) => {
    const inverted = d.key === 'honestyRisk';
    const colour = inverted ? (d.score > 40 ? 'var(--red)' : 'var(--green)') : (d.score >= 60 ? 'var(--green)' : d.score >= 40 ? 'var(--amber)' : 'var(--red)');
    return \`<tr>
      <td>\${esc(d.label)}</td>
      <td style="color:\${colour};font-weight:700;white-space:nowrap">\${d.score}<span class="muted">/100</span></td>
      <td class="muted">\${esc(d.basis)}</td>
      <td class="muted" style="font-size:12px">\${esc(d.rationale)}</td>
    </tr>\`;
  }).join('');

  const blockers = r.honesty.findings.filter((f) => f.severity === 'blocker');
  const honesty = r.honesty.findings.length
    ? '<table><tr><th>Severity</th><th>Found</th><th>Suggestion</th></tr>' +
      r.honesty.findings.slice(0, 8).map((f) => \`<tr><td>\${esc(f.severity)}</td><td><code>\${esc(f.matched)}</code></td><td class="muted">\${esc(f.suggestion)}</td></tr>\`).join('') + '</table>'
    : '<p class="muted">No hype or unbacked-claim patterns detected.</p>';

  const b = r.broadcasters[0];
  $('out').innerHTML = \`
    \${r.launchPlan.doNotLaunchYet ? \`<div class="banner warn"><strong>Do not launch yet.</strong> \${esc(r.launchPlan.doNotLaunchReason || '')}</div>\` : ''}
    \${blockers.length ? \`<div class="banner bad"><strong>\${blockers.length} honesty blocker(s).</strong> Publishing now risks a public correction.</div>\` : ''}
    <div class="card">
      <div class="big">\${r.scorecard.overall}<span class="muted" style="font-size:15px">/100</span></div>
      <p class="muted" style="margin:8px 0 0">\${esc(r.source.kind)} · \${esc(r.source.ref)}</p>
      <p style="margin:14px 0 0;font-style:italic">\${esc(r.pasteReady)}</p>
      <table><tr><th>Lever</th><th>Score</th><th>Basis</th><th>Why</th></tr>\${dims}</table>
      <p class="muted" style="font-size:12px;margin-top:10px">Basis: <code>measured</code> counted from your document · <code>structural</code> deterministic rule · <code>heuristic</code> judgement · <code>unavailable</code> could not determine.</p>
    </div>
    <div class="card">
      <h3 style="margin:0 0 6px;font-size:15px">Category</h3>
      <p>Competing in <strong>\${esc(r.category.currentCategory)}</strong> <span class="pill">\${esc(r.category.saturation)}</span></p>
      <p><strong>Proposed:</strong> \${esc(r.category.proposedPositioning)}</p>
      <p class="muted" style="font-size:13px">\${esc(r.category.saturationEvidence)}</p>
      <h3 style="margin:20px 0 6px;font-size:15px">Broadcaster — \${esc(b.target)}</h3>
      <p class="muted" style="font-size:13px">\${esc(b.whyTheyCare)}</p>
      <pre>\${esc(b.messageTemplate)}</pre>
      <p style="color:var(--amber);font-size:13px"><strong>Fails if:</strong> \${esc(b.failureCondition)}</p>
    </div>
    <div class="card"><h3 style="margin:0 0 6px;font-size:15px">Honesty check</h3>\${honesty}</div>
    <div class="card"><h3 style="margin:0 0 6px;font-size:15px">Launch assets</h3>
      \${r.launchPlan.assets.slice(0, 4).map((a) => \`<p class="muted" style="font-size:12px;margin:14px 0 4px">\${esc(a.channel)}</p><pre>\${esc(a.text)}</pre>\`).join('')}
      <p class="muted" style="font-size:12px">All \${r.launchPlan.assets.length} assets are in the full report.</p>
    </div>
    <div class="card"><h3 style="margin:0 0 6px;font-size:15px">Kill criteria</h3>
      <ul>\${r.launchPlan.killCriteria.map((k) => \`<li><strong>\${esc(k.statement)}</strong><div class="muted" style="font-size:12.5px">\${esc(k.observable)} · \${esc(k.horizon)}</div></li>\`).join('')}</ul>
    </div>
    <div class="card"><h3 style="margin:0 0 6px;font-size:15px">Limitations</h3>
      <ul>\${r.limitations.map((l) => \`<li class="muted" style="font-size:13px">\${esc(l)}</li>\`).join('')}</ul>
    </div>\`;
}

async function run() {
  const target = $('target').value.trim();
  if (!target) { $('target').focus(); return; }
  $('out').innerHTML = '<div class="card"><span class="spin"></span>Analysing…</div>';
  $('run').disabled = true;
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ target, offline: $('offline').checked }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'analysis failed');
    render(data);
  } catch (err) {
    $('out').innerHTML = \`<div class="banner bad"><strong>Failed:</strong> \${esc(err.message)}</div>\`;
  } finally {
    $('run').disabled = false;
  }
}
$('run').addEventListener('click', run);
$('target').addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) run(); });
$('html').addEventListener('click', () => {
  const t = $('target').value.trim();
  if (t) window.open('/report?target=' + encodeURIComponent(t) + ($('offline').checked ? '&offline=1' : ''), '_blank');
});
</script></body></html>`;
}

async function buildReport(target: string, offline: boolean) {
  const source = await loadSource(target, { offline });
  let saturationCount: number | undefined;
  if (!offline) {
    const query = [source.topics[0], source.description?.split(/\s+/).slice(0, 4).join(' ')]
      .filter(Boolean)
      .join(' ')
      .trim();
    if (query) {
      const count = await fetchTopicSaturation(query);
      if (count !== null) saturationCount = count;
    }
  }
  const resolution = resolveProvider('auto');
  return analyze(source, {
    provider: resolution.provider ?? undefined,
    saturationCount,
    saturationUnavailableReason: offline ? 'local-only mode' : 'GitHub search unavailable',
  });
}

const server = createServer(async (req, res) => {
  const url = parse(req.url ?? '/', true);

  try {
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(page());
      return;
    }

    if (req.method === 'GET' && url.pathname === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/report') {
      const target = String(url.query.target ?? '');
      if (!target) {
        res.writeHead(400, { 'content-type': 'text/plain' });
        res.end('missing ?target=');
        return;
      }
      const report = await buildReport(target, url.query.offline === '1');
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(toHtml(report));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/report.md') {
      const target = String(url.query.target ?? '');
      const report = await buildReport(target, url.query.offline === '1');
      res.writeHead(200, { 'content-type': 'text/markdown; charset=utf-8' });
      res.end(toMarkdown(report));
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/analyze') {
      const chunks: Buffer[] = [];
      for await (const chunk of req) chunks.push(chunk as Buffer);
      const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}') as {
        target?: string;
        text?: string;
        offline?: boolean;
      };
      const target = (body.target ?? body.text ?? '').trim();
      if (!target) {
        res.writeHead(400, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ error: 'provide "target" (repo, URL, file path) or "text"' }));
        return;
      }
      // Multi-word prose is pasted copy; anything else is a repo/URL/path target.
      const looksLikeProse = target.includes(' ') && target.split(/\s+/).length > 6;

      let source;
      let saturationCount: number | undefined;
      if (looksLikeProse) {
        source = {
          kind: 'free-text' as const,
          ref: 'pasted text',
          body: target,
          topics: [] as string[],
          fetchedFrom: 'pasted' as const,
        };
      } else {
        source = await loadSource(target, { offline: body.offline === true });
        if (body.offline !== true) {
          const query = [source.topics[0], source.description?.split(/\s+/).slice(0, 4).join(' ')]
            .filter(Boolean)
            .join(' ')
            .trim();
          if (query) {
            const c = await fetchTopicSaturation(query);
            if (c !== null) saturationCount = c;
          }
        }
      }

      const resolution = resolveProvider('auto');
      const finalReport = await analyze(source, {
        provider: resolution.provider ?? undefined,
        saturationCount,
        saturationUnavailableReason: body.offline ? 'local-only mode' : 'GitHub search unavailable',
      });

      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(finalReport));
      return;
    }

    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
  } catch (err) {
    res.writeHead(500, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ error: (err as Error).message }));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`viral-engine web UI → http://localhost:${PORT}`);
  console.log('local mode only: no telemetry, no third-party requests');
});
