# The limitations

This file is referenced from the AQI disclaimer, from `protocol/aqi-weights.json`, and from every
scorecard the tool emits, so it has to exist and it has to be the unflattering version.

It did not exist until a reader followed the reference and found nothing. That is the most ordinary
documentation failure there is: a link is a promise, and nobody had checked this one.

## What the AQI is

A weighted rubric of 25 dimensions, each scored 0-100 by rules you can read in
`packages/core/src/score/aqi.ts`, multiplied by published weights and summed to 1000. Fourteen
dimensions are computed from the text itself — counted things: words, commands, headings, links,
first-person receipts, banned claims. Eleven involve judgement encoded as thresholds, and every one
of those carries `basis` and `confidence` fields saying how much weight to give it.

The rubric was written to be **useful for deciding what to fix next**, not to be psychometrically
valid. Those are different goals, and only the first one has been attempted.

## What it is not

- **Not a prediction.** There is no model of attention, no market data, and no fitted curve anywhere
  in this repository. High scores have launched into silence. Low scores have been forwarded widely.
  The score has no measured relationship with reach, and we have not measured one.
- **Not comparable across versions.** A 1.x score and a 2.0 score come from different rubrics with
  different dimensions and weights. They cannot be averaged, ranked together, or shown side by side
  without stating both versions. `viral-engine migrate` preserves the old number and marks it
  historical rather than converting it.
- **Not a measure of quality.** A deliberately difficult essay, a private document never meant to
  travel, and a joke told to eleven people can all score badly and be entirely correct. The rubric
  measures legibility-to-a-stranger and honesty-of-claim, because those decide whether an attempt
  *can* travel — not whether it should.
- **Not validated.** "Check whether AQI correlates with outcomes" is on the roadmap and may well
  find no effect. If it finds none, that result goes into `evidence/` like any other.

## Known weaknesses of the rubric itself

1. **The weights are a judgement.** They were chosen for usefulness by one person, not derived from
   a study. A defensible different set would produce different scores, and someone should publish
   one.
2. **The thresholds are brittle.** Several dimensions fire on regular expressions with numeric
   cutoffs — word counts, sentence lengths. They are transparent and arguable, and they will be
   wrong at the margins. The eval harness documents one known miss rather than tuning it away.
3. **English-first.** The rules encode English morphology and idiom. `--language` changes the
   language of the report, not the competence of the rubric. A non-English artifact is scored by
   English rules, and the report says so in its limitations block.
4. **Length bias.** A longer document gets more chances to satisfy a rule. Very short artifacts are
   scored with fewer signals available, which is why `confidence` drops on them.
5. **The five 2.0 dimensions are new.** They have not been used on more than a handful of documents,
   which is why their weights are conservative.

## What it does not prove

A score does not prove the work is good, that anyone will care, that the category is right, that
launching now is wise, or that the named broadcaster will reply. It proves that a specific set of
readable rules, applied to this text, produced this number — and nothing beyond that.

If you quote an AQI number, quote the version with it. If you cannot quote the version, do not quote
the number.
