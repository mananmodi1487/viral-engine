# Architecture

Eleven layers, four of which are code, three of which are documents, four of which are planned and
not built. This file says which is which, because the difference matters more than the diagram.

---

## The one decision everything follows from

**Scoring is deterministic. A model may only explain.**

Most "AI analysis" tools put the model in the scoring path. Three consequences: results are not
reproducible, scores drift between identical runs, and the model can invent the evidence it then
scores. For a tool whose entire differentiator is *not fabricating things*, that is disqualifying.

So the pipeline is inverted:

```
             ┌────────────────────────────────────────────┐
  artifact ─▶│ ingest/     14 formats, pure local parsing │──▶ Source
             └────────────────────────────────────────────┘
                                │
             ┌──────────────────▼─────────────────────────┐
             │ signals.ts   deterministic extraction      │──▶ Signals
             │  lexicons, counts, structural probes       │
             └──────────────────┬─────────────────────────┘
                                │
             ┌──────────────────▼─────────────────────────┐
             │ agents/   15 agents, pure functions        │──▶ Agent findings
             │  one of them can refuse                    │
             └──────────────────┬─────────────────────────┘
                                │
             ┌──────────────────▼─────────────────────────┐
             │ score/aqi.ts   Signals+Docs → 20 dims      │──▶ AQI 0-1000
             │  every dimension declares its basis        │
             └──────────────────┬─────────────────────────┘
                                │
             ┌──────────────────▼─────────────────────────┐
             │ analyze/ods.ts   assemble + validate       │──▶ ODS document
             └──────────────────┬─────────────────────────┘
                                │
        ┌───────────────────────┼──────────────────────────┐
        ▼                       ▼                          ▼
  report/{terminal,       apps/web               apps/cli
   markdown,html,svg}     (zero deps)            (15 commands)
```

An LLM, when enabled, sits **beside** this pipeline and receives the finished document to produce
prose. It never sees a score before the score is computed, and it cannot change one. `--offline`
removes it entirely and the output differs only in narrative polish — which is the test that the
claim is true.

---

## Layer 1 — Universal input (built)

`packages/core/src/ingest/`

| Capability | Detail |
|---|---|
| Formats | 14 `InputKind`s: markdown, txt, PDF, DOCX, HTML, JSON, CSV, YAML, SVG, source code, GitHub repo metadata, pasted text, stdin, directory |
| Dependencies | none in the extraction path — PDF and DOCX are parsed with hand-written readers |
| Network | zero. A URL is not fetched; the user pastes the visible copy |
| Consent | every input records `consent: 'user-provided'` in `provenance.inputs` |

**Why no URL fetching:** fetching a page means deciding whether to respect `robots.txt`, risking a
crawl of someone's private content, and making the tool's output depend on a live network. The
cost is one paste. The benefit is that offline mode is a property of the design, not a flag.

`classifyInput()` decides between `owner/repo`, a path, and raw text, with local-path prefixes
winning over the GitHub shorthand — a bug found when `./README.md` was parsed as repository
`owner=./README.md`.

---

## Layer 2 — The protocol (built)

`protocol/` + `packages/protocol/`

| Artefact | Purpose |
|---|---|
| `open-diffusion-spec.md` | The specification: semantics, conformance rules, non-goals, per-language status |
| `aqi-weights.json` | The rubric. Loaded at runtime by every implementation. Never copied. |
| `ods.schema.json` | JSON Schema 2020-12. The contract, not the TypeScript interface. |
| `conformance.md` | What conformance means, how to run the checks, the bugs it found |
| `schema-versioning.md` | How versions change and what breaks |
| `examples/ods-example.json` | 73 KB real document, regenerable, validated by every binding |
| `src/aqi.ts`, `python/`, `go/`, `rust/` | Four bindings, with honest per-language status |

**The rule that keeps the protocol a protocol:** a hardcoded weight is a fork. TS imports the
JSON, Python walks up to find it (override `VIRAL_ENGINE_WEIGHTS`), Go and Rust walk up from cwd.
`scripts/check-aqi-weights.mjs` fails the build if the weights do not sum to 1000 or the bands are
not contiguous.

---

## Layer 3 — The agents (built)

`packages/agents/src/` — 15 agents plus the registry.

| Agent | Answers | Notable constraint |
|---|---|---|
| Category Cartographer | what slot am I in, and what adjacent slot has room | returns `null` repositioning when the text is too thin to justify one |
| Saturation Radar | how crowded is this | `"unknown"` unless measured; `missing_data` required |
| Broadcaster Ethicist | who would carry this, under what consent | `maxContacts ≤ 3`; no field can hold a handle |
| Friction Surgeon | what makes forwarding expensive | names what no copy can fix |
| Honesty Firewall | which claims will not survive checking | rewrites into evidence class; `cannotCheck` list on every run |
| Asset Alchemist | the copy, ready to edit | self-audits its own output before returning it |
| Experiment Weaver | what to test before launching | every test names the decision it changes; `pre_registered: false` |
| Launch Simulator | what happens on day one | scenario ranges, labelled as scenarios |
| Critic Simulator | what hostile readers will say | six voices, `speculativeDisclaimer` on all of them |
| Postmortem Archaeologist | what the failure actually teaches | labels `anecdotal` unless numbers with sources exist |
| Evidence Librarian | what label does this record deserve | refuses to upgrade a label without a source |
| Translation Diplomat | what does not survive translation | does not translate; `testedLanguages: ['en']` |
| Accessibility Guardian | what excludes readers | names what it did not test, every run |
| Privacy Sentinel | what leaves the machine | `networkCalls: 0` in offline, and nothing more |
| Abuse Sentinel | what must never be automated | hard limits that cannot be configured away |

Every agent returns `AgentRefusal | AgentResult<T>`. A refusal carries a code, a one-line reason,
and an **alternative** — enforced by the type and by a test: a refusal without an alternative
fails.

---

## Layer 4 — The engine (built)

`packages/core/src/`

- `score/aqi.ts` — 20 dimension functions, `computeAqi`, `weakestDimension`, `topLostPoints`.
  Missing dimensions are filled as `unavailable` at zero, not dropped: averaging only the
  dimensions you have would make one perfect dimension read as 100%.
- `analyze/ods.ts` — assembles the document, applies the ethics gate, snake_cases every protocol
  field (the two bugs found by cross-language validation were here).
- `report/` — terminal, CI summary, markdown (14 sections), single-file HTML, SVG assets with
  mandatory `alt`.
- `evals/harness.ts` — 12 detectors, precision/recall/FPR per target, `failures` and
  `knownMisses` published by name.

**The leverage metric decision** (`governance/decisions/0001`): `weakest` is the lowest score;
`highest leverage` is the most points recoverable. They are reported separately and never
labelled as each other, because they frequently disagree and the disagreement is the useful
information.

---

## Layer 5 — Tooling surfaces

| Surface | Status | Where |
|---|---|---|
| CLI | **built** — 15 commands, exit codes 0-5, 7 output formats | `apps/cli` |
| Web app | **built** — zero dependencies, `node:http`, strict CSP, no cookies | `apps/web` |
| GitHub Action | **built** — composite, sticky comment, `fail-on` policy, artifact upload | `.github/actions/spread-check` |
| Plugin SDK | **built** — sealed rubric, enforced permissions | `packages/plugin-sdk` |
| HTTP API | **planned** — `apps/api`. The web server already exposes `/api/score`, `/api/analyze`, `/api/protocol/dimensions`; a separate API is about rate limiting and caching, not function. |
| Browser extension | **planned** — `apps/browser-extension`. Reads the visible copy of the page you are on, runs the same detectors locally, adds a badge. No page-level network access, no background requests. |
| VS Code extension | **planned** — `apps/vscode-extension`. Analyses the open markdown file, shows the three highest-leverage dimensions in a diagnostic panel. |
| PWA | **planned** — `apps/mobile-pwa`. The web app is already installable-ish; a manifest and a service worker that never caches `/api/` exist. What is missing is offline document storage, which needs a decisions log entry about local data retention. |
| Slack / Discord / Telegram bots | **planned** — `apps/chatbot-*`. Each is a thin shell over the CLI's JSON output. The blocker is not code: it is that a bot in a company workspace can accumulate private launch copy, which is a data-retention question the ethics council should answer first. |
| Email plugin | **planned** — an outbound integration, which is exactly where a diagnostic tool becomes a spam tool. Blocked on `governance/decisions/0003`. |
| CMS plugins | **planned** — WordPress/Ghost/Hugo. Lowest risk, highest reach for non-developers. |

**They are not in the tree.** An empty directory is a claim that something exists there, and this
repository's whole thesis is about not making claims you cannot support. See
`governance/decisions/0005`.

---

## Layer 6 — Local-first (built)

| Piece | Status |
|---|---|
| `--offline` implies `--provider none` | built |
| Zero network in ingest, signals, scoring, rendering | built, tested |
| Ollama / llama.cpp / LM Studio via `OLLAMA_HOST` | built, in `packages/providers` |
| Whisper (audio input) | **not built.** No audio ingest exists. |
| `doctor --offline` asserting no network | built |
| Web app: no cookies, no telemetry, strict CSP | built |
| Service worker caches the shell, never `/api/` | built |

The provider contract is frozen by `tests/providers.test.ts`, which encodes a local-availability
rule: `auto` never silently picks a local model just because Ollama is running. Naming the
provider is a deliberate act.

---

## Layer 7 — Evidence commons (built, sparse)

`evidence/` — 11 directories, each with a README stating what the records **cannot** support.

Two real records and two incidents ship. That is a small and honest number: a directory with
eighteen empty folders and a "coming soon" would have looked more impressive and told a reader
nothing. The labelling scheme (`verified` … `private-redacted`) is enforced in the format; the
volume is the problem, and the README says so at the top.

---

## Layer 8 — Evaluation harness (built)

`packages/core/src/evals/harness.ts` + `fixtures/eval-dataset.jsonl` + `scripts/run-eval.ts`.

- 12 targets, 32 cases, explicit `mustNot` lists for precision.
- Per-target precision / recall / FPR, macro averages, published in
  `evidence/benchmarks/aqi-detector-results.md`.
- **Every failing case published by name.** One is kept as a `knownMiss` with a written reason it
  was not tuned away.
- CI fails below a precision floor.
- `limitations` names the conflict of interest (same author wrote the cases and the detectors) and
  the English-only coverage.

---

## Layer 9 — Academy (built)

`academy/` — 15 modules, 7 hours, plus `exercises/check.ts`, a real checker invoked as
`npm run academy -- 04 ./README.md`. The checkers test the *artifact*, never the answer, and each
failing check prints the reasoning behind it rather than the fix.

---

## Layer 10 — Governance (built, vacant)

`governance/` — 10 non-negotiable commitments, a council charter with 5 seats and a stated quorum,
a decision log with dissent recorded, an anti-takeover process requiring a supermajority plus
unanimous council consent plus a 90-day fork window, and a sunset plan.

**The council is vacant.** Charter written, seats empty, disclosed in the charter and in the
release notes rather than implied to exist.

---

## Layer 11 — Sustainability (documented, not funded)

See `SUSTAINABILITY.md`. Permitted: donations, grants, public-interest sponsorship, optional
consulting that never degrades the free product. Forbidden: everything that makes the free product
worse in order to sell something. `viral-engine upgrade` prints "there is no paid tier", and a
test asserts the string.

---

## Cross-cutting decisions

**Exit codes are part of the interface.** 0 clean · 1 error · 2 usage · 3 honesty blocker ·
4 ethics violation · 5 refused. CI depends on 3 and 5 being distinguishable from 1, so a refusal
is never mistaken for a crash.

**Every renderer tolerates agent drift.** `Array.isArray(x) ? x : []` at every read. The
`bc.what_not_to_say is not iterable` crash taught this: a missing field must never take down a
report, because the user loses the diagnosis as well as the bug.

**Degradation is visible.** If a provider fails, if a dimension is unavailable, if a section could
not be generated, the output says so at the point of failure. A report that silently omits a
section is worse than one that fails, because the omission looks like a "no findings".

**The web app has zero dependencies.** Not minimalism for its own sake: a dependency tree is an
audit surface, and this app handles unpublished documents. `node:http` and hand-written routing
mean the entire server can be read in one sitting.

**Rate limiting is per-IP, in memory, 60 requests per minute,** and is framed in the code as abuse
prevention rather than usage measurement, because it resets on restart and is never logged.

---

## What this architecture is not

- **Not a prediction system.** No market data, no scraping, no outcome model. The index scores a
  rubric for an attempt.
- **Not a multi-tenant service.** There are no accounts, so there is nothing to be multi-tenant
  about.
- **Not finished.** Four surfaces are planned and unbuilt, two bindings are uncompiled, one agent
  layer has never seen a non-English document, and the council that is supposed to guard all of it
  has no members yet.
