/**
 * @viral-engine/core — the deterministic engine.
 *
 * Public surface. Anything not exported here is internal and may change without
 * a major version bump; anything exported here is covered by tests and is part of
 * the contract other tools build on.
 */

/* ---- v1 engine, preserved: deterministic signals and the 7-lever scorecard ---- */
export { analyze, VERSION } from './analyze.js';
export type { AnalyzeOptions } from './analyze.js';
export * from './schemas.js';
export { extractSignals } from './signals.js';
export type { Signals } from './signals.js';
export { scoreDocument, summariseScorecard } from './score.js';
export { checkInbound, checkOutbound, hasBlockers, REPLACEMENT_RULES } from './honesty.js';
export { loadSource, fetchTopicSaturation, parseGitHubRef, htmlToText } from './load.js';
export type { LoadOptions } from './load.js';
export {
  detectCrowdedCategory,
  adjacentCategories,
  proposePositioning,
  bandFromRepoCount,
  unknownSaturation,
  CROWDED_CATEGORIES,
} from './categories.js';
export { chooseBroadcasters } from './broadcasters.js';
export { generateAssets, buildPasteReady } from './assets.js';
export { toMarkdown } from './report/markdown.js';
export { toHtml } from './report/html.js';
export { toTerminal, toCiSummary } from './report/terminal.js';

/* ---- v2: ODS orchestration ---- */
export { analyzeOds, ODS_VERSION, GENERATOR_VERSION, artifactTypeFrom } from './analyze/ods.js';
export type { OdsDocument, OdsOptions, FailureCondition } from './analyze/ods.js';

/* ---- v2: input engine ---- */
export {
  ingest,
  classifyInput,
  extractText,
  htmlToReadable,
  extractPdf,
  extractDocx,
  SUPPORTED_INPUTS,
} from './ingest/index.js';
export type { IngestOptions, IngestResult, ClassifiedInput, InputKind, ExtractResult } from './ingest/index.js';

/* ---- v2: AQI ---- */
export { scoreAqi } from './score/aqi.js';
export type { AqiInputs } from './score/aqi.js';

/* ---- v2: renderers ---- */
export { odsToMarkdown } from './report/ods-markdown.js';
export { odsToTerminal, odsToCiSummary } from './report/ods-terminal.js';
export { odsToHtml, odsSvgAssets } from './report/ods-html.js';
export type { SvgAsset } from './report/ods-html.js';

/* ---- v2: AQI rubric, re-exported so consumers need one dependency ---- */
export {
  AQI_DIMENSIONS,
  AQI_VERSION,
  AQI_MAX,
  computeAqi,
  bandFor,
  weakestDimension,
  topLostPoints,
  assertWeightsSumToMax,
  AQI_BANDS,
  AQI_DISCLAIMER,
} from '../../protocol/src/aqi.js';
export type { AqiResult, AqiDimension, AqiKey } from '../../protocol/src/aqi.js';

/* ---- v2: providers (moved to packages/providers, re-exported for compatibility) ---- */
export {
  resolveProvider,
  buildProvider,
  completeWithRetry,
  buildDiagnosisPrompt,
  auditProse,
  ALL_PROVIDERS,
  LOCAL_PROVIDERS,
  PROVIDER_CAPABILITIES,
} from '../../providers/src/index.js';
export type {
  Provider,
  ProviderName,
  ProviderRequest,
  ProviderResult,
  ProviderCapability,
  Resolution,
} from '../../providers/src/index.js';

/* ---- v3: share payloads, artifact types, modes, and the stress test ---- */
export { buildSharePayloads, failureCard, fromAqi } from './share/payloads.js';
export type { ShareInput, SharePayloads } from './share/payloads.js';
export {
  ARTIFACT_TYPES,
  artifactTypeSpec,
  guessArtifactType,
} from './ingest/artifact-types.js';
export type { ArtifactType, ArtifactTypeSpec } from './ingest/artifact-types.js';
export { roast, therapist, killYourDarling, explainLikeImFive } from './modes/index.js';
export type { ModeInput, ModeOutput } from './modes/index.js';
export { stressTest } from './research/stress-test.js';
export type { StressTest, Hypothesis, FailureMode, IndicatorGroup, KillCriterion } from './research/stress-test.js';

/* ---- v3: migration ---- */
export { migrateDocument, CURRENT_ODS_VERSION as MIGRATION_TARGET_ODS, CURRENT_AQI_VERSION as MIGRATION_TARGET_AQI } from './migrate/index.js';
export type { MigrationResult } from './migrate/index.js';
