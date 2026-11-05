---
label: reproducible
kind: win
first_person: true
date: 2026-04-18
artifact_type: github-repo
channel: [local-test]
numbers_provided: true
ods_version: 1.0.0
tags: [protocol, cross-language, conformance]
---

# The second implementation found two bugs the first one could not see

## What happened

The TypeScript reference implementation passed 92 tests, served a live web application,
and produced valid-looking ODS documents. Within minutes of the Python validator being
written against the written spec, it rejected the TypeScript output with **36 errors**.

| Metric | Value | Source | Date |
|---|---|---|---|
| TS tests passing before the Python check | 92 | `npx vitest run` | 2026-04-18 |
| validation errors Python found | 36 | `validate_document()` | 2026-04-18 |
| distinct bugs | 2 | triage | 2026-04-18 |
| errors after fixing both | 0 | re-run | 2026-04-18 |

The bugs: `adjacent_categories` emitted `whyLessCrowded` instead of `why_less_crowded`,
and `pre_launch_tests` emitted `successCriterion` instead of `success_criterion` — the
classic camelCase leak from an interface that is checked at compile time by the same
language that reads it back.

## Why this is a win worth recording

Not because the code improved. Because it demonstrates a general rule that this project
now depends on:

> **A format defined by one implementation is not a format. It is that implementation's
> private behaviour with a document attached.**

Within a single language, the interface *is* the truth, so a naming disagreement cannot
be observed. TypeScript's compiler enforced the camelCase interface perfectly. The
renderer read the camelCase keys back. Everything agreed. The document was wrong.

The research analogue is exact: Goel, Watts & Goldstein (2012) showed that diffusion
studies relying on a single data source systematically overestimated cascade size,
because the single source could not disagree with itself.

## What cannot be concluded

- Cannot conclude the protocol is now clean. Two more bindings exist and one of them
  (Rust) has never been compiled, so it has found nothing yet.
- Cannot conclude cross-language testing is sufficient. Both implementations share an
  author and share a reading of the spec; a genuinely independent author would find
  different things.
- n=2 bugs is not a rate. It is an existence proof.

## What generalises

If you ship a format, ship a second reader before you ship the format. The reader is the
test. Ideally, make it someone else's.

## Sources

- `protocol/conformance.md` §6
- `packages/protocol/python/tests/test_ods.py`
- `tests/conformance.test.ts` — now asserts that every generated field is named in the
  schema, so this class of bug fails the build rather than the validator.
