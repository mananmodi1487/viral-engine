# Self-evaluation

A score out of 1000 across 18 dimensions, graded against the brief this project set for itself.

## The rule this file is written under

This document is the one place where a project is most tempted to lie, because nobody else can
verify the rubric. Three defences:

1. **The grader is the same one being graded.** Stated up front, not in a footnote.
2. **Every score has a "what would make it lower" line.** If I cannot name the condition, the score
   is a feeling.
3. **The weakest three are named before the total.** Read them before you read the number.

The previous version of this project graded itself 10/10 and called it honest. That was the thing
this rewrite exists to fix.

---

## Scores

| # | Dimension | Score | Max | Basis |
|---|---|---:|---:|---|
| 1 | Vision and ambition | 82 | 100 | structural |
| 2 | Originality of the core idea | 76 | 100 | heuristic |
| 3 | Honesty and epistemics | 88 | 100 | measured |
| 4 | Protocol design (ODS) | 79 | 100 | structural |
| 5 | Core engine quality | 72 | 100 | measured |
| 6 | Breadth of the agent layer | 68 | 100 | heuristic |
| 7 | CLI and developer experience | 84 | 100 | measured |
| 8 | Web app | 61 | 100 | heuristic |
| 9 | Accessibility | 58 | 100 | heuristic |
| 10 | Privacy and local-first | 86 | 100 | structural |
| 11 | Ethics and abuse resistance | 81 | 100 | measured |
| 12 | Evidence commons | 44 | 100 | structural |
| 13 | Evaluation rigour | 63 | 100 | measured |
| 14 | Academy and non-developer access | 74 | 100 | heuristic |
| 15 | Governance and durability | 70 | 100 | structural |
| 16 | Sustainability model | 55 | 100 | heuristic |
| 17 | Code craft and test quality | 77 | 100 | measured |
| 18 | Real-world usefulness, proven | 31 | 100 | unavailable |
| | **Total** | **1239** | **1800** | |

Normalised to the 1000-point scale: **688/1000.**

**Band: Strong.** Which, per the project's own rubric, means: *"a specific person could forward this
and their reader would understand it."* That is a claim about legibility, not about quality, and it
is the only kind of claim this file is allowed to make.

---

## The three weakest, named first

### 18 — Real-world usefulness, proven: 31/100

This is the dimension that matters most and the one with the thinnest evidence. **There is no
evidence that using this tool improves anyone's outcome.** The benchmark measures whether the
detectors notice the right things in 32 documents written by their author. It does not measure
whether a person who followed the advice did better than a person who did not, and no such study
exists.

The honest score for "proven useful" is therefore close to zero, and 31 reflects only the
indirect case: the rubric is derived from published research, the academy's method is standard
practice in writing instruction, and the refusals are real. That is reasoning, not evidence.

*What would make it lower:* if the first ten people who run it report that the diagnosis told them
something they already knew. I expect this to be common.

*What would raise it:* a cohort study, run by someone else, with a pre-registered outcome measure.
Nothing else counts.

### 12 — Evidence commons: 44/100

Eleven directories, eleven READMEs, four real records, two of which are about this project's own
development. The labelling scheme is rigorous; the contents are nearly empty. A reader looking for
a base rate will find a well-argued explanation of why base rates are not available, which is
honest and not what they came for.

*What would make it lower:* if the records were self-serving. Two of the four are failures, which
holds the line.

*What would raise it:* twenty well-labelled failed launches from people other than the author.
There is no shortcut and no way to manufacture it.

### 9 — Accessibility: 58/100

The tool checks for missing alt text, non-descriptive alt text, contrast declarations, sentence
length, and heading structure. It has **never been tested with a screen reader by anyone**, and the
report says so on every run.

The generated SVG assets carry `<title>`, `<desc>`, and `role="img"`, and every alt text is
emitted alongside the file. The web app uses semantic HTML and no client-side rendering. Those are
real. But an accessibility score written by someone who does not use assistive technology is a
self-report, and the gap between "passes the checks" and "usable" is where this score belongs.

*What would make it lower:* an audit by a screen-reader user finding a blocking failure. I would
expect this.

*What would raise it:* paying for that audit. It is the first item on the funding list in
`SUSTAINABILITY.md` for exactly this reason.

---

## The rest, with the honest caveat on each

| # | Score | Why it is not higher |
|---|---:|---|
| 1 | 82 | The vision is genuinely larger than a repo upgrade — an open protocol, an evidence commons, a governance model. It loses 18 because "operating system for making work legible" is a phrase that promises more integration than exists: four surfaces are planned and unbuilt. |
| 2 | 76 | The Attempt Quality Index is a real contribution: 20 weighted dimensions with mandatory evidence, failure conditions, and a schema that rejects a score without them. But it is a synthesis of Watts, Berger, and standard positioning practice, not a new theory. Any honest reader will recognise the parts. |
| 3 | 88 | The highest score here, and earned by measurement: a published benchmark that names every failure, a refusal that exits 5, a `do_not_launch_yet` boolean in the schema, an evidence commons that keeps its own incidents, and a README that publishes its own failing audit. Loses 12 for the quotation-blindness flaw and because honesty is easier to encode in a schema than to practise in prose. |
| 4 | 79 | ODS is spec'd, schema'd, versioned, conformance-tested, and implemented four times with honest status per language. Loses 21 because two of those implementations have never executed, the numeric tolerance is inconsistent between bindings (±2 vs ±0.5), and no third party has implemented it independently. |
| 5 | 72 | Deterministic scoring with no model in the scoring path is the right architecture and it is tested (171 tests). The analysis is still rule-based and thin in places: `emotional_truth` scrapes a lexicon, `cultural_resonance` is close to a guess. |
| 6 | 68 | Fifteen agents with typed refusals is real work. But most are string heuristics with good comments, and the agent layer has never seen a non-English document. |
| 7 | 84 | 15 commands, exit codes that distinguish a refusal from a crash, 7 output formats, offline by default, `doctor` that proves no network. Loses 16 for discovery: you have to read the README to know which command does what, and there is no interactive mode. |
| 8 | 61 | It runs, it is dependency-free, it has no cookies and a strict CSP, and every page carries a "what this cannot do" section. It is also not beautiful, has no client-side interactivity, and the no-JS form is the only form. |
| 10 | 86 | Local-first is structural, not claimed: ingest is pure local parsing, `--offline` forces `--provider none`, the service worker never caches `/api/`, and `doctor` asserts zero network calls. Loses 14 because hosted mode exists and a user who chooses it is trusting the terminal's warning. |
| 11 | 81 | Refusal is a return type, exit code 5 is distinct from 3 and 1, the broadcaster type cannot hold an identifier, the plugin manifest rejects private hosts and wildcards, and the abuse screen has four kinds of test including two for false positives. Loses 19 for the documented padding attack and for the ethics council being vacant. |
| 13 | 63 | Precision 1.000, recall 0.958, FPR 0.000, with every failure published and one known miss kept rather than tuned away. That rigour is real. The dataset and the detectors share an author, which caps this score hard: it measures self-consistency. |
| 14 | 74 | 15 modules with real checkers that test the artifact rather than the answer, and a deliberate refusal to write the sentence for you. Loses 26 for being English-only and for never having been used by a class. |
| 15 | 70 | Ten non-negotiable commitments, a council charter with quorum, five decisions with dissent recorded, an anti-takeover process with a 90-day fork window, and a sunset plan. Loses 30 because **the council has no members**, which is the difference between governance and a document about governance. |
| 16 | 55 | The constraint (free forever, ~$75/year, funding hierarchy written down, forbidden sources enumerated) is coherent and unusually specific. But there is no funding, no second maintainer, and therefore no evidence the model survives contact with a person who needs a salary. |
| 17 | 77 | 171 tests including conformance, an eval-as-regression-test, and a plugin SDK whose permissions are enforced rather than documented. Loses 23 for the two uncompiled bindings and for a known placeholder match arm in the Rust validator. |

---

## What the total does and does not mean

**688/1000 does not mean** this is 69% of a perfect project, or that it is more useful than a
project scoring 600. The rubric is one person's judgement, weighted by the same person, applied to
their own work. It is a structured self-report, and its purpose is to be specific enough that it
can be argued with.

**It does mean** the weakest dimensions are named, the reasons are concrete, and each has a stated
condition that would make it worse. That is the only mechanism here that could catch a lie.

## If someone else graded this

I would expect lower in 5, 6, 13 and 14 — the "engine quality" and "evaluation rigour" dimensions
are the ones where an outside reader sees the string heuristics, the single-author benchmark, and
the English-only coverage plainly, while the author sees the comments explaining each decision.

I would expect higher in 9 only if the grader ran it with a screen reader and found less wrong
than I fear.

The one thing I would not expect anyone to raise: 18. There is no evidence of real-world
usefulness, and every additional paragraph written about this project makes that gap more visible
rather than less.
