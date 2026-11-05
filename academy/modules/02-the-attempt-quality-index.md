# 02 — The Attempt Quality Index

**25 minutes.** By the end you should be able to read a scorecard and say what it does not
tell you. The second half is the harder half.

## What it is

A rubric. Twenty weighted dimensions, summing to 1000. It scores **the quality of an attempt
at being understood and passed on** — the positioning, the broadcaster fit, the honesty of the
claims, the friction in the way of a forward, the accessibility of the copy.

## What it is not

It is not a probability. It is not a forecast. It is not a measure of the quality of your work
— a brilliant artifact can score low because it was described badly, and a mediocre one can
score high because it was described well.

The most important sentence in this whole project:

> **A high score means the attempt is well-formed. It does not mean the work will spread.**

Two artifacts scoring 720 are comparably described. They are not comparably likely to succeed,
because the index contains no market data at all.

## How to read a score

| Band | Range | What it means in practice |
|---|---|---|
| Not ready | 0-249 | There is not enough here to judge. Usually: no named audience, no category, no failure condition. |
| Fragile | 250-449 | A stranger can read it, but cannot tell whether it is for them. |
| Workable | 450-649 | Forwardable, with effort. The reader has to construct the reason to pass it on. |
| Strong | 650-824 | A specific person could forward this and their reader would understand it. |
| Exceptional | 825-1000 | Rare. Usually a small artifact described precisely. |

Band boundaries are arbitrary. Nothing happens at 450.

## The three numbers that matter

On any report, ignore the total first. Read:

1. **Highest leverage** — where the most points are recoverable. Note this is *not* the lowest
   score; a low score on a light dimension is worth less than a medium score on a heavy one.
2. **Weakest** — the lowest score. Sometimes it is also the highest leverage. Often not.
3. **Basis** — is this dimension `measured`, `structural`, `heuristic`, `user-supplied`, or
   `unavailable`? A heuristic score presented confidently is the thing to distrust.

## The rule that trips everyone

**No dimension may be scored without evidence, an improvement action, and a failure
condition.** If a dimension is `unavailable`, it scores zero — you do not get to mark a number
unknown and keep the number.

That is why a document that omits information scores lower than one that includes it, even if
the omitted information would have been unflattering. The rubric rewards disclosure, not the
appearance of strength. It is the only design choice here that is genuinely load-bearing.

## Exercise

`../exercises/02-read-a-scorecard.md`

Run the engine on your own artifact. Find the dimension with the most points available. Write
down what you would have to *do* to get them — not what you would have to write.

Then answer: what would prove that dimension's score was wrong? If you cannot answer that, the
dimension is not doing any work for you.

## What this module cannot tell you

- Whether the weights are right. They are one person's judgement, published so you can argue
  with them. Change them and you have a fork, which is legitimate — but it is a fork, and its
  scores will not compare with anyone else's.
- Whether 20 dimensions is the right number. It is probably too many to read and about right to
  rank with.
