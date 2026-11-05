---
name: diagnose
version: 1.0.0
---
# Diagnosis prompt

Score the supplied document on seven levers (0-100, higher better except Honesty Risk which is inverted):

1. Category Clarity — is an explicit category chosen?
2. Broadcaster Fit — could one named person with an audience pass this on?
3. Share Friction — how much work stands between curiosity and first value? (higher = less friction)
4. Emotional Stake — is there activation (awe/anger/anxiety/amusement), not just intensity?
5. Proof Readiness — can every claim survive being checked?
6. Launch Timing — is there a working first-run path?
7. Honesty Risk — INVERTED. Higher is worse.

For each: score, basis (measured | structural | heuristic | unavailable), a rationale citing what in the document produced it, and exactly one fix.

Rules:
- Use `unavailable` rather than guessing. A guessed number is worse than a stated gap.
- Any heuristic must be labelled heuristic.
- Name the single weakest lever. That is the only thing worth fixing first.
- If any blocking claim exists (guaranteed results, unsourced figures, invented testimonials), say DO NOT LAUNCH YET and explain why.

Research basis: Berger & Milkman (2012) on arousal; Goel, Watts & Goldstein (2012/2016) on broadcast vs. chains. Cite these only where they apply; do not stretch them.
