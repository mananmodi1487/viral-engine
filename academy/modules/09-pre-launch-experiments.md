# 09 — Pre-launch experiments

**35 minutes.** How to buy information cheaply, before the expensive test.

## The rule

Every experiment must name **the decision it changes**. If no possible result would change what
you do, you are collecting data, not testing. Collecting data feels like progress and is
usually a way of postponing the launch.

## The cheapest six

| Test | Cost | The question | Decision it changes |
|---|---|---|---|
| Blind description | 1 hour, 5 people | Can a stranger say what this does after one read? | rewrite the opening sentence |
| The two-second test | 10 minutes | Does the first line survive a skim? | cut the first line |
| Forward simulation | 30 minutes | Can one reader write a one-sentence reason to send it? | make the forwardable unit explicit |
| Dead link / empty repo | 5 minutes | Does the current state embarrass a forward? | delay launch |
| Accessible read | 20 minutes | Does it work with a screen reader, at 200% zoom? | fix the layout before launch |
| Adverse read | 30 minutes | What is the strongest hostile reading? | pre-empt one objection |

## Designing one properly

A test is a sentence with four parts:

> **We expect** [observable outcome] **to happen by** [horizon] **for** [who], **and if it does
> not we will** [decision].

Notice the fourth part. A test whose result does not force a decision is a survey.

## The five-reader protocol

The most useful pre-launch test, and it takes an hour:

1. Find five people who **do not know what you built** and are **in your audience**.
2. Send them only the description. No screenshots, no demo, no explanation.
3. Ask one question: "what do you think this does, and for whom?"
4. Write down their answers verbatim.
5. Count how many used a word close to your intended category.

Zero out of five means your copy is not working, and the artifact has not even been seen yet.
That is cheap information. Three or more means the description is doing its job and the
remaining risk is elsewhere.

Do not explain. The temptation to say "well, it's more like…" is exactly the failure the test
is designed to catch.

## Why "not pre-registered" matters

If you decide what would count as success *after* seeing the result, you will always succeed.
The engine reports `pre_registered: false` by default on its generated tests, because it wrote
them and you did not agree to them beforehand. To make one real: email yourself the test and the
threshold, date it, do not edit it afterwards.

## Exercise

`../exercises/09-design-a-test.md`

Design one test for your artifact with all four parts. Then run it on five people. Record the
verbatim answers, including the ones that make you want to change the question.

## What this module cannot tell you

- Whether five readers generalise. n=5 finds gross failures and misses subtle ones.
- Whether your friends were being kind. They were. That is why you need five, and why zero out
  of five is the only result you can fully trust.
