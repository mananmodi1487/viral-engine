# 📈 Launch Playbook

**How a skill like this actually gets stars — and what it would take to reach 100K.**

---

## First, the honest bit

You asked for a repo that reaches 100K+ stars. Here is what that number really means, because planning around a fantasy is how projects get abandoned in week three.

| Reality | Detail |
|---|---|
| **100K stars is ~0.008% of repos** | Roughly 150–200 repositories on all of GitHub have ever passed it. Ever. |
| **Stars are a distribution event, not a quality score** | Almost every 100K repo had one moment: a Hacker News front page, a famous person's tweet, a viral demo video, or years of compounding search traffic. |
| **The median "good" repo gets 5–50** | Getting to 500 puts you in the top few percent of all repos. |
| **Nobody can promise it** | Anyone who guarantees a star count is selling something. This doc gives you the mechanism and the odds, not a guarantee. |

**So what's the actual target?** Start at **1,000 stars in 90 days**. That's ambitious, achievable, and — critically — it's the threshold where GitHub's own recommendation surfaces start feeding you traffic for free. 1,000 real stars beats a fantasy about 100K every single time.

> **Honesty guardrail:** every number in this playbook is a planning estimate, not a measurement. Replace them with your own data as you go.

---

## Why this specific repo can compound

Most repos have no reason to be shared. This one has four structural advantages:

1. **It's a skill, not a library.** Zero install friction, no dependencies, no build step. The barrier to trying it is "copy one file."
2. **The output is shareable by nature.** People run it, get hooks and a positioning frame, and those outputs are screenshots. The tool manufactures its own marketing material.
3. **"Meta-viral" is a real hook.** A tool for making things go viral will always get more scrutiny — and more shares — than a tool for parsing CSV. Use that attention honestly.
4. **The honesty policy is the differentiator.** The growth-tool space is drowning in fabricated case studies. Being the one skill that refuses to invent numbers is a defensible position, and it's the reason people will trust the output enough to use it.

**What it does not have:** a visual demo, a benchmark, or a "wow" 5-second moment. That's the gap. Section 3 fixes it.

---

## The fastest path: screenshots of real outputs

The single highest-leverage asset is not a blog post. It's **a before/after in one image.**

```
INPUT:  "A daily habit tracker app for busy professionals"
                    ↓
OUTPUT: "It's not a habit tracker. It's placement-risk management."
        + 3 hooks + the risk-card share mechanism
```

**Why this works:** the reframe is legible in under three seconds, it's surprising, and it teaches the reader something they can reuse immediately on their own project. That's the whole share trigger — and it costs the sharer nothing.

**Action:** produce 5 of these cards from 5 different domains (a local bakery, a B2B SaaS, a newsletter, a student club, a side project). Post one per week. They are reusable forever and they never expire.

---

## Launch sequence

### Phase 0 — Before you say anything (Week 1)

The repo must survive the traffic before you ask for it. A launch that lands on a broken repo converts zero.

- [ ] `SKILL.md` works end-to-end from a clean Claude install — test it 5 times with different inputs
- [ ] Both examples open cleanly and validate as JSON
- [ ] README renders on mobile (check the badge row and the tables)
- [ ] Pin it: repo description, topics (`claude-skill`, `claude`, `ai`, `marketing`, `content-creation`, `viral`, `growth`, `prompt-engineering`)
- [ ] Social preview image set (Settings → Social preview) — this is the card on every share
- [ ] One pinned issue: "Show me what Viral Engine gave you" — this becomes your social proof engine, and every comment is a real testimonial

**Do not launch until 10 strangers have used it and 5 of them reported something useful.** Friends compliment. Strangers tell you the truth.

### Phase 1 — The first 100 (Week 2)

Hand-to-hand, not broadcast.

- [ ] Give it to 20 people who have a real launch coming up, individually. Ask for their output, not their opinion.
- [ ] Collect the 3 best outputs as the first real testimonials — **screenshots only, no invented quotes**
- [ ] Add those 3 to the README. This is the first time the README should claim any results
- [ ] Post the *story* to one community whose rules allow it: "I built a Claude Skill that diagnoses why content doesn't spread. Here's what it told me about my own project."

### Phase 2 — The public attempt (Week 3–4)

One coordinated push, not a slow drip. Timing matters more than volume.

| Channel | Format | Notes |
|---|---|---|
| **Hacker News** | Show HN, Tue–Thu, 8–10am ET | Title must be plain and non-promotional. "Show HN: A Claude Skill that diagnoses why content doesn't spread." Survival time is measured in minutes — have the repo ready and be present in the thread for 6 hours. |
| **r/ClaudeAI, r/ClaudeCode** | Build story, not an ad | Read the self-promo rules first. Answer questions in comments for a week before linking. |
| **X / LinkedIn** | The before/after card | Lead with the output, not the repo. The repo link goes in the reply, not the post. |
| **Product Hunt** | Launch, with a real demo GIF | Needs a visual. Pair with Phase 3. |
| **Claude skill directories** | Submit to every one you can find | Low effort, long tail, keeps working for months. |

**HN rule:** you get one real attempt. Don't burn it on a version with an unpolished README.

### Phase 3 — The long tail (Month 2+)

The spike is luck. The tail is work. This is where most repos die, and where 1,000 stars actually comes from.

- [ ] **One new example per week** — a different domain each time, always complete JSON. This is the recurring content engine and it feeds search.
- [ ] **A short write-up per example** — "why we cut this frame" is more interesting than the frame itself, and it's the kind of post that gets linked.
- [ ] **SEO surface**: every example's filename and README mentions the domain (habit tracker, blog post, newsletter, B2B SaaS, local business). Repos rank in Google; GitHub search is free distribution.
- [ ] **A newsletter or a "pattern of the week"** — converts a one-time reader into a returning one.
- [ ] **Invite 3 contributors by name.** A repo with 3 outside contributors is categorically more alive than one with 3,000 stars and one committer.

---

## The loop

```
Useful skill  →  surprising output  →  screenshot  →  someone else
      ↑                                                  │
      └──────────── new example / PR ←───────────────────┘
```

The output is the marketing. Every run is a content opportunity, and every shared output is a new user who runs it and produces another one. That's the only loop worth building, and it works because the tool's output is genuinely useful to the person sharing it — not because it's engineered to be.

**What breaks the loop:** outputs that read as generic. If the skill returns "post consistently and provide value," the screenshots are worthless and the loop is dead on arrival. Specificity is not a style choice here; it's the entire mechanic.

---

## Scorecard

Track weekly. Three numbers, no vanity metrics.

| Metric | Why | Working | Broken |
|---|---|---|---|
| **Stranger runs** | Installs by people you don't know | > 30/week | Anything from your own network only |
| **Output shares** | People posting their results | > 5/week | People use it privately and never mention it |
| **Star-to-run ratio** | Do users convert to stargazers? | > 20% | High runs, low stars → README isn't asking |

Supporting signals: repo views → clones (traffic tab), issue quality (real use cases vs. "cool project!"), and the ratio of returning visitors.

---

## The realistic curve

| Timeframe | Optimistic | Realistic | Fail state |
|---|---|---|---|
| Week 1 | 150 | 40 | 5 |
| Month 1 | 1,200 | 300 | 30 |
| Month 3 | 4,000 | 1,000 | 150 |
| Month 12 | 15,000 | 3,000 | 400 |

**100K requires a genuine outlier** — the HN front page *and* a major account picking it up *and* the examples being good enough to sustain it. It is possible. It is not plannable. Plan for 1,000 and you might get the outlier; plan for the outlier and you'll get 40.

### Go / no-go gates

- **End of Week 2:** fewer than 10 stranger runs → the audience is wrong, not the copy. Change who you're talking to.
- **End of Month 1:** good runs, weak stars → the README isn't converting. Rewrite the top 10 lines only.
- **End of Month 2:** good stars, no returning users → you have a novelty, not a habit. Ship recurring value (weekly example) or stop investing.
- **Any point:** hostile replies about accuracy → stop promoting immediately and fix the claim. Reputation compounds in both directions.

---

## What will actually kill this

Named plainly, because knowing the failure modes is most of the strategy:

1. **Generic outputs.** If the skill produces advice-shaped text instead of specific frames, the screenshots are unshareable and the whole loop collapses. This is the #1 risk.
2. **Overpromising in the README.** "Make anything go viral" invites the reply "nothing can make anything go viral." The honesty policy exists to prevent exactly this — keep it in the marketing too.
3. **A single fabricated testimonial.** One invented result and the replies become the story. The entire differentiator is that this repo doesn't do that.
4. **Launching before it's good.** One burned HN attempt cannot be repeated.
5. **Stopping at launch.** Week 3 is where 90% of repos stall. The tail is the strategy.

---

## The one-line version

> Build something specific enough that a stranger screenshots it, honest enough that they trust it, and cheap enough that they try it in 60 seconds — then ship one new example every week for a year.

That's the whole playbook. Everything above is execution detail.

---

<div align="center">

**[← Back to the README](README.md)** · **[Read the skill](SKILL.md)** · **[See the examples](examples/)**

</div>
