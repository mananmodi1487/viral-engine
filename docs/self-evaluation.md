# Self-evaluation

Scored against the five categories in the upgrade brief. Written by the person who did the work, which is a conflict of interest — so every score names what would falsify it.

---

| Category | Score | Honest basis |
|---|---:|---|
| Technical Depth | **8/10** | Real typed engine, 49 tests, 4 providers, CI, working CLI + web UI. Not 10: signal extraction is lexicons, not NLP. |
| Practical Utility | **8/10** | One command, readable report, 8 asset channels, local mode. Not 10: no real-user validation; scoring is untested against actual outcomes. |
| Execution / Architecture | **8.5/10** | Clean separation, deterministic core, schema validation, graceful degradation. Not 10: no monorepo publish pipeline; `fail-on: regression` is documented but unimplemented. |
| Documentation | **9/10** | 5 docs, each with a limitations section; README explains the tool in ~20 seconds with real output. Not 10: no video, no screenshots (Chromium download blocked in the build sandbox). |
| Conceptual Originality | **7.5/10** | The Broadcaster Rule is a genuine synthesis of the diffusion data, and the outbound honesty pass is unusual. Not 10: the underlying research is other people's, and the category table is a heuristic. |

**Weighted: ~8.2/10.**

---

## What would falsify each score

| Claim | Falsified if… |
|---|---|
| "Deterministic" | Two runs with the same clock and saturation count differ. There is a test asserting they don't. |
| "Enforces honesty" | A document with `guaranteed viral growth` produces a passing report. Tested. |
| "Local-first" | `--offline` makes a network call, or fails without a provider. Tested. |
| "Useful" | Five real users run it and cannot name one thing to change. **Untested — this is the biggest gap.** |
| "Accurate" | The benchmark is 7 self-authored fixtures. Growing it is the next iteration. |

---

## Known gaps, ranked by how much they matter

### 1. No real-user validation (critical)

Every accuracy claim rests on 7 fixtures written by the rule author. This is the single largest weakness and no amount of additional code fixes it.

**Close it by:** putting the tool in front of 10 people with a real launch pending, recording (a) whether the weakest lever matched their intuition and (b) whether they acted on it. Ten honest interviews outweigh a hundred more unit tests.

### 2. Lexicon-based signals (high)

Keyword matching misses paraphrase and can be gamed. "This will *catalyse* explosive adoption" scores as flat.

**Close it by:** adding an embedding-based signal layer that runs locally, keeping the lexicon as the auditable fallback. Never let the embedding layer be the only path — the reproducibility guarantee depends on a deterministic core.

### 3. Benchmark size and independence (high)

7 fixtures, 100%, same author. See `docs/scoring.md`.

**Close it by:** 30+ real documents with outcomes, authored by others, including several failures.

### 4. `fail-on: regression` is unimplemented (medium)

The Action accepts the value and exits 0. This is a broken promise, documented in `docs/migration.md` rather than silently shipped.

**Close it by:** analysing `README.md` at the merge-base, diffing scores, failing on any drop > 5 points.

### 5. Category table is fixed (medium)

A genuinely novel category lands in `unspecified`.

**Close it by:** letting users supply a category, and using the supplied value to grow the table.

### 6. No publish pipeline (low)

`npm run build` works and the binaries run, but there is no release workflow, no `npm publish` step, no versioned changelog.

**Close it by:** a `release.yml` on tag, plus `changesets`.

### 7. No visual demo (low but hurts a launch)

Screenshots and a terminal GIF are the highest-converting assets for a dev tool. Chromium could not be downloaded in the build environment, so the HTML report was verified structurally rather than visually.

**Close it by:** running the web UI locally and capturing three screenshots: terminal output, web UI, HTML report.

---

## What is deliberately not built

| Not built | Why |
|---|---|
| Virality prediction | Cannot be done honestly. Goel et al.: ~0.025% of diffusion events exceed 100 nodes. |
| Auto-posting to social platforms | Would make the tool a spam vector and require OAuth scopes that do not match its purpose. |
| Engagement-bait templates | Violates the policy the repo is built on. |
| A hosted SaaS | The thesis is local-first; hosting would put user documents on someone else's disk. |
| Fake testimonials in the README | The whole differentiator. Real ones get added with permission as they arrive. |

---

## One thing that changed during the build

The engine was run on its own repository and it caught two problems in the project's own copy:

1. `SKILL.md` contained `10,000 professionals` as an example hook — flagged as an unsourced adoption figure. Replaced with `[your real number]`.
2. The README's easter-egg comment (`This repo will hit 100K+ stars`) was flagged as a star promise. Rephrased as a wish, with a comment explaining the joke.

That is the tool working on itself, which is the only credibility claim here that a reader can verify in one command.
