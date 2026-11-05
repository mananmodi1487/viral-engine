/**
 * Provider abstraction.
 *
 * The critical property: the engine is fully functional with NO provider. The
 * deterministic path is not a fallback for a degraded experience — it is the
 * default, and providers only add prose (rationale, messaging) on top of signals
 * that were computed locally.
 *
 * That ordering is what makes local/private mode real rather than a marketing
 * claim, and it is why "no API key" is not an error state.
 */
import type { SourceDocument } from '../schemas.js';

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
}

export interface Provider {
  readonly name: string;
  readonly model: string;
  /** Cheap check: is this provider usable in the current environment? */
  isAvailable(): boolean;
  complete(req: ProviderRequest): Promise<ProviderResult>;
}

export type ProviderName = 'none' | 'anthropic' | 'openai' | 'ollama' | 'groq' | 'mistral' | 'together';

const DEFAULT_MODELS: Record<Exclude<ProviderName, 'none'>, string> = {
  anthropic: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o-mini',
  ollama: 'llama3.1',
  groq: 'llama-3.3-70b-versatile',
  mistral: 'mistral-large-latest',
  together: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
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
    if (!res.ok) {
      throw new Error(`provider HTTP ${res.status}: ${text.slice(0, 300)}`);
    }
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

function openAiCompat(
  name: string,
  baseUrl: string,
  apiKeyEnv: string,
  defaultModel: string,
): Provider {
  const key = () => process.env[apiKeyEnv];
  return {
    name,
    model: process.env[`${apiKeyEnv}_MODEL`] ?? defaultModel,
    isAvailable: () => Boolean(key()),
    async complete(req) {
      if (!key()) throw new Error(`${name}: ${apiKeyEnv} is not set`);
      const model = process.env[`${apiKeyEnv}_MODEL`] ?? defaultModel;
      const json = (await postJson(
        `${baseUrl}/chat/completions`,
        { authorization: `Bearer ${key()}` },
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
      return { text, provider: name, model };
    },
  };
}

export function anthropicProvider(): Provider {
  const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_MODELS.anthropic;
  return {
    name: 'anthropic',
    model,
    isAvailable: () => Boolean(process.env.ANTHROPIC_API_KEY),
    async complete(req) {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) throw new Error('anthropic: ANTHROPIC_API_KEY is not set');
      const json = (await postJson(
        'https://api.anthropic.com/v1/messages',
        { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
        {
          model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODELS.anthropic,
          max_tokens: req.maxTokens ?? 900,
          temperature: req.temperature ?? 0.3,
          system: req.system,
          messages: [{ role: 'user', content: req.prompt }],
        },
      )) as { content?: Array<{ text?: string }> };
      const text = json.content?.map((c) => c.text ?? '').join('\n').trim();
      if (!text) throw new Error('anthropic: empty response');
      return { text, provider: 'anthropic', model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODELS.anthropic };
    },
  };
}

/**
 * Ollama is the local option. It is the reason "runs without a proprietary
 * model" is true rather than aspirational.
 */
export function ollamaProvider(): Provider {
  const host = process.env.OLLAMA_HOST ?? 'http://127.0.0.1:11434';
  const model = process.env.OLLAMA_MODEL ?? DEFAULT_MODELS.ollama;
  return {
    name: 'ollama',
    model,
    isAvailable: () => Boolean(process.env.OLLAMA_HOST || process.env.VIRAL_ENGINE_TRY_OLLAMA === '1'),
    async complete(req) {
      const json = (await postJson(
        `${host}/api/chat`,
        {},
        {
          model,
          stream: false,
          options: { temperature: req.temperature ?? 0.3 },
          messages: [
            { role: 'system', content: req.system },
            { role: 'user', content: req.prompt },
          ],
        },
      )) as { message?: { content?: string } };
      const text = json.message?.content;
      if (!text) throw new Error('ollama: empty response (is the model pulled?)');
      return { text, provider: 'ollama', model };
    },
  };
}

export function openaiProvider(): Provider {
  return openAiCompat('openai', 'https://api.openai.com/v1', 'OPENAI_API_KEY', DEFAULT_MODELS.openai);
}
export function groqProvider(): Provider {
  return openAiCompat('groq', 'https://api.groq.com/openai/v1', 'GROQ_API_KEY', DEFAULT_MODELS.groq);
}
export function mistralProvider(): Provider {
  return openAiCompat('mistral', 'https://api.mistral.ai/v1', 'MISTRAL_API_KEY', DEFAULT_MODELS.mistral);
}
export function togetherProvider(): Provider {
  return openAiCompat('together', 'https://api.together.xyz/v1', 'TOGETHER_API_KEY', DEFAULT_MODELS.together);
}

export const ALL_PROVIDERS: Record<Exclude<ProviderName, 'none'>, () => Provider> = {
  anthropic: anthropicProvider,
  openai: openaiProvider,
  ollama: ollamaProvider,
  groq: groqProvider,
  mistral: mistralProvider,
  together: togetherProvider,
};

/** Ordered preference when the user does not pin a provider. Local first, by design. */
export const AUTO_ORDER: Array<Exclude<ProviderName, 'none'>> = [
  'ollama',
  'anthropic',
  'openai',
  'groq',
  'mistral',
  'together',
];

export interface ResolveResult {
  provider: Provider | null;
  /** Why no provider was selected, for the CLI to print. */
  reason: string;
  /** Providers that were considered but unavailable, with the reason. */
  skipped: Array<{ name: string; reason: string }>;
}

export function resolveProvider(requested: ProviderName | 'auto' | undefined): ResolveResult {
  const skipped: Array<{ name: string; reason: string }> = [];
  if (requested === 'none') {
    return { provider: null, reason: 'disabled with --provider none', skipped };
  }

  const candidates: Array<Exclude<ProviderName, 'none'>> =
    requested && requested !== 'auto' ? [requested] : AUTO_ORDER;

  for (const name of candidates) {
    const p = ALL_PROVIDERS[name]();
    if (p.isAvailable()) {
      return {
        provider: p,
        reason: requested && requested !== 'auto' ? `explicitly requested ${name}` : `auto-selected ${name}`,
        skipped,
      };
    }
    skipped.push({
      name,
      reason:
        name === 'ollama'
          ? 'no OLLAMA_HOST set (set VIRAL_ENGINE_TRY_OLLAMA=1 to probe localhost)'
          : `missing ${name.toUpperCase()}_API_KEY`,
    });
  }

  return {
    provider: null,
    reason:
      requested && requested !== 'auto'
        ? `requested provider "${requested}" is not configured`
        : 'no provider credentials found',
    skipped,
  };
}

/**
 * Runs a provider with one retry and a hard failure that the caller can catch.
 * We deliberately do not silently swallow provider errors: the report metadata
 * must be able to say whether a model was involved.
 */
export async function completeWithRetry(
  provider: Provider,
  req: ProviderRequest,
  attempts = 2,
): Promise<ProviderResult> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await provider.complete(req);
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 400 * (i + 1)));
    }
  }
  throw new Error(
    `provider ${provider.name} failed after ${attempts} attempt(s): ${(lastErr as Error).message}`,
  );
}

/** Prompt assembly. Kept separate from transport so prompts can be versioned. */
export function buildDiagnosisPrompt(source: SourceDocument, localFindings: string): ProviderRequest {
  return {
    system:
      'You are a spread diagnostician. You do not hype. You never invent statistics, testimonials, or users. ' +
      'Every claim you make must be traceable to the provided document or to the named research (Berger & Milkman 2012; ' +
      'Goel, Watts & Goldstein 2012/2016). You always state a failure condition. If the honest answer is "do not launch yet", say so.',
    prompt: [
      'The local engine computed the following deterministic findings. Explain them in plain language; do not contradict them.',
      localFindings,
      '',
      'SOURCE DOCUMENT:',
      `ref: ${source.ref}`,
      `kind: ${source.kind}`,
      source.description ? `description: ${source.description}` : '',
      '---',
      source.body.slice(0, 12_000),
      '---',
      '',
      'Return: (1) the single weakest lever and why, (2) one proposed positioning sentence in the form "It\'s not X. It\'s Y — for Z",',
      '(3) the one broadcaster to approach and what to send them, (4) the failure condition, (5) whether to launch yet.',
      'Maximum 400 words. No preamble.',
    ]
      .filter(Boolean)
      .join('\n'),
  };
}
