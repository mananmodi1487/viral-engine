# Ethics council

The charter. Short on purpose, because a governing body that needs a long charter to explain
itself is usually explaining why it does nothing.

## Why a council and not a policy

A written policy is interpreted by whoever holds the merge button. When the merge button
holder is under pressure — a sponsor asking for a favour, a growth target, a launch — the
policy gets read generously toward the pressure. The council exists to be a second reader
whose incentive is not the launch.

## Composition

| Seat | Who | Constraint |
|---|---|---|
| 1 | Maintainer | one of at most two |
| 2 | Maintainer or long-standing reviewer | one of at most two |
| 3 | External: someone with direct experience of the harms this tool could cause | must not be a contributor |
| 4 | External: privacy, accessibility, or moderation practitioner | must not be a contributor |
| 5 | External: a user from a community that outreach tools routinely spam | must not be a contributor |

**At least three seats must be filled for the council to act.** A council of one is a
fig leaf. If the seats cannot be filled, the council is *vacant*, and vacancies are published
in the release notes rather than quietly unreported.

## Powers

1. **Veto** a change that breaches a commitment in `governance/README.md` §1.
2. **Publish a dissent**, unedited, alongside any release note.
3. **Commission an audit** at project expense (requires funding to exist; if none does, the
   audit is published as a request for volunteers — not silently dropped).
4. **Compel disclosure** of any data collection, sponsorship, or funding above a stated
   threshold.

## Limits (stated so the council cannot become a different problem)

- No veto over ordinary product decisions, popularity, or taste.
- No ability to introduce a paywall, seat limit, or telemetry default.
- No authority over code style, architecture, or roadmap.
- No power to remove a commitment — the council defends the commitments; it does not own them.

## Meetings

Public, minuted, quarterly, in `governance/minutes/`. Quorum: 3. Anything decided without
quorum is a recommendation, clearly labelled as such.

An annual **public review** answers three questions, in writing:

1. Did the project breach a commitment this year? (If unsure, the answer is yes.)
2. What did the tool do that harmed someone, and what changed as a result?
3. What is the council most worried about next year?

## Conflicts of interest

Declared in `governance/coi.md`, in public, before a vote. Anyone employed by, consulting
for, or holding equity in a company affected by a decision recuses. Recusal is recorded.

## Dissolution

If the council becomes vacant for more than twelve months, the commitments do not lapse —
they were already in `LICENSE` and in the git history. The vacancy is published, and the
fork window in `governance/README.md` §4 becomes permanently open.
