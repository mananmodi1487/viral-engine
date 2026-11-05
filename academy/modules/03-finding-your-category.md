# 03 — Finding your category

**30 minutes.** The most mechanically useful module. By the end you should be able to name the
category you are *actually* in.

## Why the category matters more than the feature list

A category is a slot in a reader's head. When they hear your thing, they place it before they
evaluate it. If the slot is already full — "another note-taking app" — you are now competing on
features with a hundred things, and the reader has nothing to learn from you.

If there is no slot, you have a harder problem but a better position: you have to teach the
reader a new category, which costs attention, and if they accept it you are alone in it.

## The three tests

**Test 1 — The name test.** Remove your name from the description. Is the sentence still
specific? "A note-taking app for writers" fails: replace *writers* with any other group and it
reads equally true, which means the group was decoration.

**Test 2 — The comparison test.** What is the reader's current alternative? If the answer is
"nothing", the reader will not experience a problem, and you are in the "nice to have" category,
which does not spread. If the answer is "a spreadsheet and anxiety", that is a real alternative
and it is your real competitor.

**Test 3 — The job test.** Finish this: "I use this when I need to ______." If the blank is a
verb phrase a specific person would say out loud, you have a job. If it is "be more productive",
you have a slogan.

## The most common failure

Describing a **mechanism** instead of a **job**.

> "An AI-powered document analyser with a deterministic rules engine."

Every word is accurate. It describes how the thing works. No reader has ever woken up wanting
that. The job version:

> "Tells you which part of your launch copy will make a stranger close the tab."

Same artifact. Different category: one is "AI tools", the other is "launch diagnostics".

## Repositioning without lying

The reposition must be **true of the artifact you already built**, not aspirational. The test:

> Would the person who built this recognise it in your sentence?

If the sentence describes a thing you intend to build next quarter, you have written a
roadmap, and the reader who shows up will be disappointed. That disappointment is expensive:
it costs you the one channel you cannot re-buy, which is the person who forwarded you.

## Exercise

`../exercises/03-name-your-category.md`

Write the mechanism sentence and the job sentence for your artifact. Then run:

```bash
npx viral-engine category ./README.md --offline
```

Compare its output with yours. Where they disagree, decide who is right — you have information
the engine does not. If the engine found a category you did not intend, that is usually a
signal about your copy rather than about the engine.

## What this module cannot tell you

- Whether the category you chose has room. The tool has no market data, and cannot know how
  many people are already in the slot.
- Whether a new category is a good bet. Creating a category is expensive and often correct;
  there is no rule that says which.
