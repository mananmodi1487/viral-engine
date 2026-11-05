/**
 * Data the pages render, imported from the packages rather than duplicated, so a
 * weight cannot drift between the docs and the engine.
 */
export { AQI_DIMENSIONS, AQI_MAX, AQI_VERSION, AQI_BANDS } from '../../../packages/protocol/src/aqi.js';
export { SUPPORTED_INPUTS } from '../../../packages/core/src/ingest/index.js';
export { AGENT_REGISTRY } from '../../../packages/agents/src/index.js';

export const AGENT_REGISTRY_FOR_DOCS = [
  { id: 'category-cartographer', purpose: 'Detects the real category and proposes a less crowded adjacent one with its credibility risk.' },
  { id: 'saturation-radar', purpose: 'Measures crowding when it can, returns unknown when it cannot.' },
  { id: 'broadcaster-ethicist', purpose: 'Names a role to approach, caps outreach at three, refuses spray-and-pray.' },
  { id: 'friction-surgeon', purpose: 'Finds why forwarding is expensive and produces the one-liner that removes it.' },
  { id: 'honesty-firewall', purpose: 'Detects unbacked claims and rewrites them into checkable ones. Audits our own output.' },
  { id: 'asset-alchemist', purpose: 'Generates channel-appropriate assets with alt text and a placeholder inventory.' },
  { id: 'experiment-weaver', purpose: 'Designs tests that change a decision, with pre-registered kill criteria.' },
  { id: 'critic-simulator', purpose: 'Plays seven critics from the artifact\'s own detected weaknesses.' },
  { id: 'antifragile', purpose: 'Generates the strongest attack on the artifact and what survives it.' },
  { id: 'postmortem-archaeologist', purpose: 'Turns a failed attempt into one falsifiable lesson, without blame.' },
  { id: 'evidence-librarian', purpose: 'Labels records by evidence quality so anecdotes never become statistics.' },
  { id: 'translation-diplomat', purpose: 'Flags sentences that break in translation. Does not translate.' },
  { id: 'accessibility-guardian', purpose: 'Readability, alt text, structure, screen-reader notes, and what was untested.' },
  { id: 'privacy-sentinel', purpose: 'Reports its own network behaviour and warns about credentials and personal data.' },
  { id: 'abuse-sentinel', purpose: 'Refuses spam, astroturfing, harassment, scraping, and deception at the type level.' },
  { id: 'time-machine', purpose: 'Replays the framing across five eras to strip period decoration. Fully speculative.' },
];
