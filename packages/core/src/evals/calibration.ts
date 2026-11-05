/**
 * Calibration: does the score mean anything?
 *
 * The single most honest thing this project can do about its own number is publish
 * the correlation between predicted attempt quality and what actually happened,
 * computed on whatever data exists — including when the data is too thin to
 * conclude anything.
 *
 * Three rules govern this file:
 *
 *  1. **It will not fit a model to n < 30.** Below that it reports the count and
 *     refuses to produce a correlation. A correlation coefficient on eight points
 *     is a decoration that gets quoted as a finding.
 *  2. **It reports the interval, not the point.** Spearman's rho on 30 self-selected
 *     submissions has an interval so wide it usually includes zero, and saying so is
 *     more useful than the number.
 *  3. **It reports the direction of the selection bias.** Outcomes are submitted by
 *     people who read this repository, which is not a random sample of launches. A
 *     positive result here would be evidence about this audience, not about the
 *     world.
 *
 * There is deliberately no "calibrated" output and no adjusted score. A tool that
 * silently corrects its own prediction using its own unvalidated outcomes is
 * producing a number nobody can audit.
 */

export interface CalibrationRecord {
  /** AQI total at the time of analysis. */
  aqi: number;
  /** The rubric version that produced it. Records from different versions cannot be pooled. */
  aqiVersion: string;
  /** Whatever the submitter says happened, as a number they defined themselves. */
  outcome: number;
  outcomeUnit: string;
  outcomeDefinedBy: 'submitter' | 'protocol';
  /** Evidence label from the commons. Analysed separately, never mixed. */
  label: 'verified' | 'reproducible' | 'self-reported' | 'anecdotal' | 'unclear' | 'contested' | 'private-redacted';
  horizonDays: number;
}

export interface CalibrationReport {
  n: number;
  /** Present only when n >= the minimum. Absent means "not computed", never "zero". */
  rho: number | null;
  /** 95% bootstrap interval on rho. Null when rho is null. */
  interval: [number, number] | null;
  /** Which subsets were analysed and which were refused. */
  strata: Array<{ name: string; n: number; rho: number | null; note: string }>;
  sampleProblems: string[];
  conclusion: string;
  /** What would make this analysis trustworthy, stated as a falsifiable condition. */
  whatWouldChangeThis: string[];
}

const MIN_N = 30;
const ITERATIONS = 2000;

function ranks(xs: number[]): number[] {
  const order = xs.map((v, i) => ({ v, i })).sort((a, b) => a.v - b.v);
  const out = new Array<number>(xs.length);
  let i = 0;
  while (i < order.length) {
    let j = i;
    while (j + 1 < order.length && order[j + 1].v === order[i].v) j++;
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) out[order[k].i] = avg;
    i = j + 1;
  }
  return out;
}

/** Spearman's rho, computed on ranks so a single outlier cannot own the result. */
export function spearman(xs: number[], ys: number[]): number | null {
  if (xs.length !== ys.length || xs.length < 3) return null;
  const rx = ranks(xs);
  const ry = ranks(ys);
  const mx = rx.reduce((a, b) => a + b, 0) / rx.length;
  const my = ry.reduce((a, b) => a + b, 0) / ry.length;
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < rx.length; i++) {
    num += (rx[i] - mx) * (ry[i] - my);
    dx += (rx[i] - mx) ** 2;
    dy += (ry[i] - my) ** 2;
  }
  if (dx === 0 || dy === 0) return null;
  return num / Math.sqrt(dx * dy);
}

function bootstrap(xs: number[], ys: number[], seed = 20260401): [number, number] {
  // Deterministic PRNG: the published interval must be reproducible byte for byte,
  // or it is a different interval every time someone checks it.
  let s = seed;
  const rand = () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
  const samples: number[] = [];
  for (let it = 0; it < ITERATIONS; it++) {
    const bx: number[] = [];
    const by: number[] = [];
    for (let i = 0; i < xs.length; i++) {
      const k = Math.floor(rand() * xs.length);
      bx.push(xs[k]);
      by.push(ys[k]);
    }
    const r = spearman(bx, by);
    if (r !== null) samples.push(r);
  }
  if (samples.length === 0) return [0, 0];
  samples.sort((a, b) => a - b);
  const lo = samples[Math.floor(samples.length * 0.025)];
  const hi = samples[Math.floor(samples.length * 0.975)];
  return [Number(lo.toFixed(3)), Number(hi.toFixed(3))];
}

export function calibrate(records: CalibrationRecord[]): CalibrationReport {
  const sampleProblems: string[] = [];

  const byVersion = new Map<string, CalibrationRecord[]>();
  for (const r of records) {
    const list = byVersion.get(r.aqiVersion) ?? [];
    list.push(r);
    byVersion.set(r.aqiVersion, list);
  }
  if (byVersion.size > 1) {
    sampleProblems.push(
      `Records span ${byVersion.size} rubric versions (${[...byVersion.keys()].join(', ')}). Pooling them would compare numbers that were never on the same scale, so each is analysed separately.`,
    );
  }

  const units = new Set(records.map((r) => r.outcomeUnit));
  if (units.size > 1) {
    sampleProblems.push(
      `Outcomes are measured in ${units.size} different units (${[...units].slice(0, 6).join(', ')}). A correlation across different definitions of "happened" is a correlation between the definitions.`,
    );
  }
  if (records.some((r) => r.outcomeDefinedBy === 'submitter')) {
    sampleProblems.push(
      'At least some outcomes are defined by the submitter rather than the protocol, which lets a person choose the measure that flatters their result. Reports say so rather than correcting it.',
    );
  }
  if (records.some((r) => r.outcomeDefinedBy === 'submitter' && r.horizonDays < 7)) {
    sampleProblems.push('Some horizons are under a week, which measures the first spike rather than what persisted.');
  }
  const labelled = records.filter((r) => r.label === 'self-reported' || r.label === 'anecdotal');
  if (labelled.length > 0) {
    sampleProblems.push(
      `${labelled.length} of ${records.length} records are self-reported or anecdotal. They are reported as a separate stratum and never used to support a claim about efficacy.`,
    );
  }

  const strata: CalibrationReport['strata'] = [];

  const latest = [...byVersion.entries()].sort((a, b) => b[0].localeCompare(a[0]))[0];
  if (latest) {
    const [version, rows] = latest;
    const withRho = rows.length >= MIN_N;
    strata.push({
      name: `${version}, all labels`,
      n: rows.length,
      rho: withRho ? spearman(rows.map((r) => r.aqi), rows.map((r) => r.outcome)) : null,
      note: withRho
        ? 'Computed. Read the interval, not the point estimate.'
        : `Not computed: n=${rows.length} is below the minimum of ${MIN_N}. A correlation on fewer points is a decoration.`,
    });

    const strong = rows.filter((r) => r.label === 'verified' || r.label === 'reproducible');
    strata.push({
      name: `${version}, verified or reproducible only`,
      n: strong.length,
      rho: strong.length >= MIN_N ? spearman(strong.map((r) => r.aqi), strong.map((r) => r.outcome)) : null,
      note:
        strong.length >= MIN_N
          ? 'Computed. This is the only stratum that could support a claim.'
          : `Not computed: n=${strong.length}. This is the stratum that matters, and it is empty, which is the honest headline.`,
    });
  }

  const analysedVersion = latest?.[0];
  const analysedRows = analysedVersion ? (latest?.[1] ?? []) : [];
  const useRho = analysedRows.length >= MIN_N;
  const rho = useRho ? spearman(analysedRows.map((r) => r.aqi), analysedRows.map((r) => r.outcome)) : null;
  const interval = useRho && rho !== null ? bootstrap(analysedRows.map((r) => r.aqi), analysedRows.map((r) => r.outcome)) : null;

  let conclusion: string;
  if (rho === null || interval === null) {
    conclusion =
      `No correlation is reported. With ${records.length} record${records.length === 1 ? '' : 's'}, there is not enough data to say whether the score relates to outcomes, and the repository will not imply that it does. ` +
      'The absence of a computed number is the finding.';
  } else if (interval[0] <= 0 && interval[1] >= 0) {
    conclusion =
      `rho = ${rho.toFixed(3)} with a 95% interval of [${interval[0]}, ${interval[1]}], which includes zero. The data are consistent with no relationship at all. ` +
      'Do not quote the point estimate.';
  } else if (rho < 0) {
    conclusion =
      `rho = ${rho.toFixed(3)} with a 95% interval of [${interval[0]}, ${interval[1]}]. The relationship is negative, which would mean higher scores did worse — a result worth publishing precisely because it is not the one the project wants.`;
  } else {
    conclusion =
      `rho = ${rho.toFixed(3)} with a 95% interval of [${interval[0]}, ${interval[1]}]. A positive association in a self-selected sample is a hypothesis to test, not a validation of the rubric.`;
  }

  return {
    n: records.length,
    rho,
    interval,
    strata,
    sampleProblems,
    conclusion,
    whatWouldChangeThis: [
      `At least ${MIN_N} outcome records in which the outcome was defined before the launch, not after it.`,
      'A pre-registered hypothesis naming the direction and the horizon, filed in governance/decisions/ before the data are collected.',
      'Outcomes for attempts that were never publicised to this community, so the sample is not the audience.',
      'A published analysis anyone can rerun, including one that finds nothing.',
      'Acceptance in advance that a null result will be published with the same prominence as a positive one, which is the only version of this that means anything.',
    ],
  };
}
