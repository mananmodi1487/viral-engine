# Evidence commons

A public record of what happened when people tried to make something spread. Not a
testimonials page. A ledger, with the losses in it.

The reason this exists: almost everything published about diffusion is written by
someone who won. The failures are silent, so the survivors look like the rule. This
directory is an attempt to break that bias by keeping the losses as first-class records
with equal billing.

## The one rule

**Every record carries a label, and the label is chosen by the evidence, not by the
author's confidence.**

| Label | Means | What a reader may do with it |
|---|---|---|
| `verified` | A third party can see the source, and the numbers are attached | Cite the specific claim |
| `reproducible` | Someone else ran the method and got a compatible result | Cite the method |
| `self-reported` | The author says so; no independent source | Read as a hypothesis |
| `anecdotal` | One story, no numbers | Read as an illustration, never as a rate |
| `unclear` | Nobody knows how solid this is | Do not cite |
| `contested` | Someone disputes it and the dispute is recorded here | Cite both sides |
| `private-redacted` | A real record with identifying details removed | Cite the shape, not the details |

A record without a label is not a record. It is a story, and it belongs in a blog post.

## What these records cannot support

This is the section most projects omit, so it goes at the top:

- **You cannot compute a success rate from this directory.** The wins were submitted
  more often than the failures. That is a sampling bias we cannot correct, only
  disclose. Any "X% of launches succeed" figure derived from these files is wrong.
- **Survivorship is baked in.** People delete their failures. We kept ours
  (`failures/`) specifically so that at least some of them are visible.
- **No causal claims.** Nothing here shows that following the advice caused the
  outcome. The most common outcome in this directory is "it worked and we do not know
  which part mattered".
- **Small n.** Count the files before you generalise.
- **English and Western-platform skewed.** Almost every record comes from GitHub, X,
  Hacker News, LinkedIn, or Product Hunt. That is a narrow slice of the world.

## How to add one

Open a PR with a file in the right directory, following `_template.md`. If you are
submitting your own failure, add the `first-person` tag so readers can weigh it
accordingly. If you are submitting someone else's failure, you need their consent or
public sourcing, and you may not name a private individual.

Records are reviewed for label accuracy, not for how flattering they are. A carefully
labelled `anecdotal` record is worth more than an unlabelled `verified` one.

## Structure

```
evidence/
  wins/                  what worked, with the numbers that exist
  failures/              what did not work, including this project's own
  postmortems/           structured "what happened" narratives
  benchmarks/            machine-generated results, reproducible
  case-studies/          long-form, multi-record analyses
  failed-launches/       launches that went out and died, anonymised on request
  broadcaster-patterns/  who actually passes things on, and how
  hook-patterns/         opening lines and what they did
  category-shifts/       before/after repositioning, with dates
  ethics-incidents/      times this ecosystem did harm, recorded so we do not repeat it
  datasets/              raw inputs other people can reanalyse
```

`benchmarks/` is generated. Do not hand-edit it; `npm run bench` writes it, and CI
fails if it is stale.
