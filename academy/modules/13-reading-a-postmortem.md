# 13 — Reading a postmortem

**20 minutes.** How to extract something falsifiable from someone else's failure.

## The problem with launch stories

Most postmortems are written backwards. The author knows the outcome, so the narrative is
assembled to explain it. Details that do not fit get quietly dropped. The result reads as a
causal chain and is actually a story with a moral attached.

This is not dishonesty. It is how memory works, and it is why a postmortem written *before* the
result is worth more than one written after.

## The four questions that separate a record from a story

**1. Was there a stated expectation, before the result?**
If the author only says what they learned, not what they expected, there is no surprise to
explain, and you cannot learn from it. "I learned that positioning matters" is not a finding.

**2. Are there numbers, with sources?**
"Got some traction" versus "31 forwards, 4 of which came from people I do not know, counted in
reply threads on 2026-03-12". The second can be argued with.

**3. What else changed?**
Almost every launch post omits this. They repositioned *and* retitled *and* posted at a
different time *and* were more excited when they talked about it. A record with no confounds
section is a single-variable claim about a multi-variable event.

**4. What can the author not conclude?**
If this section is missing, the postmortem has decided what it means. Skip to the comments and
see if anyone argued with it; that is where the real analysis usually is.

## The extraction technique

Read the postmortem and write down, in your own words, **the author's implicit claim**. Then ask:
what observation would have proven that claim wrong?

Examples:

| Post says | Implicit claim | Falsifier |
|---|---|---|
| "We launched on a Tuesday and got no traction." | Timing caused the failure | A Tuesday launch that worked, in the same category |
| "The post went viral because I told a personal story." | Narrative caused the spread | Similar story, no spread — or spread without a story |
| "Our landing page conversion doubled after we changed the headline." | Headline caused the change | Same period, no headline change, similar traffic |

Most launch postmortems cannot survive this, and the useful takeaway is not the lesson but the
*shape* of the claim you can actually test on your own work.

## What to do with a good one

1. Copy its `cannot be concluded` section into your own notes before the launch. It is a
   pre-written version of the honest thing you will need to say later.
2. Note the specific numbers. Even bad numbers are useful as a sanity check on your own
   expectations.
3. Send it to one person who is about to launch the same kind of thing. This is the actual
   mechanism of the whole repository: one specific person, one specific useful thing.

## Exercise

`../exercises/13-extract-a-lesson.md`

Take any public launch postmortem. Answer the four questions. Write the implicit claim and one
falsifier. If you cannot find a falsifier, the postmortem is a story — useful as reassurance,
useless as evidence.

## What this module cannot tell you

- Whether a postmortem's numbers are accurate. Almost all are self-reported; label them as such.
- Whether the same lesson applies to your category. Usually it does not, and this is the most
  common way advice misleads.
