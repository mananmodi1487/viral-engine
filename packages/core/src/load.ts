/**
 * Input acquisition.
 *
 * Every path here degrades rather than fails: a blocked network produces a
 * SourceDocument with `degraded` set, so the report can still run on whatever
 * was supplied and can say so. Silent fallback is how tools end up scoring an
 * empty string and calling it a diagnosis.
 */
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import type { SourceDocument } from './schemas.js';

const UA = 'viral-engine/1.0 (+https://github.com/mananmodi1487/viral-engine)';
const TIMEOUT_MS = 10_000;

async function fetchWithTimeout(url: string, headers: Record<string, string> = {}): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, {
      headers: { 'user-agent': UA, accept: '*/*', ...headers },
      signal: ctrl.signal,
      redirect: 'follow',
    });
  } finally {
    clearTimeout(timer);
  }
}

export function parseGitHubRef(ref: string): { owner: string; repo: string } | null {
  const cleaned = ref.trim().replace(/\.git$/, '').replace(/\/$/, '');
  const urlMatch = cleaned.match(/github\.com[/:]([^/]+)\/([^/?#]+)/i);
  if (urlMatch) return { owner: urlMatch[1], repo: urlMatch[2] };
  const slugMatch = cleaned.match(/^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/);
  if (slugMatch) return { owner: slugMatch[1], repo: slugMatch[2] };
  return null;
}

export interface LoadOptions {
  /** Disable all network access. Required for the privacy-preserving mode. */
  offline?: boolean;
  /** Explicit text, which wins over any fetch. */
  text?: string;
  /** Product/landing-page URL to summarise. */
  url?: string;
}

export async function loadSource(input: string, opts: LoadOptions = {}): Promise<SourceDocument> {
  const trimmed = input?.trim() ?? '';
  if (!trimmed && !opts.text) {
    throw new Error(
      'No input. Pass a GitHub repo (owner/name or URL), a file path, a URL, or text with --text.',
    );
  }

  if (opts.text) {
    return {
      kind: 'free-text',
      ref: 'pasted text',
      body: opts.text,
      topics: [],
      fetchedFrom: 'pasted',
    };
  }

  // Local file wins over network when the path exists.
  const asPath = resolve(trimmed);
  if (existsSync(asPath)) {
    const body = await readFile(asPath, 'utf8');
    return {
      kind: 'readme-text',
      ref: asPath,
      title: asPath.split('/').pop(),
      body,
      topics: [],
      fetchedFrom: 'local-file',
    };
  }

  const gh = parseGitHubRef(trimmed);
  if (gh) return loadGitHub(gh.owner, gh.repo, opts.offline === true);

  if (/^https?:\/\//i.test(trimmed) || opts.url) {
    return loadUrl(opts.url ?? trimmed, opts.offline === true);
  }

  return {
    kind: 'free-text',
    ref: 'inline text',
    body: trimmed,
    topics: [],
    fetchedFrom: 'pasted',
  };
}

async function loadGitHub(owner: string, repo: string, offline: boolean): Promise<SourceDocument> {
  const base: SourceDocument = {
    kind: 'github-repo',
    ref: `${owner}/${repo}`,
    topics: [],
    fetchedFrom: 'pasted',
    body: '',
  };

  if (offline) {
    return {
      ...base,
      body: `# ${owner}/${repo}\n\nOffline mode: repository content was not fetched.`,
      degraded: 'offline mode — no network call was made, so only the repo slug is analysed',
    };
  }

  const notes: string[] = [];
  let description: string | undefined;
  let topics: string[] = [];
  let stars: number | undefined;
  let forks: number | undefined;
  let readme = '';

  try {
    const headers: Record<string, string> = {};
    const token = process.env.GITHUB_TOKEN;
    if (token) headers.authorization = `Bearer ${token}`;

    const metaRes = await fetchWithTimeout(`https://api.github.com/repos/${owner}/${repo}`, headers);
    if (metaRes.ok) {
      const meta = (await metaRes.json()) as {
        description?: string;
        topics?: string[];
        stargazers_count?: number;
        forks_count?: number;
      };
      description = meta.description ?? undefined;
      topics = meta.topics ?? [];
      stars = meta.stargazers_count;
      forks = meta.forks_count;
    } else if (metaRes.status === 403 || metaRes.status === 429) {
      notes.push(`GitHub API rate-limited (${metaRes.status}); metadata unavailable`);
    } else if (metaRes.status === 404) {
      throw new Error(`Repository ${owner}/${repo} not found (404). Check the name, or it may be private.`);
    }
  } catch (err) {
    if (err instanceof Error && err.message.includes('not found')) throw err;
    notes.push(`metadata fetch failed: ${(err as Error).message}`);
  }

  // Two routes to the README: raw.githubusercontent (fast, often blocked by
  // corporate proxies) then the REST API (returns base64). Falling through
  // between them is the difference between working and not working on a
  // restricted network.
  try {
    const readmeRes = await fetchWithTimeout(
      `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/README.md`,
    );
    if (readmeRes.ok) readme = await readmeRes.text();
    else notes.push(`raw README not available (${readmeRes.status})`);
  } catch (err) {
    notes.push(`raw README fetch failed: ${(err as Error).message}`);
  }

  if (!readme) {
    try {
      const headers: Record<string, string> = { accept: 'application/vnd.github.raw+json' };
      const token = process.env.GITHUB_TOKEN;
      if (token) headers.authorization = `Bearer ${token}`;
      const apiRes = await fetchWithTimeout(
        `https://api.github.com/repos/${owner}/${repo}/readme`,
        headers,
      );
      if (apiRes.ok) {
        readme = await apiRes.text();
        notes.push('README retrieved via the REST API fallback');
      } else {
        notes.push(`API README not available (${apiRes.status})`);
      }
    } catch (err) {
      notes.push(`API README fetch failed: ${(err as Error).message}`);
    }
  }

  if (!readme && !description) {
    throw new Error(
      `Could not read ${owner}/${repo}. No network access and no cached content. ` +
        `Try --offline with a local file, or pass the README path directly.`,
    );
  }

  return {
    kind: 'github-repo',
    ref: `${owner}/${repo}`,
    title: `${owner}/${repo}`,
    description,
    body: readme || description || '',
    topics,
    stars,
    forks,
    fetchedFrom: notes.length === 0 ? 'network' : 'network',
    degraded: notes.length ? notes.join('; ') : undefined,
  };
}

async function loadUrl(url: string, offline: boolean): Promise<SourceDocument> {
  if (offline) {
    return {
      kind: 'url',
      ref: url,
      body: `# ${url}\n\nOffline mode: page content was not fetched.`,
      topics: [],
      fetchedFrom: 'pasted',
      degraded: 'offline mode — only the URL itself was analysed',
    };
  }
  try {
    const res = await fetchWithTimeout(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const { text, title, description } = htmlToText(html);
    return {
      kind: 'url',
      ref: url,
      title,
      description,
      body: text || description || url,
      topics: [],
      fetchedFrom: 'network',
    };
  } catch (err) {
    return {
      kind: 'url',
      ref: url,
      body: `# ${url}\n\nPage could not be fetched: ${(err as Error).message}`,
      topics: [],
      fetchedFrom: 'pasted',
      degraded: `page fetch failed (${(err as Error).message}) — analysis is based on the URL only and is close to meaningless`,
    };
  }
}

/** Minimal, dependency-free readability pass. Good enough to score copy. */
export function htmlToText(html: string): { text: string; title?: string; description?: string } {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim();
  const description =
    html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1]?.trim() ??
    html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)?.[1]?.trim();

  const bodyOnly = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ');
  const headings = [...bodyOnly.matchAll(/<h([1-3])[^>]*>([\s\S]*?)<\/h\1>/gi)]
    .map((m) => `# ${stripTags(m[2]).trim()}`)
    .join('\n');
  const text = stripTags(bodyOnly).replace(/\s+/g, ' ').trim();
  return { text: `${headings}\n\n${text}`.trim(), title, description };
}

function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Estimates category saturation via GitHub topic search.
 * Returns null when unavailable — callers must handle null, never default to a number.
 */
export async function fetchTopicSaturation(query: string): Promise<number | null> {
  if (process.env.VIRAL_ENGINE_OFFLINE === '1') return null;
  try {
    const headers: Record<string, string> = { accept: 'application/vnd.github+json' };
    const token = process.env.GITHUB_TOKEN;
    if (token) headers.authorization = `Bearer ${token}`;
    const q = encodeURIComponent(query.slice(0, 200));
    const res = await fetchWithTimeout(
      `https://api.github.com/search/repositories?q=${q}&per_page=1`,
      headers,
    );
    if (!res.ok) return null;
    const json = (await res.json()) as { total_count?: number };
    return typeof json.total_count === 'number' ? json.total_count : null;
  } catch {
    return null;
  }
}
