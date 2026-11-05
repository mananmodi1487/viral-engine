# The free academy

Fifteen modules. No signup, no account, no certificate fee, no email capture. The exercises run
in this repository, against your own work, and the checker is a script you can read.

## Why this exists

Almost every resource on "getting your work out there" teaches tactics. Tactics expire, they
are platform-specific, and half of them are manipulation. This academy teaches the four things
that do not expire:

1. Why diffusion actually happens (and why most of what you have been told about it is wrong).
2. How to describe what you made so a stranger can locate it.
3. How to find the specific person who would carry it, without becoming a spammer.
4. How to know when to stop.

## The modules

| # | Module | Time | What you can do afterwards |
|---|---|---|---|
| 01 | Why things spread, and why they mostly do not | 20 min | Explain broadcast vs chain diffusion, and why "viral" is a bad target |
| 02 | The Attempt Quality Index | 25 min | Read a scorecard, and say what it cannot tell you |
| 03 | Finding your category | 30 min | Name the category you are actually in, not the one you wish you were in |
| 04 | The repositioning sentence | 30 min | Write "it's not X, it's Y" without it being a gimmick |
| 05 | Who carries it | 25 min | Identify a broadcaster *category*, with a consent rule |
| 06 | Consent and the ethics of outreach | 30 min | Write a first-contact message with no ask in it |
| 07 | Honesty under pressure | 25 min | Catch your own overclaim before a stranger does |
| 08 | Failure conditions | 30 min | Write a kill criterion you would actually honour |
| 09 | Pre-launch experiments | 35 min | Design a test whose result changes a decision |
| 10 | The friction audit | 25 min | Find the ten seconds that stop a forward |
| 11 | Accessibility is reach | 30 min | Fix the four failures that exclude most readers |
| 12 | Privacy without theatre | 25 min | Run offline, say so, and prove it |
| 13 | Reading a postmortem | 20 min | Extract a falsifiable lesson, not a moral |
| 14 | When not to launch | 20 min | Recognise the four conditions that mean "not yet" |
| 15 | Teaching this to someone else | 30 min | Run the whole thing on a colleague's artifact |

Total: about 7 hours. It is not a course you binge. Module 04 gets better if you sleep on it.

## How the exercises work

Each module has a file in `modules/` and an exercise in `exercises/`. The exercise is a prompt
plus a check:

```bash
npm run academy -- 04            # run the checker for module 04
```

The checker runs the real engine against *your* document and looks for the specific thing the
module taught. It will tell you what is missing, and it will not give you the answer — the
whole point is that the sentence has to be yours, because a generated repositioning sentence is
exactly the generic copy this academy exists to prevent.

## What this academy will not do

- **No "grow your audience" tactics.** Nothing about algorithm timing, hashtags, growth loops,
  engagement pods, or posting schedules. Those are either ineffective or they are manipulation,
  and often both.
- **No certificate that means anything.** There is a template in
  `certificates-transparent/` for a self-issued record of what you did. It carries no
  accreditation, and calling it anything else would be a lie.
- **No guarantee that finishing it helps.** Most things do not spread. The academy's modest
  claim is that you will be able to explain why, and to tell the difference between a work that
  failed and a work that was never described clearly enough to be judged.

## For teachers

Modules 01-15 map to a 7-hour workshop or a 14-week seminar at 30 minutes per session. The
exercises are designed to be run on students' own work, which means the class produces fifteen
different artifacts rather than fifteen copies of one. Everything is CC BY 4.0; teach it,
translate it, change it, charge for the room if you need to.
