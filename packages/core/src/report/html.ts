/**
 * Self-contained HTML report. No external assets, so it can be emailed,
 * attached to an issue, or opened offline. This is deliberate: a report you
 * cannot open without a network connection is not a report you own.
 */
import type { DiagnosisReport } from '../schemas.js';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function toHtml(r: DiagnosisReport): string {
  const weakest = [...r.scorecard.dimensions]
    .filter((d) => d.key !== 'honestyRisk')
    .sort((a, b) => a.score - b.score)[0];

  const scoreRows = r.scorecard.dimensions
    .map((d) => {
      const inverted = d.key === 'honestyRisk';
      const good = inverted ? d.score < 20 : d.score >= 60;
      const colour = inverted ? (d.score > 40 ? '#f85149' : '#3fb950') : good ? '#3fb950' : d.score >= 40 ? '#d29922' : '#f85149';
      return `<tr>
        <td class="lever">${esc(d.label)}</td>
        <td class="num"><span style="color:${colour};font-weight:700">${d.score}</span><span class="muted">/100</span></td>
        <td><div class="track"><div class="fill" style="width:${d.score}%;background:${colour}"></div></div></td>
        <td class="basis"><code>${esc(d.basis)}</code></td>
        <td class="why">${esc(d.rationale)}<div class="fix"><strong>Fix:</strong> ${esc(d.fix)}</div></td>
      </tr>`;
    })
    .join('');

  const honestyRows = r.honesty.findings.length
    ? r.honesty.findings
        .map(
          (f) => `<tr><td><span class="sev sev-${f.severity}">${f.severity}</span></td>
        <td><code>${esc(f.matched)}</code></td><td>${esc(f.rule)}</td><td>${esc(f.suggestion)}</td></tr>`,
        )
        .join('')
    : '<tr><td colspan="4">No hype or unbacked-claim patterns detected.</td></tr>';

  const broadcasterCards = r.broadcasters
    .map(
      (b, i) => `<div class="card">
      <h3>${i === 0 ? 'Primary' : `Alternate ${i}`} — ${esc(b.target)}</h3>
      <dl>
        <dt>Where to find them</dt><dd>${esc(b.whereToFind)}</dd>
        <dt>Why they care</dt><dd>${esc(b.whyTheyCare)}</dd>
        <dt>Why it makes them look good</dt><dd>${esc(b.whatMakesThemLookGood)}</dd>
        <dt>What to send</dt><dd>${esc(b.assetToSend)}</dd>
        <dt>Likely amplifier</dt><dd>${esc(b.likelyAmplifier)}</dd>
      </dl>
      <pre>${esc(b.messageTemplate)}</pre>
      <p class="muted"><strong>Do not say:</strong> ${b.whatNotToSay.map(esc).join(' · ')}</p>
      <p class="fail"><strong>Fails if:</strong> ${esc(b.failureCondition)}</p>
    </div>`,
    )
    .join('');

  const assetBlocks = r.launchPlan.assets
    .map(
      (a) => `<div class="asset"><h4>${esc(a.channel)} ${a.budget ? `<span class="muted">(${esc(a.budget)})</span>` : ''}</h4>
      <pre>${esc(a.text)}</pre>${a.notes ? `<p class="muted">${esc(a.notes)}</p>` : ''}</div>`,
    )
    .join('');

  const checklist = r.launchPlan.checklist
    .map(
      (c) => `<li class="gate-${c.gate}"><span class="gate">${c.gate}</span> ${esc(c.step)}
      <div class="muted">${esc(c.reasoning)}</div></li>`,
    )
    .join('');

  const kill = r.launchPlan.killCriteria
    .map((k) => `<li><strong>${esc(k.statement)}</strong><div class="muted">Observable: ${esc(k.observable)} · Horizon: ${esc(k.horizon)}</div></li>`)
    .join('');

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Spread diagnosis — ${esc(r.source.title ?? r.source.ref)}</title>
<style>
:root{--bg:#0d1117;--card:#161b22;--line:#30363d;--fg:#e6edf3;--muted:#8b949e;--green:#3fb950;--red:#f85149;--amber:#d29922}
*{box-sizing:border-box}
body{margin:0;padding:40px 20px;background:var(--bg);color:var(--fg);font:15px/1.6 ui-sans-serif,system-ui,-apple-system,sans-serif}
.wrap{max-width:1080px;margin:0 auto}
h1{font-size:26px;margin:0 0 6px}
h2{font-size:17px;margin:44px 0 12px;padding-bottom:8px;border-bottom:1px solid var(--line);text-transform:uppercase;letter-spacing:.08em;color:var(--muted)}
h3{font-size:16px;margin:0 0 12px}
h4{font-size:13px;margin:0 0 8px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
.muted{color:var(--muted);font-weight:400}
.banner{background:#1c1400;border:1px solid var(--amber);color:#e3b341;padding:14px 18px;border-radius:8px;margin:20px 0}
.summary{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:22px;margin:22px 0}
.big{font-size:40px;font-weight:800;line-height:1}
table{width:100%;border-collapse:collapse;background:var(--card);border:1px solid var(--line);border-radius:10px;overflow:hidden;font-size:13px}
th,td{padding:11px 12px;text-align:left;border-bottom:1px solid var(--line);vertical-align:top}
th{background:#1c2128;font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)}
tr:last-child td{border-bottom:none}
.num{white-space:nowrap;font-variant-numeric:tabular-nums;font-size:15px}
.track{width:100px;height:6px;background:#21262d;border-radius:3px;min-width:100px}
.fill{height:6px;border-radius:3px}
.basis code{font-size:11px;background:#21262d;padding:2px 6px;border-radius:4px;color:var(--muted)}
.why{font-size:12.5px}
.fix{margin-top:6px;color:var(--muted);font-size:12px}
.card{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:18px;margin:14px 0}
dl{margin:0;display:grid;grid-template-columns:170px 1fr;gap:6px 14px;font-size:13px}
dt{color:var(--muted)}
dd{margin:0}
pre{background:#0b0f14;border:1px solid var(--line);border-radius:8px;padding:14px;overflow:auto;font-size:12.5px;white-space:pre-wrap;word-break:break-word}
.fail{color:#e3b341;font-size:12.5px}
.sev{font-size:10px;text-transform:uppercase;letter-spacing:.05em;padding:2px 7px;border-radius:20px;font-weight:700}
.sev-blocker{background:#3d1418;color:#ff7b72}
.sev-warning{background:#341a00;color:#e3b341}
.sev-note{background:#1c2128;color:var(--muted)}
ul{padding-left:18px}
li{margin:9px 0}
.gate{font-size:10px;text-transform:uppercase;letter-spacing:.05em;padding:2px 7px;border-radius:20px;background:#21262d;color:var(--muted);margin-right:6px}
.gate-blocker .gate{background:#3d1418;color:#ff7b72}
.gate-warning .gate{background:#341a00;color:#e3b341}
footer{margin-top:50px;padding-top:18px;border-top:1px solid var(--line);color:var(--muted);font-size:12px}
@media(max-width:720px){dl{grid-template-columns:1fr}.track{display:none}}
</style></head><body><div class="wrap">
<h1>Spread diagnosis — ${esc(r.source.title ?? r.source.ref)}</h1>
<p class="muted">${esc(r.source.kind)} · ${esc(r.source.fetchedFrom)}${r.source.degraded ? ` · degraded: ${esc(r.source.degraded)}` : ''}</p>

${r.launchPlan.doNotLaunchYet ? `<div class="banner"><strong>Do not launch yet.</strong> ${esc(r.launchPlan.doNotLaunchReason ?? '')}</div>` : ''}

<div class="summary">
  <div class="big">${r.scorecard.overall}<span class="muted" style="font-size:16px">/100</span></div>
  <p style="margin:10px 0 0">Weakest lever: <strong>${esc(weakest.label)}</strong> at ${weakest.score}/100</p>
  <p style="margin:10px 0 0;color:var(--muted);font-style:italic">${esc(r.pasteReady)}</p>
</div>

<h2>1. Scorecard</h2>
<table><thead><tr><th>Lever</th><th>Score</th><th></th><th>Basis</th><th>Why this score</th></tr></thead><tbody>${scoreRows}</tbody></table>
<p class="muted"><code>measured</code> counted from your document · <code>structural</code> deterministic rule · <code>heuristic</code> judgement call · <code>unavailable</code> could not determine</p>

<h2>2. Category</h2>
<div class="card">
  <p><strong>Currently competing in:</strong> ${esc(r.category.currentCategory)} <span class="muted">(${esc(r.category.currentCategoryBasis)})</span></p>
  <p><strong>Saturation:</strong> ${esc(r.category.saturation)} <span class="muted">(${esc(r.category.saturationBasis)})</span> — ${esc(r.category.saturationEvidence)}</p>
  <p><strong>Proposed positioning:</strong> ${esc(r.category.proposedPositioning)}</p>
  <p><strong>Proof required:</strong> ${esc(r.category.proofRequired)}</p>
  <p class="fail"><strong>Fails if:</strong> ${esc(r.category.failureCondition.statement)}</p>
</div>
<table><thead><tr><th>Adjacent category</th><th>Why less crowded</th><th>Tension</th><th>What could break it</th></tr></thead><tbody>
${r.category.adjacentCategories.map((a) => `<tr><td>${esc(a.name)}</td><td>${esc(a.whyLessCrowded)}</td><td class="num">${a.tensionScore}/5</td><td>${esc(a.credibilityRisk)}</td></tr>`).join('')}
</tbody></table>

<h2>3. The broadcaster</h2>
<p class="muted">Popularity tracks the largest single broadcast more than it tracks chains (Goel, Watts &amp; Goldstein 2012/2016). This section names one.</p>
${broadcasterCards}

<h2>4. Share friction</h2>
<table><thead><tr><th>Friction</th><th>Evidence</th><th>Fix</th></tr></thead><tbody>
${r.shareFriction.map((f) => `<tr><td>${esc(f.friction)}</td><td>${esc(f.evidence)}</td><td>${esc(f.fix)}</td></tr>`).join('')}
</tbody></table>

<h2>5. Honesty check</h2>
<p>${r.honesty.passed ? '<span style="color:var(--green);font-weight:700">Passed</span> — no blocker-level claims found.' : '<span style="color:var(--red);font-weight:700">Blocked</span> — fix these before publishing.'}</p>
<table><thead><tr><th>Severity</th><th>Found</th><th>Rule</th><th>Suggestion</th></tr></thead><tbody>${honestyRows}</tbody></table>

<h2>6. Launch assets</h2>
${assetBlocks}

<h2>7. Pre-launch checklist</h2>
<ul>${checklist}</ul>

<h2>8. Kill criteria</h2>
<p class="muted">Written down before launch, so they cannot be rationalised afterwards.</p>
<ul>${kill}</ul>

<h2>9. Limitations of this report</h2>
<ul>${r.limitations.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>

<footer>
Generated by ${esc(r.generator.name)} ${esc(r.generator.version)} (${esc(r.generator.mode)}${r.generator.provider ? ` via ${esc(r.generator.provider)}/${esc(r.generator.model ?? '')}` : ''}) at ${esc(r.generatedAt)}.<br>
This report contains no invented statistics and makes no promise of virality. It is a diagnosis of the attempt, not a forecast.
</footer>
</div></body></html>`;
}
