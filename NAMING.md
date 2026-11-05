# Naming and positioning

## The twenty candidates

Scored on four things: does it survive being said aloud, does it imply something false, does it
scale past one artifact type, is it available as an npm scope / handle (checked informally, not
legally cleared).

| # | Name | Sounds | Implies | Verdict |
|---|---|---|---|---|
| 1 | **Viral Engine** | good, familiar | promises virality | rejected — the original name, and the implication is the problem |
| 2 | **Viral Engine Commons** | long but precise | nothing false; "commons" implies shared governance | **chosen** |
| 3 | Diffusion Engine | clean, scientific | nothing, but cold | runner-up |
| 4 | Spread Diagnosis | descriptive | a medical metaphor that overpromises rigour | rejected |
| 5 | Attempt Quality | accurate | nothing false; too abstract to say | rejected as a name, kept as the metric |
| 6 | Legible | one word, lovely | nothing false; too generic to search | rejected |
| 7 | Forwardable | accurate, specific | nothing false; awkward as a noun | rejected |
| 8 | Broadcast | strong | collides with media and with the research paper it references | rejected |
| 9 | Carrier | evocative | implies carriers are found by the tool | rejected |
| 10 | The Diffusion Protocol | protocol-forward | nothing false | too abstract for a CLI |
| 11 | Honest Launch | good values | implies other launches are dishonest | rejected |
| 12 | Open Diffusion | precise | nothing false | kept as the spec name |
| 13 | Threshold | nice metaphor | vague | rejected |
| 14 | Second Reader | warm | nothing false | rejected — sounds like a service |
| 15 | Category Engine | descriptive | implies market data | rejected |
| 16 | Nudge | short | collides with behavioural-economics literature | rejected |
| 17 | Passed On | beautiful | past tense implies failure | rejected |
| 18 | Legibility Index | accurate | nothing false; still one artifact type | kept as the metric's long name |
| 19 | Viral Engine Lite | — | implies a paid version | rejected on principle |
| 20 | Viral Engine Pro | — | would imply a paywall | rejected on principle |

**The name is two parts, and both matter.** "Viral Engine" is what people search for and what the
repository is already called. "Commons" is the claim about governance: shared, unowned, and
protected by the commitments in `governance/README.md`. The word is doing real work — if the
governance ever lapses, the name becomes a lie, and that is a useful pressure.

## What the name does not promise

It does not say it will make anything viral. "Engine" describes a mechanism you operate, not an
outcome you are given. Every surface repeats the disclaimer because the name alone cannot carry it:

- CLI banner: `ethical diffusion infrastructure`
- Every report: *a rubric, not a prediction*
- `scorecard.disclaimer`, enforced by schema and by test

## One-sentence definition

> Viral Engine Commons is a free, open, local-first protocol and toolchain that diagnoses whether a
> piece of work is legible and forwardable — and tells you not to launch when it is not.

## Hero line

> **Your work did not spread because of the category, not the writing.**

Kept from the original. It is a strong, specific, falsifiable claim, and it is the one sentence the
whole tool exists to test.

## README opener

> You published something. A few people said nice things. Nobody passed it on.
>
> You rewrote the hook. You posted at a better time. Still nothing. And now the advice is "be more
> authentic", which is not actionable, or "post more", which is how people end up spamming.
>
> **Viral Engine Commons reads what you published and tells you which specific thing is stopping a
> stranger from passing it on.**

Why this opener: it starts with the reader's failed sequence, not with the product. The three
sentences of failure are the reader's own experience stated back to them, which is the only kind of
opening that earns a fourth sentence.

## Elevator pitch (30 seconds, spoken)

> Most advice about why something did not spread is about writing. The research says it is mostly
> about broadcast: one specific person deciding to post it. So the leverage is in whether a
> stranger can tell what your thing is, who it is for, and why they would pass it on.
>
> This is a free tool that scores twenty dimensions of that attempt out of a thousand, names the
> three where you are losing the most points, and refuses to tell you it will go viral. It runs
> offline. And it will tell you not to launch.
>
> The protocol is public. You can implement it yourself, and two other languages already do.

## Anti-pitch

The other elevator pitch. Saying this out loud is the fastest way to find out whether the project is
for you.

> **Do not use this if:** you want a list of people to contact (it will not produce one), you want
> a virality score (the number is a rubric, not a forecast), you want a weekend hack that makes
> your traffic graph go up (there is no traffic, this runs locally), or you want the tool to write
> your launch copy for you (it will write placeholders and mark every one).
>
> **It will be slow and slightly annoying.** It will ask you for evidence you do not have, tell you
> a dimension is unavailable because you did not supply the data, and produce a number lower than
> you hoped.
>
> **It cannot tell you whether your work is good.** It can only tell you whether it is legible.
> Those are different, and the second one is the smaller, more tractable question that a document
> can actually answer.

## Anti-positioning

| Not this | Because |
|---|---|
| A growth tool | Growth tools optimise for reach. This optimises for legibility and refuses outreach automation. |
| An AI writing assistant | The scoring is deterministic and a model may only explain, never score. |
| A marketing platform | There is no account, no dashboard, no analytics. |
| A virality predictor | No market data exists, and the number is a rubric for the attempt. |
| A launched SaaS with a free tier | There is no tier. `viral-engine upgrade` prints that. |

## Voice

The register of the original, kept deliberately:

- Plain sentences. Specific numbers. No adjective is allowed to carry weight that evidence should
  carry.
- A failing check means fix the claim, not the check.
- When something is wrong, say what and how wrong, with the record.
- Never use the word "viral" as an outcome in our own copy. It appears only in the name and in
  quoted examples of what not to write.

## Copy that is banned in this repository

Enforced by review, and partly by the honesty audit running on our own docs:

`guaranteed` · `10x` · `game-changer` · `revolutionary` · `unleash` · `supercharge` ·
`hack the algorithm` · `explode your` · `secret sauce` · `nobody is talking about` ·
`only N spots left`

If one of these appears in a merged file, it is a bug and the PR is welcome.
