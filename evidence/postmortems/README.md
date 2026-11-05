# Postmortems

Structured narratives of what happened when something was launched and did not work.

The word "postmortem" is doing real work here. This is not "lessons learned" — that phrase
usually means "a story with a moral attached after the fact". A postmortem states what was
expected, what was observed, and what cannot be inferred, in that order.

## The structure that is mandatory

```
1. What was published            (the artifact, and the sentence meant to carry it)
2. What was expected             (a number and a horizon, or an admission there was none)
3. What actually happened        (numbers with sources and dates, or "no numbers")
4. What it resembles             (link to a pattern in this directory)
5. What cannot be concluded      (minimum three statements)
6. What I would do differently   (stated as a falsifiable prediction)
7. Consent and privacy           (who is named, and how that was agreed)
8. Sources                       (or the word "none")
```

Section 5 is the one people skip, and it is the reason this directory exists. A postmortem
without a "cannot be concluded" section is a narrative that has already decided what it
means.

## Anonymisation

`private-redacted` is a first-class label, not a concession. If publishing the numbers would
identify a client or expose a colleague, publish the shape:

> Revenue: redacted. Shape: an 8-person consultancy, B2B, second launch of the year.

That is more useful than a vague post about how hard launching is.

## The failure this directory is meant to correct

People delete their failures. This means every public collection of launch stories is a
censored sample, and the visible survivors look like the rule. We cannot fix the sampling
bias. We can keep our own failures visible and label the bias out loud, which is why
`../failures/` exists and why this file mentions it before listing anything.
