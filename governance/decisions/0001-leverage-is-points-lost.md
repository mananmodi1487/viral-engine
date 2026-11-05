# 0001 — Leverage is points lost, not the lowest score

- **Date:** 2026-04-16
- **Status:** accepted
- **Deciders:** initial author

## Context

The engine had to answer one question first: **what should a person fix next?**

The obvious answer is "the dimension with the lowest score". It is intuitive, it is easy to
explain, and it is wrong often enough to waste a user's only day of work.

## Options considered

**A. Lowest raw score.** Simple. But a dimension scoring 20/100 that carries weight 30 can
return 24 points by going to 100, while a dimension scoring 55/100 at weight 80 returns 36.
The intuitive answer sends the user to the less valuable repair.

**B. Lowest weighted points.** Multiplies the percentage by the weight, so the ranking reflects
how much of the total is actually retrievable. Correct on the maths, but the ordering can
contradict the visible bars in a report, which makes it feel arbitrary unless the UI explains
it.

**C. Both, named separately.** "Weakest" is the lowest score. "Highest leverage" is the most
points recoverable. They are shown as different things, with different labels.

## Decision

Option C. The report shows weakest and highest-leverage side by side, and never labels one as
the other.

## Consequences

- The user sees a recommendation that sometimes contradicts their intuition, with the
  arithmetic visible next to it. That friction is intentional.
- The tests had to encode the distinction, which they now do: a case where the lowest score is
  *not* the highest leverage, asserting the two differ.
- Any future change that collapses the two into one ranking is a regression against a
  documented decision, not a simplification.

## Dissent

None recorded. This entry exists as the format example and because the decision is easy to
undo by accident.
