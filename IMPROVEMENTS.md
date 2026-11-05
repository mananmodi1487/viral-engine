# What changed, and what it cost

This repository began as a Claude Skill and a CLI that diagnosed why a piece of work did not
spread. It is now an attempt at something larger: a free, open, local-first operating system for
making work legible, with a public protocol at its centre.

This file lists the changes, in the order they matter, and — because the original had an honesty
policy and this version is judged against it — what each change cost.

---

## 1. From a tool to a protocol

**Before:** one implementation. The scoring rules lived in `score.ts`. If you disagreed with a
weight, your only option was to fork and become incomparable.

**Now:** `ODS 1.0.0` — a published specification, a JSON Schema, a machine-readable rubric
(`protocol/aqi-weights.json`) that every implementation loads at runtime, and a conformance suite
with a status column per language.

**Why it matters:** a rubric in one person's source code is an opinion. A rubric in a public file
that three implementations load is a shared vocabulary. The difference shows up the moment two
people want to compare a score.

**What it cost:** a day of work and two real bugs in the reference implementation, found by the
Python binding within minutes of it being written. Both were camelCase leaks that 92 TypeScript
tests could not see, because the same language wrote and read both sides of the format. Recorded
in `protocol/conformance.md` §6.

**What is still weak:** Go and Rust bindings exist and are labelled **CI-only**, because no
compiler was available when they were written. One of them contains a function that is probably
wrong. The label is the honest part; a claim of "four languages" would not be.

---

## 2. From a 0-100 score to a 1000-point rubric with 20 dimensions

**Before:** seven levers, one 0-100 number, five bands.

**Now:** twenty weighted dimensions summing to exactly 1000, each carrying evidence, confidence,
basis, assumptions, missing data, improvement action, and failure condition. The schema rejects a
dimension missing any of them.

**Why it matters:** a single score is a verdict. Twenty dimensions with reasons is a diagnosis
you can argue with, and — more importantly — a document you can diff between commits.

**What it cost:** readability. Twenty dimensions is too many to read. The report therefore shows
only the three highest-leverage dimensions by default and says it is doing so. The full twenty
exist so that the ranking is defensible, not so that anyone reads them.

**Deliberate design choice worth naming:** 1000 points, not 100. A number like 583 does not look
like a percentage, so it does not invite the reading "58% likely to work". That awkwardness is
the point.

---

## 3. From a report to an auditable document

**Before:** markdown and JSON, shaped by the renderer.

**Now:** ODS documents are a spec'd format with six conformance rules: validates against the
schema; never guesses; states how it would be wrong; ethics can stop a launch; no score without a
reason; states its own limitations.

**What it cost:** every field must be justified, so the generator got longer and slower. It also
got *more useful to machine-read*, which is what makes the GitHub Action, the web app, the API
surface, and the plugin SDK possible at all.

---

## 4. From refuse-nothing to refusals as a return type

**Before:** the tool answered whatever it was asked.

**Now:** fifteen agents, one of which can refuse. `analyze --text "help me mass DM 500 people"`
exits with code 5, prints a refusal object, and offers the supported alternative. The broadcaster
agent's type has no field in which an individual's handle could be stored, so a list of contacts
is not "discouraged" — it is unrepresentable.

**What it cost:** real usability. There are people who wanted the contact list. They are right
that it would help them, and wrong that it is available here. Recorded in
`governance/decisions/0003-never-generate-a-contact-list.md` with the dissent.

**The bug this created, and the second-order lesson:** the abuse screen refused to analyse *this
repository's own documentation*, because `SKILL.md` contains the line "Anti-patterns: launch-day
mass DMs". Twice. The first fix (a negation guard) was insufficient; the real fix was requiring
*intent* rather than vocabulary. A safety feature that punishes precision is a censor, and the
record is in `evidence/ethics-incidents/2026-04-safety-feature-as-censor.md`.

---

## 5. From one model path to local-first as the default

**Before:** provider-optional, with the hosted path as the obvious one.

**Now:** `--offline` implies `--provider none`; ingest (14 formats) is pure local parsing; the web
app has no cookies, no telemetry, and a strict CSP; `doctor --offline` asserts "this command made
no network requests". Local mode (Ollama, llama.cpp, LM Studio) is a first-class citizen, not a
degraded fallback.

**Why it matters:** this tool reads unpublished work. A launch description before publication
contains what you are betting on and where you are weak. If analysing it requires a server, the
careful user does not run it.

**What it cost:** the hosted experience is less convenient, and the "AI writes your launch copy"
feature is deliberately *not* the headline, because it cannot be offered without sending the
document somewhere.

---

## 6. From an evaluation claim to a published benchmark with its failures in it

**Before:** tests existed for the code. Nothing measured the detectors.

**Now:** `fixtures/eval-dataset.jsonl`, 32 hand-written cases across 12 detection targets with
explicit `mustNot` lists; `npm run bench` writes `evidence/benchmarks/`; CI fails on a precision
regression below the published floor; and **every case the engine gets wrong is published by
name**, including one that is kept in the dataset as a known miss with a written explanation of
why it was not tuned away.

**The numbers:** precision 1.000, recall 0.958, false-positive rate 0.000, 31/32 cases passing.

**Why those numbers are not impressive:** the dataset and the detectors share an author. That is
a conflict of interest, and the results file says so in its limitations section before it shows
the table. The purpose of the benchmark is not to prove the engine is good; it is to make a
regression visible and to publish the misses.

---

## 7. From "self-graded 10/10" to a grading that has to survive its own tool

**Before:** a self-evaluation that asserted the project was good.

**Now:** the project runs its own honesty audit on its own README, and that audit returns
`do_not_launch_yet: true` with two blockers — because the README quotes the phrases the audit
catches, and the audit cannot tell a quotation from an assertion.

The alternatives were to reword the examples until the checker went green (tuning the document to
the tool) or to hide the result. Both were rejected. The failure is recorded in
`evidence/failures/2026-04-audit-flags-own-example.md`, alongside a falsifiable condition for
when the fix would be worth making.

The earlier draft of this file quoted "630/1000" as proof the rubric was honest. That number went
stale the moment the document changed. **A README that quotes its own score will always
eventually be wrong**, which is why the current text names the command to re-run instead of the
result.

---

## 8. From a repository tree full of intentions to a smaller, honest one

**Before:** the architecture specified `apps/api`, `apps/browser-extension`,
`apps/vscode-extension`, `apps/mobile-pwa`, `apps/chatbot-{slack,discord,telegram}`,
`packages/{ui,sdk,docs}`, and ten `examples/` subdirectories. All empty.

**Now:** they are **deleted**, and `docs/architecture.md` lists them as specified-but-unbuilt with
their intended paths.

**Why:** an empty directory is a claim that something exists there. In a repository whose central
thesis is that software should not claim more than it can support, shipping eighteen of them
would have been the exact hypocrisy the project criticises. Recorded in
`governance/decisions/0005-delete-directories-we-could-not-fill.md`.

**What it cost:** a contributor cannot see where their code should go. Mitigated by the
architecture doc naming the path for each unbuilt surface — a sentence instead of a directory.

---

## 9. New surfaces that actually run

| Surface | Status |
|---|---|
| CLI | 15 commands, exit codes 0-5, 7 output formats, works offline |
| Web app | zero dependencies, `node:http`, strict CSP, no cookies, `/api/analyze-form` for no-JS |
| GitHub Action | composite action, sticky PR comment, `fail-on` policy, reads the ODS contract |
| Plugin SDK | manifest validation, sealed rubric, declared permissions **enforced** at runtime |
| Academy | 15 modules with real checkers (`npm run academy -- 04 ./README.md`) |
| Evidence commons | 11 directories, labelled records including our own incidents |
| Governance | commitments, council charter, 5 recorded decisions, sunset plan |

---

## What did not change, on purpose

- **The refusal to invent statistics.** It was the original's best feature and it is now enforced
  by a schema, a test, and a published benchmark instead of by discipline.
- **"Do not launch yet" is a valid output.** Now it is a boolean field in a validated format, so
  it cannot be quietly dropped by a renderer.
- **The original's voice.** Plain sentences, specific numbers, no adjectives carrying the weight
  that evidence should carry. The new material is longer, and the register is the same.

## What is still wrong

Stated here rather than only in the self-evaluation, because the point of this file is the diff:

1. **One author.** Every judgement, including every ethical judgement, has one perspective.
2. **Self-written benchmark.** Precision 1.000 measures agreement with its own author.
3. **Two bindings never executed.** Go and Rust, in CI, unverified.
4. **English only.** Lexicons and negation logic are English-tuned; every eval case is English.
5. **The ethics council is vacant.** Charter written, seats empty, disclosed rather than hidden.
6. **Quotation blindness in the honesty audit.** Documented, unfixed, with a falsifiable
   condition for when to fix it.
7. **A 54-point score swing from a prose edit.** The rubric is more sensitive to wording than it
   should be, and that deserves its own investigation.
