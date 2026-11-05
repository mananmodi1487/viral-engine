# 07 — Honesty under pressure

**25 minutes.** Why honest copy wins on the merits, not only on principle.

## The mechanism

Every claim you make is a promise someone else has to check for you if they forward it. The
more specific and checkable the claim, the easier the forward. The more inflated, the more risk
you transfer to the person sharing it.

> "10,000+ developers love this" — the forwarder cannot check this, and suspects it.
> "47 ms median latency on a 2015 laptop; benchmark in the repo" — the forwarder can check it,
> and it makes them look rigorous for having found it.

Inflated claims feel like they increase persuasion. They increase *skepticism* in exactly the
audience that matters: the person deciding whether to attach their name.

## The four claim types, and what each needs

| Type | Example | What makes it honest |
|---|---|---|
| Measured | "47 ms median, p95 112 ms, on 2015 hardware" | the method, the hardware, and the date |
| Structural | "reads files locally; makes no network calls in `--offline`" | a way to verify (run it) |
| Attributed | "Berger & Milkman found high-arousal content travels further" | the citation, and the caveat that this is their finding, not yours |
| Unknown | "we do not know how many people use it" | literally saying so |

The fourth row is the one that buys the most credibility per word. Almost no marketing copy
contains it, which is precisely why it works.

## The five phrases to remove

1. **Multipliers without a base.** "10x your audience." 10x of what, measured how, over what?
   Replace with the plan: "the target is 1,000 readers in 90 days, measured by newsletter
   signups."
2. **Superlatives without a comparison set.** "The fastest." Than what, on what?
3. **Testimonials without a source.** If you cannot link it, do not say it. A `self-reported`
   label in an evidence record is honest; a quotation mark in a headline is not.
4. **Urgency that is not real.** "Only 3 spots left" is a lie unless there are three spots.
   Manufactured scarcity is the most common dark pattern in launch copy and it destroys trust
   on second contact.
5. **Outcome promises.** "Guaranteed to grow your following." Nobody can guarantee this, so
   anyone who does is either lying or has discovered manipulation.

## The reframe that makes this easy

You are not removing claims. You are **downgrading them to their evidence class**:

| Before | After |
|---|---|
| "Used by thousands of developers" | "Used by [n] developers, as of [date] — we have no way to count the rest" |
| "Blazing fast" | "0.4 s on a 2,000-file repo; the benchmark script is in `scripts/`" |
| "Teams love it" | "Two teams have told us what broke; both reports are in `evidence/`" |

Every "after" is stronger, because a reader can act on it and a forwarder can defend it.

## The uncomfortable part

The honesty audit will catch the crude cases — guarantees, invented numbers, urgency. It will
not catch the sophisticated ones: the true-but-misleading framing, the cherry-picked comparison,
the citation that does not say what you imply it says.

**The tool can check whether your claims are shaped like claims. It cannot check whether they
are true.** Only you can, and the audit's `cannotCheck` list says so on every run.

## Exercise

`../exercises/07-clean-your-claims.md`

Run `npx viral-engine honesty-audit ./README.md --offline`. Fix every blocker. Then do the part
the tool cannot: read your own copy as a hostile stranger and find one claim that is technically
true and misleading. Rewrite it.

## What this module cannot tell you

- Whether a specific statistic is correct. The tool has no database of facts.
- Whether your framing, while true, creates a false impression. That is a judgement about
  context, and it is yours.
