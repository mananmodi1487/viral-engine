# Architecture

## The one decision everything else follows from

**Scoring is deterministic. An LLM can only ever explain.**

Most "AI analysis" tools put the model in the scoring path. That has three consequences: results are not reproducible, scores drift between runs, and the model can invent the evidence it then scores. For a tool whose entire differentiator is *not fabricating things*, that is disqualifying.

So the pipeline is inverted:

```
            ┌──────────────────────────────────────────┐
input ─────▶│ signals.ts   deterministic extraction     │
            │   lexicons, counts, structural probes    │──▶ Signals
            └──────────────────────────────────────────┘
                              │
            ┌─────────────────▼────────────────────────┐
            │ score.ts   pure function: Signals → 0-100│──▶ Scorecard
            │   every dimension declares its basis     │
            └──────────────────────────────────────────┘
                              │
   honesty.ts ────────────────┤  inbound scan of the input
   categories.ts ─────────────┤  category + saturation
   broadcasters.ts ───────────┤  the Broadcaster Rule
   assets.ts ─────────────────┘  template-driven assets
                              │
            ┌─────────────────▼────────────────────────┐
            │ analyze.ts   assembles + validates        │
            │   Zod schema · failure-condition assert   │──▶ DiagnosisReport
            │   outbound honesty scan of our own output │
            └──────────────────────────────────────────┘
                              │
                 (optional) provider adds prose only
```

`analyze()` is a pure function of `(SourceDocument, options)`. Given an injected clock and saturation count, the same input produces byte-identical JSON. There is a test for exactly that.

## Data flow

| Stage | File | Network? | Deterministic? |
|---|---|---|---|
| Acquire input | `load.ts` | Possibly (degrades to `degraded` note) | — |
| Extract signals | `signals.ts` | No | Yes |
| Score | `score.ts` | No | Yes |
| Category / saturation | `categories.ts` | Only the numeric band | Bands are pure |
| Honesty scan | `honesty.ts` | No | Yes |
| Broadcasters | `broadcasters.ts` | No | Yes |
| Assets | `assets.ts` | No | Yes |
| Assemble + validate | `analyze.ts` | No | Yes |
| Prose (optional) | `providers/` | Yes | **No** |

The only non-deterministic stage is the last one, and it cannot write to any scored field, any broadcaster, or any failure condition.

## Why the provider layer is optional, not required

`resolveProvider()` returns `{ provider: null, reason, skipped }` when nothing is configured. That is not an error path — it is the default path. The CLI prints a note explaining it and continues.

Consequences:

- **Local mode is real.** `--offline` sets `provider: 'none'` and makes zero network calls. Every scored field still computes.
- **No vendor lock-in.** Ollama is first in `AUTO_ORDER`, ahead of every hosted provider, so a machine with a local model never reaches for a paid API.
- **Provider failure is survivable.** If a call fails after retries, `analyze()` appends the failure to `limitations` and ships the deterministic report. It does not throw away the diagnosis.

## The two honesty passes

```
inbound  : user's document  → what could get them publicly corrected
outbound : our own report   → what we must never emit
```

The outbound pass is unusual and it caught a real bug during development: the analyzer initially scanned `JSON.stringify(report)`, which included honesty findings that *quoted* the user's bad phrases. The tool flagged itself. The fix was `extractGeneratedText()` — project only the fields we authored, then scan those.

A second real bug followed: the inbound scanner flagged the sentence "Nobody can promise 100K stars" as a star promise. The fix was a negation guard: a match is discarded when the preceding ~70 characters contain `no`, `not`, `never`, `cannot`, `nobody`, `without`, `avoid`, `rather than`, `instead of`.

Both bugs are now regression-tested. They are the argument for having the outbound pass at all.

## Scoring model

Seven dimensions, each 0–100, each carrying an `EvidenceBasis`:

| Basis | Meaning | Example dimension |
|---|---|---|
| `measured` | counted from the document | Share Friction |
| `structural` | deterministic rule over signals | Category Clarity |
| `heuristic` | judgement, labelled as such | Emotional Stake |
| `unavailable` | could not determine — never guessed | Category saturation |

`honestyRisk` is **inverted**: higher is worse, and the label says so. Collapsing it into "higher is better" would let a tool that found five blockers report a confident 80/100.

Confidence is explicit: `scorecard.lowConfidence` is true whenever saturation is unknown or any heuristic dimension scores below 45.

## Failure conditions are structurally required

`assertFailureConditions()` runs on every report and throws if any of these is missing:

- `report.failureCondition`
- `category.failureCondition`
- every `broadcasters[i].failureCondition`
- `launchPlan.killCriteria` (must be non-empty)

The Zod schema also requires them, so a provider that returns nothing useful cannot produce a report without them either.

## "Do not launch yet"

`launchPlan.doNotLaunchYet` becomes true when honesty blockers exist **or** the overall score is below 35. It is a first-class outcome, not a warning: the CLI prints it prominently, the HTML report shows a banner, and the GitHub Action fails on blockers.

The reasoning is in the failure condition of the plan itself — one unpolished launch attempt per project is the real constraint, so a launch that cannot produce signal is worse than a delay.

## Extension points

| Want to… | Do this | Touched files |
|---|---|---|
| Add a hook/claim rule | Append to `REPLACEMENT_RULES` | `honesty.ts`, `tests/honesty.test.ts` |
| Add a crowded category | Append to `CROWDED_CATEGORIES` + `ADJACENT` | `categories.ts`, `tests/` |
| Add a provider | Implement the `Provider` interface, register in `ALL_PROVIDERS` | `providers/index.ts` |
| Change scoring | Edit one `dim()` call; basis label is mandatory | `score.ts`, `tests/score.test.ts` |
| Add an asset channel | Extend the `LaunchAsset` enum + `generateAssets` | `schemas.ts`, `assets.ts` |
| Add a benchmark case | Append to `fixtures/benchmark.json` | benchmark |

## Known architectural limits

1. **Signal extraction is lexicons, not NLP.** It will miss paraphrase and it can be gamed. It is cheap, auditable, and reproducible — which was the trade made deliberately.
2. **Saturation is a keyword query.** The band comes from a real GitHub count; the *query* is built heuristically from topics/description and can be wrong.
3. **Category mapping is a fixed table.** A genuinely novel category falls into `unspecified`.
4. **The benchmark is small.** 7 fixtures at 100% is a smoke test, not evidence of generalization. See `docs/scoring.md`.
5. **No base-branch comparison yet.** `fail-on: regression` is documented but not implemented; it currently reports and exits 0.
