/**
 * ODS migration.
 *
 * The important decision here: **a score cannot be migrated.**
 *
 * A 1.x scorecard was produced by a 20-dimension rubric. A 2.0 scorecard is
 * produced by a 25-dimension rubric. No arithmetic converts one into the other,
 * because four of the new dimensions (and the reweighted `category_clarity`) depend
 * on the *artifact*, not on the old numbers. Scaling 20 dimensions into 25 would
 * produce a plausible-looking number with no provenance, which is exactly the class
 * of fabricated statistic the honesty policy forbids.
 *
 * So the migration does two honest things and refuses the tempting third:
 *
 *  1. It structurally upgrades the document — field names, `ods_version`,
 *     `aqi_version` on the scorecard, and any newly required envelope fields — and
 *     preserves the original byte-for-byte under `x_migrated_from`.
 *  2. It marks the migrated scorecard as **`status: "historical"`** with a
 *     `rescore_required` note naming the exact command to regenerate it.
 *  3. It refuses to compute a 2.0 total. A historical scorecard keeps its old
 *     total, its old weights, and cannot be compared with a 2.0 score.
 *
 * The consequence is that a migrated document is deliberately *less* useful than a
 * freshly generated one. That is the correct incentive: run the analysis again.
 */
import type { ArtifactType } from '../ingest/artifact-types.js';

export const CURRENT_ODS_VERSION = '2.0.0';
export const CURRENT_AQI_VERSION = '2.0.0';

export interface MigrationResult {
  /** The upgraded document, ready to serialise. */
  document: Record<string, unknown>;
  /** Every change made, in order, so the user can audit it. */
  changes: string[];
  /** Things the migration cannot do, and the command that can. */
  cannot: string[];
  /** True when the input needed no work. */
  noop: boolean;
  fromVersion: string;
}

const V2_ENVELOPE_REQUIRED = ['ods_version', 'artifact', 'current_positioning', 'scorecard'];

/**
 * Per-version repair tables. Only two versions have ever shipped, so this is a
 * switch rather than a framework; a framework for two cases is a way of not
 * documenting either.
 */
export function migrateDocument(raw: unknown): MigrationResult {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('migrate needs a JSON object, and this is not one');
  }
  const src = raw as Record<string, unknown>;
  const changes: string[] = [];
  const cannot: string[] = [];

  const declared = String(src.ods_version ?? src.schemaVersion ?? '0.0.0');
  const doc: Record<string, unknown> = JSON.parse(JSON.stringify(src));

  /* ---------- pre-ODS v1 reports ---------- */

  if (!src.ods_version && src.schemaVersion) {
    changes.push(`renamed schemaVersion "${declared}" to ods_version, and marked it a pre-ODS report`);
    cannot.push(
      'A pre-ODS report contains a seven-lever scorecard. Seven levers cannot be expanded into 25 dimensions without re-reading the artifact. Re-run: viral-engine analyze <original target>',
    );
    return {
      document: {
        ods_version: CURRENT_ODS_VERSION,
        migrated_at: new Date().toISOString(),
        migration_status: 'incomplete',
        x_migrated_from: src,
        artifact: src.source ?? { id: 'unknown', name: 'unknown', type: 'document' },
        scorecard: {
          aqi_version: CURRENT_AQI_VERSION,
          status: 'absent',
          max: 1000,
          total: 0,
          dimensions: [],
          note: 'The original report predates the AQI. No score was invented to fill this in.',
        },
        note: 'Structural migration only. Nothing was re-scored and nothing was deleted.',
      },
      changes,
      cannot,
      noop: false,
      fromVersion: declared,
    };
  }

  /* ---------- 1.x → 2.0 ---------- */

  if (/^1\./.test(declared)) {
    changes.push(`set ods_version to ${CURRENT_ODS_VERSION}`);

    const card = (doc.scorecard ?? {}) as Record<string, unknown>;
    const dims = Array.isArray(card.dimensions) ? (card.dimensions as Array<Record<string, unknown>>) : [];

    if (dims.length > 0) {
      changes.push(
        `kept the original ${dims.length} dimension rows unchanged, including their 1.x weights — rewriting a weight would make the old total wrong as well as incomparable`,
      );
    }

    doc.scorecard = {
      ...card,
      aqi_version: card.aqi_version ?? '1.0.0',
      status: 'historical',
      rescore_required: true,
      rescore_command: 'viral-engine analyze <original target> --format json',
      rescore_reason:
        'This score was produced by the 1.x rubric. Four dimensions were added and one was reweighted in 2.0.0. The old total is preserved as a historical record and must not be compared with, averaged with, or shown alongside a 2.0.0 score.',
    };
    changes.push('marked the scorecard status "historical" and set rescore_required');

    cannot.push(
      'It cannot convert a 1.x score into a 2.0 score. A converted number would have no provenance; the honest output is the old number, clearly labelled, next to a command that produces a real one.',
    );
  } else if (declared === CURRENT_ODS_VERSION) {
    return { document: doc, changes: [], cannot: [], noop: true, fromVersion: declared };
  } else if (!/^1\./.test(declared) && declared !== '0.0.0') {
    throw new Error(
      `unrecognised ods_version "${declared}". This migration knows 1.x and ${CURRENT_ODS_VERSION} only; guessing at an unknown version is how data gets corrupted.`,
    );
  }

  /* ---------- envelope repair, for anything that is now a 2.0 document ---------- */

  doc.ods_version = CURRENT_ODS_VERSION;
  for (const key of V2_ENVELOPE_REQUIRED) {
    if (!(key in doc)) {
      doc[key] = key === 'scorecard'
        ? { aqi_version: CURRENT_AQI_VERSION, status: 'absent', max: 1000, total: 0, dimensions: [] }
        : {};
      changes.push(`added the required envelope field "${key}", empty rather than invented`);
    }
  }

  const artifact = (doc.artifact ?? {}) as Record<string, unknown>;
  if (!artifact.type) {
    artifact.type = 'document' satisfies ArtifactType;
    changes.push('defaulted artifact.type to "document"; a wrong specific type would apply the wrong rubric');
  }
  if (!artifact.language) {
    artifact.language = 'en';
    changes.push('defaulted artifact.language to "en"');
  }
  doc.artifact = artifact;

  if (!('x_migrated_from' in doc)) {
    doc.x_migrated_from = src;
    changes.push('preserved the original document in full under x_migrated_from');
  }
  doc.migrated_at = new Date().toISOString();
  doc.migration_note =
    'Structural migration only. No dimension was scored, rescaled, or invented. A historical scorecard is a record, not a comparable score.';

  return { document: doc, changes, cannot, noop: false, fromVersion: declared };
}
