# Open Diffusion Spec (ODS) 1.0.0

**A public, implementable, evidence-labelled way to describe an artifact and its diffusion state.**

Status: `1.0.0` — stable for the 1.x line. Owned by nobody. Licensed CC BY 4.0 (text) / Apache-2.0 (schema files).

---

## 1. Why this exists

There are schemas for products (schema.org/Product), articles (schema.org/Article), and scientific
output (JATS, RO-Crate). There was no schema for the awkward question in between:

> *This thing exists. Why has it not been found, understood, and passed on?*

Every existing answer to that question lives inside a growth team's private dashboard, phrased in
metrics that only make sense after the fact (impressions, CTR, conversion). Those metrics cannot
describe an artifact that has not launched yet, cannot be audited by someone else, and cannot be
compared across projects.

ODS describes the **attempt**, not the outcome:

- what the artifact claims to be, and what it is structurally
- which category it competes in, with labelled evidence for that judgement
- who would have to carry it, and under what consent
- what makes forwarding expensive
- which claims would not survive being checked
- what failure would look like, said before launch
- what was learned, labelled by evidence quality

Three design commitments make it different from a JSON dump of opinions:

1. **Every judgement carries a `basis`** — `measured`, `structural`, `heuristic`,
   `user-supplied`, or `unavailable`. `unavailable` is a first-class value. There is no sixth
   option where the implementation guesses and presents it as fact.
2. **Failure conditions are required, at the top level.** A document that cannot say how it fails
   is not an assessment.
3. **No score may exist without evidence strings, an improvement action, and a failure
   condition.** Enforced in `packages/protocol/src/aqi.ts` and in the JSON Schema.

## 2. Minimal valid document

```json
{
  "ods_version": "1.0.0",
  "artifact": { "id": "example-001", "name": "Example", "type": "github-repo" },
  "current_positioning": {
    "one_sentence_description": "A spread diagnostic for people who already published.",
    "claimed_category": "growth tooling"
  },
  "honesty_audit": {
    "invented_stats_detected": false,
    "fake_testimonials_detected": false,
    "guaranteed_outcomes_detected": false,
    "manufactured_outrage_detected": false,
    "dark_patterns_detected": [],
    "required_fixes": [],
    "passed": true
  },
  "scorecard": {
    "aqi_version": "1.0.0",
    "max": 1000,
    "total": 0,
    "dimensions": []
  },
  "failure_conditions": [
    {
      "statement": "This assessment fails if it would read identically for a different project.",
      "observable": "Swapping the input produces the same report.",
      "horizon": "Immediately, on your own read-through"
    }
  ],
  "ethics_review": {
    "ethical_risk_check": [
      { "risk": "Weaponisation as a spam generator", "assessment": "caution" }
    ],
    "do_not_launch_yet": false,
    "reviewer": "deterministic-rules"
  }
}
```

Everything else in the schema is optional and additive. See [`examples/ods-example.json`](./examples/ods-example.json)
for a complete document.

## 3. The field groups

| Group | Question it answers | Required |
|---|---|---|
| `artifact` | What is this, in machine terms? | yes |
| `provenance` | Where did the analysed text come from, and was it read in full? | no |
| `current_positioning` | What does it claim to be? | yes |
| `category_analysis` | What is it actually competing with, and how crowded is that? | no |
| `audience_analysis` | Who specifically would recognise themselves? | no |
| `broadcaster_analysis` | Who carries it, and under what consent? | no |
| `friction_analysis` | Why is forwarding expensive? | no |
| `honesty_audit` | What would not survive being checked? | yes |
| `scorecard` | The Attempt Quality Index, 0–1000, with evidence per dimension | yes |
| `launch_assets` | What a forwarder needs, already made | no |
| `experiments` | What small test would change the plan? | no |
| `failure_conditions` | How would we know this failed? | yes, ≥1 |
| `post_launch_learning` | What did we learn, labelled by evidence quality? | no |
| `ethics_review` | Would the audience accept this plan if they read it? | yes |
| `accessibility` | Can people outside the author's context read it? | no |
| `limitations` | What can this document not tell you? | no |

## 4. Evidence labels

These apply to *claims about the world* (in `evidence/` case studies and in
`post_launch_learning`):

| Label | Means | How to treat it |
|---|---|---|
| `self-reported` | The author says so, unaudited | Interesting, not evidence |
| `verified` | An independent party checked the artefact of the claim | Citable |
| `reproducible` | Anyone can rerun the method and get the same result | Strongest |
| `anecdotal` | n = 1, honestly labelled | A hypothesis generator |
| `unclear` | Provenance is lost | Do not aggregate |
| `contested` | Someone disputes it, with reasons attached | Read both sides or cite neither |
| `private-redacted` | True, but the specifics are withheld to protect someone | Cite the label, never the number |

A public claim that aggregates `self-reported` numbers into a total is fabrication with extra
steps. The Tools must refuse it; see `governance/anti-abuse.md`.

## 5. Conformance

An implementation is **ODS 1.0 conformant** if it:

1. emits a document validating against `ods-1.0.0.schema.json`;
2. uses `unavailable` rather than an invented value when it cannot determine something;
3. includes at least one top-level `failure_condition`;
4. includes `ethics_review.do_not_launch_yet` as a boolean, and sets it when its own honesty audit
   fails;
5. does not emit a dimension score without `evidence`, `improvement`, and `failure_condition`;
6. states in `limitations` at least one thing it cannot determine.

It is **conformant with an extension** if it adds fields under a namespaced key
(`x_yourorg_...`) — see [`schema-versioning.md`](./schema-versioning.md).

Conformance is self-declared and testable. There is no certification body, no fee, and no badge
you can buy. There is a test suite: `npm run conformance`.

## 6. What ODS deliberately does not contain

- **No virality probability.** Not because it would be hard, but because a probability field would
  be read as a forecast and used to justify spending money. Rubrics get audited; predictions get
  believed.
- **No follower counts or reach estimates.** They invite gaming and are unverifiable without
  scraping.
- **No personal profiles.** `broadcaster_analysis` names *roles plus discovery methods*, never a
  scraped individual. This is a schema-level privacy decision, not a policy suggestion.
- **No emoji-enriched "AI score" of 97/100.** Twenty dimensions with evidence beats one number
  with none. The single number exists only as a sum of the twenty, and only so two attempts can be
  compared.

## 7. Versioning, extensions, and forks

See [`schema-versioning.md`](./schema-versioning.md). Short version: additive fields bump the
minor version; removals and semantic changes bump major; a major version must keep a migration
path. Anyone may fork the spec; a fork must not use the ODS name for an incompatible schema.

## 8. Implementations

Status is stated per language, because "supports Python" means nothing if nobody ever
ran the tests. The column that matters is the last one.

| Language | Location | Tests actually run | Status |
|---|---|---|---|
| TypeScript | `packages/protocol/src/` | `npx vitest run` — 151 tests, run on every commit | **Reference.** Complete: types, JSON Schema, validators, all renderers. |
| Python | `packages/protocol/python/` | `python -m pytest tests` — 19 tests, run locally and in CI | **Tested.** Pydantic v2 models, full validation, same weights file. |
| Go | `packages/protocol/go/` | `go test ./...` in CI only | **CI-only.** Structs, validation, no external dependencies. Never executed by the author: no Go toolchain was available at time of writing. Treat as a draft that compiles in CI until a human runs it. |
| Rust | `packages/protocol/rust/` | `cargo test` in CI only | **CI-only.** serde types plus validation. Never executed by the author, for the same reason. |

The distinction is deliberate and it is the whole point of publishing a status column:
a binding nobody has run is a claim, not an implementation. Two of the four bindings in
this repository were written without a compiler in reach. They are in CI now, so the
claim becomes checkable — but until that CI has actually gone green, the honest label is
**CI-only**, not "supported".

If you implement ODS in another language, open an issue with the link and we will list it
here, with the same status column. A protocol with one implementation is a product; a
protocol with three independent implementations that disagree in useful ways is a
protocol. The first serious cross-language check in this repository found two real bugs
in the reference implementation — see `protocol/conformance.md`.

## 9. Citing ODS

```
Viral Engine Commons. (2026). Open Diffusion Spec 1.0.0.
https://github.com/mananmodi1487/viral-engine/blob/main/protocol/open-diffusion-spec.md
```

The honest citation includes what ODS cannot do:

> ODS is a rubric protocol for describing an attempt at diffusion, not a predictive model of
> diffusion. Its scores are reproducible by design and have no demonstrated causal relationship
> with reach.
