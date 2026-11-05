# How scoring works

Seven dimensions, 0–100. Higher is better **except Honesty Risk**, which is inverted and labelled.

Every dimension carries an `EvidenceBasis` (`measured` / `structural` / `heuristic` / `unavailable`). This exists because the honest answer to "how did you get this number" differs per dimension, and pretending otherwise is how scorecards start lying.

---

## 1. Category Clarity — *structural*

**Question:** does the document name the category it is competing in, and the person it is for?

| Signal | Effect |
|---|---|
| Explicit `it's not X, it's Y` pairing | **+30** |
| A one-line description exists | +12 |
| Names an audience (identity markers) | +10 |
| Jargon density > 12% | **−12** |
| Baseline | 35 |

The pairing is worth the most because it is the only signal that proves a category decision was made rather than inherited. Jargon is penalised because a document that needs a glossary cannot be forwarded without a footnote.

**Fix when low:** add one sentence of the form `It's not <crowded category>. It's <new category> — for <specific person>.`

---

## 2. Broadcaster Fit — *structural*

**Question:** could one person with an audience pass this on, and would they know how to describe it?

| Signal | Effect |
|---|---|
| Community/tribe cues present | +22 |
| ≥3 recurring proper nouns | +18 |
| ≤900 words (quotable in one screen) | +15 |
| First-person receipt present | +15 |
| Baseline | 30 |

Word count scales down gradually above 900 rather than falling off a cliff: a 1,400-word post is not unshareable, it is just harder to summarise.

**Fix when low:** name one real broadcaster and write the sentence they would paste. If you cannot, there is no amplifier.

---

## 3. Share Friction — *measured* (higher = less friction)

**Question:** how much work stands between a curious reader and first value?

Starts at 100 and subtracts:

| Signal | Effect |
|---|---|
| Prerequisite/configuration cues | −1 to −45, saturating |
| >3 setup steps | −15 |
| 0 setup steps (no explicit start) | −10 |
| >8 code blocks (hard to screenshot) | −12 |

The saturating penalty is deliberate: the difference between 0 and 2 prerequisites matters more than between 8 and 10.

**Fix when low:** cut the path to first value to one command; move everything else into a collapsible block.

---

## 4. Emotional Stake — *heuristic*

**Question:** does the copy create arousal, the kind that makes someone act?

Basis: Berger & Milkman (2012), *Journal of Marketing Research* 49(2) — high-arousal emotions (awe, anger, anxiety, amusement) increase sharing; deactivating emotions (sadness) decrease it. The variable is **activation, not valence**.

```
score = 40 + saturate(arousal − deactivating, half=2, max=45) − min(25, deactivating × 6)
```

**This is the dimension to distrust most.** It counts keywords. It cannot tell the difference between genuine awe and a cynical "SHOCKING". It is labelled `heuristic` everywhere it appears for that reason.

**Fix when low:** add one concrete stake — what does the reader lose by ignoring this, in their own words?

---

## 5. Proof Readiness — *measured*

**Question:** can every claim survive being checked?

| Signal | Effect |
|---|---|
| Each honesty **blocker** | **−22** (max −50) |
| No blockers detected | +15 |
| Each warning | −6 (max −20) |
| Specific verifiable figures present | +12 |
| First-person evidence | +12 |
| Already states a failure condition | +11 |
| Baseline | 50 |

A blocked document cannot score well here regardless of how good the writing is. That is the intended behaviour: an unbacked claim is a factual problem, not a stylistic one.

---

## 6. Launch Timing — *heuristic*

**Question:** is this ready to be shown to strangers?

| Signal | Effect |
|---|---|
| 1–3 setup steps (a working first-run path) | +25 |
| >3 setup steps | +5 |
| Self-described unstable/WIP/alpha | −18 |
| Kill criteria already written | +15 |
| Baseline | 45 |

---

## 7. Honesty Risk — *measured* · **INVERTED**

**Higher is worse.** The label says so in the CLI, the Markdown table, and the HTML report.

```
risk = min(100, blockers×35 + warnings×12 + notes×4)
```

It is excluded from the positive mean and applied as a multiplier instead:

```
overall = mean(six positive dimensions) × (1 − risk/200)
```

So five blockers cannot produce a confident score. A clean document is not penalised.

---

## Overall

```
overall = mean(categoryClarity, broadcasterFit, shareFriction,
               emotionalStake, proofReadiness, launchTiming)
          × (1 − honestyRisk/200)
```

Rounded, clamped to 0–100.

**`doNotLaunchYet`** is true when `overall < 35` **or** any honesty blocker exists.

---

## What the scores are not

- **Not a prediction.** No number here forecasts reach, stars, sales, or virality. Goel, Watts & Goldstein (2012/2016) found large cascades are ~0.025% of diffusion events; nothing in a 400-word document changes that.
- **Not comparable across documents.** A 51/100 README and a 51/100 landing page are not the same artifact. Compare a document to its own previous version.
- **Not a quality judgement of the product.** A useful tool with a bad description scores low, correctly: the diagnosis is about the *attempt*, not the thing.
- **Not precise.** Treat differences under ~5 points as noise.

---

## The evaluation harness

```
npm run bench
```

Runs labelled fixtures from `fixtures/benchmark.json` through the detector and reports precision/recall, plus a full-pipeline check that every fixture yields a schema-valid report. CI fails below 85% precision or 80% recall.

**Current state: 7 fixtures, 100% precision, 100% recall.**

That number should be read with suspicion, and the docs say so on purpose:

- 7 fixtures is a smoke test. It proves the rules fire and the pipeline holds together.
- The fixtures were written by the same person who wrote the rules, which is a conflict of interest.
- Labelling is **partial**: only signals a case names are scored. Labelling all five signals for every case would invite invented expectations.
- The negative cases matter more than the positives: `honest-disclaimers` exists specifically to catch a regression where warnings get flagged as claims.

**To make this number mean something:** add 30+ real documents with outcomes, written by someone other than the rule author, including several genuine failures. That is the next iteration (see `docs/contributing.md`).
