#!/usr/bin/env tsx
/**
 * Academy exercise checker.
 *
 *   npm run academy -- 04 ./README.md
 *
 * Each exercise checks the specific thing its module taught, against *your*
 * document. It never writes the answer for you: the repositioning sentence has
 * to be yours, because a generated sentence is exactly the generic copy the
 * academy exists to prevent.
 *
 * Exit codes: 0 pass · 1 not yet · 2 usage.
 */
import { readFileSync, existsSync } from 'node:fs';
import { ingest } from '../../packages/core/src/ingest/index.js';
import { extractSignals } from '../../packages/core/src/signals.js';
import { checkInbound } from '../../packages/core/src/honesty.js';
import { analyzeOds } from '../../packages/core/src/analyze/ods.js';

const MODULES: Record<string, { title: string; file: string }> = {
  '01': { title: 'Why things spread', file: '01-broadcast-not-chain.md' },
  '02': { title: 'The Attempt Quality Index', file: '02-read-a-scorecard.md' },
  '03': { title: 'Finding your category', file: '03-name-your-category.md' },
  '04': { title: 'The repositioning sentence', file: '04-write-the-sentence.md' },
  '05': { title: 'Who carries it', file: '05-name-a-broadcaster.md' },
  '06': { title: 'Consent and outreach', file: '06-write-a-no-ask-message.md' },
  '07': { title: 'Honesty under pressure', file: '07-clean-your-claims.md' },
  '08': { title: 'Failure conditions', file: '08-write-a-kill-criterion.md' },
  '09': { title: 'Pre-launch experiments', file: '09-design-a-test.md' },
  '10': { title: 'The friction audit', file: '10-forwardable-unit.md' },
  '11': { title: 'Accessibility is reach', file: '11-fix-four-failures.md' },
  '12': { title: 'Privacy without theatre', file: '12-prove-offline.md' },
  '13': { title: 'Reading a postmortem', file: '13-extract-a-lesson.md' },
  '14': { title: 'When not to launch', file: '14-decide-whether-to-launch.md' },
  '15': { title: 'Teaching it to someone else', file: '15-run-a-pair-session.md' },
};

interface Check {
  name: string;
  /** Why this check exists, in the student's terms. Printed when it fails. */
  teach: string;
  run: (text: string) => { pass: boolean; detail: string };
}

const GREEN = process.stdout.isTTY ? '\u001b[32m' : '';
const RED = process.stdout.isTTY ? '\u001b[31m' : '';
const DIM = process.stdout.isTTY ? '\u001b[2m' : '';
const OFF = process.stdout.isTTY ? '\u001b[0m' : '';

function checksFor(module: string, text: string): Check[] | null {
  const s = extractSignals(text);
  const pairs: Array<{ re: RegExp; label: string }> = [
    { re: /^\s*>\s+/m, label: 'a blockquote (a sentence someone can lift)' },
    { re: /\b(?:this fails if|fails when|kill criterion|we will stop if)\b/i, label: 'a stated failure condition' },
    { re: /\b(?:npm i|npx|pip install|cargo add|go get|brew install)\b/, label: 'a first-run command' },
  ];
  const found = pairs.filter((p) => p.re.test(text)).map((p) => p.label);

  switch (module) {
    case '01':
      return [
        {
          name: 'No request for amplification',
          teach:
            'Module 01 replaces "make it spread" with "one specific person decides to post it". An ask for shares is the old model.',
          run: (t) => {
            const ask = /\b(?:please (?:share|retweet|boost|repost)|would mean (?:a lot|the world)|smash that|share this with)\b/i.test(t);
            return { pass: !ask, detail: ask ? 'found an explicit request for amplification' : 'no ask for amplification' };
          },
        },
        {
          name: 'Names a role, not a market',
          teach:
            'A broadcaster is a role ("the person who writes the internal newsletter"), not a demographic ("developers").',
          run: () => ({
            pass: s.identityMarkers.length > 0,
            detail: s.identityMarkers.length
              ? `named: ${s.identityMarkers.map((m) => m.term).slice(0, 3).join(', ')}`
              : 'no role named anywhere in the copy',
          }),
        },
        {
          name: 'Contains at least one of the forwardable elements',
          teach: 'A reader needs one thing to lift: a quotable sentence, a failure condition, or a command.',
          run: () => ({ pass: found.length > 0, detail: found.length ? found.join('; ') : 'none of: blockquote, failure condition, install command' }),
        },
      ];

    case '02':
      return [
        {
          name: 'The document can be scored at all',
          teach: 'Module 02: a document with no named audience cannot be read by a scorecard, only guessed at.',
          run: (t) => ({ pass: t.trim().length > 200, detail: `${t.trim().split(/\s+/).length} words` }),
        },
        {
          name: 'No dimension is claiming a number it does not have',
          teach: 'Unavailable means zero. A number with no basis is the thing the rubric forbids.',
          run: async () => ({ pass: true, detail: 'checked by the engine, see below' }) as never,
        },
      ].slice(0, 1);

    case '03':
      return [
        {
          name: 'No mechanism-only description',
          teach:
            'Module 03: "an AI-powered analyser with a rules engine" describes how it works. A category names the job.',
          run: (t) => {
            const mechanismOnly = /\b(?:powered by|built with|using (?:ai|llm|gpt)|rules engine|tech stack)\b/i.test(t) && !/\bit'?s not\b/i.test(t);
            return { pass: !mechanismOnly, detail: mechanismOnly ? 'describes a mechanism and never names a job' : 'ok' };
          },
        },
        {
          name: 'Names a job, not a market',
          teach: 'The job test: "I use this when I need to ______" must be fillable with a verb phrase from the copy.',
          run: () => ({
            pass: s.hasCategoryPairing || s.identityMarkers.length > 0,
            detail: s.hasCategoryPairing ? 'has a category pairing' : s.identityMarkers.length ? 'named a role' : 'neither a pairing nor a role',
          }),
        },
      ];

    case '04':
      return [
        {
          name: 'Has the "it is not X, it is Y" structure',
          teach: 'Module 04: the structure is the point. Without an X the reader supplies their own, and it is not the one you want.',
          run: () => ({ pass: s.hasCategoryPairing, detail: s.hasCategoryPairing ? 'pairing detected' : 'no "not X, but Y" shape found' }),
        },
        {
          name: 'Y is not a superlative or a label-only noun',
          teach:
            'Ornamental Y ("a second brain") maps to no job. Check: can you say "I use this when I need to ___" with your Y?',
          run: (t) => {
            const y = t.match(/\b(?:it'?s|this is)\s+(?:not\s+[^.!?]{2,80}?[,.]?\s*(?:it'?s|but)\s+)([^.!?]{3,90})/i)?.[1] ?? '';
            const ornamental = /\b(?:second brain|game-?changer|revolution|movement|platform for|ecosystem)\b/i.test(y);
            return { pass: !ornamental, detail: ornamental ? `Y looks ornamental: "${y.trim()}"` : y ? `Y reads as: "${y.trim()}"` : 'no Y extracted' };
          },
        },
        {
          name: 'No guaranteed outcome',
          teach: 'An untrue Y is worse than an ornamental one, because the cost lands on whoever forwarded it.',
          run: (t) => {
            const g = checkInbound(t).findings.filter((f) => f.severity === 'blocker');
            return { pass: g.length === 0, detail: g.length ? g.map((f) => f.rule).join('; ') : 'no blockers' };
          },
        },
      ];

    case '05':
      return [
        {
          name: 'No individual identifiers',
          teach: 'Module 05: a broadcaster brief names a role and a discovery method, never a handle.',
          run: (t) => {
            const handles = t.match(/@[a-z0-9_]{2,}/gi) ?? [];
            return { pass: handles.length === 0, detail: handles.length ? `found handles: ${handles.slice(0, 3).join(', ')}` : 'no handles' };
          },
        },
        {
          name: 'No contact list',
          teach: 'A list becomes a queue. The tool will not produce one and neither should the exercise.',
          run: (t) => {
            const list = /(?:^\s*[-*]\s+[A-Z][a-z]+\s+[A-Z][a-z]+\s*(?:\(|,|-))/m.test(t);
            return { pass: !list, detail: list ? 'looks like a list of named people' : 'no apparent name list' };
          },
        },
        {
          name: 'Includes a disqualifier',
          teach: 'Every brief needs a condition under which you should not approach this person at all.',
          run: (t) => {
            const d = /\b(?:do not approach|disqualif|not a fit|skip (?:this|them) if|unless)\b/i.test(t);
            return { pass: d, detail: d ? 'has a disqualifier' : 'no disqualifier' };
          },
        },
      ];

    case '06':
      return [
        {
          name: 'The message contains no ask',
          teach: 'Module 06: four sentences, none of them a request. If there is an ask, the ask is doing the work.',
          run: (t) => {
            const ask = /\b(?:would (?:you|could you)|could you (?:share|post|tweet)|please (?:share|post|tweet|retweet)|happy to reciprocate|would mean (?:a lot|the world)|let me know if you(?:'d| would) be (?:willing|open))\b/i.test(t);
            return { pass: !ask, detail: ask ? 'contains a request for amplification' : 'no ask found' };
          },
        },
        {
          name: 'Provides an exit',
          teach: 'A no-ask message still owes the reader permission to ignore it.',
          run: (t) => {
            const exit = /\b(?:no (?:action|reply) (?:needed|necessary)|no (?:need|obligation) to (?:reply|respond)|ignore this|if (?:it'?s|this is) not (?:useful|relevant))\b/i.test(t);
            return { pass: exit, detail: exit ? 'gives the reader a way out' : 'no exit offered' };
          },
        },
        {
          name: 'No flattery opener',
          teach: '"Loved your content" is a template marker. It signals a broadcast, not a person.',
          run: (t) => {
            const f = /\b(?:loved your|big fan|huge fan|love your (?:content|work|stuff)|been following you)\b/i.test(t);
            return { pass: !f, detail: f ? 'opens with flattery' : 'no flattery opener' };
          },
        },
      ];

    case '07':
      return [
        {
          name: 'No honesty blockers',
          teach: 'Module 07: downgrade every claim to its evidence class. A blocker is a claim you cannot support.',
          run: (t) => {
            const f = checkInbound(t).findings.filter((x) => x.severity === 'blocker');
            return { pass: f.length === 0, detail: f.length ? f.map((x) => `${x.rule}: "${x.matched}"`).join('; ') : 'clean' };
          },
        },
        {
          name: 'No unsourced adoption figure',
          teach: 'A number attached to "users" without a source is the most common invented statistic in launch copy.',
          run: (t) => {
            const n = /\b\d[\d,]{2,}\+?\s+(?:users|developers|stars|customers|downloads)\b/i.test(t);
            const sourced = /\b(?:as of|source:|measured on|per our analytics)\b/i.test(t);
            return { pass: !n || sourced, detail: n && !sourced ? 'adoption figure with no source' : n ? 'figure is sourced' : 'no adoption figure' };
          },
        },
        {
          name: 'Says at least one thing it does not know',
          teach: 'The claim that buys the most credibility per word is "we do not know".',
          run: (t) => {
            const u = /\b(?:we (?:do not|don'?t) know|unknown|unmeasured|no way to know|cannot (?:tell|measure|know)|not measured)\b/i.test(t);
            return { pass: u, detail: u ? 'admits a gap' : 'no admission of a gap anywhere' };
          },
        },
      ];

    case '08':
      return [
        {
          name: 'A failure condition exists',
          teach: 'Module 08: "I will see how it goes" is not a condition.',
          run: () => ({ pass: s.hasFailureCondition || /\b(?:this fails if|fails when|kill criterion)\b/i.test(text), detail: s.hasFailureCondition ? 'present' : 'absent' }),
        },
        {
          name: 'It has an observable',
          teach: 'Without an observable it is a feeling. Something a stranger could also see.',
          run: (t) => {
            const o = /\b(?:observable|a stranger (?:would|could)|we will see|counted|visible in|nobody (?:replies|forwards)|fewer than \d+)\b/i.test(t);
            return { pass: o, detail: o ? 'has something observable' : 'no observable stated' };
          },
        },
        {
          name: 'It has a horizon',
          teach: 'Without a horizon it can never fire, which makes it decoration.',
          run: (t) => {
            const h = /\b(?:by|within|after)\s+\d+\s+(?:hours?|days?|weeks?|months?)\b|\b\d{4}-\d{2}-\d{2}\b/i.test(t);
            return { pass: h, detail: h ? 'has a horizon' : 'no time horizon' };
          },
        },
      ];

    case '09':
      return [
        {
          name: 'The test names the decision it changes',
          teach: 'Module 09: if no result would change what you do, you are collecting data, not testing.',
          run: (t) => {
            const d = /\b(?:if (?:it|this|that) (?:does not|doesn'?t|fails)|we will (?:rewrite|cut|delay|ship|stop)|decision[: ]|we would then|then we would)\b/i.test(t);
            return { pass: d, detail: d ? 'names a decision' : 'no decision named' };
          },
        },
        {
          name: 'It has a success criterion',
          teach: 'A test without a threshold passes by default, which is the same as not running it.',
          run: (t) => {
            const c = /\b(?:at least|more than|fewer than|if \d+|threshold|success criterion|\d+ of \d+)\b/i.test(t);
            return { pass: c, detail: c ? 'has a threshold' : 'no threshold' };
          },
        },
        {
          name: 'It says whether it was pre-registered',
          teach: 'Deciding what counts as success after seeing the result means you always succeed.',
          run: (t) => {
            const p = /\b(?:pre-?register\w*|written (?:down |)?before|before the result|dated|sent to myself)\b/i.test(t);
            return { pass: p, detail: p ? 'states its pre-registration' : 'silent on pre-registration' };
          },
        },
      ];

    case '10':
      return [
        {
          name: 'A one-sentence forwardable unit exists',
          teach: 'Module 10: one sentence a reader can paste with no editing. Job, audience, price, cost.',
          run: (t) => {
            const quote = /^\s*>\s*(.{20,200})$/m.exec(t)?.[1];
            const inline = t.split(/(?<=[.!?])\s+/).find((sen) => sen.split(/\s+/).length <= 26 && /\bfor\b/i.test(sen) && sen.length > 40);
            const unit = quote ?? inline;
            return { pass: Boolean(unit), detail: unit ? `"${unit.trim().slice(0, 120)}"` : 'no single-sentence unit found; write it as a blockquote' };
          },
        },
        {
          name: 'The unit is under 26 words',
          teach: 'Longer than a sentence is a paragraph, and a paragraph is not pasteable.',
          run: (t) => {
            const quote = /^\s*>\s*(.+)$/m.exec(t)?.[1] ?? '';
            const words = quote.trim().split(/\s+/).filter(Boolean).length;
            return { pass: words === 0 ? true : words <= 26, detail: words ? `${words} words` : 'no blockquote to measure' };
          },
        },
      ];

    case '11':
      return [
        {
          name: 'No image without alt text',
          teach: 'An image with no alt text is invisible to some readers, who then cannot evaluate any of it.',
          run: (t) => {
            const bad = /!\[\s*\]\(/.test(t) || /<img(?![^>]*alt=)/i.test(t);
            return { pass: !bad, detail: bad ? 'found an image with no alt attribute' : 'all images have alt attributes' };
          },
        },
        {
          name: 'No alt text that only names the medium',
          teach: '"![screenshot]" tells a screen-reader user what they already know. Describe what it communicates.',
          run: (t) => {
            const alts = [...t.matchAll(/!\[([^\]]*)\]\(/g)].map((m) => m[1].trim().toLowerCase());
            const bad = alts.filter((a) => /^(?:image|img|screenshot|photo|picture|figure|chart|diagram|logo)s?$/.test(a));
            return { pass: bad.length === 0, detail: bad.length ? `non-descriptive alt: ${bad.join(', ')}` : `${alts.length} alt text(s), all descriptive` };
          },
        },
        {
          name: 'Sentences are short enough to parse',
          teach: 'Plain language is accessibility for the largest excluded group: people reading in their second language.',
          run: (t) => {
            const sentences = t.split(/[.!?]+\s+/).map((x) => x.split(/\s+/).filter(Boolean).length).filter((n) => n > 0);
            const avg = sentences.length ? sentences.reduce((a, b) => a + b, 0) / sentences.length : 0;
            return { pass: avg <= 30 || sentences.length < 3, detail: `mean ${avg.toFixed(1)} words per sentence` };
          },
        },
      ];

    case '12':
      return [
        {
          name: 'No third-party scripts or trackers',
          teach: 'Module 12: "we do not track you" in a footer next to an analytics tag is a contradiction.',
          run: (t) => {
            const bad = /(?:google-analytics|googletagmanager|gtag\(|fbq\(|hotjar|mixpanel|segment\.io|plausible\.io|umami)/i.test(t);
            return { pass: !bad, detail: bad ? 'found a third-party analytics reference' : 'no trackers found' };
          },
        },
        {
          name: 'No credential in the copy',
          teach: 'A pasted key in a document is a leak the moment the document is shared.',
          run: (t) => {
            const bad = /\b(?:api[_-]?key|secret|token|password)\s*[:=]\s*[A-Za-z0-9_\-]{8,}/i.test(t);
            return { pass: !bad, detail: bad ? 'found a credential-shaped string' : 'no credentials' };
          },
        },
        {
          name: 'States its data handling',
          teach: 'A privacy claim that is not structural is a mood. Say what leaves the machine, and what does not.',
          run: (t) => {
            const s2 = /\b(?:no (?:account|telemetry|cookies|network)|offline|nothing is (?:sent|stored)|local(?:ly)?|in memory)\b/i.test(t);
            return { pass: s2, detail: s2 ? 'states a data-handling property' : 'says nothing about data handling' };
          },
        },
      ];

    case '13':
      return [
        {
          name: 'States an expectation that existed before the result',
          teach: 'A postmortem that only says what was learned has no surprise in it, and nothing to learn from.',
          run: (t) => {
            const e = /\b(?:expected|hoped for|the target was|we predicted|before (?:the|we) launch)\b/i.test(t);
            return { pass: e, detail: e ? 'has a stated expectation' : 'no pre-existing expectation stated' };
          },
        },
        {
          name: 'Has a "cannot be concluded" section',
          teach: 'Module 13: without it, the postmortem has already decided what it means.',
          run: (t) => {
            const c = /\b(?:cannot be concluded|cannot conclude|does not prove|no way to know|could not tell)\b/i.test(t);
            return { pass: c, detail: c ? 'has one' : 'absent — the implicit claim is unfalsifiable' };
          },
        },
        {
          name: 'States a confound',
          teach: 'Almost every launch changes several things at once. A record without confounds is a single-variable claim about a multi-variable event.',
          run: (t) => {
            const c = /\b(?:confound|at the same time|also changed|simultaneous|coincided)\b/i.test(t);
            return { pass: c, detail: c ? 'names a confound' : 'claims a clean cause' };
          },
        },
      ];

    case '14':
      return [
        {
          name: 'The four launch conditions are addressed explicitly',
          teach: 'Module 14: comprehension, first-five-minutes, checkable claims, description matches artifact.',
          run: (t) => {
            const addressed = ['comprehen|understand|what it is', 'first (?:five|5) minutes|install|onboarding', 'claim|check', 'matches|describes|the thing itself']
              .filter((p) => new RegExp(p, 'i').test(t)).length;
            return { pass: addressed >= 3, detail: `${addressed}/4 conditions addressed` };
          },
        },
        {
          name: 'An explicit decision, with a date',
          teach: 'A decision without a date is a mood. Write the date you will re-check.',
          run: (t) => {
            const d = /\b(?:launch(?:ing)? on|re-?check(?:ing)? on|decide by|on \d{4}-\d{2}-\d{2}|\d{1,2} (?:January|February|March|April|May|June|July|August|September|October|November|December))\b/i.test(t);
            return { pass: d, detail: d ? 'has a dated decision' : 'no date' };
          },
        },
      ];

    case '15':
      return [
        {
          name: 'Records what the other person said, verbatim',
          teach: 'Module 15: every correction is a finding. Paraphrase loses the information.',
          run: (t) => {
            const q = /["“][^"”]{15,200}["”]/.test(t);
            return { pass: q, detail: q ? 'contains a verbatim quotation' : 'no verbatim quote; record their words, not your summary' };
          },
        },
        {
          name: 'Records something the engine got wrong',
          teach: 'The second paragraph of the exercise, and the one that improves the tool rather than flattering it.',
          run: (t) => {
            const d = /\b(?:the (?:engine|tool) (?:got|was) wrong|incorrectly|false positive|disagree|should not have)\b/i.test(t);
            return { pass: d, detail: d ? 'records a disagreement with the tool' : 'no disagreement recorded' };
          },
        },
      ];

    default:
      return null;
  }
}

async function main(): Promise<void> {
  const [moduleArg, target = './README.md'] = process.argv.slice(2);

  if (!moduleArg || moduleArg === '--help' || moduleArg === '-h') {
    console.log('usage: npm run academy -- <module 01-15> [path-to-your-artifact]');
    console.log('');
    for (const [id, m] of Object.entries(MODULES)) {
      console.log(`  ${id}  ${m.title}`);
    }
    process.exit(2);
  }

  const id = moduleArg.padStart(2, '0');
  const meta = MODULES[id];
  if (!meta) {
    console.error(`no module "${moduleArg}". Available: ${Object.keys(MODULES).join(', ')}`);
    process.exit(2);
  }
  if (!existsSync(target)) {
    console.error(`cannot find ${target}. Pass the path to your own artifact.`);
    process.exit(2);
  }

  const bytes = readFileSync(target);
  const ingested = await ingest(target, { bytes });
  const text = ingested.source.text;
  const checks = checksFor(id, text);

  console.log('');
  console.log(`Module ${id} — ${meta.title}`);
  console.log(`Exercise: academy/exercises/${meta.file}`);
  console.log(`Artifact: ${target}`);
  console.log('');

  if (!checks) {
    console.log('This module has no automated check. It is reading, not doing.');
    console.log(`Open academy/modules/ and read it. That is the whole exercise.`);
    process.exit(0);
  }

  let failures = 0;
  for (const c of checks) {
    let pass = false;
    let detail = '';
    try {
      const r = await Promise.resolve(c.run(text) as unknown as { pass: boolean; detail: string });
      pass = r.pass;
      detail = r.detail;
    } catch (e) {
      pass = false;
      detail = `check errored: ${(e as Error).message}`;
    }
    console.log(`${pass ? `${GREEN}PASS${OFF}` : `${RED}NOT YET${OFF}`}  ${c.name}`);
    console.log(`        ${DIM}${detail}${OFF}`);
    if (!pass) {
      failures++;
      console.log(`        ${c.teach}`);
    }
    console.log('');
  }

  if (failures === 0) {
    console.log(`${GREEN}All ${checks.length} checks pass.${OFF} Next: nothing — the exercise is done when`);
    console.log('the sentence is one you would defend, not when a checker is satisfied.');
    process.exit(0);
  }

  console.log(`${failures} of ${checks.length} not yet. That is the exercise, not a failure.`);
  console.log('');
  console.log('Read your own artifact as a hostile stranger before you edit. The fix is');
  console.log('usually in the sentence you were most confident about.');
  process.exit(1);
}

main().catch((e) => {
  console.error(`\nchecker error: ${(e as Error).message}`);
  console.error('This is a bug in the checker, not a judgement on your work.');
  process.exit(2);
});
