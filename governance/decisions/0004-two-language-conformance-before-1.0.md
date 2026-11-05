# 0004 — Two-language conformance before publishing ODS 1.0.0

- **Date:** 2026-04-18
- **Status:** accepted
- **Deciders:** initial author

## Context

The protocol had one implementation, which passed 92 tests. It was ready to be called 1.0.0.
Publishing a version number is a promise of stability to people who have not written code
against it yet.

## Options considered

**A. Ship 1.0.0 on the strength of the TypeScript implementation.** Fastest. The schema was
written down, the versioning doc existed.

**B. Ship 0.9 and call 1.0.0 when a second implementation exists.** Honest, slower.

**C. Write the second implementation first, then ship 1.0.0.**

## Decision

Option C. The Python binding was written against the *specification text*, not against the
TypeScript source, and it immediately rejected the reference output with 36 errors caused by
two real bugs — a camelCase leak in `adjacent_categories` and `pre_launch_steps`.

## Consequences

- 1.0.0 means something slightly stronger than "we wrote it down": it means two independent
  readers of the document agreed.
- The bugs are now a permanent fixture in `protocol/conformance.md` §6, because the *process*
  finding matters more than the fix.
- `tests/conformance.test.ts` asserts every generated field against the schema key list, so
  this class of bug fails the build rather than the validator.
- The Go and Rust bindings were written later without toolchains. They are labelled CI-only,
  not supported, until CI has run them. That label is a direct consequence of this decision:
  if a second implementation is a test, an unrun implementation is not a test at all.

## Dissent

None recorded. The delay cost roughly a day and found two bugs that would have been
discovered by the first third-party implementer instead, who would have concluded the spec was
wrong rather than the reference. That trade is not close.
