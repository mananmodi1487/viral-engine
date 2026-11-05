/**
 * HTML renderer + Screenshot Factory.
 *
 * One file, no external requests, no fonts loaded from a CDN, no analytics, and
 * readable with JavaScript disabled. That is not minimalism for its own sake: a
 * report you cannot read on a satellite connection or a work laptop with an
 * aggressive proxy is a report that only serves people who did not need it.
 *
 * Also emits standalone SVGs, which is what the Screenshot Factory produces —
 * forwardable assets that carry their own alt text.
 */
import type { OdsDocument } from '../analyze/ods.js';

const esc = (s: unknown): string =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const bar = (n: number): string => {
  const f = Math.round(n / 5);
  return '█'.repeat(f) + '░'.repeat(20 - f);
};

export function odsToHtml(doc: OdsDocument): string {
  const dims = [...doc.scorecard.dimensions];
  const weakest = [...dims].sort((a, b) => a.score - b.score)[0];
  const leverage = [...dims]
    .map((d) => ({ d, lost: Math.round(((100 - d.score) * d.weight) / 100) }))
    .sort((a, b) => b.lost - a.lost)
    .slice(0, 3);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Attempt quality — ${esc(doc.artifact.name)}</title>
<meta name="description" content="Attempt Quality Index ${doc.scorecard.total}/1000. A rubric, not a prediction.">
<style>
:root{--bg:#0b0f14;--card:#141a21;--line:#242c36;--fg:#e8eef5;--muted:#93a1b0;--green:#3fb950;--amber:#d29922;--red:#f85149;--blue:#58a6ff}
@media (prefers-color-scheme: light){:root{--bg:#fbfcfd;--card:#fff;--line:#e3e8ee;--fg:#14181d;--muted:#5b6673;--green:#1a7f37;--amber:#9a6700;--red:#cf222e;--blue:#0969da}}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.65 ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
.wrap{max-width:900px;margin:0 auto;padding:40px 20px 96px}
h1{font-size:clamp(22px,4vw,32px);line-height:1.2;margin:0 0 4px;letter-spacing:-.02em}
h2{font-size:20px;margin:44px 0 12px;padding-top:20px;border-top:1px solid var(--line)}
h3{font-size:16px;margin:26px 0 8px}
a{color:var(--blue)}
.sub{color:var(--muted);font-size:14px}
.big{font-size:clamp(40px,9vw,64px);font-weight:800;line-height:1;letter-spacing:-.03em}
.hero{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:24px;margin:20px 0}
.stop{border-left:5px solid var(--red);background:color-mix(in srgb,var(--red) 9%,var(--card));padding:16px 20px;border-radius:8px;margin:20px 0}
.stop strong{color:var(--red)}
table{width:100%;border-collapse:collapse;font-size:14px;margin:14px 0;display:block;overflow-x:auto}
th,td{text-align:left;padding:8px 10px;border-bottom:1px solid var(--line);vertical-align:top}
th{font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);font-weight:600}
td.num{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px}
pre{background:#0a0e13;border:1px solid var(--line);border-radius:8px;padding:14px;overflow-x:auto;font-size:13px;line-height:1.55;white-space:pre-wrap}
.bar{font-family:ui-monospace,monospace;color:var(--muted);letter-spacing:-1px}
.pill{display:inline-block;font-size:11px;padding:2px 8px;border-radius:99px;border:1px solid var(--line);color:var(--muted);text-transform:uppercase;letter-spacing:.05em}
.blocker{color:var(--red);border-color:var(--red)}
.warn{color:var(--amber);border-color:var(--amber)}
.ok{color:var(--green);border-color:var(--green)}
details{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:12px 16px;margin:8px 0}
summary{cursor:pointer}
ul{padding-left:22px}
li{margin:4px 0}
.note{font-size:13px;color:var(--muted)}
footer{margin-top:60px;padding-top:20px;border-top:1px solid var(--line);font-size:12px;color:var(--muted)}
.skip{position:absolute;left:-9999px}
.skip:focus{left:8px;top:8px;background:var(--card);padding:8px;z-index:9}
@media print{body{background:#fff;color:#000}.hero,details{break-inside:avoid}pre{white-space:pre-wrap}}
</style>
</head>
<body>
<a class="skip" href="#main">Skip to the report</a>
<main id="main" class="wrap">

<p class="sub">Viral Engine Commons · ODS ${esc(doc.ods_version)} · AQI ${esc(doc.scorecard.aqi_version)} · ${esc(doc.generated_at)} · ${doc.generator.network_calls} network call(s)</p>
<h1>Attempt quality — ${esc(doc.artifact.name)}</h1>

<div class="hero">
  <div class="big">${doc.scorecard.total}<span class="sub">/1000</span></div>
  <div style="margin-top:6px"><strong>${esc(doc.scorecard.band)}</strong> · weakest dimension: <strong>${esc(weakest.label)}</strong> (${weakest.score}/100)</div>
  <p class="note" style="margin:14px 0 0">${esc(doc.scorecard.disclaimer)}</p>
</div>

${doc.ethics_review.do_not_launch_yet ? `<div class="stop"><strong>⛔ Do not launch yet.</strong><br>${esc(doc.ethics_review.do_not_launch_reason ?? '')}</div>` : ''}

<h2 id="leverage">Where the leverage is</h2>
<p class="note">Ranked by points lost, not by score. A weak dimension with a small weight is not worth your week.</p>
<table>
<thead><tr><th>Dimension</th><th>Points lost</th><th>Do this</th></tr></thead>
<tbody>
${leverage.map(({ d, lost }) => `<tr><td><strong>${esc(d.label)}</strong></td><td class="num">${lost} / ${d.weight}</td><td>${esc(d.improvement)}</td></tr>`).join('\n')}
</tbody>
</table>

<h2 id="scorecard">All twenty dimensions</h2>
<table>
<thead><tr><th>#</th><th>Dimension</th><th>Score</th><th>Points</th><th>Basis</th><th>Confidence</th></tr></thead>
<tbody>
${dims.map((d, i) => `<tr>
  <td class="num">${i + 1}</td>
  <td>${esc(d.label)}${d.do_not_launch_yet ? ' <span class="pill blocker">blocks launch</span>' : ''}</td>
  <td class="num"><span class="bar" aria-hidden="true">${bar(d.score)}</span> ${d.score}</td>
  <td class="num">${d.points}/${d.weight}</td>
  <td><span class="pill">${esc(d.basis)}</span></td>
  <td>${esc(d.confidence)}</td>
</tr>`).join('\n')}
<tr><td></td><td><strong>Total</strong></td><td class="num"><strong>${doc.scorecard.total}</strong></td><td class="num">${doc.scorecard.total}/1000</td><td></td><td></td></tr>
</tbody>
</table>
<p class="note"><strong>Basis:</strong> measured = counted from your document · structural = deterministic rule · heuristic = judgement, labelled · unavailable = could not determine.</p>

<h2 id="details">Every dimension, with its evidence</h2>
${dims.map((d) => `<details>
<summary><strong>${esc(d.label)}</strong> — ${d.score}/100 · ${d.points}/${d.weight} points · ${esc(d.basis)} · ${esc(d.confidence)} confidence</summary>
<ul>
<li><strong>Evidence:</strong> ${esc(d.evidence.join('; '))}</li>
${d.assumptions.length ? `<li><strong>Assumptions:</strong> ${esc(d.assumptions.join('; '))}</li>` : ''}
${d.missing_data.length ? `<li><strong>Missing data:</strong> ${esc(d.missing_data.join('; '))}</li>` : ''}
<li><strong>Improvement:</strong> ${esc(d.improvement)}</li>
<li><strong>Failure condition:</strong> ${esc(d.failure_condition)}</li>
</ul>
</details>`).join('\n')}

<h2 id="honesty">Honesty audit</h2>
<p><span class="pill ${doc.honesty_audit.passed ? 'ok' : 'blocker'}">${doc.honesty_audit.passed ? 'passed' : 'failed'}</span></p>
${doc.honesty_audit.findings.length ? `<table>
<thead><tr><th>Severity</th><th>Found</th><th>Rule</th><th>Fix</th></tr></thead>
<tbody>${doc.honesty_audit.findings.map((f) => `<tr><td><span class="pill ${f.severity === 'blocker' ? 'blocker' : f.severity === 'warning' ? 'warn' : ''}">${esc(f.severity)}</span></td><td class="mono">${esc(f.matched)}</td><td>${esc(f.rule)}</td><td>${esc(f.suggestion)}</td></tr>`).join('\n')}</tbody>
</table>` : '<p class="note">No unbacked claims detected in the analysed text.</p>'}

<h2 id="broadcaster">The broadcaster</h2>
<p class="note">Popularity tracks the largest single broadcast more than it tracks chains (Goel, Watts &amp; Goldstein 2012/2016). This names roles, never people, and outreach is capped at three contacts.</p>
${((doc.broadcaster_analysis as unknown as { specific_broadcaster_candidates: Array<Record<string, string>> }).specific_broadcaster_candidates ?? []).map((c, i) => `<h3>${i === 0 ? 'Primary' : `Alternate ${i}`}: ${esc(c.candidate)}</h3>
<ul>
<li><strong>Where:</strong> ${esc(c.where_to_find)}</li>
<li><strong>Why they might care:</strong> ${esc(c.why_they_might_care)}</li>
<li><strong>What makes them look good:</strong> ${esc(c.what_makes_them_look_good)}</li>
<li><strong>Consent:</strong> ${esc(c.consent_status)} · ${esc(c.contact_channel)}</li>
</ul>`).join('\n')}

<h2 id="assets">Launch assets</h2>
${Object.entries(doc.launch_assets as Record<string, unknown>)
  .filter(([k, v]) => typeof v === 'string' && (v as string).length > 0 && k !== 'alt_text')
  .map(([k, v]) => `<h3>${esc(k.replace(/_/g, ' '))}</h3><pre>${esc(v)}</pre>`)
  .join('\n')}

<h2 id="tests">Tests before launch</h2>
<p class="note">Each test names the decision it changes. A test that changes no decision is a ritual.</p>
${((doc.experiments as unknown as { pre_launch_tests: Array<Record<string, string>> }).pre_launch_tests ?? []).map((t) => `<details>
<summary><strong>${esc(t.name)}</strong> · ${esc(t.cost)}</summary>
<ul>
<li><strong>Hypothesis:</strong> ${esc(t.hypothesis)}</li>
<li><strong>Method:</strong> ${esc(t.method)}</li>
<li><strong>Success:</strong> ${esc(t.success_criterion)}</li>
<li><strong>Kill:</strong> ${esc(t.kill_criterion)}</li>
<li><strong>Changes:</strong> ${esc(t.decisionItChanges)}</li>
</ul>
</details>`).join('\n')}

<h2 id="failure">Failure conditions</h2>
<ul>${doc.failure_conditions.map((f) => `<li><strong>${esc(f.statement)}</strong><br><span class="note">${esc(f.observable)} — ${esc(f.horizon)}</span></li>`).join('\n')}</ul>

<h2 id="ethics">Privacy and ethics</h2>
<p><strong>${doc.generator.network_calls} outbound network call(s).</strong> ${esc((doc.x_agents['privacy-sentinel'] as Record<string, unknown>)?.oneSentencePolicy ?? '')}</p>
<table>
<thead><tr><th>Risk</th><th>Assessment</th><th>Note</th></tr></thead>
<tbody>${doc.ethics_review.ethical_risk_check.map((r) => `<tr><td>${esc(r.risk)}</td><td><span class="pill ${r.assessment === 'violation' ? 'blocker' : r.assessment === 'caution' ? 'warn' : 'ok'}">${esc(r.assessment)}</span></td><td>${esc(r.note ?? '')}</td></tr>`).join('\n')}</tbody>
</table>

<h2 id="limitations">What this report cannot tell you</h2>
<ul>${doc.limitations.map((l) => `<li>${esc(l)}</li>`).join('\n')}</ul>

<footer>
<p><strong>Viral Engine Commons</strong> — free forever, no telemetry, no account. Core code MIT · docs CC BY 4.0 · protocol CC0 1.0 (public domain).</p>
<p>This is a rubric, not a forecast. It contains no prediction of reach and no guarantee of any outcome. Every number is reproducible from the evidence printed beside it.</p>
</footer>
</main>
</body>
</html>`;
}

/* ---------- Screenshot Factory: standalone, self-describing SVGs ---------- */

export interface SvgAsset {
  filename: string;
  svg: string;
  /** Alt text is not optional. Every generated image ships with one. */
  alt: string;
}

export function odsSvgAssets(doc: OdsDocument): SvgAsset[] {
  const dims = [...doc.scorecard.dimensions];
  const leverage = [...dims]
    .map((d) => ({ d, lost: Math.round(((100 - d.score) * d.weight) / 100) }))
    .sort((a, b) => b.lost - a.lost)
    .slice(0, 3);

  const scorecard = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 820 480" width="820" height="480" role="img" aria-labelledby="t d">
<title id="t">Attempt Quality Index scorecard for ${esc(doc.artifact.name)}</title>
<desc id="d">${esc(doc.artifact.name)} scores ${doc.scorecard.total} out of 1000, band ${doc.scorecard.band}. Weakest dimension: ${esc(leverage[0].d.label)} at ${leverage[0].d.score} out of 100.</desc>
<rect width="820" height="480" fill="#0d1117"/>
<text x="40" y="56" fill="#e6edf3" font-family="ui-sans-serif,system-ui,sans-serif" font-size="26" font-weight="700">${esc(doc.artifact.name)}</text>
<text x="40" y="84" fill="#8b949e" font-family="ui-sans-serif,system-ui,sans-serif" font-size="14">Attempt Quality Index · a rubric, not a prediction</text>
<text x="40" y="176" fill="#e6edf3" font-family="ui-sans-serif,system-ui,sans-serif" font-size="72" font-weight="800">${doc.scorecard.total}</text>
<text x="${40 + String(doc.scorecard.total).length * 44}" y="176" fill="#8b949e" font-family="ui-sans-serif,system-ui,sans-serif" font-size="26">/1000</text>
<text x="40" y="206" fill="#58a6ff" font-family="ui-sans-serif,system-ui,sans-serif" font-size="16">${esc(doc.scorecard.band)}</text>
${leverage.map(({ d, lost }, i) => `
<text x="40" y="${260 + i * 52}" fill="#e6edf3" font-family="ui-sans-serif,system-ui,sans-serif" font-size="15">${esc(d.label)}</text>
<rect x="330" y="${246 + i * 52}" width="${(d.score / 100) * 400}" height="16" rx="8" fill="${d.score >= 65 ? '#3fb950' : d.score >= 40 ? '#d29922' : '#f85149'}"/>
<rect x="330" y="${246 + i * 52}" width="400" height="16" rx="8" fill="none" stroke="#30363d"/>
<text x="744" y="${259 + i * 52}" fill="#8b949e" font-family="ui-monospace,monospace" font-size="13">${d.score}/100</text>
<text x="40" y="${282 + i * 52}" fill="#6e7681" font-family="ui-sans-serif,system-ui,sans-serif" font-size="12">${lost} points of ${d.weight} lost</text>`).join('')}
<text x="40" y="452" fill="#6e7681" font-family="ui-sans-serif,system-ui,sans-serif" font-size="12">No guaranteed outcomes · ${doc.scorecard.dimensions.length} dimensions · generated ${esc(doc.generated_at.slice(0, 10))}</text>
</svg>`;

  const beforeAfter = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 820 300" width="820" height="300" role="img" aria-labelledby="t2 d2">
<title id="t2">Before and after positioning for ${esc(doc.artifact.name)}</title>
<desc id="d2">Before: competing in ${esc(doc.current_positioning.claimed_category)}. After: the proposed positioning, which names a less crowded category.</desc>
<rect width="820" height="300" fill="#0d1117"/>
<text x="40" y="44" fill="#8b949e" font-family="ui-sans-serif,system-ui,sans-serif" font-size="12" letter-spacing="1.5">BEFORE</text>
<text x="40" y="80" fill="#e6edf3" font-family="ui-sans-serif,system-ui,sans-serif" font-size="19">${esc(truncate(doc.current_positioning.claimed_category, 60))}</text>
<text x="40" y="108" fill="#6e7681" font-family="ui-sans-serif,system-ui,sans-serif" font-size="13">${esc(truncate(doc.current_positioning.one_sentence_description, 78))}</text>
<line x1="40" y1="140" x2="780" y2="140" stroke="#30363d"/>
<text x="40" y="176" fill="#3fb950" font-family="ui-sans-serif,system-ui,sans-serif" font-size="12" letter-spacing="1.5">AFTER</text>
<text x="40" y="212" fill="#e6edf3" font-family="ui-sans-serif,system-ui,sans-serif" font-size="19">${esc(truncate(String((doc.category_analysis as Record<string, unknown>).recommended_category ?? ''), 60))}</text>
<text x="40" y="240" fill="#8b949e" font-family="ui-sans-serif,system-ui,sans-serif" font-size="13">${esc(truncate(String((doc.category_analysis as Record<string, unknown>).proposed_positioning ?? ''), 84))}</text>
<text x="40" y="278" fill="#6e7681" font-family="ui-sans-serif,system-ui,sans-serif" font-size="12">Category change, not copy change. Fails if readers still describe it as the old category.</text>
</svg>`;

  return [
    {
      filename: 'scorecard.svg',
      svg: scorecard,
      alt: `${doc.artifact.name} scores ${doc.scorecard.total} out of 1000 on the Attempt Quality Index. Band: ${doc.scorecard.band}. The three dimensions losing the most points are ${leverage.map((l) => `${l.d.label} (${l.lost} points)`).join(', ')}.`,
    },
    {
      filename: 'before-after.svg',
      svg: beforeAfter,
      alt: `Before: ${doc.current_positioning.claimed_category}. After: ${String((doc.category_analysis as Record<string, unknown>).recommended_category ?? 'a less crowded category')}.`,
    },
  ];
}

function truncate(s: string, n: number): string {
  const clean = String(s ?? '').replace(/\s+/g, ' ').trim();
  return clean.length <= n ? clean : clean.slice(0, n - 1) + '…';
}
