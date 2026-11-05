#!/usr/bin/env node
/**
 * viral-engine CLI.
 *
 * Exit codes are part of the contract, because this runs in CI:
 *   0  report produced, no honesty blockers
 *   1  unexpected error
 *   2  usage error
 *   3  honesty blockers found (and --fail-on-honesty was set, default on in CI)
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  analyze,
  loadSource,
  fetchTopicSaturation,
  resolveProvider,
  toMarkdown,
  toHtml,
  toTerminal,
  toCiSummary,
} from '@viral-engine/core';
import type { ProviderName, DiagnosisReport } from '@viral-engine/core';

const HELP = `
viral-engine — diagnose why something did not spread

USAGE
  viral-engine analyze <target> [options]

TARGET
  owner/repo                      GitHub repository
  https://github.com/owner/repo   GitHub repository
  ./README.md                     a local file
  https://example.com             a landing page
  --text "..."                    inline text

OPTIONS
  --format <terminal|md|json|html>   output format (default: terminal)
  -o, --out <file>                   write to a file instead of stdout
  --provider <name>                  none | auto | anthropic | openai | ollama
                                     groq | mistral | together   (default: auto)
  --offline                          no network calls at all (implies --provider none)
  --no-colour                        plain output
  --ci                               compact output, fail on honesty blockers
  --fail-on-honesty                  exit 3 when honesty blockers are found
  --saturation-count <n>             supply a GitHub repo count yourself (skips the query)
  -h, --help                         show this help
  -v, --version                      print version

EXAMPLES
  npx viral-engine analyze mananmodi1487/viral-engine
  npx viral-engine analyze ./README.md --format md -o report.md
  npx viral-engine analyze --text "my landing page copy..." --offline
  npx viral-engine analyze https://example.com --format html -o report.html

EXIT CODES
  0 clean · 1 error · 2 usage · 3 honesty blockers
`.trim();

interface Args {
  command?: string;
  target?: string;
  text?: string;
  format: 'terminal' | 'md' | 'json' | 'html';
  out?: string;
  provider: ProviderName | 'auto';
  offline: boolean;
  colour: boolean;
  ci: boolean;
  failOnHonesty: boolean;
  saturationCount?: number;
}

function parseArgs(argv: string[]): Args {
  const a: Args = {
    format: 'terminal',
    provider: 'auto',
    offline: false,
    colour: true,
    ci: false,
    failOnHonesty: false,
  };
  const rest: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    switch (arg) {
      case '-h':
      case '--help':
        console.log(HELP);
        process.exit(0);
        break;
      case '-v':
      case '--version':
        console.log('viral-engine 1.0.0');
        process.exit(0);
        break;
      case '--format': {
        const v = argv[++i];
        if (!['terminal', 'md', 'json', 'html'].includes(v ?? '')) {
          throw new UsageError(`--format must be terminal|md|json|html, got "${v}"`);
        }
        a.format = v as Args['format'];
        break;
      }
      case '-o':
      case '--out':
        a.out = argv[++i];
        break;
      case '--provider': {
        const v = argv[++i];
        const allowed = ['none', 'auto', 'anthropic', 'openai', 'ollama', 'groq', 'mistral', 'together'];
        if (!allowed.includes(v ?? '')) {
          throw new UsageError(`--provider must be one of ${allowed.join('|')}, got "${v}"`);
        }
        a.provider = v as Args['provider'];
        break;
      }
      case '--offline':
        a.offline = true;
        a.provider = 'none';
        break;
      case '--no-colour':
      case '--no-color':
        a.colour = false;
        break;
      case '--ci':
        a.ci = true;
        a.colour = false;
        a.failOnHonesty = true;
        break;
      case '--fail-on-honesty':
        a.failOnHonesty = true;
        break;
      case '--saturation-count': {
        const v = Number(argv[++i]);
        if (!Number.isFinite(v) || v < 0) throw new UsageError('--saturation-count must be a non-negative number');
        a.saturationCount = v;
        break;
      }
      case '--text':
        a.text = argv[++i];
        break;
      default:
        if (arg.startsWith('--text=')) {
          a.text = arg.slice('--text='.length);
        } else if (arg.startsWith('-')) {
          throw new UsageError(`unknown option "${arg}" (try --help)`);
        } else {
          rest.push(arg);
        }
    }
  }
  a.command = rest[0];
  a.target = rest[1] ?? rest[0];
  if (a.command === 'analyze') a.target = rest[1];
  return a;
}

class UsageError extends Error {}

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
  if (args.command !== 'analyze') {
    console.error(`error: unknown command "${args.command}". Try: viral-engine analyze <target>`);
    return 2;
  }
  if (!args.target && !args.text) {
    console.error('error: no target. Pass a repo, a path, a URL, or --text "..."');
    return 2;
  }

  try {
    const source = await loadSource(args.target ?? '', {
      offline: args.offline,
      text: args.text,
    });

    let saturationCount = args.saturationCount;
    let saturationReason = 'no saturation query was run';
    if (saturationCount === undefined && !args.offline) {
      const query = [source.topics[0], source.description?.split(/\s+/).slice(0, 4).join(' ')]
        .filter(Boolean)
        .join(' ')
        .trim();
      if (query) {
        const count = await fetchTopicSaturation(query);
        if (count !== null) saturationCount = count;
        else saturationReason = 'GitHub search unavailable or rate-limited';
      } else {
        saturationReason = 'no topics or description to build a saturation query from';
      }
    } else if (args.offline) {
      saturationReason = 'offline mode';
    }

    const resolution = resolveProvider(args.provider);
    if (resolution.provider === null && args.provider !== 'none' && !args.ci && args.format === 'terminal') {
      console.error(
        `note: running without an LLM (${resolution.reason}). This is the default path, not a degraded one.`,
      );
      console.error(
        `      available options: ${resolution.skipped.map((s) => s.name).join(', ')} — set a key, or use --provider none to silence this.`,
      );
    }

    const report: DiagnosisReport = await analyze(source, {
      provider: resolution.provider ?? undefined,
      saturationCount,
      saturationUnavailableReason: saturationReason,
    });

    const rendered =
      args.format === 'json'
        ? JSON.stringify(report, null, 2)
        : args.format === 'md'
          ? toMarkdown(report)
          : args.format === 'html'
            ? toHtml(report)
            : args.ci
              ? toCiSummary(report)
              : toTerminal(report, { colour: args.colour });

    if (args.out) {
      const full = resolve(args.out);
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, rendered, 'utf8');
      if (args.format !== 'json') {
        console.error(`wrote ${full}`);
      } else {
        console.error(`wrote ${full}`);
      }
    } else {
      process.stdout.write(rendered + (args.format === 'json' ? '' : '\n'));
    }

    if (args.failOnHonesty && !report.honesty.passed) {
      const n = report.honesty.findings.filter((f) => f.severity === 'blocker').length;
      console.error(`\nhonesty check failed: ${n} blocker(s). See section 5 of the report.`);
      return 3;
    }
    return 0;
  } catch (err) {
    const msg = (err as Error).message;
    console.error(`error: ${msg}`);
    if (/ENOTFOUND|EAI_AGAIN|abort|fetch failed/i.test(msg)) {
      console.error('hint: no network access. Try --offline with a local file, or pass --text.');
    }
    if (/not found \(404\)/.test(msg)) {
      console.error('hint: check the owner/repo spelling, or the repository may be private.');
    }
    return 1;
  }
}

main().then((code) => process.exit(code));
