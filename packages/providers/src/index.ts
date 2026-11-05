/**
 * Provider abstraction, v2.
 *
 * Unchanged principle from v1, and it is the most important one in the codebase:
 * **the engine is fully functional with no provider.** Models add prose. They
 * cannot change a score, add a broadcaster, remove a failure condition, or
 * author an asset. Everything that matters is computed locally and validated
 * against the schema before any model sees it.
 *
 * v2 additions:
 *  - `llama-cpp` and `lm-studio` as local providers
 *  - an explicit `PROVIDER_CAPABILITIES` table so the CLI can tell a user what a
 *    provider is and is not allowed to do before they configure it
 *  - `auditProse()`: any model output that will be shown to a user passes through
 *    the honesty firewall first. This is not optional and has no override flag.
 */
export interface ProviderRequest {
  system: string;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
}

export interface ProviderResult {
  text: string;
  provider: string;
  model: string;
  /** True when the request never left the machine. Optional; absent means hosted. */
  local?: boolean;
}

export interface Provider {
  readonly name: string;
  readonly model: string;
  /** True when the request never leaves the machine. Optional; absent means hosted. */
  readonly local?: boolean;
  isAvailable(): boolean;
  complete(req: ProviderRequest): Promise<ProviderResult>;
}

export type ProviderName =
  | 'none'
  | 'anthropic'
  | 'openai'
  | 'google'
  | 'mistral'
  | 'groq'
  | 'ollama'
  | 'llama-cpp'
  | 'lm-studio';

export const LOCAL_PROVIDERS: ProviderName[] = ['ollama', 'llama-cpp', 'lm-studio'];

export interface ProviderCapability {
  name: ProviderName;
  local: boolean;
  requiresKey: boolean;
  envKey?: string;
  endpoint: string;
  /** What this provider may produce. Never scored fields. */
  mayProduce: string[];
  cannotProduce: string[];
  privacy: string;
}

export const AUTO_ORDER: ProviderName[] = ['ollama', 'llama-cpp', 'lm-studio', 'anthropic', 'openai', 'google', 'mistral', 'groq'];

export const PROVIDER_CAPABILITIES: ProviderCapability[] = [
  {
    name: 'none',
    local: true,
    requiresKey: false,
    endpoint: '—',
    mayProduce: ['everything the tool is known for'],
    cannotProduce: [],
    privacy: 'Zero network calls. Recommended default.',
  },
  {
    name: 'ollama',
    local: true,
    requiresKey: false,
    endpoint: 'http://127.0.0.1:11434',
    mayProduce: ['prose', 'critic phrasing', 'plain-language rewrites'],
    cannotProduce: ['scores', 'broadcaster identities', 'failure conditions'],
    privacy: 'Runs on your machine. Nothing leaves it.',
  },
  {
    name: 'llama-cpp',
    local: true,
    requiresKey: false,
    endpoint: 'http://127.0.0.1:8080',
    mayProduce: ['prose'],
    cannotProduce: ['scores', 'broadcaster identities', 'failure conditions'],
    privacy: 'Runs on your machine. Nothing leaves it.',
  },
  {
    name: 'lm-studio',
    local: true,
    requiresKey: false,
    endpoint: 'http://127.0.0.1:1234',
    mayProduce: ['prose'],
    cannotProduce: ['scores', 'broadcaster identities', 'failure conditions'],
    privacy: 'Runs on your machine. Nothing leaves it.',
  },
  {
    name: 'anthropic',
    local: false,
    requiresKey: true,
    envKey: 'ANTHROPIC_API_KEY',
    endpoint: 'https://api.anthropic.com',
    mayProduce: ['prose', 'critic phrasing'],
    cannotProduce: ['scores', 'broadcaster identities', 'failure conditions', 'launch assets'],
    privacy: 'Your document text is sent to Anthropic. Use --offline or ollama to avoid this.',
  },
  {
    name: 'openai',
    local: false,
    requiresKey: true,
    envKey: 'OPENAI_API_KEY',
    endpoint: 'https://api.openai.com',
    mayProduce: ['prose'],
    cannotProduce: ['scores', 'broadcaster identities', 'failure conditions', 'launch assets'],
    privacy: 'Your document text is sent to OpenAI. Use --offline or ollama to avoid this.',
  },
  {
    name: 'google',
    local: false,
    requiresKey: true,
    envKey: 'GOOGLE_API_KEY',
    endpoint: 'https://generativelanguage.googleapis.com',
    mayProduce: ['prose'],
    cannotProduce: ['scores', 'broadcaster identities', 'failure conditions', 'launch assets'],
    privacy: 'Your document text is sent to Google. Use --offline or ollama to avoid this.',
  },
  {
    name: 'mistral',
    local: false,
    requiresKey: true,
    envKey: 'MISTRAL_API_KEY',
    endpoint: 'https://api.mistral.ai',
    mayProduce: ['prose'],
    cannotProduce: ['scores', 'broadcaster identities', 'failure conditions', 'launch assets'],
    privacy: 'Your document text is sent to Mistral. Use --offline or ollama to avoid this.',
  },
  {
    name: 'groq',
    local: false,
    requiresKey: true,
    envKey: 'GROQ_API_KEY',
    endpoint: 'https://api.groq.com',
    mayProduce: ['prose'],
    cannotProduce: ['scores', 'broadcaster identities', 'failure conditions', 'launch assets'],
    privacy: 'Your document text is sent to Groq. Use --offline or ollama to avoid this.',
  },
];

const DEFAULT_MODELS: Record<string, string> = {
  anthropic: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o-mini',
  google: 'gemini-2.0-flash',
  mistral: 'mistral-large-latest',
  groq: 'llama-3.3-70b-versatile',
  ollama: 'llama3.1',
  'llama-cpp': 'local-gguf',
  'lm-studio': 'local-model',
};

async function postJson(url: string, headers: Record<string, string>, body: unknown, timeoutMs = 60_000): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`provider HTTP ${res.status}: ${text.slice(0, 300)}`);
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Availability policy for local servers: we do not probe.
 *
 * A positioning tool that silently opens a socket to 127.0.0.1:11434 on every run
 * is doing exactly the thing it tells other tools not to do. A local provider is
 * considered available when the user has declared its host, or when they named it
 * explicitly on the command line. `viral-engine doctor` probes, because there the
 * user asked.
 */
const LOCAL_HOST_ENV: Record<string, string> = {
  ollama: 'OLLAMA_HOST',
  'llama-cpp': 'LLAMA_CPP_HOST',
  'lm-studio': 'LM_STUDIO_HOST',
};

function openAiCompat(name: string, baseUrl: string, apiKeyEnv: string | null, local: boolean): Provider {
  const key = (): string | undefined => (apiKeyEnv ? process.env[apiKeyEnv] : 'local');
  const declared = (): boolean => Boolean(process.env[LOCAL_HOST_ENV[name] ?? '']);
  return {
    name,
    model: process.env[`${name.toUpperCase().replace(/-/g, '_')}_MODEL`] ?? DEFAULT_MODELS[name] ?? 'default',
    local,
    isAvailable: () => (local ? declared() : Boolean(key())),
    async complete(req) {
      const model = process.env[`${name.toUpperCase().replace(/-/g, '_')}_MODEL`] ?? DEFAULT_MODELS[name] ?? 'default';
      const json = (await postJson(
        `${baseUrl}/chat/completions`,
        apiKeyEnv ? { authorization: `Bearer ${key()}` } : {},
        {
          model,
          messages: [
            { role: 'system', content: req.system },
            { role: 'user', content: req.prompt },
          ],
          max_tokens: req.maxTokens ?? 900,
          temperature: req.temperature ?? 0.3,
        },
      )) as { choices?: Array<{ message?: { content?: string } }> };
      const text = json.choices?.[0]?.message?.content;
      if (!text) throw new Error(`${name}: empty response`);
      return { text, provider: name, model, local };
    },
  };
}

/**
 * A provider factory as exposed for discovery. Some entries are always-available
 * (local servers), some require a key. Presence in this object is not a promise
 * that the provider works on this machine — `isAvailable()` answers that.
 */
export const ALL_PROVIDERS: Record<Exclude<ProviderName, 'none'>, () => Provider> = {
  anthropic: anthropicProvider,
  openai: () => openAiCompat('openai', 'https://api.openai.com/v1', 'OPENAI_API_KEY', false),
  google: () => openAiCompat('google', 'https://generativelanguage.googleapis.com/v1beta/openai', 'GOOGLE_API_KEY', false),
  mistral: () => openAiCompat('mistral', 'https://api.mistral.ai/v1', 'MISTRAL_API_KEY', false),
  groq: () => openAiCompat('groq', 'https://api.groq.com/openai/v1', 'GROQ_API_KEY', false),
  ollama: () => openAiCompat('ollama', process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434/v1', null, true),
  'llama-cpp': () => openAiCompat('llama-cpp', process.env.LLAMA_CPP_HOST ?? 'http://127.0.0.1:8080/v1', null, true),
  'lm-studio': () => openAiCompat('lm-studio', process.env.LM_STUDIO_HOST ?? 'http://127.0.0.1:1234/v1', null, true),
};

export function anthropicProvider(): Provider {
  const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_MODELS.anthropic;
  return {
    name: 'anthropic',
    model,
    local: false,
    isAvailable: () => Boolean(process.env.ANTHROPIC_API_KEY),
    async complete(req) {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) throw new Error('anthropic: ANTHROPIC_API_KEY is not set');
      const json = (await postJson(
        'https://api.anthropic.com/v1/messages',
        { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
        {
          model,
          max_tokens: req.maxTokens ?? 900,
          temperature: req.temperature ?? 0.3,
          system: req.system,
          messages: [{ role: 'user', content: req.prompt }],
        },
      )) as { content?: Array<{ text?: string }> };
      const text = json.content?.map((c) => c.text ?? '').join('\n').trim();
      if (!text) throw new Error('anthropic: empty response');
      return { text, provider: 'anthropic', model, local: false };
    },
  };
}

export function buildProvider(name: ProviderName): Provider | null {
  if (name === 'none') return null;
  const factory = ALL_PROVIDERS[name];
  return factory ? factory() : null;
}

export interface Resolution {
  provider: Provider | null;
  name: ProviderName;
  reason: string;
  skipped: Array<{ name: ProviderName; why: string; reason: string }>;
}

/**
 * Resolution order is local-first: if Ollama is running, we use it before asking
 * for an API key. A user who has deliberately installed a local model should not
 * have to argue with the tool about it.
 */
export function resolveProvider(requested: string = 'auto'): Resolution {
  if (requested !== 'auto') {
    const p = buildProvider(requested as ProviderName);
    if (!p) {
      return { provider: null, name: 'none', reason: 'no provider requested', skipped: [] };
    }
    if (!p.isAvailable()) {
      return {
        provider: null,
        name: 'none',
        reason: `${requested} is not available (missing key or endpoint)`,
        skipped: [{ name: requested as ProviderName, why: 'not available', reason: `${requested} requires configuration` }],
      };
    }
    return { provider: p, name: requested as ProviderName, reason: `using ${requested}`, skipped: [] };
  }

  const skipped: Array<{ name: ProviderName; why: string; reason: string }> = [];
  for (const name of LOCAL_PROVIDERS) {
    const p = buildProvider(name);
    if (p?.isAvailable()) return { provider: p, name, reason: `local model available at ${name}`, skipped };
    skipped.push({ name, why: 'not running', reason: `${name} endpoint not reachable` });
  }
  const envFor: Record<string, string> = {
    anthropic: 'ANTHROPIC_API_KEY',
    openai: 'OPENAI_API_KEY',
    google: 'GOOGLE_API_KEY',
    mistral: 'MISTRAL_API_KEY',
    groq: 'GROQ_API_KEY',
  };
  for (const name of ['anthropic', 'openai', 'google', 'mistral', 'groq'] as ProviderName[]) {
    const p = buildProvider(name);
    if (p?.isAvailable()) return { provider: p, name, reason: `API key found for ${name}`, skipped };
    skipped.push({ name, why: 'no API key', reason: `${envFor[name]} is not set` });
  }
  return {
    provider: null,
    name: 'none',
    reason:
      'no provider credentials found — running the deterministic path, which is the default and not a degraded mode',
    skipped,
  };
}

export async function completeWithRetry(p: Provider, req: ProviderRequest, attempts = 2): Promise<ProviderResult> {
  let last: unknown;
  for (let i = 1; i <= attempts; i++) {
    try {
      return await p.complete(req);
    } catch (err) {
      last = err;
      if (i < attempts) await new Promise((r) => setTimeout(r, 250 * i));
    }
  }
  throw new Error(`provider ${p.name} failed after ${attempts} attempt(s) — ${(last as Error)?.message ?? 'unknown error'}`);
}

/**
 * The system prompt for the only thing a provider may do: explain, in prose, a
 * judgement the deterministic engine already made. Heavily constrained on
 * purpose, and every output is audited before it is shown.
 */
export function buildDiagnosisPrompt(
  sourceOrInput: { text: string; aqiSummary: string; weakest: string } | { body?: string; ref?: string; description?: string },
  summaryOrWeakest?: string,
): ProviderRequest {
  // Two call shapes are supported: the v2 structured input, and the v1
  // (source, summary) pair that existing callers and tests already use.
  const input =
    'text' in sourceOrInput && typeof (sourceOrInput as { text?: unknown }).text === 'string' && 'aqiSummary' in sourceOrInput
      ? (sourceOrInput as { text: string; aqiSummary: string; weakest: string })
      : {
          text: [ (sourceOrInput as { description?: string }).description, (sourceOrInput as { body?: string }).body ]
            .filter(Boolean)
            .join('\n\n'),
          aqiSummary: summaryOrWeakest ?? '',
          weakest: summaryOrWeakest ?? 'unknown',
        };
  return {
    system:
      'You are a careful editor. You may only explain and compress judgements that are already made in the AQI SUMMARY. ' +
      'Never invent statistics. Never add a failure condition of your own; the failure conditions supplied are the only ones allowed. ' +
      'You must not invent statistics, testimonials, user counts, guarantees, or new recommendations. ' +
      'You must not add a claim that is not supported by the supplied summary. ' +
      'If you do not have enough information, say "insufficient information" instead of guessing. ' +
      'Write in plain language at roughly a grade 9 reading level. Maximum 150 words.',
    prompt:
      `SOURCE DOCUMENT (for tone reference only — do not add facts from it. Do not contradict the AQI summary.):\n${truncate(input.text, 6000)}\n\n` +
      `AQI SUMMARY (the only source of claims):\n${input.aqiSummary}\n\n` +
      `WEAKEST DIMENSION: ${input.weakest}\n\n` +
      'Write one paragraph that explains why this dimension is the bottleneck, using only the summary. No new numbers. No new advice. Do not contradict the summary.',
    temperature: 0.2,
    maxTokens: 400,
  };
}

/**
 * Mandatory audit of model prose. Returns the text, or null when it failed.
 * There is deliberately no `force` parameter: a tool that can be told to skip its
 * own honesty check will be told to skip its own honesty check.
 */
export async function auditProse(
  prose: string,
  check: (text: string) => { passed: boolean; findings: Array<{ rule: string; matched: string }> },
): Promise<{ text: string | null; rejected: Array<{ rule: string; matched: string }> }> {
  const result = check(prose);
  return result.passed ? { text: prose, rejected: [] } : { text: null, rejected: result.findings };
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n) + '\n…[truncated]';
}
