# 🧠 The Virality Patterns Cheat Sheet

*Everything here is either a cited finding or explicitly labeled as working hypothesis. Nothing is invented, because a cheat sheet full of fake studies is just a horoscope with footnotes.*

---

## 1. The five findings that change how you build

### 1. Arousal beats positivity

**Finding:** Content that evokes *high-arousal* emotions — awe, anger, anxiety, amusement — spreads more than content that evokes low-arousal emotions like sadness or contentment. Positive content does beat negative content overall, but the bigger driver is **activation**, not valence. Sadness is powerful and *deactivating*: it makes people withdraw, not forward.

**Source:** Berger & Milkman (2012), "What Makes Online Content Viral?", *Journal of Marketing Research* 49(2), 192–205. Analysis of ~7,000 New York Times articles plus controlled experiments.

**What to do with it:** Don't ask "is this emotional?" Ask **"does this make the reader do something in their body?"** Awe and anger both do. Melancholy doesn't.

**What not to do:** Manufacture anger. It works short-term and it costs you the audience that sticks around. The research says arousal drives *transmission*, not *trust*.

---

### 2. People share what makes them look good to a specific person

**Finding:** 94% of sharers carefully consider how useful or entertaining content will be *to the recipient*. Sharing is framed as a gift to someone specific, not a broadcast about yourself.

**Source:** The New York Times Customer Insight Group, *The Psychology of Sharing* (2011), online survey of 2,500 heavy sharers. Five motivations, six sharer personas.

**What to do with it:** Before publishing, finish this sentence: *"I'm sending this to ___ because it will help them ___."* If you can't, the content is not shareable yet — it's just readable.

**Corollary:** "Useful to everyone" scores lower than "perfect for one person," because nobody can picture the recipient.

---

### 3. Big spread is usually one big broadcast, not a chain reaction

**Finding:** Across ~1 billion diffusion events on Twitter, structural virality is typically **low** — popularity is largely driven by the size of the single largest broadcast, not by person-to-person chains. Large cascades (>100 nodes) are roughly **0.025%** of events.

**Source:** Goel, Watts & Goldstein (2012), "The structure of online diffusion networks," ACM EC '12; extended in Goel, Anderson, Hofman & Watts (2016), "The Structural Virality of Online Diffusion," *Management Science*.

**What to do with it:** This is the finding most virality advice ignores. Stop optimizing exclusively for the average person's share rate. Ask instead: **does this reach one person with an audience, and is it easy for them to pass along?** One well-placed broadcaster outperforms ten thousand passive shares.

→ This is the basis of [The Broadcaster Rule](#3-the-broadcaster-rule-) below.

---

### 4. Most word of mouth is offline, and "influencers" are overrated

**Finding:** Berger cites research estimating only about **7%** of word-of-mouth happens online — we overestimate it because digital traces are visible and kitchen-table conversations aren't. He also reports half of YouTube videos have fewer than 500 views. Social epidemics are driven by the properties of the *idea*, not by special influential people.

**Source:** Jonah Berger, *Contagious: Why Things Catch On* (2013), summarizing his own and others' research.

**What to do with it:** A share that happens in a group chat, a Slack channel, or a lecture hall is a real share and usually a better one. Design for **"would someone say this out loud to a friend?"** not just "would they tap retweet?"

**Caveat, stated plainly:** the 7% figure is from research published over a decade ago and the online share has almost certainly grown since. Treat it as a corrective to influencer obsession, not as a current measurement.

---

### 5. Curiosity is a deprivation state, not a mood

**Finding:** People experience a curiosity gap as an unpleasant itch when they're aware of missing information they think they should have. That itch drives information-seeking.

**Source:** George Loewenstein (1994), "The Psychology of Curiosity," *Psychological Bulletin* 116(1), 75–98.

**What to do with it:** Withhold the *mechanism*, deliver the *payoff*. "The 3-minute habit 10,000 professionals use" withholds the habit; it doesn't withhold whether the article is worth reading. Confusing those two is how curiosity gaps become clickbait — and clickbait converts the itch into irritation.

---

## 2. STEPPS, the reference frame

Berger's six drivers, with the one-line test for each. Useful because it's a checklist you can run on any artifact in 60 seconds.

| | Driver | Test question | Fails when |
|---|---|---|---|
| **S** | Social currency | Does sharing this make the sharer look smart, early, or generous? | It's useful but makes the sharer look basic |
| **T** | Triggers | What daily thing will remind them of this? | Nothing in their environment cues it |
| **E** | Emotion | Does it create arousal (awe/anger/anxiety/amusement)? | It's warm, pleasant, and forgettable |
| **P** | Public | Is the usage visible to non-users? | Everything happens in private |
| **P** | Practical value | Can they forward it with "this will save you time"? | It's interesting but not actionable |
| **S** | Stories | Is there a narrative people retell? | It's a list of claims with no character |

**Source:** Berger (2013), *Contagious*. Six drivers, backed by a mix of field data and lab experiments.

---

## 3. The Broadcaster Rule 🔑

**The pattern this repo is built around — and the one most growth advice gets backwards.**

Standard advice: maximize share rate across the audience. That's optimizing the average of a distribution with a very long tail.

The diffusion data says something different: since popularity tracks the size of the largest single broadcast, your job is not to make everyone share a little. It's to **make it trivially easy for one person with reach to pass it on.**

### The three questions, in priority order

1. **Who is the broadcaster?** Name one real person, account, or maintainer per channel. Not a persona — a handle.
2. **What do they need to pass it on?** Usually: a clean screenshot, a one-line explanation they can copy, and a reason it makes *them* look good for finding it.
3. **Why would they?** They need a stake — it's their community's problem, they were thanked, they're named in it, or it settles an argument they're already having.

### Why this changes the artifact

| Instead of… | Ship… |
|---|---|
| A benchmark table | A single shareable number |
| A 4,000-word post | A post + a 200-word citable summary |
| "Tell your friends" | A pre-written sentence they can paste |
| Asking for a star | Making the repo linkable in one message |

**The honest limit:** the Broadcaster Rule raises your ceiling; it doesn't guarantee the broadcaster shows up. And the 2016 result also found structural virality is generally low *regardless of size* — meaning broadcast, not branching, is the normal engine of popularity. Design for the normal case.

---

## 4. The 7 hook patterns, with the mechanism behind each

| Pattern | Mechanism | Example | Fails when |
|---|---|---|---|
| Curiosity gap | Withheld mechanism (Loewenstein) | "The 3-minute habit 10,000 professionals use" | You withhold the payoff instead |
| Forbidden insider | Gatekeeping violated + in-group | "The app my professor doesn't want you to use" | Tone tips into anti-education |
| Paradox | Two incompatible facts coexist | "I cut my week to 20 hours and shipped twice as much" | It's just a humblebrag |
| Enemy | Names a privately resented thing | "Your habit tracker is designed to make you quit" | You picked a strawman |
| Receipt | Verifiable specific (high-arousal awe) | "0 → 12,000 users in 21 days, zero ad spend" | The number is invented |
| Reframe | Same fact, new category | "It's not a meditation app. It's reputation management." | The frame needs a paragraph to explain |
| Direct address | Recognition in one second | "47 tabs, 3 deadlines, 0 systems. This is for you." | It reads as an insult |

---

## 5. What the research does *not* say

Read this before quoting any of the above in public.

- ❌ **There is no formula that guarantees virality.** The cascade data shows large events are ~0.025% of all events. Anyone selling certainty is selling something else.
- ❌ **Arousal doesn't mean "be edgy."** Anger spreads and erodes. Both are true.
- ❌ **The 7% offline figure is old.** Use it as a corrective, not a current stat.
- ❌ **Most of this research is on news articles and Twitter cascades.** Transfer to your specific product/niche is an assumption, not a finding. Test it.
- ❌ **Correlation in a large dataset is not a lever.** Berger's experiments are the stronger evidence; the observational studies are the weaker.
- ❌ **Sample-specific:** heavily English-language, US-centric media. Your audience may behave differently.

---

## 6. Reading list

| Work | Why it matters |
|---|---|
| Berger & Milkman (2012), *JMR* 49(2) | The arousal finding — the single most actionable one |
| Berger (2013), *Contagious* | STEPPS; the practical checklist |
| Goel, Watts & Goldstein (2012), ACM EC | Why broadcast beats branching |
| Goel, Anderson, Hofman & Watts (2016), *Management Science* | Structural virality at scale |
| Loewenstein (1994), *Psychological Bulletin* 116(1) | Curiosity as deprivation |
| NYT Customer Insight Group (2011), *The Psychology of Sharing* | 94% recipient-first finding; sharer personas |
| Heath & Heath (2007), *Made to Stick* | SUCCESs — sticky, not viral; complementary |
| Kahneman (2011), *Thinking, Fast and Slow* | Dual-process; why "insider" framings feel true fast |

**Citation honesty:** all sources above are cited as published. Where this repo draws an inference beyond what a paper says, the text says "inference" or "the data suggests" — it does not present speculation as a finding.
