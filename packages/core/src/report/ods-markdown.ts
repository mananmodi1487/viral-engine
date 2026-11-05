/**
 * Markdown renderer for an ODS document.
 *
 * Written for a non-developer first: the verdict is line 1, the weakest
 * dimension is line 2, and every table is readable without knowing what an ODS
 * is. Full JSON is always one command away; this is the version a human reads.
 */
import type { OdsDocument } from '../analyze/ods.js';

const bar = (n: number): string => {
  const filled = Math.round(n / 5);
  return '█'.repeat(filled) + '░'.repeat(20 - filled);
};

export function odsToMarkdown(doc: OdsDocument): string {
  const L: string[] = [];
  const dims = [...doc.scorecard.dimensions];
  const weakest = [...dims].sort((a, b) => a.score - b.score)[0];
  const leverage = [...dims]
    .map((d) => ({ d, lost: Math.round(((100 - d.score) * d.weight) / 100) }))
    .sort((a, b) => b.lost - a.lost)
    .slice(0, 3);

  L.push(`# Attempt quality — ${doc.artifact.name}`);
  L.push('');
  L.push(`**${doc.scorecard.total}/1000** · ${doc.scorecard.band} · weakest: **${weakest.label} (${weakest.score}/100)**`);
  L.push('');
  if (doc.ethics_review.do_not_launch_yet) {
    L.push(`> ## ⛔ Do not launch yet`);
    L.push(`> ${doc.ethics_review.do_not_launch_reason ?? 'A blocking condition was found.'}`);
    L.push('');
  }
  L.push(`*${doc.launch_assets.one_line_broadcast_summary ?? '(no forwardable one-liner could be built from this input)'}*`);
  L.push('');
  L.push(`> ${doc.scorecard.disclaimer}`);
  L.push('');
  L.push(`<sub>ODS ${doc.ods_version} · AQI ${doc.scorecard.aqi_version} · generated ${doc.generated_at} · ${doc.generator.network_calls} network call(s)</sub>`);
  L.push('');
  L.push('---');
  L.push('');

  /* 1. Scorecard */
  L.push('## 1. Attempt Quality Index');
  L.push('');
  L.push('| # | Dimension | Score | Points | Basis | Confidence |');
  L.push('|---:|---|---:|---:|---|---|');
  dims.forEach((d, i) => {
    L.push(`| ${i + 1} | ${d.label} | ${d.score}/100 | ${d.points}/${d.weight} | ${d.basis} | ${d.confidence} |`);
  });
  L.push(`| | **Total** | | **${doc.scorecard.total}/1000** | | |`);
  L.push('');
  L.push('**Basis key:** `measured` = counted from your document · `structural` = deterministic rule · `heuristic` = judgement, labelled as such · `unavailable` = could not determine.');
  L.push('');
  L.push('### Where the leverage is');
  L.push('');
  L.push('Ranked by points lost, not by score. A weak dimension with a small weight is not worth your week.');
  L.push('');
  leverage.forEach(({ d, lost }, i) => {
    L.push(`${i + 1}. **${d.label}** — ${lost} points lost of ${d.weight} possible. *${d.improvement}*`);
  });
  L.push('');
  L.push('### Every dimension, in full');
  L.push('');
  for (const d of dims) {
    L.push(`<details><summary><strong>${d.label}</strong> — ${d.score}/100 (${d.points}/${d.weight} points) · ${d.basis} · ${d.confidence} confidence${d.do_not_launch_yet ? ' · ⛔ blocks launch' : ''}</summary>`);
    L.push('');
    L.push(`- **Evidence:** ${d.evidence.join('; ')}`);
    if (d.assumptions.length) L.push(`- **Assumptions:** ${d.assumptions.join('; ')}`);
    if (d.missing_data.length) L.push(`- **Missing data:** ${d.missing_data.join('; ')}`);
    L.push(`- **Improvement:** ${d.improvement}`);
    L.push(`- **Failure condition:** ${d.failure_condition}`);
    L.push('');
    L.push('</details>');
    L.push('');
  }

  /* 2. Category */
  const cat = doc.category_analysis as Record<string, never>;
  L.push('## 2. Category');
  L.push('');
  L.push(`**You are competing in:** ${doc.current_positioning.claimed_category}`);
  L.push('');
  L.push(`**Saturation:** ${String(cat.saturation_estimate)} *(${String(cat.saturation_basis)})* — ${(cat.evidence as unknown as string[])[0]}`);
  L.push('');
  const adjacent = cat.adjacent_categories as unknown as Array<{ name: string; why_less_crowded: string; tension_score: number; credibility_risk: string; proof_needed: string }>;
  if (adjacent?.length) {
    L.push('| Candidate category | Why less crowded | Tension | What could break it | Proof you would need |');
    L.push('|---|---|---:|---|---|');
    for (const a of adjacent) {
      L.push(`| ${a.name} | ${esc(a.why_less_crowded)} | ${a.tension_score}/5 | ${esc(a.credibility_risk)} | ${esc(a.proof_needed)} |`);
    }
    L.push('');
  }
  L.push(`**Proposed positioning:** ${String(cat.proposed_positioning ?? '—')}`);
  L.push('');
  const catFail = cat.failure_condition as unknown as { statement: string; observable: string; horizon: string };
  L.push(`**Fails if:** ${catFail.statement}`);
  L.push(`*Observable:* ${catFail.observable} *(${catFail.horizon})*`);
  L.push('');

  /* 3. Broadcaster */
  const bc = doc.broadcaster_analysis as Record<string, never>;
  L.push('## 3. The broadcaster');
  L.push('');
  L.push('Popularity tracks the largest single broadcast more than it tracks chains (Goel, Watts & Goldstein 2012/2016). So this names roles, never people.');
  L.push('');
  const candidates = bc.specific_broadcaster_candidates as unknown as Array<Record<string, string>>;
  candidates.forEach((c, i) => {
    L.push(`### ${i === 0 ? 'Primary' : `Alternate ${i}`}: ${c.candidate}`);
    L.push('');
    L.push(`- **Where to find them:** ${c.where_to_find}`);
    L.push(`- **Why they might care:** ${c.why_they_might_care}`);
    L.push(`- **What makes them look good:** ${c.what_makes_them_look_good}`);
    L.push(`- **Consent status:** \`${c.consent_status}\` · **Channel:** ${c.contact_channel}`);
    L.push('');
  });
  L.push(`**Their stake:** ${String(bc.broadcaster_stake)}`);
  L.push('');
  L.push(`**Asset they need:** ${String(bc.share_asset_needed)}`);
  L.push('');
  L.push('**Message — send once, ask for nothing:**');
  L.push('');
  L.push('```text');
  L.push(String(bc.consent_outreach_template));
  L.push('```');
  L.push('');
  L.push('**What not to say:**');
  L.push('');
  for (const r of (bc.what_not_to_say as unknown as string[]) ?? []) L.push(`- ${r}`);
  L.push('');
  L.push('**Anti-spam rules (not suggestions):**');
  L.push('');
  for (const r of (bc.anti_spam_rules as unknown as string[]) ?? []) L.push(`- ${r}`);
  L.push('');

  /* 4. Friction */
  const fr = doc.friction_analysis as Record<string, never>;
  L.push('## 4. Share friction');
  L.push('');
  L.push(`**Friction score: ${String(fr.share_friction_score)}/100** (higher is worse) · forwardable one-liner exists: ${fr.forwardable_artifact_exists ? 'yes' : 'no'}`);
  L.push('');
  L.push('| Friction | Evidence | Fix |');
  L.push('|---|---|---|');
  for (const r of fr.reasons as unknown as Array<{ friction: string; evidence: string; fix: string }>) {
    L.push(`| ${esc(r.friction)} | ${esc(r.evidence)} | ${esc(r.fix)} |`);
  }
  L.push('');
  const irreducible = (doc.x_agents['friction-surgeon'] as { irreducible?: string[] })?.irreducible;
  if (irreducible?.length) {
    L.push('**What no copy can fix:**');
    L.push('');
    for (const i of irreducible) L.push(`- ${i}`);
    L.push('');
  }

  /* 5. Honesty */
  const h = doc.honesty_audit;
  L.push('## 5. Honesty audit');
  L.push('');
  L.push(`**${h.passed ? '✅ Passed' : '❌ Failed'}** — ${h.findings.filter((f) => f.severity === 'blocker').length} blocker(s), ${h.findings.filter((f) => f.severity === 'warning').length} warning(s), ${h.findings.filter((f) => f.severity === 'note').length} note(s)`);
  L.push('');
  if (h.findings.length) {
    L.push('| Severity | Found | Rule | Fix |');
    L.push('|---|---|---|---|');
    for (const f of h.findings) L.push(`| ${f.severity} | \`${esc(f.matched)}\` | ${esc(f.rule)} | ${esc(f.suggestion)} |`);
    L.push('');
  }
  const rewrites = (doc.x_agents['honesty-firewall'] as { rewrites?: Array<{ original: string; replacement: string; why: string }> })?.rewrites ?? [];
  if (rewrites.length) {
    L.push('### Suggested rewrites');
    L.push('');
    for (const r of rewrites) {
      L.push(`- \`${r.original}\` → **${r.replacement}**`);
      L.push(`  <br><sub>${r.why}</sub>`);
    }
    L.push('');
  }
  const cannotCheck = (doc.x_agents['honesty-firewall'] as { cannotCheck?: string[] })?.cannotCheck ?? [];
  if (cannotCheck.length) {
    L.push('**What this audit cannot check:**');
    L.push('');
    for (const c of cannotCheck) L.push(`- ${c}`);
    L.push('');
  }

  /* 6. Assets */
  L.push('## 6. Launch assets');
  L.push('');
  const la = doc.launch_assets as Record<string, never>;
  const assetBlock = (label: string, value: unknown): void => {
    if (value === undefined || value === null || value === '') return;
    L.push(`### ${label}`);
    L.push('');
    const text = Array.isArray(value) ? value.join('\n\n') : String(value);
    L.push('```text');
    L.push(text);
    L.push('```');
    L.push('');
  };
  assetBlock('Hacker News title', la.hacker_news_title);
  assetBlock('Show HN body', la.show_hn_body);
  assetBlock('X thread', la.x_thread);
  assetBlock('LinkedIn', la.linkedin_post);
  assetBlock('Product Hunt', la.product_hunt_description);
  assetBlock('Email subject lines', la.email_subject_lines);
  assetBlock('Chat announcement', la.discord_message);
  assetBlock('Landing hero', la.landing_hero);
  assetBlock('Broadcaster paste', la.one_line_broadcast_summary);
  const placeholders = la.placeholders_used as unknown as string[] | undefined;
  if (placeholders?.length) {
    L.push('### ⚠️ Placeholders you must replace with something true');
    L.push('');
    for (const p of placeholders) L.push(`- \`[${p}]\``);
    L.push('');
    L.push('An unfilled placeholder is a sentence that is not yet true. Do not publish one.');
    L.push('');
  }

  /* 7. Experiments */
  const ex = doc.experiments as Record<string, never>;
  L.push('## 7. Tests to run before launch');
  L.push('');
  L.push('Each test names the decision it changes. A test that changes no decision is a ritual.');
  L.push('');
  for (const t of ex.pre_launch_tests as unknown as Array<Record<string, string>>) {
    L.push(`### ${t.name} <sub>· ${t.cost}</sub>`);
    L.push('');
    L.push(`- **Hypothesis:** ${t.hypothesis}`);
    L.push(`- **Method:** ${t.method}`);
    L.push(`- **Success:** ${t.success_criterion}`);
    L.push(`- **Kill:** ${t.kill_criterion}`);
    L.push(`- **Changes:** ${t.decisionItChanges}`);
    L.push('');
  }
  L.push('### Kill criteria — decided before launch');
  L.push('');
  for (const k of ex.kill_criteria as unknown as string[]) L.push(`- [ ] ${k}`);
  L.push('');

  /* 8. Simulated critics */
  const sim = doc.x_agents['critic-simulator'] as { critics?: Array<Record<string, string>>; mostLikelyMisreading?: string; speculativeDisclaimer?: string } | undefined;
  if (sim?.critics) {
    L.push('## 8. What they will say');
    L.push('');
    L.push(`> ${sim.speculativeDisclaimer}`);
    L.push('');
    for (const c of sim.critics) {
      L.push(`**${c.persona}** · *${c.severity}*`);
      L.push('');
      L.push(`> ${c.firstLine}`);
      L.push('');
      L.push(`*Deeper:* ${c.deeper}`);
      L.push('');
      if (c.repair) L.push(`*Repair:* ${c.repair}`);
      if (c.irreducible) L.push(`*Cannot be repaired with words:* ${c.irreducible}`);
      L.push('');
    }
    if (sim.mostLikelyMisreading) {
      L.push(`**Most likely misreading:** ${sim.mostLikelyMisreading}`);
      L.push('');
    }
  }

  /* 9. Speculative extras */
  const tm = doc.x_agents['time-machine'] as { reactions?: Array<Record<string, string | string[]>>; invariant?: string; notice?: string } | undefined;
  if (tm?.reactions) {
    L.push('## 9. Time Machine (fully speculative)');
    L.push('');
    L.push(`> ${tm.notice}`);
    L.push('');
    for (const r of tm.reactions) {
      L.push(`### ${r.era}`);
      L.push('');
      L.push(`**Would have landed:** ${(r.lands as string[]).join('; ')}`);
      L.push('');
      L.push(`**Would have failed:** ${(r.fails as string[]).join('; ')}`);
      L.push('');
      L.push(`**Period version:** ${r.periodRewrite}`);
      L.push('');
      L.push(`<sub>Speculation basis: ${r.speculationBasis}</sub>`);
      L.push('');
    }
    if (tm.invariant) L.push(`**The invariant:** ${tm.invariant}`);
    L.push('');
  }

  const anti = doc.x_agents['antifragile'] as { attacks?: Array<{ attack: string; survives: boolean; repair: string }> } | undefined;
  if (anti?.attacks) {
    L.push('## 10. Anti-fragile mode');
    L.push('');
    for (const a of anti.attacks) {
      L.push(`- ${a.survives ? '✅' : '❌'} **${a.attack}**`);
      L.push(`  <br><sub>${a.repair}</sub>`);
    }
    L.push('');
  }

  /* 11. Accessibility */
  const acc = doc.x_agents['accessibility-guardian'] as { issues?: Array<Record<string, string>>; untested?: string[] } | undefined;
  L.push('## 11. Accessibility');
  L.push('');
  L.push(`Reading level: ${doc.accessibility.reading_level}`);
  L.push('');
  if (acc?.issues?.length) {
    L.push('| Issue | Severity | Fix |');
    L.push('|---|---|---|');
    for (const i of acc.issues) L.push(`| ${esc(i.issue)} | ${i.severity} | ${esc(i.fix)} |`);
    L.push('');
  } else {
    L.push('No text-level accessibility issues detected.');
    L.push('');
  }
  if (doc.accessibility.plain_language_rewrite) {
    L.push(`**Plain-language rewrite of the longest sentence:** ${doc.accessibility.plain_language_rewrite}`);
    L.push('');
  }
  L.push('**Screen-reader notes:**');
  L.push('');
  for (const n of doc.accessibility.screen_reader_notes as unknown as string[]) L.push(`- ${n}`);
  L.push('');
  if (acc?.untested?.length) {
    L.push('**Not tested:**');
    L.push('');
    for (const u of acc.untested) L.push(`- ${u}`);
    L.push('');
  }

  /* 12. Privacy and ethics */
  const priv = doc.x_agents['privacy-sentinel'] as Record<string, never>;
  const abuse = doc.x_agents['abuse-sentinel'] as Record<string, never>;
  L.push('## 12. Privacy and ethics');
  L.push('');
  L.push(`**This run made ${doc.generator.network_calls} outbound network call(s).** ${String(priv.oneSentencePolicy ?? '')}`);
  L.push('');
  const warnings = priv.warnings as unknown as string[];
  if (warnings?.length) {
    L.push('**Warnings:**');
    L.push('');
    for (const w of warnings) L.push(`- ${w}`);
    L.push('');
  }
  L.push(`**Abuse sentinel verdict:** \`${String(abuse.verdict)}\``);
  L.push('');
  const hardLimits = abuse.hardLimits as unknown as string[];
  if (hardLimits?.length) {
    L.push('This system will never:');
    L.push('');
    for (const l of hardLimits) L.push(`- ${l}`);
    L.push('');
  }
  L.push('**Ethical risk check:**');
  L.push('');
  L.push('| Risk | Assessment | Note |');
  L.push('|---|---|---|');
  for (const r of doc.ethics_review.ethical_risk_check) L.push(`| ${esc(r.risk)} | ${r.assessment} | ${esc(r.note ?? '')} |`);
  L.push('');

  /* 13. Post-launch */
  L.push('## 13. After launch');
  L.push('');
  L.push('**Signals to track:**');
  L.push('');
  for (const s of doc.post_launch_learning.signals_to_track as unknown as string[]) L.push(`- ${s}`);
  L.push('');
  L.push('**Questions to ask:**');
  L.push('');
  for (const q of doc.post_launch_learning.questions_to_ask as unknown as string[]) L.push(`- ${q}`);
  L.push('');
  L.push('**What would change the plan:**');
  L.push('');
  for (const t of doc.post_launch_learning.update_triggers as unknown as string[]) L.push(`- ${t}`);
  L.push('');

  /* 14. Limitations */
  L.push('## 14. What this report cannot tell you');
  L.push('');
  for (const l of doc.limitations) L.push(`- ${l}`);
  L.push('');
  L.push('---');
  L.push('');
  L.push('<sub>Viral Engine Commons · free forever, no telemetry · ODS 2.0 · MIT / CC BY 4.0</sub>');
  L.push('');

  return L.join('\n');
}

function esc(s: string): string {
  return String(s ?? '').replace(/\|/g, '\\|').replace(/\n+/g, ' ');
}
