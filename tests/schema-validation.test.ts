/**
 * The generated document, validated against the published schema — recursively.
 *
 * Why this file exists: the conformance test only checked that every *required
 * top-level* field was present. It never checked `additionalProperties: false`, so
 * the generator emitted two fields the schema forbade (`experiments.kill_criteria_detail`
 * and the top-level `x_agents`) and the published example would have been rejected by
 * any real JSON-Schema validator. The tool's own output failed the tool's own spec,
 * and 227 tests passed.
 *
 * No dependency is added for this. The subset of JSON Schema the ODS uses is small —
 * type, required, properties, additionalProperties, items, enum, patternProperties —
 * and a validator that implements exactly that subset is auditable in one screen. A
 * full validator would be another package in a project whose entire privacy claim
 * rests on "you can read what it does".
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { analyzeOds } from '../packages/core/src/analyze/ods.js';
import { ingest } from '../packages/core/src/ingest/index.js';

const schema = JSON.parse(readFileSync('packages/protocol/ods.schema.json', 'utf8')) as SchemaNode;

interface SchemaNode {
  title?: string;
  type?: string | string[];
  required?: string[];
  properties?: Record<string, SchemaNode>;
  additionalProperties?: boolean | SchemaNode;
  patternProperties?: Record<string, SchemaNode>;
  items?: SchemaNode;
  enum?: unknown[];
  const?: unknown;
  minimum?: number;
  maximum?: number;
  minItems?: number;
}

function validate(node: unknown, s: SchemaNode, path: string, problems: string[]): void {
  const types = Array.isArray(s.type) ? s.type : s.type ? [s.type] : [];
  if (node === null) {
    // Null is "the implementation could not determine this", which the schema
    // declares explicitly so that absent and unknown are not the same value.
    if (!types.includes('null')) problems.push(`${path}: null is not allowed here (types: ${types.join('|') || 'any'})`);
    return;
  }
  if (s.const !== undefined && node !== s.const) {
    problems.push(`${path}: expected const ${JSON.stringify(s.const)}, got ${JSON.stringify(node)}`);
    return;
  }
  if (s.enum && !s.enum.includes(node)) {
    problems.push(`${path}: ${JSON.stringify(node)} is not one of the allowed values`);
    return;
  }
  if (types.includes('object')) {
    if (typeof node !== 'object' || Array.isArray(node)) {
      problems.push(`${path}: expected an object`);
      return;
    }
    const obj = node as Record<string, unknown>;
    for (const key of s.required ?? []) {
      if (!(key in obj)) problems.push(`${path}.${key}: required but missing`);
    }
    const declared = s.properties ?? {};
    const patterns = Object.entries(s.patternProperties ?? {});
    for (const [key, value] of Object.entries(obj)) {
      if (key in declared) {
        validate(value, declared[key], `${path}.${key}`, problems);
        continue;
      }
      const pat = patterns.find(([re]) => new RegExp(re).test(key));
      if (pat) {
        validate(value, pat[1], `${path}.${key}`, problems);
        continue;
      }
      if (s.additionalProperties === false) {
        problems.push(`${path}.${key}: not allowed (additionalProperties is false and no pattern matches)`);
      } else if (typeof s.additionalProperties === 'object') {
        validate(value, s.additionalProperties, `${path}.${key}`, problems);
      }
    }
    return;
  }
  if (types.includes('array')) {
    if (!Array.isArray(node)) {
      problems.push(`${path}: expected an array`);
      return;
    }
    if (s.minItems !== undefined && node.length < s.minItems) {
      problems.push(`${path}: needs at least ${s.minItems} item(s), has ${node.length}`);
    }
    if (s.items) node.forEach((v, i) => validate(v, s.items!, `${path}[${i}]`, problems));
    return;
  }
  if (types.includes('string') && !types.includes('null') && typeof node !== 'string') problems.push(`${path}: expected a string`);
  if ((types.includes('number') || types.includes('integer')) && typeof node !== 'number') {
    if (typeof node !== 'number') problems.push(`${path}: expected a number`);
    else {
      if (s.minimum !== undefined && node < s.minimum) problems.push(`${path}: ${node} is below the minimum ${s.minimum}`);
      if (s.maximum !== undefined && node > s.maximum) problems.push(`${path}: ${node} is above the maximum ${s.maximum}`);
    }
  }
  if (types.includes('boolean') && typeof node !== 'boolean') problems.push(`${path}: expected a boolean`);
}

const check = (doc: unknown): string[] => {
  const problems: string[] = [];
  validate(doc, schema, '$', problems);
  return problems;
};

describe('the ODS schema validates what this tool actually produces', () => {
  it('accepts the published example', () => {
    const doc = JSON.parse(readFileSync('protocol/examples/ods-example.json', 'utf8'));
    expect(check(doc)).toEqual([]);
  });

  it('accepts a freshly generated document, including every optional section', async () => {
    const ing = await ingest('', {
      offline: true,
      text: `# A tool for founders who have shipped something nobody noticed

This is not a marketing course. It is a linter for the sentence you were about to publish.

> It is a checklist with arithmetic, and it says so.

Install with \`npm i -g viral-engine\` and run \`viral-engine analyze ./README.md\`.

This fails if a reader cannot name the person they would send it to.
`,
    });
    const doc = await analyzeOds(ing.source, { offline: true, networkCalls: 0 });
    expect(check(doc)).toEqual([]);
  });

  it('rejects an unknown top-level field, so extensions must be namespaced', () => {
    const doc = JSON.parse(readFileSync('protocol/examples/ods-example.json', 'utf8')) as Record<string, unknown>;
    const problems = check({ ...doc, surprise: true });
    expect(problems.join(' ')).toContain('not allowed');
  });

  it('allows a namespaced x_ extension, per schema-versioning rule 1', () => {
    const doc = JSON.parse(readFileSync('protocol/examples/ods-example.json', 'utf8')) as Record<string, unknown>;
    expect(check({ ...doc, x_my_tool: { anything: [1, 2, 3] } })).toEqual([]);
  });

  it('does not allow an extension that is not namespaced', () => {
    const doc = JSON.parse(readFileSync('protocol/examples/ods-example.json', 'utf8')) as Record<string, unknown>;
    expect(check({ ...doc, my_tool: {} }).join(' ')).toContain('not allowed');
  });

  it('rejects a scorecard missing its rubric version', () => {
    const doc = JSON.parse(readFileSync('protocol/examples/ods-example.json', 'utf8')) as Record<string, unknown>;
    const card = { ...(doc.scorecard as Record<string, unknown>) };
    delete card.aqi_version;
    expect(check({ ...doc, scorecard: card }).join(' ')).toContain('aqi_version');
  });

  it('rejects a dimension with no failure condition', () => {
    const doc = JSON.parse(readFileSync('protocol/examples/ods-example.json', 'utf8')) as Record<string, unknown>;
    const card = doc.scorecard as { dimensions: Array<Record<string, unknown>> };
    const dims = card.dimensions.map((d, i) => {
      if (i !== 0) return d;
      const copy = { ...d };
      delete copy.failure_condition;
      return copy;
    });
    expect(check({ ...doc, scorecard: { ...card, dimensions: dims } }).join(' ')).toContain('failure_condition');
  });

  it('declares a title that matches the version it enforces', () => {
    // The title said "1.0.0" for as long as the document declared ods_version 2.0.0.
    expect(schema.title).toContain('2.0.0');
  });
});
