# Sustainability

How this stays free, who pays for it, and what happens when nobody does.

Most "free forever" projects are free until the founder needs a salary. This file is an attempt to
answer that before it becomes urgent, so the answer is not invented under pressure.

## The constraint

**Free forever, for everyone, with no restriction.** No paywall, no premium tier, no seat limit, no
feature gate, no trial, no locked schema, no email-gated template, no enterprise-only intelligence.

> **Never restrict users to monetise.**

If revenue and access conflict, access wins and the funding changes. That ordering is the whole
policy; everything below is detail.

## What is permitted

| Source | Why it is compatible |
|---|---|
| **Donations** | Voluntary, unrestricted, no product change. GitHub Sponsors, Open Collective, Ko-fi. |
| **Grants** | Mozilla, Sloan, Knight, NLnet, Ford, national digital-public-infrastructure funds. This is public-good software and it fits those mandates. |
| **Public-interest sponsorship** | A company sponsors a feature that benefits everyone equally, disclosed, with no product control and no exclusivity. |
| **Optional consulting** | Paid help with a *deployment*, not with the *product*. "Come and run this for our team" is support. "Pay us and you get better scoring" is a paywall. |
| **Foundation funding** | The natural end state for infrastructure of this kind. |

## What is forbidden, without exception

- Selling data. There is no data to sell, by design, and this is a reason to keep it that way.
- Selling telemetry, or monetising the absence of it by making it opt-out.
- "Sponsored" placement inside generated advice. If a broadcaster brief recommends a sponsor's
  newsletter, the tool is a marketing channel and its diagnosis is worthless.
- Sponsorship conditioned on product decisions, roadmap influence, or a scoring weight.
- Making the free product worse to sell anything. No artificial limits, no degraded local mode, no
  "the hosted version is the real thing".
- Any dark pattern: no trial that silently bills, no fake scarcity, no exit interstitial.

Each of these is a breach of a commitment in `governance/README.md` §1, which means it requires the
process in §4 — a supermajority, unanimous council consent, and a 90-day fork window. In practice
the point is that the process is so expensive that nobody will attempt it for a quick win.

## The cost of the project

Honestly, and small, because the architecture was chosen to make it small:

| Item | Annual |
|---|---|
| Domain | ~$15 |
| Hosting (the web app is a single `node:http` process; a $5 VM runs it) | ~$60 |
| CI (GitHub Actions free tier is sufficient at this size) | $0 |
| npm publishing | $0 |
| **Total cash** | **~$75/year** |

That number matters. A project that can run on $75 does not need a business model, and a project
that needs a business model tends to acquire one that conflicts with its users.

The real cost is **time**, which no funding model solves. The honest statement: this is currently
unpaid work by one person, and the sustainability question is not "how do we fund hosting" but
"how do we get to more than one author before the first one stops".

## The contributor question, which is the real one

A free project with one author has a lifespan of one author. The funding priority is therefore not
money, it is **replacing dependence on a single person**:

1. **Three maintainers holding release keys.** Until that exists, any absence stops releases.
2. **Reviewers with merge rights per area.** A merge queue of one is a bottleneck and a risk.
3. **Paid review time before paid feature work.** If funding arrives, the first thing it should buy
   is someone else's hours on reviewing, not more output from the current author.
4. **Documentation that lets a stranger operate it.** Written for the person who inherits it, which
   is why `governance/` exists at all.

## If funding arrives

In this order, published so the sequence is not decided privately:

1. Cover the $75 and a domain reserve for ten years. (~$750, one-off)
2. Pay an accessibility audit by someone who uses assistive technology daily. This is the largest
   real quality gap and it cannot be closed by the current author.
3. Pay a translator to bring the academy into one non-English language properly, and to test the
   lexicons against it. Not machine translation of the docs: a translation of the *method*, by
   someone who can tell us what breaks.
4. Pay a reviewer, not a writer.
5. Everything else sits in a reserve, publicly accounted.

**Not on the list:** a salary for the founder, a conference, merchandise, or a rebrand. Those are
what funding usually buys and none of them make the product better or the project survive its
author.

## If funding never arrives

The project continues at $75/year, on one person's time, until it does not. If it stops:

1. `SUNSET.md` at the repository root, stating the date, the reason, and what still works.
2. Final release archived with a DOI and on Software Heritage.
3. Protocol version freezes; ODS 1.x remains implementable by anyone, forever, under CC0.
4. Dependencies vendored so the tool still runs without npm.
5. Evidence commons transferred to a public archive under CC0.
6. Domain redirects to a static archive, or the archive URL is published.

A tool that dies badly takes its users' trust with it. The sunset plan is part of the product, not
an admission of failure.

## Disclosure

Every funding source above a token amount is listed in `governance/funding.md`, in public, with the
amount and the funder. Sponsors get a thank-you line and nothing else — no banner, no placement in
generated output, no influence over a weight.

An empty `governance/funding.md` is the current state, and it is the honest one.
