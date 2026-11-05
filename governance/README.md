# Governance

How decisions get made here, who can make them, and what happens when the founder is gone.

This file exists because "free forever" written by one person is a wish, not a commitment.
A promise of permanence needs a mechanism that survives the promiser. What follows is that
mechanism, stated as plainly as possible.

## 1. The non-negotiables

These cannot be changed by any vote, any maintainer, any sponsor, or any future owner. They
are the reason the project exists; changing one means building a different project under a
different name.

| # | Commitment |
|---|---|
| 1 | **Free, forever, for everyone.** No paywall, no premium tier, no seat limits, no feature gating, no trial, no locked schemas or templates, no "enterprise-only" intelligence. |
| 2 | **No telemetry by default.** Not aggregated, not anonymised, not "just crash reports". Off unless a user explicitly turns it on, and reversible in one click. |
| 3 | **No data selling, ever.** Not the documents, not the scores, not the metadata, not a derived model. |
| 4 | **Local-first is first-class.** Anything the hosted version can do, a local model can do, or the limitation is documented where the feature is offered. |
| 5 | **No success guarantees.** No output may promise virality, reach, or outcomes. Every score carries its assumptions, missing data, and failure condition. |
| 6 | **"Do not launch yet" stays expressible.** Any change that removes the ability to say "not ready" is a breach, not a feature request. |
| 7 | **Ethical virality only.** No invented statistics, fake testimonials, manufactured urgency, astroturfing, mass outreach, covert surveillance, or dark patterns — in the tool, in the templates, or in the marketing of the tool itself. |
| 8 | **The protocol stays open.** Anyone may implement ODS. No license, fee, registry, or certification is required, and there is no "official" implementation gate. |
| 9 | **The core stays open source** under an OSI-approved license; docs and research under CC BY or CC0. |
| 10 | **The evidence commons stays readable by anyone**, including records that criticise this project. |

### How these are protected

- They are in `LICENSE` and in the repository history, not only in this file.
- A PR whose diff touches the substance of any commitment above requires the process in §4.
- The test suite asserts several of them mechanically: no telemetry call sites, no
  network in offline mode, no score without a failure condition. A promise that has a test
  is a promise; the rest is prose.

## 2. Roles

| Role | What they can do | How you get it |
|---|---|---|
| **User** | Everything the product does. Report bugs. Submit evidence. | Show up. |
| **Contributor** | PRs merged. Listed in `CONTRIBUTORS.md` if they want. | One merged PR of any size. |
| **Reviewer** | Approve PRs in an area, triage issues. | 5 merged PRs plus a current contributor's nomination. |
| **Maintainer** | Merge, release, edit governance in §3 only. | Sustained review over 3 months, invited by consensus of existing maintainers. |
| **Ethics council** | Veto on commitment breaches; publish an annual public review. | See §5. |
| **Steward** | Holds the name, the domain, and the release keys. | See §6. |

Nobody is paid for a role. Funding, when it exists, is for work agreed in public, never for
a vote.

## 3. What normal decisions look like

Lazy consensus: an issue or PR is open for at least 72 hours, and if no reviewer objects,
it merges. Objections must name a commitment or a test, not a preference. "I do not like
this" is not an objection; "this makes offline mode optional" is.

## 4. What changing a non-negotiable looks like

It does not happen. But because a rule with no process is a rule that gets broken in a
hurry, here is the process anyway:

1. A public proposal, in `governance/proposals/`, naming which commitment and why.
2. A 30-day comment period, announced in every channel the project uses.
3. A supermajority of maintainers **and** unanimous consent of the ethics council.
4. The fork is announced before the merge, with a 90-day window for anyone to take the code
   under the old terms. The name and the protocol stay with the original commitments; a
   capture attempt does not get to keep the brand.

The 90-day fork window is the real protection. Any change to the terms is permission for
everyone else to leave with the code, and the repository history is the proof of what the
terms used to be.

## 5. Ethics council

**Composition:** 5 seats. At least two members who are not contributors and not users —
specifically, people with a stake in the harms this tool could cause (a moderator, an
accessibility practitioner, a privacy researcher, or someone from a community that outreach
tools routinely spam). At most two may be maintainers.

**Powers:** veto over commitment breaches; the right to publish a dissenting opinion
alongside any release note; the right to commission an external audit at project expense.

**Limits:** the council cannot block a feature for being unpopular, cannot decide product
direction, and cannot add paywalls (see commitment 1).

**Seats:** 18-month terms, staggered, renewable once. Vacancies are filled by a public call
and a vote of the remaining council plus maintainers.

Template: `governance/ethics-council.md`.

## 6. The steward, and the immortality problem

The failure mode this section addresses: a project is free and open for four years, then the
founder is hired, or bored, or hit by a bus, and the domain expires, the trademark is sold,
and the repository becomes a ghost town with a forked package name.

**The commitment:** if this project is ever abandoned, its assets are released, not sold.

- **Code:** MIT today. Permanent because every released version is already MIT and cannot be
  un-released.
- **Protocol:** public domain dedication for the specification text (CC0). Implementations
  need no permission and pay no fee.
- **Name and domain:** held by the steward role, with a written public undertaking that they
  will never be sold to a party that would paywall the product. On abandonment, the domain
  and marks go to a public-interest foundation or are released.
- **Release keys:** held by at least three maintainers, so no single absence stops releases.
- **Sunset plan:** see §7.

## 7. Sunset plan

If the project stops being maintained, in this order:

1. A `SUNSET.md` at the repository root stating the date, the reason, and what still works.
2. The last release is permanently archived (Zenodo DOI, Software Heritage).
3. The protocol version freezes. ODS 1.x remains implementable by anyone, forever.
4. Mirrors: the domain redirects to a static archive of the documentation for at least five
   years, funding permitting, or the archive URL is published in `SUNSET.md`.
5. Dependencies are vendored in the final release so the tool still runs without npm.
6. Evidence commons is transferred to a public archive with a CC0 dedication.

A tool that dies badly takes its users' trust with it. The sunset plan is part of the
product.

## 8. Decision log

Every decision that changed a commitment-adjacent behaviour is recorded in
`governance/decisions/`, with the date, the alternatives considered, and who disagreed.
Disagreement is recorded, not smoothed out — a decision log with no dissent in it is a
press release.

Format: `governance/decisions/0001-title.md`.

## 9. Funding

Permitted: donations, grants, public-interest sponsorship, optional consulting that never
degrades the free product, foundation funding.

Forbidden: paywalls, seat limits, feature gating, data sales, telemetry monetisation,
"sponsored" placement inside generated advice, sponsorships conditioned on product decisions,
and anything that makes the free product worse in order to sell the paid one.

**"Never restrict users to monetise."** If revenue and access conflict, access wins every
time, and the funding is what changes. Written down so that the decision is not made in a
bad quarter by someone under pressure.

See `SUSTAINABILITY.md`.
