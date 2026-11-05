# Conformance

What it means to implement the Open Diffusion Spec, how to prove you have, and what
happens when two implementations disagree.

Version: **ODS 1.0.0** · Audited: 2026-04-18

---

## 1. Why this document exists

A spec without conformance is a wish. Anyone can write a `README.md` that says
"implements ODS". The only thing that makes the claim meaningful is a shared set of
checks that a third party can run against your output without trusting you.

This repository currently ships four implementations. Two are tested on every commit.
Two are compiled only in CI, because no compiler was available when they were written.
That is stated plainly in `open-diffusion-spec.md` §8, and it is stated here again
because it is the difference between a claim and a fact.

---

## 2. What conformance means

A document produced by your implementation is **conformant at level 1** if all six
rules below hold. Levels are cumulative.

### Rule 1 — It validates against the schema

`packages/protocol/ods.schema.json` (JSON Schema 2020-12) accepts it. Unknown
top-level fields are rejected, with one exception: the `x_` namespace is reserved for
extensions and must be tolerated by every consumer.

### Rule 2 — It never guesses

Every field that describes the outside world is either:

- a measurement, with `basis: "measured"` and the measurement stated, or
- a labelled estimate, or
- the string `"unknown"` with a non-empty `missing_data` list.

The forbidden fourth option is the one most tools choose: a confident number with no
basis behind it. `saturation_estimate: "unknown"` **must** carry `missing_data`. A
dimension with `basis: "unavailable"` **must** score zero — you do not get to mark a
number unavailable and then keep the number.

### Rule 3 — It states how it would be wrong

`failure_conditions` must contain at least one entry, and each entry must have all
three parts:

| Field | Question it answers |
|---|---|
| `statement` | What would prove this attempt wrong? |
| `observable` | What would you actually see, that a stranger could also see? |
| `horizon` | By when? |

"Not enough traction" is not a failure condition. "Under 20 forwards in 14 days from
people who are not the author" is.

### Rule 4 — Ethics can stop the launch

`ethics_review.do_not_launch_yet` is a boolean and it is always present, because "not
yet" is a legitimate answer and must be expressible in the data rather than only in a
sentence.

Hard rules that a validator must enforce:

- any `ethics_review.ethical_risk_check[].assessment === "violation"` forces
  `do_not_launch_yet: true`;
- `do_not_launch_yet: true` requires a non-empty `do_not_launch_reason`;
- `honesty_audit.passed === false` with `do_not_launch_yet: false` is a validation
  error — you cannot fail your own honesty audit and still clear the launch.

### Rule 5 — No score without a reason

Every AQI dimension carries, non-empty:

`evidence` · `confidence` · `basis` · `assumptions` · `missing_data` ·
`improvement` · `failure_condition`

A dimension missing any of these is a validation error, not a style problem. The sum
of `points` must equal `scorecard.total` to within ±2 (float rounding tolerance in
TypeScript and Python; ±0.5 in Go and Rust, which use integers).

### Rule 6 — It states what it cannot do

`limitations` must contain at least one entry, and `scorecard.disclaimer` must say the
index is not a forecast. These are checked, not merely recommended, because the single
most damaging thing this protocol could do is be mistaken for a prediction engine.

---

## 3. Level 2 — the weights are not yours

A level-2 implementation reads `protocol/aqi-weights.json` at runtime rather than
copying the numbers into source.

This is the rule that separates an implementation from a fork. If you hardcode twenty
weights, you have not implemented the protocol; you have implemented your own rubric
with the same name, and every score you produce is incomparable with everyone else's.

Concretely:

| Language | How the shared rubric is loaded |
|---|---|
| TypeScript | `import weights from '../../../protocol/aqi-weights.json'` |
| Python | walk up from `__file__` to `protocol/aqi-weights.json`, override with `VIRAL_ENGINE_WEIGHTS` |
| Go | `LoadWeights(nil)` walks up from the working directory |
| Rust | `load_weights(None)` walks up from the current directory |

The override exists so a downstream distribution can pin a rubric snapshot. It does
not exist so anyone can quietly reweight the index and still call it ODS 1.0.0 — a
different rubric is a different `aqi_version`, and a document declaring 1.0.0 must
sum to exactly 1000.

---

## 4. Level 3 — disagreement is resolved by data

A level-3 implementation is listed in §5 of `open-diffusion-spec.md`, runs the shared
example through its own validator in CI, and agrees with the reference on the total.

---

## 5. How to run the checks

### Against a document you produced

```bash
# Python (the easiest to script in CI)
pip install -e packages/protocol/python
python - <<'PY'
from viral_engine_ods import validate_document, load_document
doc = load_document('my-document.json')
errors = validate_document(doc)
if errors:
    for e in errors: print('FAIL', e)
    raise SystemExit(1)
print('conformant:', doc['scorecard']['total'])
PY
```

### Against the repository's own output

```bash
npx tsx apps/cli/src/index.ts analyze ./README.md --offline --output json -o /tmp/doc.json
cd packages/protocol/python && python -m pytest tests -q
```

### The reference example

`protocol/examples/ods-example.json` is a real generated document, 73 KB, kept in the
repository so that every binding can be tested against the same input without
regenerating it. It must validate in every implementation. If it does not, the
protocol has diverged and that is a bug in one of the implementations — not in the
example.

---

## 6. The bugs this process actually found

Not hypothetical. Both were in the **reference** implementation, which had already
passed 92 TypeScript tests and served a live web app, and both were found by the Python
binding within minutes of it being written.

### Bug 1 — `adjacent_categories` emitted camelCase

The schema and the spec say:

```json
{ "why_less_crowded": "...", "credibility_risk": "...", "tension_score": 0.4, "proof_needed": "..." }
```

The reference emitted `whyLessCrowded`, `credibilityRisk`, `tensionScore`, `proofNeeded`.
TypeScript was perfectly happy: the interface is checked at compile time, and the
renderer read the same camelCase keys back, so the bug was invisible from inside the
language. It only appears when a second implementation tries to read the document
according to the written spec.

### Bug 2 — `pre_launch_tests` had the same fault

`successCriterion` / `killCriterion` / `decisionItChanges` instead of
`success_criterion` / `kill_criterion` / `decision_it_changes`.

### Why this matters more than the fix

A single-language protocol is unfalsifiable. The reference implementation *defines*
what the protocol means, so any document it produces is correct by construction. The
Python validator was the first thing in this project capable of saying "no" to it.

Two consequences, both now enforced:

1. **The schema is the contract, not the TypeScript interface.** Every generated field
   is asserted against the schema keys in `tests/conformance.test.ts`. A field the
   generator invents that the schema does not name fails the build.
2. **A second implementation is a test, not a port.** If you only ever read your own
   output, you have not tested anything.

The research literature on this is unambiguous: Goel, Watts & Goldstein (2012) found
that most diffusion assumed to be person-to-person was in fact broadcast, and that
studies relying on a single data source systematically overestimated cascade size. The
software lesson rhymes. **One implementation is a single data source.**

---

## 7. Known non-conformance, stated rather than hidden

| Item | Status |
|---|---|
| Go binding | Written without a compiler. In CI now. Until that job has run green, treat it as unverified. |
| Rust binding | Same. `BroadcasterAnalysis::validate` contains a placeholder match arm that is very likely wrong. |
| Multilingual input | No binding has been tested on non-English text. The field is a string; the analysis is English-tuned. |
| Version negotiation | ODS 1.0.0 is the only released version. No migration path has been exercised beyond `x_` tolerance. |
| Numeric tolerance | TS/Python compare totals within ±2, Go/Rust within ±0.5. This is a genuine inconsistency in the spec that should be resolved in 1.1.0. |

---

## 8. What conformance does not mean

Passing every rule above means your document is **well-formed**. It does not mean:

- the score is accurate (there is nothing to be accurate against; the index measures a
  rubric, not an outcome);
- the analysis is useful to a human (no conformance test measures that);
- the positioning described in the document is good (a conformant document can describe
  a bad idea very clearly).

Conformance describes the shape of an argument, not its truth. That limit is load
bearing, and any implementation that markets conformance as an accuracy claim has
misread this document.
