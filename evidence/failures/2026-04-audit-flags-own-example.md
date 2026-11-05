---
label: reproducible
kind: failure
first_person: true
date: 2026-04-18
artifact_type: github-repo
channel: [local-test]
numbers_provided: true
ods_version: 1.0.0        # historical: written against ODS 1.x, kept as-is rather than migrated
tags: [false-positive, honesty, self-referential, quotation]
---

# The honesty audit flags its own documentation

## What happened

This repository's README contains a table of phrases the audit catches, quoted so a reader can
see what the rewrite looks like:

| A claim people write | What the audit turns it into |
|---|---|
| guaranteed viral growth | `[measured change]` + a plan for how to measure it |

Running `npx viral-engine honesty-audit ./README.md` returns **2 blockers** and
`do_not_launch_yet: true`, because those phrases are present in the file.

| Metric | Value | Source | Date |
|---|---|---|---|
| blockers on this repository's own README | 2 | `honesty-audit ./README.md` | 2026-04-18 |
| AQI total with those blockers | 576/1000 Workable | `analyze ./README.md` | 2026-04-18 |
| AQI total if the examples were removed | 630/1000 Workable | earlier revision | 2026-04-18 |

## Why it is a real failure and not a joke

The README originally said "630/1000" in its own text. That number became false the moment the
document was edited. **A README that quotes its own score will always eventually be wrong**, and
being wrong about a number is precisely what this project tells everyone else not to do.

So the number was removed from the prose and the *current*, *lower* score was published instead,
including the reason it is lower. The alternative was to reword the examples until the checker
went green, which would have been tuning the document to the tool — the exact behaviour the tool
criticises in other people's launch copy.

## Root cause

`checkInbound` has no model of quotation, code fences, or tables-of-examples. It matches strings.
Any documentation *about* a dishonesty pattern will trip a detector aimed at that pattern. The
`cannotCheck` list on every audit run says this explicitly: "Sarcasm, irony, and quotation. A
quoted bad claim is not a bad claim."

## What cannot be concluded

- Cannot conclude the fix is easy. Suppressing matches inside code fences and blockquotes would
  create an obvious bypass: wrap your real claim in a blockquote and the audit stops seeing it.
  That trade-off has not been resolved and is deliberately left visible rather than patched
  quickly in the wrong direction.
- Cannot conclude how often this affects other users. Every artifact that *discusses* misleading
  copy will hit it. We know of exactly one such artifact: this one.
- Cannot conclude the current README score is stable. It moved by 54 points from a prose edit,
  which is a fact about the rubric's sensitivity that deserves its own investigation.

## What I would do differently, stated falsifiably

> If, over the next twenty artifacts analysed, more than two are flagged primarily because they
> *quote* a pattern rather than assert it, then a structural fix (skip fenced blocks and explicit
> quotation constructs) is worth the bypass risk, and the risk should be documented in
> `protocol/conformance.md`. If fewer than two, leave it alone and keep the failure visible.

## Sources

- `packages/core/src/honesty.ts` — the `cannotCheck` list, which names this limitation.
- `README.md` — the section "An honesty audit that will block your merge".
