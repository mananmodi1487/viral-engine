# Outcomes

The smallest and most important directory in the repository.

Everything else here describes an attempt. This directory records what *happened* after one, in a
form that can be aggregated without anyone's interpretation in the middle. It exists so that the
AQI can eventually be checked against reality — and so that it can be shown to be wrong.

## The rule

**A record is a row, not a story.** One JSON object per line in `records.jsonl`. Prose goes in
`evidence/failures/` and `evidence/wins/`; this file is for arithmetic.

Records are rejected, not repaired. If a field is missing, the row is skipped and the reason is
printed by `npm run calibrate`. A defaulted outcome is a fabricated outcome.

## The format

```json
{"aqi": 612, "aqiVersion": "2.0.0", "outcome": 14, "outcomeUnit": "unique visitors in 14 days", "outcomeDefinedBy": "protocol", "label": "self-reported", "horizonDays": 14}
```

| Field | Required | Why it matters |
|---|---|---|
| `aqi` | yes | The total at the time of analysis. |
| `aqiVersion` | yes | Scores from different rubric versions are not on the same scale. Rows are analysed per version and never pooled. |
| `outcome` | yes | A number. A win/loss label cannot be correlated, and turning one into 1/0 is a choice the submitter did not make. |
| `outcomeUnit` | yes | The AQI is correlated with *one* measure. If the units differ across rows, the report says so instead of averaging them. |
| `outcomeDefinedBy` | no, defaults to `submitter` | `protocol` means the measure was fixed before the attempt (see `protocol/measures.md`). `submitter` means it was chosen afterwards, which allows the choice that flatters the result. The report labels this and does not correct for it. |
| `label` | yes | `verified` / `reproducible` / `self-reported` / `anecdotal` / `unclear` / `contested` / `private-redacted`. Only `verified` and `reproducible` rows are analysed as a separate stratum. |
| `horizonDays` | yes | What persisted. A three-day spike and a ninety-day tail are different phenomena. |

## Why there is no starter dataset

It would be trivial to generate 200 plausible rows and this repository would look far more
credible for it. That would be the exact offence the honesty policy names first. The file starts
empty and the calibration report starts by saying `n = 0`.

The first honest row will come from this project's own launch, and it will be labelled
`self-reported`, because the author is the one typing it.

## Known ways this becomes useless

1. **Only successes get submitted.** The report names this as a sample problem; it cannot fix it.
2. **Outcome definitions drift.** Someone reports "signups" for one attempt and "installs" for
   another. The unit check catches this; it does not resolve it.
3. **The horizon is chosen after the fact.** The `protocol` option in `protocol/measures.md` exists
   to pre-commit before launching, and it is a habit, not an enforcement.
4. **Almost nobody submits anything.** Then the honest output is `n = 0` forever, and the tool keeps
   saying the rubric is unvalidated. That is the correct outcome for a repository with no evidence,
   and the pressure to fix it with invented data is the thing to resist.
