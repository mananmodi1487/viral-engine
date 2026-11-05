<div align="center">

# 🚀 Viral Engine

### A Claude Skill that turns any idea into a launch-ready viral engine.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Claude Skill](https://img.shields.io/badge/Claude-Skill-blueviolet)](https://claude.ai)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/mananmodi1487/viral-engine/pulls)
[![Stars](https://img.shields.io/github/stars/mananmodi1487/viral-engine?style=social)](https://github.com/mananmodi1487/viral-engine/stargazers)

**Hooks. Positioning. Structure. Distribution. Scorecard.**
*In one pass, from one sentence of input.*

[Quick start](#-quick-start) · [How it works](#-how-it-works) · [Examples](examples/) · [Launch playbook](SUMMARY.md) · [Honesty policy](#-honesty-policy)

</div>

---

## The problem

Most creators, founders, and marketers can build the thing. Almost nobody can **get it in front of people.**

So they do one of four things:

- ❌ Post and hope the algorithm is feeling generous
- ❌ Spend thousands on ads that buy attention instead of earning it
- ❌ Guess at what the audience wants
- ❌ Copy whatever is trending — which is already stale by the time they ship

None of these are strategy. They're lottery tickets with extra steps.

## The solution

**Viral Engine** is a Claude Skill that treats spread as an engineering problem, not a personality trait.

Give it a topic, a product, a rough post, or half an idea. It returns the full plan: the hook, the category you should actually compete in, the structure that makes sharing rational, where the first 100 people come from, and the three numbers that tell you whether it's working.

> **The core principle:** people don't share things because they're good. They share them because sharing **makes the sharer look good**, **makes them feel something**, or **makes them useful to someone they know**. Every recommendation has to answer: *why would a specific person risk their reputation to post this?*

---

## ⚡ Quick start

**1. Install the skill**

```bash
# Personal skills directory
mkdir -p ~/.claude/skills/viral-engine
curl -fsSL https://raw.githubusercontent.com/mananmodi1487/viral-engine/main/SKILL.md \
  -o ~/.claude/skills/viral-engine/SKILL.md
```

Or just copy [`SKILL.md`](SKILL.md) into your Claude skills folder by hand.

**2. Run it**

```
/viral-engine a daily habit tracker app for busy professionals
```

**3. Use what comes back**

You get eight sections — the bet, a spreadability diagnosis, three competing hooks, a positioning frame, a share-optimized structure, a distribution plan, a 48-hour checklist, and a scorecard. Not inspiration. A plan you can start on today.

---

## 🔍 How it works

The skill runs a seven-phase pipeline. Each phase attacks a different reason things fail to spread.

| Phase | Question it answers | What you get |
|---|---|---|
| **0. Intake** | Who is this *actually* for? | A named audience, not "everyone" |
| **1. Diagnose** | Which lever is the bottleneck? | 7-lever scorecard (surprise, identity, usefulness, emotion, share cost, tribal fit, remixability) |
| **2. Hook** | Will anyone stop scrolling? | 12 drafted, 3 kept — each mapped to a pattern and an audience |
| **3. Position** | What category are you really in? | "It's not X. It's Y." — plus the crowded frame you're leaving |
| **4. Structure** | Why would sharing be *rational*? | 2 of 6 share mechanisms, wired into the artifact |
| **5. Distribute** | Where do the first 100 come from? | Named seed nodes, the share sentence, the loop, the backstop |
| **6. Measure** | Did it work? | 3 metrics with real thresholds and a one-variable iteration rule |

### The 7 hook patterns

Curiosity gap · Forbidden insider · Paradox · Enemy · Receipt · Reframe · Direct address

### The 6 share mechanisms

Template/fork · Named pattern · Public artifact · Completion invite · Tribal marker · Built-in gift

Pick **two**. Three or more reads as desperate.

### The 4 failure modes it catches for you

| Symptom | Actual cause |
|---|---|
| Strong hook, no shares | The share trigger is missing, not the copy |
| Shares but no conversion | Wrong audience, or a weak close |
| Good numbers, hostile replies | The claim overreached — fix honesty before reach |
| Nothing at all | You optimized a strong lever and ignored the bottleneck |

---

## 📂 What's in the repo

```
viral-engine/
├── README.md                        ← you are here
├── SKILL.md                         ← the skill itself (the whole product)
├── SUMMARY.md                       ← launch playbook + why it can compound
├── examples/
│   ├── student-app-example.json     ← habit app → placement-risk management
│   └── blog-post-example.json       ← "AI anxiety" → workplace change literacy
├── LICENSE                          ← MIT
└── .gitignore
```

Each example is a **complete** output: diagnosis with scores, three hooks with the pattern and risk for each, the positioning sentence, the two share mechanisms, distribution, 48-hour checklist, and the scorecard. Real reasoning, real rejection notes — including the frames that were cut and why.

Open them side by side with a blank `SKILL.md` run and you'll see the format is reproducible, not vibes.

---

## 🧪 Example: the same product, two categories

**Input:** *"A daily habit tracker app for busy professionals"*

| | Obvious framing | Viral Engine framing |
|---|---|---|
| **Category** | Habit tracker | Placement-risk management |
| **Audience** | "Busy professionals" | Students one missed deadline from a bad semester |
| **Tribe** | None | Students in placement season |
| **Hook** | "Build better habits" | "47 browser tabs, 3 deadlines, 0 systems. This is for you." |
| **Why share it** | *No reason* | Sends a risk card to the friend who's about to blow it |

The product didn't change. The **category** did. That's the entire mechanism — and it's why positioning beats polish almost every time.

Full breakdown: [`examples/student-app-example.json`](examples/student-app-example.json)

---

## 🛡️ Honesty policy

This is the part most growth tooling gets wrong, so it's built into the skill as a hard constraint:

- **No invented statistics.** If a number doesn't exist, the output says `[your real number]` and tells you what to measure.
- **No fabricated testimonials or social proof.** Fake proof is the fastest route to a public callout.
- **No guaranteed outcomes.** Nobody can promise 100K stars or 12,000 users. The skill promises a better-designed attempt.
- **Every plan ships with its failure condition.** One line: *"This fails if ___."*
- **No manufactured outrage, fake controversy, or astroturfing.** Short-term reach, long-term reputation loss — the trade is almost never worth it.
- **Platform rules get checked.** Self-promo bans are real, and getting banned is not a growth strategy.

You'll notice the examples contain `[bracketed]` placeholders instead of impressive-looking numbers. That's the point.

---

## 🎯 When to use it

- You have content that isn't getting traction and you don't know why
- You're launching a product, service, or piece of creative work
- You need hooks that don't sound like every other hook
- You want to know *why* something spread, not just that it did
- You're a creator, founder, marketer, student, or anyone whose work needs to reach people

**Not** for: buying engagement, manufacturing controversy, or dressing up a weak product. The skill will tell you when the honest answer is "don't launch yet."

---

## 🤝 Contributing

Found a viral pattern that isn't in here? Have a worked example from a different domain? Open an issue or a PR.

The most valuable contributions:

1. **New hook patterns** with a real example and the audience they target
2. **New share mechanisms** — especially ones that don't require a network effect
3. **Counter-examples** — things that looked viral-ready and flopped, and why
4. **Domain examples** — local businesses, B2B, education, non-profits, developer tools

Please keep the honesty guardrails intact. A PR that adds fabricated social proof will be closed.

MIT licensed. Build what spreads. 🚀

---

## 📜 License

MIT — see [LICENSE](LICENSE).

<div align="center">

**If this saved you a bad launch, a star helps someone else avoid one too.**

[⭐ Star this repo](https://github.com/mananmodi1487/viral-engine) · [📖 Read the skill](SKILL.md) · [🚀 Launch playbook](SUMMARY.md)

</div>
