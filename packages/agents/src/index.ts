/**
 * The agent swarm.
 *
 * Fifteen agents, each a pure function, each independently testable, each able to
 * refuse. The orchestrator in `packages/core/src/analyze/` composes them; nothing
 * here imports the orchestrator, so there are no cycles and any agent can be run
 * alone from a script or a plugin.
 */
export * from './types.js';

export { categoryCartographer } from './category-cartographer.js';
export type { CategoryMap } from './category-cartographer.js';

export { saturationRadar } from './saturation-radar.js';
export type { RadarResult } from './saturation-radar.js';

export { broadcasterEthicist } from './broadcaster-ethicist.js';
export type { BroadcasterBriefOutput, BroadcasterCandidate } from './broadcaster-ethicist.js';

export { frictionSurgeon, buildOneLiner } from './friction-surgeon.js';
export type { FrictionReport, FrictionItem } from './friction-surgeon.js';

export { honestyFirewall, selfAudit, RULE_LABELS } from './honesty-firewall.js';
export type { HonestyVerdict, Rewrite } from './honesty-firewall.js';

export { assetAlchemist } from './asset-alchemist.js';
export type { AssetKit } from './asset-alchemist.js';

export { experimentWeaver } from './experiment-weaver.js';
export type { ExperimentPlan, Test } from './experiment-weaver.js';

export { criticSimulator, antifragile } from './critic-simulator.js';
export type { SimulationOutput, CriticVoice } from './critic-simulator.js';

export { postmortemArchaeologist, evidenceLibrarian } from './postmortem.js';
export type { PostmortemInput, PostmortemOutput, EvidenceRecord, EvidenceLabel } from './postmortem.js';

export { translationDiplomat } from './translation-diplomat.js';
export type { TranslationReport, TranslationRisk } from './translation-diplomat.js';

export {
  accessibilityGuardian,
  privacySentinel,
  abuseSentinel,
} from './sentinels.js';
export type { AccessibilityReport, PrivacyReport, AbuseReport } from './sentinels.js';

export { timeMachine } from './time-machine.js';
export type { TimeMachineOutput, EraReaction } from './time-machine.js';

/** Registry used by docs generation, the plugin loader, and the eval harness. */
export const AGENT_REGISTRY = [
  { id: 'category-cartographer', layer: 'analysis', purpose: 'Detects the real category and proposes a less crowded adjacent one with its credibility risk.' },
  { id: 'saturation-radar', layer: 'analysis', purpose: 'Measures crowding when it can, returns unknown when it cannot.' },
  { id: 'broadcaster-ethicist', layer: 'distribution', purpose: 'Names a role to approach, caps outreach at three, refuses spray-and-pray.' },
  { id: 'friction-surgeon', layer: 'distribution', purpose: 'Finds why forwarding is expensive and produces the one-liner that removes it.' },
  { id: 'honesty-firewall', layer: 'ethics', purpose: 'Detects unbacked claims and rewrites them into checkable ones. Audits our own output.' },
  { id: 'asset-alchemist', layer: 'distribution', purpose: 'Generates channel-appropriate assets with alt text and a placeholder inventory.' },
  { id: 'experiment-weaver', layer: 'learning', purpose: 'Designs tests that change a decision, with pre-registered kill criteria.' },
  { id: 'critic-simulator', layer: 'learning', purpose: 'Plays seven critics from the artifact\'s own detected weaknesses.' },
  { id: 'antifragile', layer: 'learning', purpose: 'Generates the strongest attack on the artifact and what survives it.' },
  { id: 'postmortem-archaeologist', layer: 'learning', purpose: 'Turns a failed attempt into one falsifiable lesson, without blame.' },
  { id: 'evidence-librarian', layer: 'learning', purpose: 'Labels records by evidence quality so anecdotes never become statistics.' },
  { id: 'translation-diplomat', layer: 'access', purpose: 'Flags sentences that break in translation. Does not translate.' },
  { id: 'accessibility-guardian', layer: 'access', purpose: 'Readability, alt text, structure, screen-reader notes, and what was untested.' },
  { id: 'privacy-sentinel', layer: 'ethics', purpose: 'Reports its own network behaviour and warns about credentials and personal data.' },
  { id: 'abuse-sentinel', layer: 'ethics', purpose: 'Refuses spam, astroturfing, harassment, scraping, and deception at the type level.' },
  { id: 'time-machine', layer: 'learning', purpose: 'Replays the framing across five eras to strip period decoration. Fully speculative.' },
] as const;
