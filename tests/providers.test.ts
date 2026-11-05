import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolveProvider, ALL_PROVIDERS, completeWithRetry, buildDiagnosisPrompt } from '@viral-engine/core';
import type { Provider, SourceDocument } from '@viral-engine/core';

const ENV_KEYS = [
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'GROQ_API_KEY',
  'MISTRAL_API_KEY',
  'TOGETHER_API_KEY',
  'OLLAMA_HOST',
  'VIRAL_ENGINE_TRY_OLLAMA',
];

describe('providers: resolution without credentials', () => {
  const saved: Record<string, string | undefined> = {};
  beforeEach(() => {
    for (const k of ENV_KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });
  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it('returns null rather than throwing when nothing is configured', () => {
    const r = resolveProvider('auto');
    expect(r.provider).toBeNull();
    expect(r.reason).toMatch(/no provider credentials/);
    expect(r.skipped.length).toBeGreaterThan(0);
  });

  it('reports why each provider was skipped', () => {
    const r = resolveProvider('auto');
    const names = r.skipped.map((s) => s.name);
    expect(names).toContain('anthropic');
    expect(names).toContain('openai');
    expect(r.skipped.find((s) => s.name === 'anthropic')!.reason).toContain('ANTHROPIC_API_KEY');
  });

  it('honours an explicit "none" and does not probe', () => {
    const r = resolveProvider('none');
    expect(r.provider).toBeNull();
    expect(r.skipped).toHaveLength(0);
  });

  it('selects a provider once a key appears', () => {
    process.env.OPENAI_API_KEY = 'test-key';
    const r = resolveProvider('auto');
    expect(r.provider?.name).toBe('openai');
  });

  it('prefers the local provider over hosted ones', () => {
    process.env.OLLAMA_HOST = 'http://127.0.0.1:11434';
    process.env.ANTHROPIC_API_KEY = 'test-key';
    const r = resolveProvider('auto');
    expect(r.provider?.name).toBe('ollama');
  });

  it('errors clearly when an explicitly requested provider is unconfigured', () => {
    const r = resolveProvider('groq');
    expect(r.provider).toBeNull();
    expect(r.reason).toContain('groq');
  });

  it('every provider exposes the same interface', () => {
    for (const factory of Object.values(ALL_PROVIDERS)) {
      const p = factory();
      expect(typeof p.name).toBe('string');
      expect(typeof p.model).toBe('string');
      expect(typeof p.isAvailable).toBe('function');
      expect(typeof p.complete).toBe('function');
    }
  });
});

describe('providers: retry semantics', () => {
  const fake = (failures: number): Provider & { calls: number } => {
    const p = {
      name: 'fake',
      model: 'fake-1',
      calls: 0,
      isAvailable: () => true,
      async complete() {
        p.calls += 1;
        if (p.calls <= failures) throw new Error('simulated network failure');
        return { text: 'ok', provider: 'fake', model: 'fake-1' };
      },
    };
    return p;
  };

  it('succeeds after a transient failure', async () => {
    const p = fake(1);
    const r = await completeWithRetry(p, { system: 's', prompt: 'p' }, 2);
    expect(r.text).toBe('ok');
    expect(p.calls).toBe(2);
  });

  it('throws with the provider name and attempt count after exhausting retries', async () => {
    const p = fake(99);
    await expect(completeWithRetry(p, { system: 's', prompt: 'p' }, 2)).rejects.toThrow(
      /provider fake failed after 2 attempt/,
    );
  });
});

describe('prompt assembly', () => {
  it('carries the no-fabrication and no-guarantee constraints', () => {
    const source: SourceDocument = {
      kind: 'readme-text',
      ref: 'x',
      body: 'body',
      topics: [],
      fetchedFrom: 'pasted',
    };
    const req = buildDiagnosisPrompt(source, 'weakest lever: broadcaster fit');
    expect(req.system).toMatch(/never invent statistics/i);
    expect(req.system).toMatch(/failure condition/i);
    expect(req.prompt).toMatch(/do not contradict/i);
    expect(req.prompt).toContain('weakest lever: broadcaster fit');
  });

  it('truncates very large documents instead of sending everything', () => {
    const source: SourceDocument = {
      kind: 'readme-text',
      ref: 'x',
      body: 'word '.repeat(20000),
      topics: [],
      fetchedFrom: 'pasted',
    };
    const req = buildDiagnosisPrompt(source, 'x');
    expect(req.prompt.length).toBeLessThan(15000);
    expect(req.prompt).toContain('SOURCE DOCUMENT');
  });
});
