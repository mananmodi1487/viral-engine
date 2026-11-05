# Decision log

Every decision that changed behaviour in a way a user could notice, plus every decision where
a maintainer disagreed.

## Why publish the disagreements

A decision log that reads as a series of obviously-correct choices is either extremely short
or edited. Recording dissent is what makes the log useful to someone three years later asking
"why is it like this?" — and it is the only protection against a future maintainer reading a
smooth log and concluding that no one ever thought about the alternative.

## Format

`NNNN-short-title.md`:

```markdown
# 0007 — Refuse to generate a contact list, ever

- **Date:** 2026-04-18
- **Status:** accepted | superseded by NNNN | rejected
- **Deciders:** names

## Context

What forced a decision.

## Options considered

Each option with its cost. Include the ones that lost — that is the whole point.

## Decision

What was chosen, in one sentence.

## Consequences

What becomes easier, what becomes harder, and what is now impossible.

## Dissent

Who disagreed, and their argument, recorded in their own framing.
```

## Index

| # | Decision | Status |
|---|---|---|
| 0001 | Points lost is the leverage metric, not raw score | accepted |
| 0002 | The index is 1000 points across 20 weighted dimensions | accepted |
| 0003 | Never generate a list of individuals to contact | accepted |
| 0004 | Two-language conformance before publishing ODS 1.0.0 | accepted |
| 0005 | Delete directories we could not fill | accepted |
