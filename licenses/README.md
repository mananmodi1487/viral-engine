# Licensing

Three licenses, because three kinds of thing are in this repository.

| What | License | File | Why this one |
|---|---|---|---|
| Code (`apps/`, `packages/`, `scripts/`) | MIT | `../LICENSE` | Maximum reuse. A tool that argues against gatekeeping cannot ship under a license that gatekeeps. |
| Specification (`protocol/`) | CC0 1.0 | `CC0-1.0.txt` | The spec must be implementable by anyone, including a competitor, with no attribution obligation to create friction. |
| Documentation, research, academy, evidence | CC BY 4.0 | `CC-BY-4.0.txt` | Attribution is reasonable for prose. It is the only restriction anywhere in this repository. |
| Generated output (a report you produce) | **Yours** | — | See below. |

## Your output is yours

Reports, ODS documents, SVG assets, and generated copy produced by this tool belong to the
person who produced them. No attribution is required, no license is imposed, and no
"generated with" watermark appears anywhere. You may use the output commercially, modify it,
and publish it under any terms you like.

The only thing this project asks — and it is a request, not a license condition — is that if
you publish an ODS document publicly, you keep the `do_not_launch_yet` field intact. Deleting
the field that says "not ready" turns a diagnosis into a marketing asset.

## What CC0 on the spec actually means

You may:

- implement ODS in a closed-source product;
- change the spec for your own use and call it something else;
- sell a service that validates ODS documents;
- write a competing spec.

You may not claim your implementation is "ODS 2.0.0 conformant" while disagreeing with the
conformance rules, because conformance is a factual claim about behaviour, not a licensed
trademark. The tests are public; run them.

## Why not a copyleft license

GPL or AGPL would prevent a company from shipping this inside a closed product. That is a
real and defensible position. It was not chosen here because the thing at risk is not code
reuse — it is *adoption of the protocol*. A permissively licensed rubric is more likely to
become a shared vocabulary, and a shared vocabulary is the only mechanism by which "the index
says 463" means the same thing in two companies that have never heard of each other.

The protection against capture is not the license. It is the governance commitments, the fork
window, and the fact that every released version is already MIT and cannot be un-released.

## Full texts

- `CC0-1.0.txt` — public domain dedication (verbatim, from creativecommons.org)
- `CC-BY-4.0.txt` — attribution 4.0 (summary + link; the legal code is long and has one
  canonical source, so this file links rather than forks it)
