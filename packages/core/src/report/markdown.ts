/**
 * Markdown report. Written for a non-developer first: plain headings, no
 * jargon without a definition, and the weakest lever stated before the table.
 */
import type { DiagnosisReport } from '../schemas.js';

const bar = (n: number): string => {
  const filled = Math.round(n / 5);
  return '█'.repeat(filled) + '░'.repeat(20 - filled);
};

export function toMarkdown(r: DiagnosisReport): string {
  const L: string[] = [];
  const weakest = [...r.scorecard.dimensions]
    .filter((d) => d.key !== 'honestyRisk')
    .sort((a, b) => a.score - b.score)[0];

  L.push(`# Spread diagnosis — ${r.source.title ?? r.source.ref}`);
  L.push('');
  L.push(`**Overall: ${r.scorecard.overall}/100** · weakest lever: **${weakest.label} (${weakest.score}/100)**`);
  L.push('');
  if (r.launchPlan.doNotLaunchYet) {
    L.push(`> **Do not launch yet.** ${r.launchPlan.doNotLaunchReason}`);
    L.push('');
  }
  L.push(`*${r.pasteReady}*`);
  L.push('');
  L.push('---');
  L.push('');

  // 1. Scorecard
  L.push('## 1. Scorecard');
  L.push('');
  L.push('Higher is better except **Honesty Risk**, where higher is worse and is labelled as such.');
  L.push('');
  L.push('| Lever | Score | Basis | Why |');
  L.push('|---|---:|---|---|');
  for (const d of r.scorecard.dimensions) {
    L.push(`| ${d.label} | ${d.score}/100 | ${d.basis} | ${escapePipes(d.rationale)} |`);
  }
  L.push('');
  L.push('**Basis key:** `measured` = counted from your document · `structural` = deterministic rule · `heuristic` = judgement · `unavailable` = could not determine.');
  L.push('');
  L.push(`### Fix this first: ${weakest.label}`);
  L.push('');
  L.push(weakest.fix);
  L.push('');

  // 2. Category
  L.push('## 2. Category');
  L.push('');
  L.push(`**You are currently competing in:** ${r.category.currentCategory} *(${r.category.currentCategoryBasis})*`);
  L.push('');
  L.push(`**Saturation:** ${r.category.saturation} *(${r.category.saturationBasis})* — ${r.category.saturationEvidence}`);
  L.push('');
  L.push('**Adjacent, less crowded categories:**');
  L.push('');
  L.push('| Candidate | Why less crowded | Tension | What could break it |');
  L.push('|---|---|---:|---|');
  for (const a of r.category.adjacentCategories) {
    L.push(`| ${a.name} | ${escapePipes(a.whyLessCrowded)} | ${a.tensionScore}/5 | ${escapePipes(a.credibilityRisk)} |`);
  }
  L.push('');
  L.push(`**Proposed positioning:** ${r.category.proposedPositioning}`);
  L.push('');
  L.push(`**Proof required:** ${r.category.proofRequired}`);
  L.push('');
  L.push(`**Fails if:** ${r.category.failureCondition.statement}`);
  L.push(`*Observable:* ${r.category.failureCondition.observable} *(${r.category.failureCondition.horizon})*`);
  L.push('');

  // 3. Broadcaster
  L.push('## 3. The broadcaster');
  L.push('');
  L.push('Popularity tracks the largest single broadcast more than it tracks chains (Goel, Watts & Goldstein 2012/2016). So this section names one.');
  L.push('');
  r.broadcasters.forEach((b, i) => {
    L.push(`### ${i === 0 ? 'Primary' : `Alternate ${i}`}: ${b.target}`);
    L.push('');
    L.push(`- **Where to find them:** ${b.whereToFind}`);
    L.push(`- **Why they care:** ${b.whyTheyCare}`);
    L.push(`- **Why it makes them look good:** ${b.whatMakesThemLookGood}`);
    L.push(`- **What to send:** ${b.assetToSend}`);
    L.push(`- **Likely amplifier:** ${b.likelyAmplifier}`);
    L.push('');
    L.push('**Message template**');
    L.push('');
    L.push('```text');
    L.push(b.messageTemplate);
    L.push('```');
    L.push('');
    L.push('**Do not say:**');
    b.whatNotToSay.forEach((w) => L.push(`- ${w}`));
    L.push('');
    L.push(`**Fails if:** ${b.failureCondition}`);
    L.push('');
  });

  // 4. Share friction
  L.push('## 4. Share friction');
  L.push('');
  L.push('| Friction | Evidence | Fix |');
  L.push('|---|---|---|');
  for (const f of r.shareFriction) {
    L.push(`| ${escapePipes(f.friction)} | ${escapePipes(f.evidence)} | ${escapePipes(f.fix)} |`);
  }
  L.push('');

  // 5. Honesty
  L.push('## 5. Honesty check');
  L.push('');
  L.push(r.honesty.passed ? '**Passed** — no blocker-level claims found.' : '**Blocked** — fix these before publishing.');
  L.push('');
  if (r.honesty.findings.length === 0) {
    L.push('No hype or unbacked-claim patterns detected.');
  } else {
    L.push('| Severity | Found | Rule | Suggestion |');
    L.push('|---|---|---|---|');
    for (const f of r.honesty.findings) {
      L.push(`| ${f.severity} | \`${escapePipes(f.matched)}\` | ${f.rule} | ${escapePipes(f.suggestion)} |`);
    }
  }
  L.push('');

  // 6. Launch assets
  L.push('## 6. Launch assets');
  L.push('');
  for (const a of r.launchPlan.assets) {
    L.push(`### ${a.channel}${a.budget ? ` *(${a.budget})*` : ''}`);
    L.push('');
    L.push('```text');
    L.push(a.text);
    L.push('```');
    if (a.notes) L.push(`> ${a.notes}`);
    L.push('');
  }

  // 7. Checklist
  L.push('## 7. Pre-launch checklist');
  L.push('');
  for (const c of r.launchPlan.checklist) {
    const box = c.gate === 'blocker' ? '**[BLOCKER]**' : c.gate === 'warning' ? '[warning]' : '[info]';
    L.push(`- [ ] ${box} ${c.step}`);
    L.push(`      <sub>${c.reasoning}</sub>`);
  }
  L.push('');

  // 8. Kill criteria
  L.push('## 8. Kill criteria');
  L.push('');
  L.push('Written down before launch, so they cannot be rationalised afterwards.');
  L.push('');
  for (const k of r.launchPlan.killCriteria) {
    L.push(`- **${k.statement}**`);
    L.push(`  - Observable: ${k.observable}`);
    L.push(`  - Horizon: ${k.horizon}`);
  }
  L.push('');

  // 9. Limitations
  L.push('## 9. Limitations of this report');
  L.push('');
  for (const l of r.limitations) L.push(`- ${l}`);
  L.push('');
  L.push('---');
  L.push('');
  L.push(`Generated by ${r.generator.name} ${r.generator.version} (${r.generator.mode}${r.generator.provider ? ` via ${r.generator.provider}/${r.generator.model}` : ''}) at ${r.generatedAt}.`);
  L.push(`Source: ${r.source.kind} — ${r.source.ref} (${r.source.fetchedFrom}${r.source.degraded ? `; degraded: ${r.source.degraded}` : ''}).`);
  return L.join('\n');
}

function escapePipes(s: string): string {
  return s.replace(/\|/g, '\\|').replace(/\n+/g, ' ');
}

export { bar };
