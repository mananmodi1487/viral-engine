# 0003 — Never generate a list of individuals to contact

- **Date:** 2026-04-17
- **Status:** accepted
- **Deciders:** initial author

## Context

The Broadcaster Ethicist agent was being designed. The most requested feature in tools of this
kind is a list: "here are 40 people who might share your thing". It is also the feature that
turns a diagnostic tool into a spam engine, because a list inevitably becomes a queue.

## Options considered

**A. Generate the list, with warnings.** Good for adoption. The warning is not a control
mechanism: once a list exists, some fraction of users will send to all of it, and the tool
provided the ammunition. Every mass-outreach product began as a "helpful list".

**B. Generate the list only on request.** Same outcome, one extra click, and it puts the
decision in a log where it can be blamed on the user.

**C. Generate a *category* of broadcaster, a consent status, a disqualifier, and a message
template with no ask in it — and never a name or a handle.**

## Decision

Option C, with the constraint written into the type: the broadcaster candidate has
`candidate` (a role description), `consentStatus` (always `not-contacted` at generation time),
`whyThem`, `howToFindThem`, and `disqualifier`. There is no field in which an individual
identifier can be stored.

## Consequences

- The tool is less immediately gratifying. A user has to do the last step — find a specific
  person — themselves. That step is where judgement lives, so removing it was the harm.
- `max_contacts` defaults to 3 and the anti-spam rules array must be non-empty for a document
  to validate.
- A test asserts that no `@handle` appears anywhere in a generated broadcaster block.
- Downstream tools that want to add a "find people" feature must do it as a separate product,
  and cannot claim it is part of this one.

## Dissent

Recorded second-hand from user feedback: "this is the feature I actually wanted". Acknowledged
and accepted as a real cost. The counter-argument was that the requested feature is available
from a dozen other products whose entire business is that feature, and none of them can also
tell you your positioning is weak.
