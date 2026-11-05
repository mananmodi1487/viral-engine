# 11 — Accessibility is reach

**30 minutes.** Not a compliance module. A reach module that happens to also be the right thing.

## The framing that makes people act

An inaccessible artifact is one that some people physically cannot evaluate, no matter how much
they wanted to. That is not a small minority: roughly one in six people worldwide has a
significant disability, and everyone passes through temporary and situational versions —
a broken wrist, a cracked screen, a noisy train, a language they are still learning.

Every accessibility failure is an audience you have excluded *before* they could decide whether
to forward.

## The four that matter most for launch copy

**1. Images without real alt text.** Not "screenshot.png", not "image". What the image
communicates, in a sentence. If the image is decorative, say so with empty alt, which is a
legitimate answer.

**2. Contrast.** Grey text on white is a design choice that excludes people. Check it: 4.5:1
for body text, 3:1 for large text. Every browser has a checker in its developer tools.

**3. Structure.** Headings used for hierarchy, not for size. Lists as lists. Tables with
headers. This is what lets screen-reader users navigate a page instead of listening to all of it.

**4. Plain language.** Sentences under about 25 words. Jargon defined on first use. This one is
"accessibility" for the largest excluded group in the world: people reading in their second
language.

That last point deserves its own paragraph. **Most of the planet reads English as a second or
third language.** A document written in consultant-speak excludes more people than a missing alt
attribute, and it is never counted in an accessibility audit.

## What the tool checks, and what it cannot

The accessibility guardian checks for: missing or non-descriptive alt text, heading structure,
contrast declarations in inline styles, jargon density, sentence length, and whether the
language attribute is present.

It **cannot** check: whether the screen reader output actually makes sense, whether the keyboard
order is logical, whether the layout survives 200% zoom, whether a video has captions, or
whether your colour scheme works for colour-blind readers. The report lists these as `untested`
on every run, because a "passed" accessibility check that never looked at a screen reader is
worse than no check at all.

## The 20-minute audit anybody can run

1. Zoom the browser to 200%. Does anything overlap or disappear?
2. Tab through the page. Can you reach everything? Can you see where you are?
3. Turn on your OS screen reader for two minutes. Listen. Do not fix anything yet — just notice.
4. Grab your longest paragraph. Count words per sentence. Cut anything over 25.
5. Right-click each image. If the alt text only names the file or the medium, rewrite it.

That is not a full audit. It catches most of what a launch-level artifact gets wrong.

## Exercise

`../exercises/11-fix-four-failures.md`

Run `npx viral-engine analyze ./README.md --offline` and find the accessibility output. Fix the
four above. Then do the one thing the tool cannot: read your opening paragraph at 200% zoom on
a phone, out loud.

## What this module cannot tell you

- Whether your artifact is accessible. Only assistive-technology users can tell you that, and
  the honest move is to ask one and pay them for the review if you can.
- Whether your language is plain enough for your actual audience. Read it aloud; that catches
  more than any metric.
