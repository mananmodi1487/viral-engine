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
  resolveProvider,
  ALL_PROVIDERS,
  AUTO_ORDER,
  completeWithRetry,
  buildDiagnosisPrompt,
} from './providers/index.js';
export type { Provider, ProviderName, ProviderRequest, ProviderResult } from './providers/index.js';
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
