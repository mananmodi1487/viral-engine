/**
 * Plugin SDK — the contract, and the referee.
 *
 * A plugin can add a renderer, an input format, an evidence source, or an output
 * channel. It cannot add a scoring dimension, change a weight, or remove an
 * ethics check. That asymmetry is the entire design.
 *
 * Why the restriction: the value of the Attempt Quality Index is that 750 means
 * the same thing everywhere. The moment a plugin can add "Founder Charisma +50",
 * the number stops being comparable and the protocol stops being a protocol.
 * Extensibility that can rewrite the rubric is not extensibility, it is forking
 * with extra steps.
 *
 * So: capabilities are additive. Weights, dimensions, bands and the refusal
 * screen are sealed. A plugin that tries to touch them is rejected at load time,
 * with a reason.
 */
import { createHash } from 'node:crypto';

/* ------------------------------------------------------------------ *
 * Manifest
 * ------------------------------------------------------------------ */

export const PLUGIN_CAPABILITIES = [
  'renderer',      // turn an ODS document into an artifact
  'input',         // read a format the core does not read
  'evidence',      // provide evidence records
  'channel',       // deliver an output somewhere (a bot, a CMS, an inbox)
  'language',      // add translations of shipped copy
  'provider',      // supply a local model
] as const;

export type PluginCapability = (typeof PLUGIN_CAPABILITIES)[number];

/** Things a plugin may never do, whatever it declares. */
export const SEALED = [
  'aqi.weights',
  'aqi.dimensions',
  'aqi.bands',
  'ods.schema',
  'ethics.screen',
  'honesty.rules',
  'disclaimer',
] as const;

export type SealedSurface = (typeof SEALED)[number];

export interface PluginManifest {
  /** Reverse-DNS or npm-style. Must be unique and stable. */
  id: string;
  name: string;
  version: string;
  /** One sentence. What it does, for whom. No adjectives. */
  description: string;
  author: string;
  license: string;
  capabilities: PluginCapability[];
  /** ODS versions this plugin accepts. A range, not a wish. */
  odsVersions: string;
  /**
   * What the plugin does on the network. Declared, not discovered.
   * `none` is the default and the only value that works offline.
   */
  network: 'none' | 'declared-hosts';
  /** Required when network is 'declared-hosts'. Exact hostnames, no wildcards. */
  hosts?: string[];
  /** What it writes to disk outside the working directory. Should be empty. */
  filesystem?: 'none' | 'project-only' | 'declared-paths';
  /** Whether it reads the user's document at all. */
  readsDocument: boolean;
  /** Whether it can send the document anywhere. Must be false if network is 'none'. */
  transmitsDocument: boolean;
  /** Minimum capability the host must grant. Checked at load. */
  permissions: string[];
  homepage?: string;
}

/* ------------------------------------------------------------------ *
 * Runtime contract
 * ------------------------------------------------------------------ */

export interface PluginContext {
  /** Read-only view of the document. Plugins never mutate it. */
  readonly doc: Readonly<Record<string, unknown>>;
  readonly locale: string;
  readonly offline: boolean;
  /** Honest logging. Goes to stderr so stdout stays pipeable. */
  log: (message: string) => void;
  /** Absolute paths the plugin may write to. Empty when filesystem is 'none'. */
  readonly writablePaths: readonly string[];
  /** Fetch, or a thrower when offline. Never `globalThis.fetch` directly. */
  fetch: (url: string, init?: RequestInit) => Promise<Response>;
}

export interface RendererPlugin {
  readonly kind: 'renderer';
  /** File extension it produces, without the dot. */
  readonly extension: string;
  render(doc: PluginContext['doc'], ctx: PluginContext): Promise<string> | string;
}

export interface InputPlugin {
  readonly kind: 'input';
  /** Lowercase extensions it claims. */
  readonly extensions: readonly string[];
  read(bytes: Uint8Array, ctx: PluginContext): Promise<{ text: string; title?: string }>;
}

export type Plugin = RendererPlugin | InputPlugin;

export interface LoadedPlugin {
  manifest: PluginManifest;
  plugin: Plugin;
  /** Content hash of the plugin entry point, so an evidence record can name it. */
  digest: string;
}

/* ------------------------------------------------------------------ *
 * Validation
 * ------------------------------------------------------------------ */

export interface ManifestProblem {
  field: string;
  problem: string;
  fix: string;
}

const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

/**
 * Validates a manifest. Returns every problem, not the first one: a plugin author
 * fixing a manifest should get the whole list in one pass.
 */
export function validateManifest(m: Partial<PluginManifest>): ManifestProblem[] {
  const p: ManifestProblem[] = [];
  const add = (field: string, problem: string, fix: string): void => {
    p.push({ field, problem, fix });
  };

  if (!m.id || !/^[a-z0-9][a-z0-9._-]{2,80}$/.test(m.id)) {
    add('id', 'missing or not a lowercase identifier', 'use something like "viral-engine-renderer-notion"');
  }
  if (!m.name || m.name.trim().length < 2) add('name', 'missing', 'a short human name');
  if (!m.version || !SEMVER.test(m.version)) add('version', 'not semver', 'e.g. "1.0.0"');
  if (!m.description || m.description.length < 20) {
    add('description', 'too short to be useful', 'one sentence saying what it does and for whom');
  }
  if (/\b(?:revolutionary|game-chang\w+|best-in-class|world-class|cutting-edge|10x|guarantee\w*|viral)\b/i.test(m.description ?? '')) {
    add(
      'description',
      'contains marketing language',
      'describe the mechanism, not the outcome. "Writes the ODS report into a Notion page" is a description.',
    );
  }
  if (!m.author) add('author', 'missing', 'a name or handle, so people can ask you questions');
  if (!m.license || !/^(?:MIT|Apache-2\.0|BSD-[23]-Clause|ISC|MPL-2\.0|AGPL-3\.0|GPL-[23]\.0|CC0-1\.0|CC-BY-4\.0|Unlicense)$/.test(m.license)) {
    add('license', 'not an OSI-approved or CC identifier', 'plugins in this ecosystem must be open source, like the host');
  }
  if (!Array.isArray(m.capabilities) || m.capabilities.length === 0) {
    add('capabilities', 'none declared', `one of: ${PLUGIN_CAPABILITIES.join(', ')}`);
  } else {
    for (const c of m.capabilities) {
      if (!(PLUGIN_CAPABILITIES as readonly string[]).includes(c)) {
        add('capabilities', `unknown capability "${c}"`, `one of: ${PLUGIN_CAPABILITIES.join(', ')}`);
      }
    }
  }
  if (!m.odsVersions || !/^[~^>=<\d]/.test(m.odsVersions)) {
    add('odsVersions', 'not a version range', 'e.g. "^1.0.0"');
  }
  if (m.network !== 'none' && m.network !== 'declared-hosts') {
    add('network', 'not declared', '"none" or "declared-hosts"');
  }
  if (m.network === 'declared-hosts') {
    if (!m.hosts?.length) {
      add('hosts', 'required when network is declared-hosts', 'list exact hostnames');
    } else {
      for (const h of m.hosts) {
        if (/[*]/.test(h)) {
          add('hosts', `wildcard host "${h}"`, 'list exact hostnames; a wildcard cannot be audited');
        }
        if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(h)) {
          add('hosts', `"${h}" is not a hostname`, 'e.g. "api.notion.com"');
        }
        if (/^(?:localhost|127\.|0\.0\.0\.0|10\.|192\.168\.|172\.(?:1[6-9]|2\d|3[01])\.)/.test(h)) {
          add('hosts', `"${h}" is a private or loopback address`, 'a public plugin must not need your LAN');
        }
      }
    }
  }
  if (m.transmitsDocument && m.network === 'none') {
    add('transmitsDocument', 'true while network is "none"', 'these two declarations contradict each other; fix one');
  }
  if (m.transmitsDocument && !m.permissions?.includes('document:transmit')) {
    add('permissions', 'missing document:transmit', 'declare the permission you actually need, or stop transmitting');
  }
  if (typeof m.readsDocument !== 'boolean') add('readsDocument', 'not declared', 'true or false');
  if (typeof m.transmitsDocument !== 'boolean') add('transmitsDocument', 'not declared', 'true or false');
  if (!Array.isArray(m.permissions)) add('permissions', 'not an array', 'use [] if you need nothing');

  return p;
}

/* ------------------------------------------------------------------ *
 * Sealing
 * ------------------------------------------------------------------ */

/**
 * A manifest or export that tries to touch a sealed surface.
 *
 * The check is deliberately blunt: it looks at the plugin's own export keys and at
 * the manifest's extra fields. It is not a sandbox — a determined plugin runs
 * arbitrary code anyway, because plugins are code. What it does is make the
 * intent explicit and auditable, so a malicious plugin cannot claim it was only
 * "extending".
 */
export function findSealedAttempts(input: {
  /** A manifest, plus any extra fields a plugin author may have smuggled in. */
  manifest: Partial<PluginManifest> | (Partial<PluginManifest> & Record<string, unknown>);
  exports?: Record<string, unknown>;
}): string[] {
  const found: string[] = [];

  for (const key of Object.keys(input.manifest)) {
    const normalised = key.replace(/[A-Z]/g, (c) => `.${c.toLowerCase()}`).replace(/^\./, '');
    for (const sealed of SEALED) {
      const tail = sealed.split('.').pop()!;
      if (normalised.includes(tail) || key.toLowerCase().includes(tail)) {
        found.push(`manifest field "${key}" overlaps sealed surface "${sealed}"`);
      }
    }
  }

  for (const key of Object.keys(input.exports ?? {})) {
    if (/^(?:aqi|weights?|dimensións?|dimensions?|bands?|rubric|scores?Weights?)$/i.test(key)) {
      found.push(`export "${key}" would let the plugin redefine the rubric`);
    }
  }

  return found;
}

/* ------------------------------------------------------------------ *
 * Loading
 * ------------------------------------------------------------------ */

export class PluginRejected extends Error {
  constructor(
    readonly id: string,
    readonly problems: ManifestProblem[],
    readonly sealed: string[],
  ) {
    super(
      `plugin "${id}" rejected:\n` +
        problems.map((p) => `  ${p.field}: ${p.problem}. ${p.fix}`).join('\n') +
        (sealed.length ? `\n  sealed: ${sealed.join('; ')}` : ''),
    );
    this.name = 'PluginRejected';
  }
}

export function loadPlugin(manifest: PluginManifest, plugin: Plugin, entrySource?: string): LoadedPlugin {
  const problems = validateManifest(manifest);
  const sealed = findSealedAttempts({
    manifest: manifest as unknown as Record<string, unknown>,
    exports: plugin as unknown as Record<string, unknown>,
  });

  if (problems.length || sealed.length) throw new PluginRejected(manifest.id ?? '(unnamed)', problems, sealed);

  if (manifest.capabilities.includes('renderer') && plugin.kind !== 'renderer') {
    throw new PluginRejected(manifest.id, [{ field: 'capabilities', problem: 'declares renderer but the export is not one', fix: 'export a RendererPlugin' }], []);
  }
  if (manifest.capabilities.includes('input') && plugin.kind !== 'input') {
    throw new PluginRejected(manifest.id, [{ field: 'capabilities', problem: 'declares input but the export is not one', fix: 'export an InputPlugin' }], []);
  }

  return {
    manifest,
    plugin,
    digest: createHash('sha256').update(entrySource ?? JSON.stringify(manifest)).digest('hex').slice(0, 16),
  };
}

/**
 * Wraps a plugin's context so the declared permissions are actually enforced.
 * A plugin that declares `network: "none"` gets a fetch that throws, rather than a
 * promise in a README.
 */
export function makeContext(
  plugin: LoadedPlugin,
  base: { doc: Record<string, unknown>; locale: string; offline: boolean; writablePaths: readonly string[] },
): PluginContext {
  return {
    doc: Object.freeze({ ...base.doc }),
    locale: base.locale,
    offline: base.offline,
    writablePaths: plugin.manifest.filesystem === 'none' ? [] : base.writablePaths,
    log: (message) => process.stderr.write(`[${plugin.manifest.id}] ${message}\n`),
    fetch: async (url, init) => {
      if (plugin.manifest.network === 'none') {
        throw new Error(
          `plugin "${plugin.manifest.id}" declared network: "none" and then called fetch(${url}). Those plugins must work offline.`,
        );
      }
      const host = new URL(url).hostname;
      if (!(plugin.manifest.hosts ?? []).includes(host)) {
        throw new Error(
          `plugin "${plugin.manifest.id}" called ${host}, which is not in its declared hosts (${(plugin.manifest.hosts ?? []).join(', ') || 'none'}).`,
        );
      }
      if (base.offline) throw new Error(`offline mode: plugin "${plugin.manifest.id}" may not make network calls`);
      return fetch(url, init);
    },
  };
}
