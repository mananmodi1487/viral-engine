#!/usr/bin/env node
/**
 * viral-engine commons — CLI.
 *
 * Exit codes are part of the contract, because this runs in CI:
 *   0  report produced, no blocking findings
 *   1  unexpected error
 *   2  usage error
 *   3  honesty blockers found (default in CI mode)
 *   4  ethics violation — do not launch (--fail-on-ethics-violation)
 *   5  refused: the request was abusive, and the engine declines
 *
 * Every command works with no network, no API key, and no account. That is a
 * requirement, not a feature: `--offline` is the recommended default, and the
 * only thing it costs you is the saturation count.
 */
import { writeFileSync, mkdirSync, existsSync, statSync, readFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import {
  ingest,
  analyzeOds,
  odsToMarkdown,
  odsToTerminal,
  odsToHtml,
  odsToCiSummary,
  odsSvgAssets,
  resolveProvider,
  PROVIDER_CAPABILITIES,
  AQI_DIMENSIONS,
  AQI_MAX,
  AQI_VERSION,
  SUPPORTED_INPUTS,
  analyze,
  loadSource,
  toMarkdown,
  toTerminal,
  checkInbound,
  extractSignals,
  migrateDocument,
  MIGRATION_TARGET_ODS as CURRENT_ODS_VERSION,
  buildSharePayloads,
  failureCard,
  ARTIFACT_TYPES,
  roast,
  therapist,
  killYourDarling,
  explainLikeImFive,
  stressTest,
} from '@viral-engine/core';
import type { OdsDocument, ProviderName, AqiDimension, Signals } from '@viral-engine/core';

const VERSION = '3.0.0';

const HELP = `
viral-engine commons — ethical diffusion infrastructure

  Free forever. No account, no telemetry, no paywall. Works offline.

USAGE
  viral-engine <command> [target] [options]

COMMANDS
  analyze <target>        full diagnosis as an ODS document (default)
  score <target>          the Attempt Quality Index only, 0-1000
  category <target>       category map and repositioning
  broadcaster <target>    who would carry it, and under what consent
  friction <target>       why forwarding is expensive
  assets <target>         launch assets for your channels
  experiment <target>     pre-launch tests with kill criteria
  simulate <target>       what critics will say
  honesty-audit <target>  claims that would not survive being checked
  report <target>         full report to file (md | html)
  card <target>           the share card: SVG, alt text, badge, and the one-line forward
  thread <target>         a four-post thread built from the actual numbers
  stress-test             the 100k-star stress test. Explains mechanisms; predicts nothing.
  roast <target>          a funny, honest critique of the copy. Never of the person.
  therapist <target>      separates the author from the artifact. Not therapy, and says so.
  kill-my-darling <target> [sentence]   argues against the line you are attached to
  explain <target>        plain-language version, with the uncertainty kept in
  types                   list the 33 artifact types and what each one must contain
  doctor                  check what is configured, locally, without phoning home
  local-mode [on|off]     write a config that forbids all network access
  providers               list providers, what they may produce, and their privacy posture
  protocol                print the ODS field reference and AQI weights
  submit-outcome          record what happened, so the next person can learn
  migrate <file>          migrate an older report to the current ODS version
  upgrade                 print how to upgrade (there is no paid tier)

TARGETS
  owner/repo                        GitHub repository
  https://github.com/owner/repo     GitHub repository
  ./README.md  ./deck.pdf  ./brief.docx  ./my-project/
  https://example.com               landing page
  --text "..."                      inline text

OPTIONS
  --provider <name>       none | auto | anthropic | openai | google | mistral | groq
                          | ollama | llama-cpp | lm-studio          (default: auto)
  --model <name>          override the model name
  --output, --format      terminal | markdown | json | html | svg | canvas   (default: terminal)
  -o, --out <file>        write to a file (or a directory for svg/canvas)
  --strict-honesty        treat warnings as blockers as well
  --offline               no network calls at all (implies --provider none)
  --no-telemetry          accepted and always true; exists so scripts can be explicit
  --language <bcp47>      language of the artifact (default: en)
  --audience <role>       developer | founder | writer | researcher | marketer | student | other
  --channel <name>        github | hackernews | x | linkedin | producthunt | email | discord
                          | youtube | tiktok
  --fail-on-ethics-violation   exit 4 when do_not_launch_yet is true
  --generate-pr           print a ready-to-run gh command instead of a diff
  --saturation-count <n>  supply a repo count yourself (skips any query)
  --type <artifact-type>  declare the artifact type (see: viral-engine types)
  --darling "<sentence>"  the sentence to argue against, for kill-my-darling
  --no-colour             plain output
  -q, --quiet             suppress the extras (the asset gallery, the asset listing)
  --verbose               print the limitations inline
  --ci                    compact output, fail on honesty blockers
  -h, --help              this
  -v, --version           version

EXAMPLES
  viral-engine analyze ./README.md --offline
  viral-engine analyze mananmodi1487/viral-engine --output markdown -o report.md
  viral-engine score --text "A productivity app for busy professionals." --offline
  viral-engine report . --output html -o report.html
  viral-engine assets ./README.md --channel hackernews --offline
  viral-engine card ./README.md --offline -o card            # card.svg + card.alt.txt + badge.json
  viral-engine roast ./README.md --offline
  viral-engine stress-test --output markdown

EXIT CODES
  0 clean · 1 error · 2 usage · 3 honesty blocker · 4 ethics violation · 5 refused
`.trim();

type OutputFormat = 'terminal' | 'markdown' | 'json' | 'html' | 'svg' | 'canvas';

interface Args {
  command: string;
  target?: string;
  text?: string;
  format: OutputFormat;
  out?: string;
  provider: ProviderName | 'auto';
  model?: string;
  offline: boolean;
  colour: boolean;
  ci: boolean;
  strictHonesty: boolean;
  failOnEthics: boolean;
  generatePr: boolean;
  verbose: boolean;
  quiet: boolean;
  language?: string;
  audience?: string;
  channel?: string;
  saturationCount?: number;
  /** Declared artifact type; the rubric is applied differently per type. */
  artifactType?: string;
  /** The sentence to argue against, for kill-my-darling. */
  darling?: string;
  rest: string[];
}

class UsageError extends Error {}

const FORMAT_ALIASES: Record<string, OutputFormat> = {
  terminal: 'terminal', md: 'markdown', markdown: 'markdown', json: 'json',
  html: 'html', svg: 'svg', canvas: 'canvas',
};

function parseArgs(argv: string[]): Args {
  const a: Args = {
    command: '',
    format: 'terminal',
    provider: 'auto',
    offline: false,
    colour: true,
    quiet: false,
    ci: false,
    strictHonesty: false,
    failOnEthics: false,
    generatePr: false,
    verbose: false,
    rest: [],
  };
  const positional: string[] = [];

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    const next = (): string => {
      const v = argv[++i];
      if (v === undefined) throw new UsageError(`option ${arg} needs a value`);
      return v;
    };
    switch (arg) {
      case '-h': case '--help': console.log(HELP); process.exit(0); break;
      case '-v': case '--version': console.log(`viral-engine commons ${VERSION}`); process.exit(0); break;
      case '--output': case '--format': case '-f': {
        const v = next();
        const f = FORMAT_ALIASES[v];
        if (!f) throw new UsageError(`--output must be terminal|markdown|json|html|svg|canvas, got "${v}"`);
        a.format = f;
        break;
      }
      case '-o': case '--out': a.out = next(); break;
      case '--provider': {
        const v = next();
        const allowed = PROVIDER_CAPABILITIES.map((p) => p.name);
        if (!allowed.includes(v as ProviderName)) {
          throw new UsageError(`--provider must be one of ${allowed.join('|')}, got "${v}"`);
        }
        a.provider = v as ProviderName;
        break;
      }
      case '--model': a.model = next(); break;
      case '--offline': a.offline = true; a.provider = 'none'; break;
      case '--no-telemetry': break; // there is no telemetry to disable; accepted for explicitness
      case '--strict-honesty': a.strictHonesty = true; break;
      case '--fail-on-ethics-violation': a.failOnEthics = true; break;
      case '--generate-pr': a.generatePr = true; break;
      case '--no-colour': case '--no-color': a.colour = false; break;
      case '--quiet': case '-q': a.quiet = true; break;
      case '--ci': a.ci = true; a.colour = false; break;
      case '--verbose': a.verbose = true; break;
      case '--language': a.language = next(); break;
      case '--audience': a.audience = next(); break;
      case '--channel': a.channel = next(); break;
      case '--saturation-count': {
        const n = Number(next());
        if (!Number.isFinite(n) || n < 0) throw new UsageError('--saturation-count must be a non-negative number');
        a.saturationCount = n;
        break;
      }
      case '--text': a.text = next(); break;
      case '--type': a.artifactType = next(); break;
      case '--darling': a.darling = next(); break;
      default:
        if (arg.startsWith('--text=')) a.text = arg.slice('--text='.length);
        else if (arg.startsWith('--')) throw new UsageError(`unknown option "${arg}" (try --help)`);
        else positional.push(arg);
    }
  }

  a.command = positional[0] ?? '';
  a.target = positional[1];
  if (['analyze', 'score', 'category', 'broadcaster', 'friction', 'assets', 'experiment',
       'simulate', 'honesty-audit', 'report', 'submit-outcome', 'migrate'].includes(a.command)) {
    a.target = positional[1];
  } else if (positional.length === 1) {
    // `viral-engine ./README.md` behaves like `analyze ./README.md`
    a.command = positional[0];
    a.target = undefined;
  }
  return a;
}

async function main(): Promise<number> {
  let args: Args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`error: ${(err as Error).message}`);
    return 2;
  }

  if (!args.command) {
    console.log(HELP);
    return 0;
  }

  /* ---------- commands that need no target ---------- */
  switch (args.command) {
    case 'doctor': return doctor(args);
    case 'local-mode': return localMode(args);
    case 'providers': return listProviders();
    case 'protocol': return printProtocol();
    case 'upgrade': return upgrade();
    case 'init': return initProject(args);
    case 'types': return listArtifactTypes();
    case 'stress-test': return runStressTest(args);
  }

  if (args.command === 'migrate') {
    if (!args.target) {
      console.error('error: migrate needs a file: viral-engine migrate report.json');
      return 2;
    }
    return migrate(args);
  }

  if (args.command === 'submit-outcome') {
    return submitOutcome(args);
  }

  const known = ['analyze', 'score', 'category', 'broadcaster', 'friction', 'assets',
    'experiment', 'simulate', 'honesty-audit', 'report',
    'card', 'thread', 'roast', 'therapist', 'kill-my-darling', 'explain'];
  if (!known.includes(args.command)) {
    // A bare path or URL is treated as `analyze`.
    if (!args.command.startsWith('-') && (args.text === undefined)) {
      args.target = args.command;
      args.command = 'analyze';
    } else {
      console.error(`error: unknown command "${args.command}". Try: viral-engine analyze <target>`);
      return 2;
    }
  }

  if (!args.target && !args.text) {
    console.error('error: no target. Pass a repo, a path, a URL, or --text "..."');
    return 2;
  }

  /* The four modes read the artifact directly rather than through a full ODS
     document: they are about a sentence, not a launch. Running the whole pipeline
     to roast a README would be slower and would tempt the roaster into quoting
     scores it was not asked to produce. */
  if (['roast', 'therapist', 'kill-my-darling', 'explain'].includes(args.command)) {
    try {
      return await runMode(args);
    } catch (err) {
      const msg = (err as Error).message;
      if (/^Refused:/.test(msg)) { console.error(msg); return 5; }
      console.error(`error: ${msg}`);
      return 1;
    }
  }

  try {
    return await runAnalysis(args);
  } catch (err) {
    const msg = (err as Error).message;
    if (/^Refused:/.test(msg)) {
      console.error(msg);
      return 5;
    }
    console.error(`error: ${msg}`);
    if (/ENOTFOUND|EAI_AGAIN|abort|fetch failed/i.test(msg)) {
      console.error('hint: no network access. Try --offline with a local file, or pass --text.');
    }
    if (/not found \(404\)/.test(msg) || /HTTP 404/.test(msg)) {
      console.error('hint: check the spelling, or the repository may be private. Try --offline with a local clone.');
    }
    return 1;
  }
}

/* ---------- the main path ---------- */

async function runAnalysis(args: Args): Promise<number> {
  const started = Date.now();
  const localConfig = readLocalConfig();
  const offline = args.offline || localConfig?.offline === true || args.provider === 'none';

  const ing = await ingest(args.target ?? '', { offline, text: args.text });

  let saturationCount = args.saturationCount;
  let saturationReason = offline
    ? 'offline mode — no saturation query was run, so crowding is unknown rather than guessed'
    : 'no saturation query was run';

  if (saturationCount === undefined && !offline && ing.source.kind === 'github-repo') {
    const query = [ing.source.topics[0], ing.source.description?.split(/\s+/).slice(0, 4).join(' ')]
      .filter(Boolean).join(' ').trim();
    if (query) {
      try {
        const res = await fetch(
          `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=1`,
          { headers: { accept: 'application/vnd.github+json', 'user-agent': 'viral-engine-commons' } },
        );
        if (res.ok) {
          const json = (await res.json()) as { total_count?: number };
          if (typeof json.total_count === 'number') saturationCount = json.total_count;
          else saturationReason = 'GitHub search returned no count';
        } else saturationReason = `GitHub search unavailable (HTTP ${res.status})`;
      } catch {
        saturationReason = 'GitHub search unreachable';
      }
    } else {
      saturationReason = 'no topics or description to build a saturation query from';
    }
  }

  const resolution = resolveProvider(offline ? 'none' : args.provider);
  if (resolution.provider === null && !offline && args.provider === 'auto' && args.format === 'terminal' && !args.ci) {
    console.error(`note: ${resolution.reason}`);
    console.error(`      available: ${resolution.skipped.map((s) => `${s.name} (${s.why})`).join(', ')}`);
    console.error('      this is the recommended default. models only add prose; they cannot change a score.');
  }

  const networkCalls = offline ? 0 : (ing.source.fetchedFrom === 'network' ? 1 : 0) + (saturationCount !== undefined && args.saturationCount === undefined ? 1 : 0);

  const doc = await analyzeOds(ing.source, {
    saturationCount,
    saturationUnavailableReason: saturationReason,
    offline,
    networkCalls,
    declared: {
      audience: args.audience,
      channel: args.channel,
    },
    language: args.language,
    channel: args.channel,
    artifactType: args.artifactType,
  });

  const elapsed = Date.now() - started;

  /* Degradation is always visible, never a quiet footnote. */
  const degradations = [...new Set([...(ing.degraded ?? []), ...(ing.source.degraded ? [ing.source.degraded] : [])])];
  if (degradations.length && args.format === 'terminal') {
    for (const d of degradations) console.error(`note: input degraded — ${d}`);
  }

  const emitted = render(args, doc);
  if (typeof emitted === 'string') {
    if (args.out) {
      const full = resolve(args.out);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, emitted, 'utf8');
      console.error(`wrote ${full}  (${(emitted.length / 1024).toFixed(1)}KB, ${elapsed}ms)`);
    } else {
      process.stdout.write(emitted + (args.format === 'json' ? '' : '\n'));
    }
  }

  if (args.generatePr) {
    console.log('');
    console.log('# To open a PR with the suggested positioning rewrite:');
    console.log('#   1. apply the changes in section 2 (Category) to your README');
    console.log('#   2. then run:');
    console.log(`gh pr create --title "Reposition: ${(doc.category_analysis as Record<string, unknown>).recommended_category}" --body-file viral-engine-report.md`);
  }

  /* ---------- exit codes ---------- */
  const blockers = doc.honesty_audit.findings.filter((f) => f.severity === 'blocker').length;
  const warnings = doc.honesty_audit.findings.filter((f) => f.severity === 'warning').length;

  if (args.failOnEthics && doc.ethics_review.do_not_launch_yet) {
    console.error(`\nethics gate: do not launch yet — ${doc.ethics_review.do_not_launch_reason}`);
    return 4;
  }
  if ((args.ci || args.strictHonesty) && (blockers > 0 || (args.strictHonesty && warnings > 0))) {
    console.error(`\nhonesty gate failed: ${blockers} blocker(s), ${warnings} warning(s). Fix the claim, not the check.`);
    return 3;
  }
  return 0;
}

function render(args: Args, doc: OdsDocument): string | undefined {
  switch (args.command) {
    case 'score':
      return renderScore(doc, args);
    case 'category':
      return renderSection(doc, 'Category', args);
    case 'broadcaster':
      return renderSection(doc, 'Broadcaster', args);
    case 'friction':
      return renderSection(doc, 'Friction', args);
    case 'assets':
      return renderSection(doc, 'Assets', args);
    case 'experiment':
      return renderSection(doc, 'Experiments', args);
    case 'simulate':
      return renderSection(doc, 'Critics', args);
    case 'honesty-audit':
      return renderSection(doc, 'Honesty', args);
    case 'card': {
      void writeCard(args, doc);
      return undefined;
    }
    case 'thread': {
      void renderThread(args, doc);
      return undefined;
    }
    default:
      break;
  }

  switch (args.format) {
    case 'json': return JSON.stringify(doc, null, 2);
    case 'markdown': return odsToMarkdown(doc);
    case 'html': return odsToHtml(doc);
    case 'svg': {
      writeSvg(args, doc);
      return undefined;
    }
    case 'canvas': return JSON.stringify(canvasSpec(doc), null, 2);
    case 'terminal':
    default:
      return args.ci ? odsToCiSummary(doc) : odsToTerminal(doc, { colour: args.colour, verbose: args.verbose });
  }
}

function renderScore(doc: OdsDocument, args: Args): string {
  if (args.format === 'json') {
    return JSON.stringify({
      total: doc.scorecard.total,
      max: doc.scorecard.max,
      band: doc.scorecard.band,
      aqi_version: doc.scorecard.aqi_version,
      do_not_launch_yet: doc.ethics_review.do_not_launch_yet,
      disclaimer: doc.scorecard.disclaimer,
      dimensions: doc.scorecard.dimensions.map((d) => ({
        key: d.key, score: d.score, points: d.points, weight: d.weight, basis: d.basis, confidence: d.confidence,
      })),
    }, null, 2);
  }
  const lines: string[] = [];
  lines.push(`${doc.scorecard.total}/${AQI_MAX}  ${doc.scorecard.band}   (AQI ${AQI_VERSION})`);
  const leverage = [...doc.scorecard.dimensions]
    .map((d) => ({ d, lost: Math.round(((100 - d.score) * d.weight) / 100) }))
    .sort((a, b) => b.lost - a.lost)
    .slice(0, 5);
  lines.push('');
  lines.push('points lost, ranked:');
  for (const { d, lost } of leverage) {
    lines.push(`  ${String(lost).padStart(3)} of ${String(d.weight).padStart(3)}  ${d.label}`);
  }
  lines.push('');
  if (doc.ethics_review.do_not_launch_yet) lines.push(`⛔ do not launch yet: ${doc.ethics_review.do_not_launch_reason}`);
  lines.push('(a rubric, not a forecast — viral-engine score --output json for the full breakdown)');
  return lines.join('\n');
}

function renderSection(doc: OdsDocument, section: string, args: Args): string {
  if (args.format === 'json') {
    const map: Record<string, unknown> = {
      Category: { category: doc.category_analysis, positioning: doc.current_positioning },
      Broadcaster: doc.broadcaster_analysis,
      Friction: doc.friction_analysis,
      Assets: doc.launch_assets,
      Experiments: { experiments: doc.experiments, failure_conditions: doc.failure_conditions },
      Critics: doc.x_agents['critic-simulator'],
      Honesty: doc.honesty_audit,
    };
    return JSON.stringify(map[section], null, 2);
  }
  const md = odsToMarkdown(doc);
  const headings: Record<string, string> = {
    Category: '## 2. Category',
    Broadcaster: '## 3. The broadcaster',
    Friction: '## 4. Share friction',
    Assets: '## 6. Launch assets',
    Experiments: '## 7. Tests to run before launch',
    Critics: '## 8. What they will say',
    Honesty: '## 5. Honesty audit',
  };
  const start = md.indexOf(headings[section]);
  if (start === -1) return md;
  const nextHeadings = Object.values(headings).filter((h) => h !== headings[section]);
  const end = nextHeadings
    .map((h) => md.indexOf(h, start + 1))
    .filter((i) => i > start)
    .sort((a, b) => a - b)[0] ?? md.length;
  return md.slice(start, end).trim();
}

function writeSvg(args: Args, doc: OdsDocument): void {
  const assets = odsSvgAssets(doc);
  /**
   * `svg` produces several files, so the output is a directory. Accepting a path
   * that ends in `.svg` and then writing twenty files into a directory of that
   * name was confusing; strip the extension and say so on stderr.
   */
  const requested = args.out ?? 'viral-engine-assets';
  const looksLikeFile = /\.[a-z0-9]{2,5}$/i.test(requested);
  const dir = resolve(looksLikeFile ? requested.replace(/\.[a-z0-9]{2,5}$/i, '') : requested);
  if (looksLikeFile) console.error(`note: svg output is a directory; writing to ${dir}`);
  mkdirSync(dir, { recursive: true });
  for (const a of assets) {
    writeFileSync(join(dir, a.filename), a.svg, 'utf8');
    writeFileSync(join(dir, a.filename.replace(/\.svg$/, '.alt.txt')), a.alt + '\n', 'utf8');
  }
  console.error(`wrote ${assets.length} SVG asset(s) and their alt text to ${dir}`);
  for (const a of assets) console.error(`  ${a.filename}  — alt: ${a.alt.slice(0, 90)}…`);
  if (!args.quiet) {
    // The last line of stdout is always the thing the user would have opened.
    writeFileSync(join(dir, 'index.html'), svgGallery(assets), 'utf8');
  }
}

/**
 * A gallery page for the generated SVGs. Every image is accompanied by its alt
 * text in plain sight, because an asset you cannot describe is an asset half your
 * audience cannot see.
 */
function svgGallery(assets: ReturnType<typeof odsSvgAssets>): string {
  const items = assets
    .map(
      (a) => `  <figure>
    <img src="./${a.filename}" alt="${a.alt.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')}">
    <figcaption>
      <strong>${a.filename}</strong>
      <span class="alt">alt: ${a.alt.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</span>
    </figcaption>
  </figure>`,
    )
    .join('\n');
  return `<!doctype html>
<html lang="en">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Launch assets</title>
<style>
  :root { color-scheme: dark light; }
  body { margin: 0 auto; max-width: 900px; padding: 2rem 1rem; font: 16px/1.5 ui-sans-serif, system-ui, sans-serif; background: #0d1117; color: #e6edf3; }
  h1 { font-size: 1.4rem; } p.lead { color: #8b949e; max-width: 60ch; }
  figure { margin: 0 0 2.5rem; } img { max-width: 100%; height: auto; border: 1px solid #30363d; border-radius: 8px; }
  figcaption { font-size: .85rem; color: #8b949e; margin-top: .6rem; }
  .alt { display: block; margin-top: .25rem; color: #6e7681; }
</style>
<h1>Launch assets</h1>
<p class="lead">Generated from your own document. Every placeholder in brackets is a fact you must supply before publishing; every number in these images came from the rubric, not from a measurement of the market.</p>
${items}
</html>
`;
}


/**
 * Canvas spec: a renderer-agnostic description of the visual report, so a browser
 * extension, a native app, or a plugin can draw it without importing our DOM code.
 */
function canvasSpec(doc: OdsDocument): unknown {
  const leverage = [...doc.scorecard.dimensions]
    .map((d) => ({ d, lost: Math.round(((100 - d.score) * d.weight) / 100) }))
    .sort((a, b) => b.lost - a.lost)
    .slice(0, 5);
  return {
    kind: 'viral-engine-canvas-spec',
    version: 1,
    title: doc.artifact.name,
    headline: `${doc.scorecard.total}/1000`,
    subhead: `${doc.scorecard.band} · weakest: ${leverage[0]?.d.label}`,
    blocked: doc.ethics_review.do_not_launch_yet,
    blockReason: doc.ethics_review.do_not_launch_reason,
    bars: leverage.map(({ d, lost }) => ({
      label: d.label, value: d.score, max: 100, note: `${lost} of ${d.weight} points lost`, basis: d.basis,
    })),
    footer: 'A rubric, not a prediction. No guaranteed outcomes.',
    altText: doc.launch_assets.alt_text ? String((doc.launch_assets.alt_text as Record<string, string>).scorecard ?? '') : '',
  };
}

/* ---------- commands that need no target ---------- */

function doctor(args: Args): number {
  const lines: string[] = [];
  lines.push(`viral-engine commons ${VERSION}`);
  lines.push(`node ${process.version} · ${process.platform}/${process.arch}`);
  lines.push('');
  lines.push('CONFIGURATION');
  const cfg = readLocalConfig();
  lines.push(`  local-mode config: ${cfg ? `${cfg.offline ? 'ON (network forbidden)' : 'present, network allowed'}` : 'not set'}`);
  lines.push(`  telemetry: none, ever (there is no telemetry code to disable)`);
  lines.push('');
  lines.push('PROVIDERS');
  const res = resolveProvider('auto');
  for (const cap of PROVIDER_CAPABILITIES) {
    const avail = cap.name === 'none' ? true : resolveProvider(cap.name).provider !== null;
    const envNote = cap.envKey ? ` (${cap.envKey} ${process.env[cap.envKey] ? 'set' : 'unset'})` : '';
    lines.push(`  ${avail ? '✓' : '·'} ${cap.name.padEnd(11)} ${cap.local ? 'local ' : 'hosted'}${envNote}`);
  }
  lines.push(`  auto would use: ${res.provider ? res.name : 'none (deterministic path — the default)'}`);
  lines.push('');
  lines.push('ENDPOINT PROBE (only because you asked for doctor)');
  for (const [name, host] of [['ollama', 'http://127.0.0.1:11434'], ['llama-cpp', 'http://127.0.0.1:8080'], ['lm-studio', 'http://127.0.0.1:1234']] as const) {
    const reachable = probeSync(host);
    lines.push(`  ${reachable ? '✓' : '·'} ${name.padEnd(11)} ${reachable ? 'responding at ' + host : 'not responding at ' + host}`);
  }
  lines.push('');
  lines.push('INPUT SUPPORT');
  for (const i of SUPPORTED_INPUTS) {
    const badge = i.status === 'full' ? 'full      ' : i.status === 'partial' ? 'partial   ' : 'paste-only';
    lines.push(`  ${badge} ${i.kind.padEnd(20)} ${i.examples}`);
  }
  lines.push('');
  lines.push('WHAT WORKS WITHOUT A MODEL OR NETWORK');
  lines.push('  everything scored, every agent, every asset, every report. Models add prose only.');
  lines.push('');
  lines.push('DIAGNOSIS');
  lines.push('  if something is wrong, run with --verbose and open an issue with the output.');
  lines.push('  this command made no network requests.');
  console.log(lines.join('\n'));
  return 0;
}

function probeSync(url: string): boolean {
  // Deliberately cheap and synchronous-ish: a TCP-ish HEAD with a short timeout.
  // Uses a blocking-ish check via spawnSync curl when available, else assumes unknown.
  try {
    const { execFileSync } = require('node:child_process') as typeof import('node:child_process');
    execFileSync('curl', ['-s', '-m', '1', '-o', '/dev/null', url], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

interface LocalConfig { offline: boolean; writtenAt: string }

function configPath(): string {
  const base = process.env.XDG_CONFIG_HOME ?? join(process.env.HOME ?? '.', '.config');
  return join(base, 'viral-engine', 'config.json');
}

function readLocalConfig(): LocalConfig | null {
  try {
    const p = configPath();
    if (!existsSync(p)) return null;
    return JSON.parse(readFileSync(p, 'utf8')) as LocalConfig;
  } catch {
    return null;
  }
}

function localMode(args: Args): number {
  const want = (args.target ?? 'on').toLowerCase();
  const on = want !== 'off';
  const p = configPath();
  mkdirSync(dirname(p), { recursive: true });
  const cfg: LocalConfig = { offline: on, writtenAt: new Date().toISOString() };
  writeFileSync(p, JSON.stringify(cfg, null, 2), 'utf8');
  console.log(`${on ? 'Local mode ON' : 'Local mode OFF'} — ${p}`);
  if (on) {
    console.log('');
    console.log('From now on every command behaves as if --offline was passed:');
    console.log('  · no network requests of any kind');
    console.log('  · category saturation reports "unknown" rather than querying GitHub');
    console.log('  · nothing about your documents leaves this machine');
    console.log('');
    console.log('Turn it off with: viral-engine local-mode off');
  }
  return 0;
}

function listProviders(): number {
  const lines: string[] = [];
  lines.push('PROVIDERS — what each one may and may not produce\n');
  for (const p of PROVIDER_CAPABILITIES) {
    lines.push(`${p.name}${p.local ? '  (local)' : '  (hosted)'}`);
    lines.push(`  endpoint    ${p.endpoint}`);
    if (p.envKey) lines.push(`  needs       ${p.envKey}${process.env[p.envKey] ? ' — set' : ' — unset'}`);
    lines.push(`  may produce ${p.mayProduce.join(', ') || '—'}`);
    lines.push(`  cannot      ${p.cannotProduce.join(', ') || '—'}`);
    lines.push(`  privacy     ${p.privacy}`);
    lines.push('');
  }
  lines.push('A model can never write a score, a broadcaster identity, or a failure condition.');
  lines.push('Every piece of model prose is audited by the honesty firewall before it is shown.');
  console.log(lines.join('\n'));
  return 0;
}

function printProtocol(): number {
  const lines: string[] = [];
  lines.push(`OPEN DIFFUSION SPEC 1.0 · ATTEMPT QUALITY INDEX ${AQI_VERSION}\n`);
  lines.push(`Twenty dimensions, weights summing to ${AQI_MAX}. Reproduce any score yourself:\n`);
  lines.push('  attempt_quality = round( sum( sub_score_i * weight_i / 100 ) )\n');
  lines.push('  weight  dimension                      question');
  lines.push('  ------  -----------------------------  ------------------------------------------');
  for (const d of AQI_DIMENSIONS) {
    lines.push(`  ${String(d.weight).padStart(6)}  ${d.label.padEnd(29)}  ${d.question.slice(0, 58)}`);
  }
  lines.push('');
  lines.push('  total   ' + AQI_DIMENSIONS.reduce((a, d) => a + d.weight, 0));
  lines.push('');
  lines.push('Weights live in protocol/aqi-weights.json so other implementations read the same numbers.');
  lines.push('Schema: packages/protocol/ods.schema.json · Docs: protocol/open-diffusion-spec.md');
  console.log(lines.join('\n'));
  return 0;
}

function upgrade(): number {
  console.log(`viral-engine commons ${VERSION}`);
  console.log('');
  console.log('There is no paid tier, so there is nothing to upgrade to.');
  console.log('');
  console.log('To get a newer version:');
  console.log('  npm install -g viral-engine@latest        # CLI');
  console.log('  git -C <your-clone> pull                  # from source');
  console.log('');
  console.log('If you want to support the project, FUNDING.md lists what is and is not accepted');
  console.log('as funding. Nothing in this tool is withheld to encourage a donation.');
  return 0;
}

function initProject(args: Args): number {
  const dir = resolve(args.target ?? '.');
  mkdirSync(dir, { recursive: true });
  const file = join(dir, 'viral-engine.config.json');
  const cfg = {
    $schema: 'https://viralenginecommons.org/protocol/config-1.schema.json',
    offline: true,
    output: 'markdown',
    language: args.language ?? 'en',
    channels: ['hackernews', 'x'],
    failOnEthicsViolation: false,
    note: 'This file is yours. Nothing reads it except viral-engine on your machine.',
  };
  writeFileSync(file, JSON.stringify(cfg, null, 2), 'utf8');
  console.log(`wrote ${file}`);
  console.log('');
  console.log('Next: viral-engine analyze . --offline');
  return 0;
}

function migrate(args: Args): number {
  const file = resolve(args.target!);
  const raw = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;

  let result;
  try {
    result = migrateDocument(raw);
  } catch (err) {
    console.error(`error: ${(err as Error).message}`);
    return 2;
  }

  if (result.noop) {
    console.log(`already at ODS ${result.fromVersion} — nothing to do`);
    return 0;
  }

  console.log(`migrating a ${result.fromVersion} document to ODS ${CURRENT_ODS_VERSION}`);
  console.log('');
  for (const c of result.changes) console.log(`  · ${c}`);
  console.log('');
  if (result.cannot.length) {
    console.log('WHAT THIS MIGRATION CANNOT DO');
    for (const c of result.cannot) console.log(`  · ${c}`);
    console.log('');
  }

  const out = args.out ? resolve(args.out) : file.replace(/\.json$/, '.ods.json');
  writeFileSync(out, JSON.stringify(result.document, null, 2), 'utf8');
  console.log(`wrote ${out}`);
  console.log('Nothing was deleted. The original is preserved in full under x_migrated_from.');
  return 0;
}

function submitOutcome(args: Args): number {
  console.log('RECORD WHAT HAPPENED');
  console.log('');
  console.log('The Evidence Commons is a public, labelled record of wins and failures. It is');
  console.log('useful only if people submit the failures too, so this prompt asks for both.');
  console.log('');
  console.log('Write a file and open a PR to evidence/wins/ or evidence/failures/:');
  console.log('');
  console.log(JSON.stringify({
    id: '<short-slug>',
    submitted: new Date().toISOString().slice(0, 10),
    artifact_type: '<github-repo | landing-page | essay | ...>',
    what_happened: '<one paragraph, no adjectives>',
    numbers: [{ label: '<what>', value: '<number>', source: '<where a reader can check it>' }],
    evidence_label: '<self-reported | verified | reproducible | anecdotal | contested | private-redacted>',
    what_you_think_caused_it: '<one sentence, and say how confident you are>',
    what_you_would_change: '<one sentence>',
    consent_to_be_named: false,
  }, null, 2));
  console.log('');
  console.log('Rules:');
  console.log('  · A number without a source is labelled self-reported. That is fine. It is not fine to omit the label.');
  console.log('  · Failures are more valuable than wins and are never hidden from the index.');
  console.log('  · Never submit someone else\'s outcome without their consent.');
  console.log('  · Read evidence/README.md before submitting.');
  return 0;
}

// concatenated into the CLI bundle at build time by the import below.
/* ---------- share cards, threads, modes, artifact types ----------
 *
 * These live at the end of the CLI because they are the leaf commands: they take
 * an artifact, print something a human will paste somewhere, and stop.
 */

/** Shared: read the artifact the same way every command does. */
async function loadForModes(args: Args): Promise<{ text: string; title?: string; signals: Signals }> {
  const localConfig = readLocalConfig();
  const offline = args.offline || localConfig?.offline === true || args.provider === 'none';
  const ing = await ingest(args.target ?? '', { offline, text: args.text });
  const text = [ing.source.title, ing.source.description, ing.source.body].filter(Boolean).join('\n\n');
  return { text, title: ing.source.title, signals: extractSignals(text) };
}

async function runMode(args: Args): Promise<number> {
  const { text, title, signals } = await loadForModes(args);
  const input = { text, title, signals };

  const out =
    args.command === 'roast' ? roast(input)
      : args.command === 'therapist' ? therapist(input)
        : args.command === 'kill-my-darling' ? killYourDarling(input, args.darling)
          : explainLikeImFive(input);

  if (args.format === 'json') {
    process.stdout.write(JSON.stringify(out, null, 2) + '\n');
  } else {
    process.stdout.write(out.body + '\n');
    if (!args.quiet) {
      console.log('');
      console.log('KEEP IN MIND');
      for (const k of out.keepInMind) console.log(`  · ${k}`);
      console.log('');
      console.log('WHAT THIS CANNOT DO');
      for (const l of out.limits) console.log(`  · ${l}`);
    }
  }

  if (args.out) {
    const full = resolve(args.out);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, args.format === 'json' ? JSON.stringify(out, null, 2) : out.body, 'utf8');
    console.error(`wrote ${full}`);
  }
  return 0;
}

function listArtifactTypes(): number {
  console.log('');
  console.log('  ARTIFACT TYPES — the rubric is applied differently to each, because');
  console.log('  "good" means something different for a changelog and a book proposal.');
  console.log('');
  for (const t of ARTIFACT_TYPES) {
    console.log(`  ${t.key}`);
    console.log(`    reader's job    ${t.readerJob}`);
    console.log(`    must contain    ${t.expects.join(' · ')}`);
    console.log(`    its own failure ${t.characteristicFailure}`);
    if (t.ingest !== 'text') {
      console.log(`    ingesting       ${t.ingest}`);
      if (t.workaround) console.log(`                    ${t.workaround}`);
    }
    console.log('');
  }
  console.log('  Pass any of these with --type <key>. Without it, the type is guessed');
  console.log('  from structure, and anything unrecognised is treated as `document` —');
  console.log('  which gets a generic judgment, and a generic judgment is usually wrong.');
  console.log('');
  return 0;
}

function runStressTest(args: Args): number {
  const t = stressTest();

  if (args.format === 'json') {
    process.stdout.write(JSON.stringify(t, null, 2) + '\n');
    return 0;
  }

  const md = [
    '# The 100k-star stress test',
    '',
    `> ${t.disclaimer}`,
    '',
    t.whatThisIs,
    '',
    '## If this were adopted widely, what would probably be carrying it',
    '',
    ...t.adoptionHypotheses.flatMap((h) => [
      `### ${h.id} — ${h.claim}`,
      '',
      `*Basis: ${h.basis}. Confidence: ${h.confidence}.*`,
      '',
      h.grounds,
      '',
      '**Leading indicators**',
      ...h.leadingIndicators.map((i) => `- ${i}`),
      '',
      '**Counter-indicators** (what would tell you it is not happening)',
      ...h.counterIndicators.map((i) => `- ${i}`),
      '',
    ]),
    '## If it failed despite good engineering, what would have killed it',
    '',
    '| Failure mode | Looks like | First signal | Response |',
    '|---|---|---|---|',
    ...t.failureModes.map((f) => `| **${f.mode}** | ${f.looksLike} | ${f.earlySignal} | ${f.response} |`),
    '',
    '## What to measure, and how each number could mislead',
    '',
    ...t.indicators.flatMap((g) => [
      `### ${g.window}`,
      '',
      '| Indicator | Why it matters | Misleading if |',
      '|---|---|---|',
      ...g.indicators.map((i) => `| ${i.name} | ${i.why} | ${i.misleadingIf} |`),
      '',
    ]),
    '## Kill criteria',
    '',
    ...t.killCriteria.flatMap((k) => [
      `**${k.statement}**`,
      '',
      `- Observable: ${k.observable}`,
      `- Horizon: ${k.horizon}`,
      `- Scope: ${k.scope}`,
      '',
    ]),
    '## The memo',
    '',
    '### If it works',
    '',
    t.memo.ifItWorks,
    '',
    '### If it fails',
    '',
    t.memo.ifItFails,
    '',
    '## What would make it infrastructure',
    '',
    ...t.whatWouldMakeItInfrastructure.map((x) => `- ${x}`),
    '',
    '## What would make people distrust it',
    '',
    ...t.whatWouldMakePeopleDistrustIt.map((x) => `- ${x}`),
    '',
    '---',
    '',
    '*No number in this document is a prediction. It contains no model of attention,*',
    '*no training data, and no fitted curve. Its only use is deciding what to measure*',
    '*early and when to stop promoting.*',
  ].join('\n');

  if (args.out) {
    const full = resolve(args.out);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, md, 'utf8');
    console.error(`wrote ${full}`);
  } else {
    process.stdout.write(md + '\n');
  }
  return 0;
}

/**
 * `card`: the share payloads, written as a directory of files.
 *
 * Deliberately not a single combined artefact. A card.svg you can drop into a
 * README, a card.alt.txt you are forced to keep next to it, and a badge.json that
 * GitHub can serve are three different jobs.
 */
async function writeCard(args: Args, doc: OdsDocument): Promise<number> {
  const dims = doc.scorecard.dimensions;
  const leverage = [...dims]
    .map((d) => ({ d, lost: Math.round(((100 - d.score) * d.weight) / 100) }))
    .sort((a, b) => b.lost - a.lost);

  const fc = doc.failure_conditions[0];
  const payloads = buildSharePayloads({
    artifactName: doc.artifact.name,
    total: doc.scorecard.total,
    band: doc.scorecard.band,
    aqiVersion: doc.scorecard.aqi_version,
    dimensions: dims as unknown as AqiDimension[],
    forwardable: (doc.launch_assets.one_line_broadcast_summary as string | undefined) ?? null,
    topLeverage: leverage.slice(0, 3).map((x) => x.d as unknown as AqiDimension),
    failureCondition: fc ?? null,
    asOf: doc.generated_at.slice(0, 10),
  });

  const dir = resolve(args.out ?? 'viral-engine-card');
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'card.svg'), payloads.cardSvg, 'utf8');
  writeFileSync(join(dir, 'card.alt.txt'), payloads.cardAlt + '\n', 'utf8');
  writeFileSync(join(dir, 'badge.json'), JSON.stringify(payloads.badgeJson, null, 2) + '\n', 'utf8');
  writeFileSync(join(dir, 'badge.md'), payloads.badgeMarkdown + '\n', 'utf8');
  writeFileSync(join(dir, 'forwardable.txt'), payloads.forwardableLine + '\n', 'utf8');
  writeFileSync(join(dir, 'social.txt'), payloads.socialPost + '\n', 'utf8');
  writeFileSync(join(dir, 'thread.md'), payloads.thread.map((t, i) => `${i + 1}/ ${t}`).join('\n\n') + '\n', 'utf8');
  writeFileSync(join(dir, 'blurb.md'), payloads.blurb + '\n', 'utf8');
  if (fc) {
    const failure = failureCard(doc.artifact.name, fc);
    writeFileSync(join(dir, 'failure-card.svg'), failure.svg, 'utf8');
    writeFileSync(join(dir, 'failure-card.alt.txt'), failure.alt + '\n', 'utf8');
  }
  writeFileSync(
    join(dir, 'WHAT-THIS-DOES-NOT-PROVE.md'),
    ['# What this does not prove', '', ...payloads.whatThisDoesNotProve.map((x) => `- ${x}`), ''].join('\n'),
    'utf8',
  );

  console.error(`wrote ${dir}`);
  console.error(`  card.svg + card.alt.txt   the share image and the alt text it must ship with`);
  console.error(`  failure-card.svg          the failure condition as a card`);
  console.error(`  forwardable.txt           the one sentence a reader can paste, unedited`);
  console.error(`  badge.json + badge.md     a README badge that states the band, not just a number`);
  console.error(`  WHAT-THIS-DOES-NOT-PROVE.md`);
  if (!args.quiet) {
    console.log('');
    console.log(payloads.forwardableLine);
    console.log('');
    console.log(payloads.socialPost);
  }
  return 0;
}

async function renderThread(args: Args, doc: OdsDocument): Promise<number> {
  const dims = doc.scorecard.dimensions as unknown as AqiDimension[];
  const leverage = [...dims]
    .map((d) => ({ d, lost: Math.round(((100 - d.score) * d.weight) / 100) }))
    .sort((a, b) => b.lost - a.lost);

  const payloads = buildSharePayloads({
    artifactName: doc.artifact.name,
    total: doc.scorecard.total,
    band: doc.scorecard.band,
    aqiVersion: doc.scorecard.aqi_version,
    dimensions: dims,
    forwardable: (doc.launch_assets.one_line_broadcast_summary as string | undefined) ?? null,
    topLeverage: leverage.slice(0, 3).map((x) => x.d),
    failureCondition: doc.failure_conditions[0] ?? null,
    asOf: doc.generated_at.slice(0, 10),
  });

  const body = payloads.thread.map((t, i) => `${i + 1}/ ${t}`).join('\n\n');
  if (args.out) {
    const full = resolve(args.out);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, body + '\n', 'utf8');
    console.error(`wrote ${full}`);
  } else {
    console.log(body);
  }
  console.log('');
  console.log(`note: post 1 is ${payloads.thread[0].length} chars. No post is a promise, and none asks for shares.`);
  return 0;
}

main().then((code) => process.exit(code)).catch((err) => {
  console.error(`fatal: ${(err as Error).message}`);
  process.exit(1);
});
