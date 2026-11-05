# Launch plan

The plan for launching this, written with the tool's own criticism applied to itself.

## The uncomfortable starting position

Running the tool on its own README returns **583/1000 Workable** with
**`do_not_launch_yet: true`** — two honesty blockers caused by the audit flagging the phrases its
own documentation quotes.

The honest response is not to reword until the checker is green. It is to state the blockers as
known, publish the reason, and decide explicitly that they do not block this launch. That decision
is recorded in `evidence/failures/2026-04-audit-flags-own-example.md` with a falsifiable
condition for revisiting it.

**The launch condition, per the tool's own four tests:**

| Condition | Status |
|---|---|
| A reader can tell what it is | Passing — five distinct descriptions tested, all landed on "diagnoses why your launch copy isn't working" |
| The first five minutes work | Passing — `npx viral-engine analyze ./README.md --offline`, no install, no account, no network |
| The claims survive checking | Passing except the two documented self-referential blockers |
| The description matches the artifact | Passing — every claim in the README has a command behind it |

## The broadcaster

Not a list. One category, named first:

**The curator.** A person whose reputation is "found a useful thing and explained why". Concretely:
writers of small newsletters covering developer tools, launch practice, or open-source maintenance.

- **Why them:** their readers are the people who write launch copy and wonder why it did not work.
- **How to find them:** read the newsletters that cover this category and note who writes about
  method rather than product.
- **Disqualifier:** anyone whose newsletter is a paid placement channel. A mention there converts
  nothing and tells you nothing.
- **Consent status:** not-contacted.
- **Max contacts:** 3.

**The message, with no ask in it:**

```
Subject: a tool that scores whether your launch copy is legible

You wrote about why good tools fail to spread, which is the question I have been
stuck on for a year.

I built Viral Engine Commons: it scores an artifact on 20 dimensions out of 1000
and names the three where a fix would return the most points. It runs offline and
it will tell you not to launch. The protocol is public domain and there are four
implementations.

No action needed — sending it in case it is useful for your readers.
If it is not, no reply is the right reply.
```

## The three hook mechanisms (all honesty-checked)

Every one names its mechanism, because the mechanism is the reusable part.

| Mechanism | Line | Why it works |
|---|---|---|
| Negative comparison | "It's not a growth tool. It's a diagnosis of why nobody passed your work on." | places it instantly, and the "not" is a real category people know |
| Concrete number | "20 dimensions, 1000 points, and one of them is honesty — which is why it blocks its own README." | the number is checkable and the self-application is memorable |
| Compressed loss | "You rewrote the hook three times. The problem was the category." | states the reader's wasted effort, which they recognise |

**Banned from the launch:** any statistic about how many launches fail. We do not have one, nobody
credibly does, and quoting an invented base rate would destroy the only thing this project has.

## The pre-registered test

Written down before the launch, which is what makes it a test:

> **We expect** at least 5 forwards from people who are not the author, **within 14 days**, **of
> which at least 2 come from someone with no prior relationship to the project**.
>
> **Decision if it fails:** the problem is the description, not the artifact. Rewrite the first
> three sentences and the forwardable unit, then re-run the five-reader protocol from academy
> module 09 before trying again.

And the kill criterion:

> **If** fewer than 5 forwards happen in 14 days **and** the five-reader protocol shows 3 or more
> people describing it as "an AI tool for launch copy", **then** the category in the README is
> wrong and the repositioning is the work, not the launch.

## Channels, in order

1. **The repository itself.** The README is the landing page, the demo, and the proof. It has to
   work with zero context.
2. **`npx`.** The 60-second start is the whole funnel. If the first command fails on a clean
   machine, nothing else matters.
3. **Three curators, by the no-ask message.** Not fifty. Three.
4. **One community where the rules permit it,** after reading the rules. If self-linking is
   banned, it is banned.
5. **Nothing else.** No Product Hunt launch-day sprint, no cross-posting the same text to twelve
   subreddits, no "we're live!" threads. Those are the anti-patterns this repository names in its
   own academy, and doing them would make the whole document set worthless.

## What would make this launch dishonest

Listed so it can be checked afterwards:

- Quoting a market size for "launch tools" without a source.
- Presenting the 171 passing tests as evidence the tool is *useful* (it is evidence the code is
  tested).
- Presenting precision 1.000 without the conflict-of-interest note.
- Calling the Go and Rust bindings "supported".
- Claiming the ethics council exists.
- Any sentence containing "guaranteed", "10x", or "viral" used as an outcome.

## What happens after

`evidence/wins/` and `evidence/failures/` both get a record within 30 days, whichever it is. The
failure record is the one that matters: a launch post that only exists if it succeeded is how
every other launch post in this field is written, and the sampling bias in
`evidence/README.md` is created exactly that way.

If the launch does nothing, that record goes in `evidence/failed-launches/` with the numbers, and
the next person can read it.

## The sequencing (phases)

| Phase | What | Gate to the next phase |
|---|---|---|
| 0 | Repository, protocol, engine, CLI, tests | `npm run check` green |
| 1 | Protocol conformance in two languages | the Python binding validates the TS output |
| 2 | Academy, evidence commons, governance | the checkers run and the commitments are written |
| 3 | Launch to the repository's own readers | the 14-day test resolves |
| 4 | Outside contribution to the eval dataset | three external cases merged |
| 5 | Ethics council seats filled | three seats, minuted |
| 6 | Go and Rust compiled in CI | both jobs green |
| 7 | First independent implementation | a third party's validator accepts the example |
| 8 | Non-English lexicons | one language tested against the academy |

Nothing after phase 3 is a promise. Phases 4-8 are the work that makes the earlier claims true
rather than merely stated.
