# 0002 — The index is 1000 points across 20 weighted dimensions

- **Date:** 2026-04-16
- **Status:** accepted
- **Deciders:** initial author

## Context

The score needed a scale. The three candidates were 0-100 (familiar, imprecise), 0-10
(comprehensible, too coarse to show improvement), and 0-1000 across weighted dimensions
(awkward-looking, granular enough to move).

## Options considered

**A. A single 0-100 score.** Everyone understands it. The problem is that it invites the
reading "82/100, so 82% likely to work" — a percentage-shaped number invites probability
interpretation, and this index is not a probability of anything.

**B. 0-10.** Even more likely to be read as a grade. Also impossible to express a small
improvement.

**C. 0-1000 across 20 weighted dimensions summing to 1000.** The awkwardness is a feature: a
number like 463 does not look like a percentage, does not look like a grade, and forces the
reader to ask what it is. That question is the one we want them to ask.

## Decision

Option C. Twenty dimensions, weights summing to exactly 1000, `points = round(score × weight ÷
100)`, five bands.

## Consequences

- Weights must be published in a machine-readable file that every implementation loads at
  runtime, so a fork cannot silently reweight the index.
- `scripts/check-aqi-weights.mjs` fails the build if the weights do not sum to 1000, if the
  bands are not contiguous, or if a dimension is missing a required field.
- Every document must carry the sentence that the index is not a forecast, and a test asserts
  it.
- Band boundaries (250/450/650/825) are arbitrary and documented as arbitrary. They exist to
  make the number legible, not because anything happens at 450.

## Dissent

The strongest argument against was that 20 weighted dimensions is too many to read. Accepted
as a real cost, mitigated by reporting only three highest-leverage dimensions by default. The
full twenty exist so that the ranking is defensible; they are not all shown, and the report
says so.
