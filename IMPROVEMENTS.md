# 🔬 What's Actually Different Here

Most "viral content" tooling is a list of adjectives with a subscribe button. This document is the honest diff — including what other approaches do **better** than this one, because a comparison page that finds no merit in the alternatives isn't a comparison.

---

## The one-sentence difference

> Other tools help you write something that *sounds* viral. This one diagnoses **why the thing didn't spread**, names the bottleneck, and refuses to let you skip it.

That's it. Everything below is the mechanism behind that sentence.

---

## vs. prompt collections ("100 viral hooks!")

| | Prompt collections | Viral Engine |
|---|---|---|
| Unit of output | A list of lines | A diagnosis plus 3 lines |
| Failure mode | Every hook sounds the same after 20 uses | Slower; demands real audience specificity |
| Knowledge of *why* | None — the patterns are unlabeled | Every hook is tagged with pattern, audience, and its failure condition |
| When it's wrong | Silent | Says "don't launch yet" |

**What they do better:** instantly usable, zero thinking required, and genuinely fine for a low-stakes tweet.

---

## vs. growth frameworks (Traction, Contagious, Obviously Awesome)

| | Books | Viral Engine |
|---|---|---|
| Format | 250 pages, read once | One file, runs in 30 seconds, every time |
| Output | A framework you must apply yourself | A filled-in artifact |
| Availability at the moment of need | At home on a shelf | In the same window you're writing in |
| Rigor | Deep, cited, tested over years | Compressed — and it loses nuance doing so |

**What they do better:** actual depth. If you're building a company, read the books. This skill is a checklist derived from them, and it's honest about being a derivative. See [CREDITS.md](CREDITS.md).

---

## vs. "AI growth hacking" tools

| | Typical AI growth tool | Viral Engine |
|---|---|---|
| Assumes | Volume fixes everything | Volume fixes nothing without a frame |
| Fabricates | Stats, testimonials, "10,000 users" | **Never** — placeholders instead |
| Optimizes for | Output volume | One artifact worth sharing |
| Ethics | Usually unspecified | Hard constraints in the skill file |
| Risk | Public callout when the numbers don't exist | Slower, less impressive-looking output |

**What they do better:** they generate a lot, fast, and that's sometimes exactly what you need.

**The trade this repo makes deliberately:** it will produce *less* output than a volume tool, and some of that output will be "your idea isn't ready." That's the feature. Every fabricated number is a liability with a due date.

---

## The five structural improvements

### 1. A bottleneck, not a checklist

Most frameworks hand you 6–19 levers and let you pick. Picking is the failure mode — people optimize the fun lever (usually the hook) and ignore the broken one (usually the audience).

This one **scores all seven, then names the single weakest**, and tells you to fix only that. Improving an already-strong lever is wasted effort, and it's the most common way a week disappears.

### 2. Two share mechanisms, never three

A design constraint, not a research finding. When an artifact tries to be a template *and* a leaderboard *and* a gift, the sharer has no idea what to do, so they do nothing.

Choosing two forces you to decide what the share *is*. It also makes desperation visible, which is useful.

### 3. Position before you write

The category decision comes **before** the hook. This ordering is the whole thing:

```
Wrong:  write 12 hooks → wonder why none of them land
Right:  change the category → 3 of the 12 hooks now write themselves
```

"It's not a habit tracker. It's placement-risk management." That's not a better sentence — it's a different game, with a different audience, a different emotion, and a different budget.

### 4. Honesty as a hard constraint, not a value statement

Enforced in the output format rather than promised in a manifesto:

- Missing numbers become `[your real number]` + what to measure
- Every plan ships with a failure condition
- Two example JSONs carry a `guardrail_check` block you can inspect
- The research file has a section titled "What the research does *not* say"

This exists because fabricated social proof is the single fastest way to lose a launch — the replies become the story, and the story is that you made it up.

### 5. The scorecard includes the number that means "stop"

Most growth advice gives you metrics. This gives you **thresholds and the corresponding action**:

| If | Then |
|---|---|
| Strong hook, no shares | The share trigger is missing — fix structure, not copy |
| Shares, no conversion | Wrong audience or weak close |
| Good numbers, hostile replies | The claim overreached — fix honesty before reach |
| Nothing at all | The bottleneck was misdiagnosed |

"Fix honesty before reach" is not a line you'll find in a growth-hacking toolkit.

---

## What this repo deliberately does not have

Naming these is part of the pitch, because their absence is a choice:

- ❌ **No fake testimonials.** The real ones people send in get added with permission. Until then, there aren't any.
- ❌ **No "guaranteed 100K stars" claim.** The launch playbook sets a target of 1,000 in 90 days and explains why 100K isn't plannable.
- ❌ **No dependency, no API key, no build step.** One markdown file. It works in a plane seat.
- ❌ **No engagement-farming advice.** Manufactured outrage is excluded from the skill file, not just discouraged.
- ❌ **No claim to have "reverse-engineered the algorithm."** Platforms change weekly; psychological findings outlast them.

---

## Where this repo is weaker than it looks

- **It's derivative.** The research is other people's. The assembly is the contribution.
- **It's slow.** 20 minutes of blank-filling feels worse than a one-click generator.
- **It says no.** Some runs will tell you the idea isn't ready. That's a worse product experience and a better outcome.
- **Research transfer is an assumption.** Most cited studies are on news articles and Twitter cascades. Your niche may behave differently. Test.

---

## The test

Don't take any of this on faith. Run it on something you already published and know the numbers for:

1. Score the seven levers on the thing that flopped
2. See whether the named bottleneck matches what you suspected
3. Check whether the scorecard would have told you to stop earlier

If it wouldn't have, the tool is wrong for you — and that's worth knowing in 30 seconds rather than 3 months.
