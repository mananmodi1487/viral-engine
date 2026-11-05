# Case Study 1: the habit tracker that changed category

> **What this is.** A complete worked example of a Viral Engine run — the full output, the reasoning, and the rejected options. It is **not** a verified success story with real user numbers. Every metric is a `[bracketed placeholder]` because inventing them would violate the skill's own guardrails. What's real here is the *method*; you can audit every step.

**Input:** *"A daily habit tracker app for busy professionals"*

---

## The bet

**What it is.** A habit tracker pitch repositioned from wellness utility to career-risk management. Nothing about the product changes.

**Who it's for.** Second- and third-year university students in competitive placement tracks — specifically the ones who have already downloaded and abandoned two habit apps.

**Why it spreads.** The share isn't "here's a habit app" (boring, everyone has one). It's "here's the thing that stops you from blowing your placement" — a reputation-safe share, because it makes the sender look disciplined *and* generous at the same time.

**Biggest risk.** Students are saturated with productivity content and can smell a guru instantly. The frame dies the moment it sounds like a hustle-culture course.

---

## The diagnosis

Scores are 1–5 per lever. The weakest lever is the bottleneck, and the bottleneck is the only thing worth fixing.

| Lever | As given | After repositioning |
|---|---:|---:|
| Surprise | 1 | 4 |
| Identity | 1 | 4 |
| Usefulness | 3 | 4 |
| Emotion | 1 | 3 |
| Cost to share | 4 | 4 |
| Tribal fit | 1 | 4 |
| Remixability | 2 | 3 |

**Bottleneck as given:** surprise + identity (both 1). *"Habit tracker for busy professionals"* is a category with zero tension and no tribe. Nobody is against it. Nobody is for it either.

**Bottleneck after repositioning:** emotion (3). The career-risk frame is clear and shareable, but only mildly activating. It needs one concrete story to spike.

**Verdict.** Don't launch on the original framing. Reposition first, then test hooks. **The product doesn't need to change — the category does.**

---

## The hooks

Three kept from the pattern set, each with the thing that will break it.

### 1. "The app my professor doesn't want you to use (but your GPA depends on it)."

- **Pattern:** forbidden insider
- **Target:** students who already suspect the system is stacked against them
- **Why it works:** names an authority conflict in eleven words. The parenthetical resolves the curiosity gap just enough to make clicking feel safe rather than risky.
- **How it fails:** slightly adversarial toward professors. Keep it playful — genuinely anti-education framing draws faculty pushback.

### 2. "I tracked 4 habits for 30 days. My placement offer came on day 26."

- **Pattern:** receipt
- **Target:** final-year students in placement season
- **Why it works:** a dateable, arguable claim with a real number. Invites "wait, which habits?" replies — free distribution.
- **How it fails:** **only usable if the story is true.** If it is, this is the strongest hook in the set, because it converts a utility into a narrative. If it isn't, it's the hook that ends you.

### 3. "47 browser tabs, 3 deadlines, 0 systems. This is for you."

- **Pattern:** direct address
- **Target:** students in exam crunch who self-identify as chaotic
- **Why it works:** hyper-specific scene-setting. The reader recognizes themselves in one second, which is the entire job of line one.
- **How it fails:** reads as mildly insulting. Soften it with humor in line two.

---

## The positioning

**The crowded category you're leaving:** habit tracker / productivity app — thousands of competitors, zero urgency, no reason to switch.

**The sentence:**

> **It's not a habit tracker. It's placement-risk management — for students who are one missed deadline away from a bad semester.**

**Why not these:**

| Rejected frame | Why it was cut |
|---|---|
| Mental health and burnout prevention | True and important, but it invites clinical claims the app can't back, and it makes sharing feel heavy rather than useful. |
| Study-with-me social app | Requires a network effect on day one. The cold-start problem kills it before the hook gets a chance. |

**Proof required.** The frame only survives if the app visibly ties a habit to an outcome the student actually cares about — submission dates, interview prep, sleep before an exam. Otherwise "placement-risk management" is a costume.

---

## The structure

Two share mechanisms. Not three — three reads as desperate.

**1. Public artifact.** A shareable "Semester Risk Score" card: three numbers (habits held, deadlines hit, sleep hours) as a screenshot-friendly graphic with no personal data.
- *Cost to sharer:* one tap, zero explanation — the card is self-describing.
- *Why:* students already screenshot their stats for group chats. Give them a better-looking artifact and they'll do the distribution for you.

**2. Built-in gift.** On the streak screen, one button: "Send my risk card to the friend who needs it." Pre-written, editable, no referral spam.
- *Cost to sharer:* low — framed as a favor, not a promo.
- *Why:* turns an existing peer dynamic (students nagging each other about deadlines) into a distribution channel.

**Rejected: leaderboards.** They convert well for the top 5% and shame everyone else — which suppresses sharing among exactly the people who need the app.

### The content skeleton

> **47 browser tabs, 3 deadlines, 0 systems.**
>
> Most habit apps are built for people who already have their life together. This one is built for the week before submissions.
>
> **The proofs:** a real number of students who used it through one exam cycle `[X]` · the day-26 placement offer story, told in four sentences with dates · the mechanism — a visible risk score instead of a vague streak, so progress is legible in a screenshot.
>
> **The turn:** the point isn't discipline. It's having one number that tells you whether this week is on fire *before* it actually is.
>
> **Close:** try it for one semester. If your risk score doesn't drop in two weeks, delete it.

---

## Distribution

**Seed nodes** (named, not "social media"):

1. Placement-prep Telegram groups at 3 named universities — join, contribute for a week, then share
2. r/college and r/GetStudying — read the self-promo rules first; post as a build log, not an ad
3. Two student-run Instagram pages in the target city with real engagement
4. The professor or TA who runs the placement cell — one endorsement outperforms 20 posts
5. One CS-interview-prep Discord where the maintainers are active

**The first 100.** Hand-recruit 20 students for a two-week beta. The requirement: they must send you their risk card once. Those cards are the first 20 pieces of social proof and the first 20 share events. No public launch until 10 of them say they'd be annoyed if you shut it down.

**The share sentence** — the words a fan uses, not you:

> *"This is the thing that tells you your semester is on fire before it actually is — made for students, not CEOs."*

**The loop.** Risk card → sent to a friend → friend installs to compare → their card is a new send → repeat. The loop is peer comparison, not referrals.

**The backstop.** Exam-season search intent ("submission deadline tracker") plus a free printable semester planner that ranks on its own. If the spike never comes, this keeps the lights on.

---

## First 48 hours

1. **Hour 0–2:** Replace the README/store copy with the new category. Same product, new frame. No feature work.
2. **Hour 2–4:** Build the risk card as a static image from real data. Ship the ugly version today.
3. **Hour 4–6:** Write the day-26 story in four sentences. If it isn't true, write the true version instead — do not invent one.
4. **Day 1 evening:** DM 20 students individually. Ask for one card, not a testimonial.
5. **Day 2 morning:** Post the build log to one community whose rules allow it. Answer every comment yourself.
6. **Day 2 evening:** Read the first 20 replies manually. If the frame is landing, do nothing else. If it isn't, change the hook only — not the product.

---

## Scorecard

| Metric | Working | If it's low |
|---|---|---|
| 3-second view-through on short-form clips | > 45% | Rewrite line one; keep everything else identical |
| Cards sent ÷ active users, weekly | > 0.25 | The send button is invisible, or the card isn't worth sending. Test the artifact before the copy. |
| 7-day return rate after first risk card | > 30% | You have a spike, not a product. Stop all promotion and fix the core loop. |

---

## The failure condition

> **This fails if students read "placement-risk management" as another adult telling them to be more disciplined.**

Test the frame with five students verbally before publishing it anywhere.

---

## Guardrail check

| Check | Result |
|---|---|
| Invented statistics | **None** — all counts are `[bracketed]` placeholders |
| Invented testimonials | **None** |
| Guaranteed outcomes | **None claimed** |
| Single call to action | Yes — try it for one semester |
| Platform rules checked | Flagged: subreddit self-promo rule |

---

**Next:** [Case study 2 — the blog post](case-study-2.md) · [Back to examples](README.md) · [Read the skill](../SKILL.md)
