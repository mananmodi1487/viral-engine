import { describe, it, expect } from 'vitest';
import {
  validateManifest,
  findSealedAttempts,
  loadPlugin,
  makeContext,
  PluginRejected,
  type PluginManifest,
  type RendererPlugin,
} from '../packages/plugin-sdk/src/index.js';

const GOOD: PluginManifest = {
  id: 'viral-engine-renderer-notion',
  name: 'Notion renderer',
  version: '1.0.0',
  description: 'Writes an ODS report into a Notion page you already own.',
  author: 'a contributor',
  license: 'MIT',
  capabilities: ['renderer'],
  odsVersions: '^1.0.0',
  network: 'declared-hosts',
  hosts: ['api.notion.com'],
  filesystem: 'none',
  readsDocument: true,
  transmitsDocument: true,
  permissions: ['document:transmit'],
};

const RENDERER: RendererPlugin = {
  kind: 'renderer',
  extension: 'md',
  render: () => '# ok',
};

describe('plugin manifest validation', () => {
  it('accepts a well-formed manifest', () => {
    expect(validateManifest(GOOD)).toEqual([]);
  });

  it('reports every problem at once, not the first', () => {
    const problems = validateManifest({ id: 'x' });
    expect(problems.length).toBeGreaterThan(6);
    for (const p of problems) {
      expect(p.fix.length, `${p.field} has no suggested fix`).toBeGreaterThan(8);
    }
  });

  it('rejects a closed-source plugin', () => {
    const p = validateManifest({ ...GOOD, license: 'Proprietary' });
    expect(p.some((x) => x.field === 'license')).toBe(true);
  });

  it('rejects marketing language in the description', () => {
    const p = validateManifest({ ...GOOD, description: 'A revolutionary, world-class plugin that guarantees viral growth.' });
    expect(p.some((x) => x.field === 'description' && /marketing/.test(x.problem))).toBe(true);
  });

  it('rejects wildcard hosts', () => {
    const p = validateManifest({ ...GOOD, hosts: ['*.notion.com'] });
    expect(p.some((x) => /wildcard/.test(x.problem))).toBe(true);
  });

  it('rejects a loopback host', () => {
    const p = validateManifest({ ...GOOD, hosts: ['127.0.0.1'] });
    expect(p.some((x) => /private or loopback/.test(x.problem))).toBe(true);
  });

  it('catches the contradiction of transmitting with network none', () => {
    const p = validateManifest({ ...GOOD, network: 'none', hosts: undefined });
    expect(p.some((x) => x.field === 'transmitsDocument')).toBe(true);
  });

  it('requires the transmit permission when the document leaves the machine', () => {
    const p = validateManifest({ ...GOOD, permissions: [] });
    expect(p.some((x) => /document:transmit/.test(x.field + x.problem))).toBe(true);
  });
});

describe('the rubric is sealed', () => {
  it('rejects a plugin that exports weights', () => {
    const sealed = findSealedAttempts({ manifest: GOOD, exports: { weights: { a: 1 } } });
    expect(sealed.length).toBe(1);
  });

  it('rejects a plugin that exports dimensions', () => {
    expect(findSealedAttempts({ manifest: GOOD, exports: { dimensions: [] } }).length).toBe(1);
  });

  it('rejects a manifest field that overlaps a sealed surface', () => {
    const sealed = findSealedAttempts({ manifest: { ...GOOD, scoreWeights: {} } as never });
    expect(sealed.length).toBeGreaterThan(0);
  });

  it('allows an ordinary renderer', () => {
    expect(findSealedAttempts({ manifest: GOOD, exports: { render: () => '', extension: 'md', kind: 'renderer' } })).toEqual([]);
  });

  it('loadPlugin refuses and explains', () => {
    expect(() => loadPlugin({ ...GOOD, license: 'Proprietary' }, RENDERER)).toThrow(PluginRejected);
    try {
      loadPlugin({ ...GOOD, license: 'Proprietary' }, RENDERER);
    } catch (e) {
      expect((e as Error).message).toMatch(/license/);
      expect((e as Error).message).toMatch(/OSI-approved/);
    }
  });

  it('refuses a capability the export does not implement', () => {
    expect(() => loadPlugin({ ...GOOD, capabilities: ['input'] }, RENDERER)).toThrow(/declares input/);
  });

  it('produces a digest an evidence record can cite', () => {
    const loaded = loadPlugin(GOOD, RENDERER, 'source');
    expect(loaded.digest).toMatch(/^[0-9a-f]{16}$/);
  });
});

describe('declared permissions are enforced, not documented', () => {
  it('a network:none plugin gets a fetch that throws', async () => {
    const loaded = loadPlugin({ ...GOOD, network: 'none', hosts: undefined, transmitsDocument: false, permissions: [] }, RENDERER);
    const ctx = makeContext(loaded, { doc: {}, locale: 'en', offline: false, writablePaths: [] });
    await expect(ctx.fetch('https://api.notion.com/v1')).rejects.toThrow(/declared network: "none"/);
  });

  it('a declared host works and an undeclared one does not', async () => {
    const loaded = loadPlugin(GOOD, RENDERER);
    const ctx = makeContext(loaded, { doc: {}, locale: 'en', offline: true, writablePaths: [] });
    await expect(ctx.fetch('https://evil.example.com/')).rejects.toThrow(/not in its declared hosts/);
    // offline short-circuits even the declared host
    await expect(ctx.fetch('https://api.notion.com/v1')).rejects.toThrow(/offline mode/);
  });

  it('a filesystem:none plugin gets no writable paths', () => {
    const loaded = loadPlugin(GOOD, RENDERER);
    const ctx = makeContext(loaded, { doc: {}, locale: 'en', offline: true, writablePaths: ['/tmp/x'] });
    expect(ctx.writablePaths).toEqual([]);
  });

  it('the document a plugin receives is frozen', () => {
    const loaded = loadPlugin(GOOD, RENDERER);
    const ctx = makeContext(loaded, { doc: { scorecard: { total: 1 } }, locale: 'en', offline: true, writablePaths: [] });
    expect(() => {
      (ctx.doc as Record<string, unknown>)['scorecard'] = 'tampered';
    }).toThrow();
  });
});
