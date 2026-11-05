/**
 * Layer 1 — Universal Input Engine.
 *
 * Turns any of ~25 input kinds into one normalised `SourceDocument`, or refuses
 * with a specific reason. Two rules govern everything here:
 *
 *  1. Never fabricate missing content. If a PDF is a scan, say so. If a tweet
 *     cannot be fetched, say so. An analyzer fed invented text produces a
 *     confident diagnosis of nothing.
 *  2. Record provenance. `degraded` is part of the output, not a log line.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { SourceDocument } from '../schemas.js';
import { extractText, htmlToReadable, type ExtractResult } from './extract.js';

export * from './extract.js';

export type InputKind =
  | 'github-repo'
  | 'local-folder'
  | 'local-file'
  | 'url'
  | 'notion-public'
  | 'google-docs-public'
  | 'figma-public'
  | 'product-hunt'
  | 'hacker-news'
  | 'youtube'
  | 'tweet-thread'
  | 'app-store-listing'
  | 'email-draft'
  | 'missing-path'
  | 'raw-text';

export interface IngestOptions {
  offline?: boolean;
  /** Inline text, wins over everything. */
  text?: string;
  /** Cap on bytes read from a folder. */
  maxFolderBytes?: number;
}

export interface IngestResult {
  source: SourceDocument;
  /** Every reason the input was not read in full. Empty means full read. */
  degraded: string[];
  /** What the engine actually saw. */
  extraction: {
    format: ExtractResult['format'] | 'assembled';
    wordCount: number;
    filesRead?: number;
  };
}

export type ClassifiedInput = { kind: InputKind; ref: string; detail: string };

/** Recognises the input kind from a string. No network. */
export function classifyInput(raw: string): ClassifiedInput {
  const s = raw.trim();
  if (!s) return { kind: 'raw-text', ref: 'empty', detail: 'nothing supplied' };

  // Local paths win over slugs: "./README.md" is a file, not owner/repo.
  const looksLikePath = /^(?:\.{1,2}\/|~\/|\/|[A-Za-z]:\\)/.test(s);
  const exists = !looksLikePath && !/^https?:/i.test(s) ? existsSync(resolve(s)) : false;

  const ghUrl = s.match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+)/i);
  if (ghUrl) return { kind: 'github-repo', ref: `${ghUrl[1]}/${ghUrl[2].replace(/\.git$/, '')}`, detail: 'GitHub repository' };

  const ghSlug = !looksLikePath && !exists && !/\.(?:md|markdown|txt|pdf|docx|json|html?|ts|js|py)$/i.test(s)
    ? s.match(/^([\w.-]+)\/([\w.-]+)$/)
    : null;
  if (ghSlug && !/\s/.test(s)) return { kind: 'github-repo', ref: `${ghSlug[1]}/${ghSlug[2].replace(/\.git$/, '')}`, detail: 'GitHub repository' };

  if (/^https?:\/\//i.test(s)) {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\./, '');
    const map: Array<[RegExp, InputKind, string]> = [
      [/notion\.(site|so)$/, 'notion-public', 'public Notion page'],
      [/docs\.google\.com$/, 'google-docs-public', 'public Google Doc'],
      [/figma\.com$/, 'figma-public', 'public Figma prototype'],
      [/producthunt\.com$/, 'product-hunt', 'Product Hunt page'],
      [/news\.ycombinator\.com$/, 'hacker-news', 'Hacker News thread'],
      [/(youtube\.com|youtu\.be)$/, 'youtube', 'YouTube video'],
      [/(twitter\.com|x\.com)$/, 'tweet-thread', 'X/Twitter thread'],
      [/(apps\.apple\.com|play\.google\.com)$/, 'app-store-listing', 'app store listing'],
      [/docs\.google\.com$/, 'google-docs-public', 'Google Doc'],
      [/mail\.google\.com|outlook\./, 'email-draft', 'email draft'],
    ];
    for (const [re, kind, detail] of map) if (re.test(host)) return { kind, ref: s, detail };
    return { kind: 'url', ref: s, detail: 'web page' };
  }

  const asPath = resolve(s);
  if (existsSync(asPath)) {
    const st = statSync(asPath);
    return st.isDirectory()
      ? { kind: 'local-folder', ref: asPath, detail: 'local directory' }
      : { kind: 'local-file', ref: asPath, detail: 'local file' };
  }

  /*
   * A path that does not exist is not raw text.
   *
   * `viral-engine analyze ./REAADME.md` (typo) used to fall through to raw-text and
   * score the literal string "./REAADME.md" — 492/1000, with a full report, exit 0.
   * The user got a plausible number for a file that was never read, and nothing
   * anywhere in the output said so. Of all the ways this tool can mislead someone,
   * fabricating an analysis of a file that does not exist is the most direct.
   *
   * A single descriptive token — "viral-engine" with no slash — is still treated as
   * text, because people paste sentences without punctuation. Something shaped like a
   * path is not.
   */
  if (looksLikePath) {
    return { kind: 'missing-path', ref: asPath, detail: 'path that does not exist' };
  }

  if (/^(subject|to):/im.test(s) && /\n/.test(s)) return { kind: 'email-draft', ref: 'pasted email', detail: 'email draft' };
  return { kind: 'raw-text', ref: 'inline text', detail: 'raw text' };
}

const FOLDER_PRIORITY = [
  'readme.md', 'readme.markdown', 'readme.txt', 'readme',
  'package.json', 'pyproject.toml', 'cargo.toml', 'go.mod',
  'index.html', 'landing.html',
];

const FOLDER_SKIP = new Set([
  'node_modules', '.git', 'dist', 'build', 'out', 'target', '.venv', 'venv',
  '__pycache__', 'vendor', '.next', 'coverage', '.cache', 'test', 'tests', '__tests__',
]);

/**
 * The main entry point. Deterministic, offline-capable, and honest.
 */
export async function ingest(raw: string, opts: IngestOptions = {}): Promise<IngestResult> {
  if (opts.text) {
    return {
      source: {
        kind: 'free-text',
        ref: 'pasted text',
        body: opts.text,
        topics: [],
        fetchedFrom: 'pasted',
      },
      degraded: [],
      extraction: { format: 'text', wordCount: wordCount(opts.text) },
    };
  }

  const cls = classifyInput(raw);
  switch (cls.kind) {
    case 'missing-path':
      throw new Error(
        `no such file or directory: ${cls.ref}. Nothing was analysed. ` +
          'Check the path, or pass --text "..." to analyse a sentence directly.',
      );
    case 'local-folder':
      return ingestFolder(cls.ref, opts);
    case 'local-file':
      return ingestFile(cls.ref);
    case 'github-repo':
      return ingestGitHub(cls.ref, opts);
    case 'url':
    case 'notion-public':
    case 'google-docs-public':
    case 'figma-public':
    case 'product-hunt':
    case 'hacker-news':
    case 'youtube':
    case 'tweet-thread':
    case 'app-store-listing':
      return ingestUrl(cls.ref, cls.kind, cls.detail, opts);
    case 'email-draft':
    case 'raw-text':
    default:
      return {
        source: { kind: 'free-text', ref: cls.detail, body: raw, topics: [], fetchedFrom: 'pasted' },
        degraded: [],
        extraction: { format: 'text', wordCount: wordCount(raw) },
      };
  }
}

function wordCount(s: string): number {
  return s.trim() ? s.trim().split(/\s+/).length : 0;
}

function ingestFile(path: string): IngestResult {
  const buf = readFileSync(path);
  const ex = extractText(buf, path);
  const name = path.split(/[\\/]/).pop() ?? path;
  return {
    source: {
      kind: 'readme-text',
      ref: path,
      title: name,
      body: ex.text || '(empty file)',
      topics: [],
      fetchedFrom: 'local-file',
    },
    degraded: ex.degraded,
    extraction: { format: ex.format, wordCount: ex.meta.wordCount },
  };
}

/**
 * A folder: README first, then manifests, then docs/, then the rest, in a
 * deterministic order. Determinism matters because two runs on the same folder
 * must produce the same report — that is how users learn to trust the score.
 */
function ingestFolder(dir: string, opts: IngestOptions): IngestResult {
  const cap = opts.maxFolderBytes ?? 2 * 1024 * 1024;
  const degraded: string[] = [];
  const files: string[] = [];
  let bytes = 0;

  const walk = (d: string, depth: number): void => {
    if (depth > 3 || bytes > cap) return;
    let entries: string[];
    try {
      entries = readdirSync(d).sort();
    } catch {
      degraded.push(`could not read directory ${d}`);
      return;
    }
    for (const e of entries) {
      const full = join(d, e);
      if (FOLDER_SKIP.has(e.toLowerCase()) || e.startsWith('.')) continue;
      let st;
      try {
        st = statSync(full);
      } catch {
        continue;
      }
      if (st.isDirectory()) walk(full, depth + 1);
      else if (/\.(md|markdown|txt|json|html?|toml|ya?ml)$/i.test(e) && st.size < 400_000) {
        files.push(full);
        bytes += st.size;
      }
    }
  };
  walk(dir, 0);

  const byPriority = [...files].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
  const parts: string[] = [];
  let read = 0;
  for (const f of byPriority) {
    if (bytes > cap && read > 6) {
      degraded.push(`stopped after ${read} files to stay within the ${cap / 1e6}MB folder budget`);
      break;
    }
    try {
      const buf = readFileSync(f);
      const ex = extractText(buf, f);
      if (!ex.text.trim()) continue;
      parts.push(`\n\n<!-- ${f.replace(dir, '')} -->\n${ex.text}`);
      degraded.push(...ex.degraded.map((d) => `${f}: ${d}`));
      read += 1;
    } catch (err) {
      degraded.push(`could not read ${f}: ${(err as Error).message}`);
    }
  }

  if (read === 0) degraded.push('no readable text files found in this folder');

  return {
    source: {
      kind: 'readme-text',
      ref: dir,
      title: dir.split(/[\\/]/).filter(Boolean).pop(),
      body: parts.join('').trim() || '(empty folder)',
      topics: [],
      fetchedFrom: 'local-file',
    },
    degraded,
    extraction: { format: 'assembled', wordCount: wordCount(parts.join(' ')), filesRead: read },
  };
}

function rank(path: string): number {
  const base = path.split(/[\\/]/).pop()?.toLowerCase() ?? '';
  const i = FOLDER_PRIORITY.indexOf(base);
  if (i >= 0) return i;
  if (/[\\/]docs?[\\/]/i.test(path)) return 50;
  return 100;
}

async function ingestGitHub(ref: string, opts: IngestOptions): Promise<IngestResult> {
  const [owner, repo] = ref.split('/');
  if (opts.offline) {
    return {
      source: {
        kind: 'github-repo',
        ref,
        topics: [],
        fetchedFrom: 'pasted',
        body: `# ${ref}\n\nOffline mode: repository content was not fetched.`,
        degraded: 'offline mode — no network call was made',
      },
      degraded: ['offline mode — only the repository slug was analysed, not its content'],
      extraction: { format: 'text', wordCount: 12 },
    };
  }

  const degraded: string[] = [];
  const headers = { accept: 'application/vnd.github+json', 'user-agent': 'viral-engine-commons' };
  const [metaRes, readmeRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers }),
    fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
      headers: { ...headers, accept: 'application/vnd.github.raw+json' },
    }),
  ]);

  if (!metaRes.ok) {
    throw new Error(
      `GitHub repo ${ref} could not be read (HTTP ${metaRes.status}). Private repositories need a token; offline use a local clone instead.`,
    );
  }
  const meta = (await metaRes.json()) as {
    description?: string;
    topics?: string[];
    stargazers_count?: number;
    forks_count?: number;
    name?: string;
    homepage?: string;
    license?: { spdx_id?: string };
  };

  let body = '';
  if (readmeRes.ok) body = await readmeRes.text();
  else degraded.push(`README could not be fetched (HTTP ${readmeRes.status})`);

  return {
    source: {
      kind: 'github-repo',
      ref,
      title: meta.name ?? repo,
      description: meta.description,
      body: body || `# ${ref}\n\n(no README available)`,
      topics: meta.topics ?? [],
      stars: meta.stargazers_count,
      forks: meta.forks_count,
      fetchedFrom: 'network',
      degraded: degraded.length ? degraded.join('; ') : undefined,
    },
    degraded,
    extraction: { format: 'markdown', wordCount: wordCount(body) },
  };
}

/**
 * URL ingestion. Platform-specific notes are honest about what a generic fetch
 * can and cannot see — X and Product Hunt serve JavaScript shells, and we do not
 * pretend otherwise.
 */
async function ingestUrl(url: string, kind: InputKind, detail: string, opts: IngestOptions): Promise<IngestResult> {
  if (opts.offline) {
    return {
      source: { kind: 'url', ref: url, body: `Offline mode: ${detail} at ${url} was not fetched.`, topics: [], fetchedFrom: 'pasted', degraded: 'offline' },
      degraded: ['offline mode — no network call was made'],
      extraction: { format: 'text', wordCount: 8 },
    };
  }

  const degraded: string[] = [];
  let html = '';
  try {
    const res = await fetch(url, {
      headers: {
        'user-agent': 'viral-engine-commons/1.1 (+https://github.com/mananmodi1487/viral-engine) ethical-diffusion-analysis',
        accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
  } catch (err) {
    throw new Error(
      `Could not fetch ${url} (${(err as Error).message}). For pages behind JavaScript or a login, copy the text and pass it with --text; we will not scrape around a wall.`,
    );
  }

  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const desc =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)/i)?.[1] ??
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)/i)?.[1];
  const body = htmlToReadable(html);

  if (/enable javascript|requires javascript|cf-browser-verification/i.test(html) && body.length < 400) {
    degraded.push('page is a JavaScript shell; little server-rendered text was available');
  }
  if (kind === 'tweet-thread') degraded.push('X/Twitter serves threads via JavaScript; only metadata was readable. Paste the thread text for a real analysis.');
  if (kind === 'figma-public') degraded.push('Figma prototypes are canvas-rendered; only the surrounding page text was readable.');
  if (kind === 'youtube') {
    const captions = html.match(/"captionTracks":(\[[^\]]*\])/)?.[1];
    if (!captions) degraded.push('no caption track found. Transcription is not bundled by default (privacy: it would require sending audio to a service). Paste a transcript for a full analysis.');
    else degraded.push('caption track discovered but fetching it is out of scope for offline-first mode; paste the transcript.');
  }

  const finalUrl = url;
  return {
    source: {
      kind: kind === 'url' ? 'url' : 'url',
      ref: finalUrl,
      title: title ?? detail,
      description: desc,
      body: body || '(no readable text)',
      topics: [],
      fetchedFrom: 'network',
      degraded: degraded.length ? degraded.join('; ') : undefined,
    },
    degraded,
    extraction: { format: 'html', wordCount: wordCount(body) },
  };
}

/** Enumerates every input kind the engine recognises, for docs and the doctor command. */
export const SUPPORTED_INPUTS: Array<{ kind: InputKind; examples: string; status: 'full' | 'partial' | 'paste-only' }> = [
  { kind: 'github-repo', examples: 'owner/repo, https://github.com/owner/repo', status: 'full' },
  { kind: 'local-folder', examples: './my-project', status: 'full' },
  { kind: 'local-file', examples: './README.md, ./deck.pdf, ./brief.docx', status: 'full' },
  { kind: 'url', examples: 'https://example.com', status: 'full' },
  { kind: 'notion-public', examples: 'https://x.notion.site/...', status: 'partial' },
  { kind: 'google-docs-public', examples: 'https://docs.google.com/document/d/...', status: 'partial' },
  { kind: 'figma-public', examples: 'https://figma.com/file/...', status: 'paste-only' },
  { kind: 'product-hunt', examples: 'https://producthunt.com/posts/...', status: 'partial' },
  { kind: 'hacker-news', examples: 'https://news.ycombinator.com/item?id=...', status: 'full' },
  { kind: 'youtube', examples: 'https://youtube.com/watch?v=...', status: 'paste-only' },
  { kind: 'tweet-thread', examples: 'https://x.com/user/status/...', status: 'paste-only' },
  { kind: 'app-store-listing', examples: 'https://apps.apple.com/...', status: 'full' },
  { kind: 'email-draft', examples: 'pasted with Subject: line', status: 'full' },
  { kind: 'raw-text', examples: '--text "..."', status: 'full' },
];
