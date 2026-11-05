---
label: reproducible
kind: failure
first_person: true
date: 2026-04-14
artifact_type: github-repo
channel: [local-test]
numbers_provided: true
ods_version: 1.0.0        # historical: written against ODS 1.x, kept as-is rather than migrated
tags: [false-positive, safety, self-referential]
---

# Our safety screen refused to analyse our own README

## What was published

Nothing. This is a record of a tool failure, not a launch.

During development of Viral Engine Commons, the abuse-prevention screen was run against
this repository's own `README.md`, which contains this sentence in its honesty policy:

> We will never generate fake testimonials, mass DM people, or use sockpuppets.

## What was expected

The screen would pass. The sentence is a **prohibition**, and prohibitions are the thing
an ethical tool is supposed to publish.

## What actually happened

The screen returned a refusal: `spam-intent`, confidence high. The tool declined to
analyse the document that states its own ethical policy.

| Metric | Value | Source | Date |
|---|---|---|---|
| false positives on project's own docs | 2 files | manual run, `README.md` and `SKILL.md` | 2026-04-14 |
| false positives after first fix | 1 file | `SKILL.md`, line 241 | 2026-04-14 |
| false positives after second fix | 0 | full test suite, 151 tests | 2026-04-18 |

## Root cause, in two rounds

**Round 1 — no negation guard.** The pattern `/mass (?:dm|email)/i` matched the phrase
regardless of what came before it. Fixed by looking at the ~70 characters preceding the
match for a negation marker ("never", "no", "won't", "rather than", "instead of").

**Round 2 — still broken on `SKILL.md`.** The line that broke it was:

> **Anti-patterns:** launch-day mass DMs; the same text in 12 subreddits; ...

No negation marker appears before it. The sentence is a *list of things not to do*, and
the preceding negation sits in the previous paragraph, outside the window. Adjacent
solution: widen the window — which would have made the screen useless, because a long
enough document eventually contains "not" somewhere before any phrase.

The actual fix was to change what was being detected. The screen now requires **intent**,
not vocabulary: a hit only counts if the sentence containing it is a request ("help me
…", "how do I …", "write me …"), or if the whole input is under twelve words and is
therefore itself the request. A warning against a practice is no longer a request for it.

## What it resembles

`evidence/ethics-incidents/2026-04-safety-feature-as-censor.md`.

## What cannot be concluded

- Cannot conclude the new rule is sufficient. An adversary can pad a request into a
  paragraph and slip past it. The trade-off was made deliberately in favour of not
  refusing to read documents that discuss harm seriously.
- Cannot conclude this was the only false positive. It is the only one we found with
  tests we wrote ourselves. The evaluation dataset was written by the same people who
  wrote the detectors.
- Cannot quantify how often this happens on documents we have never seen. n=2.

## What I would do differently, stated falsifiably

> If, in the next fifty documents analysed, the screen refuses more than one document
> that is *discussing* a harmful practice rather than requesting it, the intent
> requirement is too weak and needs a second signal.

## Sources

- `packages/agents/src/types.ts` — the `REQUEST` marker and `isRequest()`, with the
  trade-off written in the comment.
- `tests/agents.test.ts` — "does not refuse a warning that names a bad practice".
