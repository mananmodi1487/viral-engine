/**
 * Share payloads: the artifacts that make forwarding cheap.
 *
 * The single most useful thing this produces is not a report. It is one string a
 * reader can paste into a message with no editing. Everything here exists to
 * produce that string, and to make sure it cannot be a lie.
 *
 * Design rules, each of which costs something:
 *
 *  1. **Every payload is generated from the analysis, not from a template with the
 *     artifact name dropped in.** A generic card is worse than none, because it
 *     adds volume without information.
 *
 *  2. **Every payload carries its numbers, a failure condition, and the fact that
 *     it is a rubric.** A badge that only shows "847/1000" is a credential; a badge
 *     that shows the band and the biggest weakness is a diagnosis.
 *
 *  3. **Every payload is text or SVG, generated locally, no image service.** A
 *     screenshot factory that phones a rendering API would leak the document it is
 *     describing, which is the one thing this tool promises not to do.
 */
import type { AqiResult, AqiDimension } from '../../../protocol/src/aqi.js';
import { AQI_DISCLAIMER, AQI_MAX } from '../../../protocol/src/aqi.js';

export interface ShareInput {
  artifactName: string;
  total: number;
  band: string;
  /** The rubric version, so the number can be compared with someone else's. */
  aqiVersion: string;
  dimensions: AqiDimension[];
  /** The one-line forward, if the friction analysis produced one. */
  forwardable: string | null;
  /** The most points recoverable. Reported instead of the weakest, usually. */
  topLeverage: AqiDimension[];
  /** A real failure condition. Never invented here; passed in from the document. */
  failureCondition: { statement: string; observable: string; horizon: string } | null;
  /** Where a reader can reproduce the result. */
  reportUrl?: string;
  /** ISO date, so a quoted number is always datable. */
  asOf: string;
}

export interface SharePayloads {
  /** The one string a reader can paste. The most valuable output of the tool. */
  forwardableLine: string;
  /**
   * True when the artifact contained no usable paste-ready sentence, so the line
   * above was generated from the score. A generated line describes the diagnosis,
   * not the product, which makes it the weaker of the two.
   */
  forwardableWasGenerated: boolean;
  /** An X/Twitter-length post, with the number and the weakness. */
  socialPost: string;
  /** A three-post thread: what it is, what it found, what it does not prove. */
  thread: string[];
  /** Markdown badge for a README. Text, so it works everywhere. */
  badgeMarkdown: string;
  /** Shields.io-style endpoint values, for a badge that updates. */
  badgeJson: { schemaVersion: 1; label: string; message: string; color: string };
  /** The OG/social card as SVG. No external service, no font fetch. */
  cardSvg: string;
  /** Alt text for the card. Mandatory: a share image with no alt text excludes readers. */
  cardAlt: string;
  /** A short paragraph for a newsletter or a chat message. */
  blurb: string;
  /** What this payload must not be read as. Ships with every card. */
  whatThisDoesNotProve: string[];
}

const esc = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const trim = (s: string, n: number): string => (s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`);

const bandColour = (band: string): string => {
  switch (band) {
    case 'Exceptional':
      return '#3fb950';
    case 'Strong':
      return '#56d364';
    case 'Workable':
      return '#d29922';
    case 'Fragile':
      return '#db6d28';
    default:
      return '#f85149';
  }
};

/**
 * Turns a dimension key into something a stranger can read without the rubric.
 * "broadcast_stake" means nothing at a glance; "does anyone gain by sharing it"
 * means something.
 */
const humanWeakness = (d: AqiDimension): string => {
  const map: Record<string, string> = {
    category_clarity: 'a stranger cannot say what it is',
    category_opportunity: 'the category is crowded',
    audience_specificity: 'the audience is everyone',
    broadcaster_fit: 'no specific person to carry it',
    broadcast_stake: 'sharing it gains the sharer nothing',
    share_friction_reduction: 'forwarding it is expensive',
    emotional_truth: 'no stake the reader feels',
    proof_readiness: 'the claims cannot be checked',
    launch_timing: 'not ready to be seen',
    honesty_integrity: 'a claim will not survive checking',
    failure_awareness: 'nothing states what failure looks like',
    experimentability: 'nothing can be tested cheaply',
    accessibility: 'parts of it exclude readers',
    privacy_safety: 'the privacy posture is unclear',
    abuse_resistance: 'it could be repurposed as a spam tool',
    cultural_resonance: 'the references do not travel',
    language_simplicity: 'it is harder to read than it needs to be',
    asset_completeness: 'there is nothing to forward',
    post_launch_learnability: 'no plan to learn from the result',
    ethical_defensibility: 'the method would not survive disclosure',
    visual_shareability: 'nothing in it survives being screenshotted',
    first_value_speed: 'the reader waits too long for the point',
    technical_credibility: 'a practitioner would not trust it',
    community_extensibility: 'nobody else can build on it',
    long_term_maintainability: 'it will break and nobody will fix it',
  };
  return map[d.key] ?? d.label.toLowerCase();
};

export function buildSharePayloads(input: ShareInput): SharePayloads {
  const leverage = input.topLeverage[0] ?? input.dimensions[0];
  const weakness = humanWeakness(leverage);
  const colour = bandColour(input.band);
  const pointsAvailable = leverage ? Math.round(((100 - leverage.score) * leverage.weight) / 100) : 0;

  /*
   * A sentence containing a placeholder is not paste-ready, and a "forwardable
   * unit" that the forwarder still has to write is the friction it was meant to
   * remove. The friction agent emits bracketed templates when it cannot find a
   * real one-liner in the artifact; this catches that case rather than shipping
   * "For [name the person who needs this most]" to a share card.
   */
  const PLACEHOLDER = /\[[^\]\n]{2,80}\]|<[a-z][a-z /_-]{2,40}>/i;
  const declared = input.forwardable?.trim() ?? '';
  const usable = declared !== '' && !PLACEHOLDER.test(declared) ? declared : null;
  const forwardableLine =
    usable ??
    `${input.artifactName} scores ${input.total}/${AQI_MAX} on the Attempt Quality Index. The biggest gap: ${weakness}.`;

  const socialPost = trim(
    `${input.total}/${AQI_MAX} on the Attempt Quality Index — band: ${input.band}.\n\n` +
      `Biggest gap: ${weakness} (${pointsAvailable} points recoverable).\n\n` +
      `Not a virality score. A rubric for the attempt, and it says so in the schema.`,
    280,
  );

  const thread = [
    `I ran ${input.artifactName} through Viral Engine Commons. It scores the quality of the launch attempt out of ${AQI_MAX}, and it will tell you not to launch.\n\nResult: ${input.total} (${input.band}).`,
    `The useful part is not the number. It is the ranking: "weakest" is the lowest score, "highest leverage" is where the most points are recoverable, and they are frequently different things. Here they point at: ${weakness}.`,
    `What the number does not mean: that this will spread. The index measures legibility and honesty of an attempt. There is no market data in it at all, and no implementation of it can predict attention.`,
    `The protocol is public domain (CC0), and the rubric is a JSON file every implementation loads at runtime. If you disagree with a weight, fork it — and the fork is honest about being a fork.`,
  ];

  const badgeMarkdown = input.reportUrl
    ? `[![Attempt Quality Index ${input.total}/${AQI_MAX} — ${input.band} — a rubric, not a prediction](${input.reportUrl.replace(/\/$/, '')}/badge/score.svg)](${input.reportUrl})`
    : `**Attempt Quality Index ${input.total}/${AQI_MAX} (${input.band})** — a rubric, not a prediction.`;

  const badgeJson = {
    schemaVersion: 1 as const,
    label: 'attempt quality',
    message: `${input.total}/${AQI_MAX} · ${input.band}`,
    color: colour.replace('#', ''),
  };

  const failureBlock = input.failureCondition
    ? `<text x="60" y="436" class="s" fill="#8b949e">This fails if: ${esc(trim(input.failureCondition.statement, 96))}</text>`
    : `<text x="60" y="436" class="s" fill="#8b949e">No failure condition was stated. That is itself the finding.</text>`;

  const cardSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-labelledby="cardTitle cardDesc">
<title id="cardTitle">${esc(input.artifactName)}: Attempt Quality Index ${input.total} of ${AQI_MAX}, band ${esc(input.band)}</title>
<desc id="cardDesc">A share card. ${esc(input.artifactName)} scores ${input.total} out of ${AQI_MAX} on a rubric for the quality of a launch attempt, not a prediction of reach. The band is ${esc(input.band)}. The largest recoverable gap is ${esc(weakness)}, worth ${pointsAvailable} points. Scored ${esc(input.asOf)} with rubric version ${esc(input.aqiVersion)}.</desc>
<style>
  .t { font-family: ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif; }
  .m { font-family: ui-monospace,SFMono-Regular,Menlo,monospace; }
  .name { font-size: 40px; font-weight: 700; fill: #e6edf3 }
  .big { font-size: 150px; font-weight: 800; fill: #e6edf3; letter-spacing: -6px }
  .max { font-size: 44px; font-weight: 500; fill: #6e7681 }
  .band { font-size: 34px; font-weight: 700; fill: ${colour} }
  .s { font-size: 22px }
  .xs { font-size: 17px; fill: #6e7681 }
  .k { font-size: 20px; fill: #8b949e }
</style>
<rect width="1200" height="630" fill="#0d1117"/>
<rect x="0" y="0" width="1200" height="6" fill="${colour}"/>
<text x="60" y="86" class="t k">ATTEMPT QUALITY INDEX · a rubric for an attempt, not a forecast of reach</text>
<text x="60" y="146" class="t name">${esc(trim(input.artifactName, 46))}</text>
<text x="60" y="330" class="m big">${input.total}</text>
<text x="${60 + String(input.total).length * 84}" y="330" class="m max">/ ${AQI_MAX}</text>
<text x="60" y="392" class="t band">${esc(input.band)}</text>
<text x="60" y="470" class="t s" fill="#e6edf3">Biggest recoverable gap</text>
<text x="60" y="502" class="t s" fill="${colour}">${esc(trim(weakness, 62))}</text>
<text x="640" y="470" class="t k">points available</text>
<text x="640" y="516" class="m" style="font-size:46px;font-weight:700;fill:#e6edf3">${pointsAvailable}</text>
${failureBlock}
<text x="60" y="590" class="t xs">No guaranteed outcomes · rubric ${esc(input.aqiVersion)} · scored ${esc(input.asOf)} · free, offline, no account</text>
</svg>`;

  const cardAlt =
    `Share card for ${input.artifactName}: ${input.total} out of ${AQI_MAX} on the Attempt Quality Index, ` +
    `band ${input.band}. The largest recoverable gap is ${weakness}, worth ${pointsAvailable} points. ` +
    `This is a rubric for the quality of the attempt, not a prediction that anything will spread.`;

  const blurb =
    `${input.artifactName} scores ${input.total}/${AQI_MAX} (${input.band}) on the Attempt Quality Index — ` +
    `an open rubric for whether a launch attempt is legible and honest, not a prediction of reach. ` +
    `Highest-leverage gap: ${weakness}. ${input.failureCondition ? `Stated failure condition: "${trim(input.failureCondition.statement, 120)}"` : 'No failure condition was stated.'} ` +
    // The blurb is the artefact most likely to be quoted on its own, so the
    // disclaimer is inlined rather than trusted to travel alongside it.
    'This is a rubric for the attempt, not a forecast of attention.';

  return {
    forwardableLine,
    forwardableWasGenerated: usable === null,
    socialPost,
    thread,
    badgeMarkdown,
    badgeJson,
    cardSvg,
    cardAlt,
    blurb,
    whatThisDoesNotProve: [
      'That this will spread, be seen, or be shared by anyone.',
      'That the score would be the same on a different day, with different wording in the artifact.',
      'That a high score means the work is good. It means the attempt is well-formed.',
      `That anyone else's number is comparable unless they used rubric version ${input.aqiVersion}.`,
      AQI_DISCLAIMER,
    ],
  };
}

/**
 * The failure card: the counterintuitive one.
 *
 * A card showing a number is a credential. A card showing the sentence that would
 * prove the launch wrong is a position, and positions travel further than
 * credentials because they are useful to the person sharing them.
 */
export function failureCard(name: string, failure: { statement: string; observable: string; horizon: string }): {
  svg: string;
  alt: string;
} {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630" role="img" aria-labelledby="ft fd">
<title id="ft">The failure condition for ${esc(name)}</title>
<desc id="fd">A share card stating when this launch should be considered failed: ${esc(failure.statement)} Observable as: ${esc(failure.observable)}. By: ${esc(failure.horizon)}.</desc>
<style>
  .t { font-family: ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif }
  .m { font-family: ui-monospace,SFMono-Regular,Menlo,monospace }
</style>
<rect width="1200" height="630" fill="#0d1117"/>
<text x="60" y="96" class="m" style="font-size:20px;fill:#f85149;letter-spacing:2px">THIS FAILS IF</text>
<text x="60" y="176" class="t" style="font-size:40px;font-weight:700;fill:#e6edf3">${esc(trim(name, 44))}</text>
<foreignObject x="60" y="220" width="1080" height="260">
  <div xmlns="http://www.w3.org/1999/xhtml" class="t" style="font-size:46px;line-height:1.24;font-weight:600;color:#e6edf3">
    ${esc(trim(failure.statement, 150))}
  </div>
</foreignObject>
<text x="60" y="520" class="t" style="font-size:22px;fill:#8b949e">Observable: ${esc(trim(failure.observable, 86))}</text>
<text x="60" y="558" class="t" style="font-size:22px;fill:#8b949e">Horizon: ${esc(trim(failure.horizon, 60))}</text>
<text x="60" y="600" class="t" style="font-size:15px;fill:#6e7681">Written before the launch. That is what makes it a test instead of an excuse.</text>
</svg>`;
  return {
    svg,
    alt: `A card stating the failure condition for ${name}: ${failure.statement} Observable as ${failure.observable}, by ${failure.horizon}.`,
  };
}

/** Convenience: build from an AqiResult without unpacking it at every call site. */
export function fromAqi(
  result: AqiResult,
  extra: Omit<ShareInput, 'total' | 'band' | 'dimensions' | 'aqiVersion' | 'topLeverage'> & {
    topLeverage: AqiDimension[];
  },
): SharePayloads {
  return buildSharePayloads({
    ...extra,
    total: result.total,
    band: result.band.label,
    dimensions: result.dimensions,
    aqiVersion: result.version,
  });
}
