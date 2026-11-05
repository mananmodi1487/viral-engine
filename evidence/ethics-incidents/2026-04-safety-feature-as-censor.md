---
label: reproducible
kind: incident
first_person: true
date: 2026-04-14
artifact_type: github-repo
channel: [local-test]
numbers_provided: true
ods_version: 1.0.0        # historical: written against ODS 1.x, kept as-is rather than migrated
tags: [safety, false-positive, censorship, self-inflicted]
---

# A safety feature became a censor, in the first hour

## What happened

A keyword screen designed to refuse spam requests refused **documentation about spam**.
The tool would not analyse a document that said spam is wrong.

The intended behaviour: refuse requests to do harm. The actual behaviour: refuse any text
containing the vocabulary of harm, including text opposing it. The mechanism was a
substring match with no model of intent.

## Why this is an ethics incident and not a bug report

Two reasons.

**1. The failure mode is asymmetric and it falls on the careful.** The documents that
get refused are disproportionately the ones that *discuss* a problem precisely — an
ethics policy, a moderation guide, a postmortem, a research paper with a table of abusive
tactics. A tool that punishes precision teaches people to write vaguely. That is a
cultural cost paid by the people who were being careful.

**2. Every system of this kind will do it.** This was found because we tested the screen
on our own prose. Most implementers will test on spam samples and ship. The false-positive
rate on *prohibitions* is invisible from that test set, because a spam corpus contains no
prohibitions.

## The disclosure rule this produced

Any safety screen in this project must be accompanied by a test file containing:

1. requests to do the harmful thing — must refuse;
2. **prohibitions of the harmful thing — must pass**;
3. neutral discussion of the harmful thing — must pass;
4. a request padded into a long paragraph — must refuse (acknowledging this is defeatable).

If a future contributor adds a rule without adding all four, the review should reject the
PR. The rule is not "the screen works". The rule is "the screen can be shown to be wrong".

## What this does not tell you

- It does not tell you the current screen is good. It tells you it has been tested against
  the failure it already had.
- It says nothing about languages other than English. Negation is not universal: double
  negatives, and languages where a prohibition is expressed by a mood rather than a word,
  will break this design in ways we have not begun to test.

## Sources

- `packages/agents/src/types.ts`
- `evidence/failures/2026-04-refused-own-readme.md`
- Goel, Watts & Goldstein (2012), on single-source inference: the same epistemic problem,
  one layer up. One data source cannot correct itself.
