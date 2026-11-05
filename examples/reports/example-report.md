# Spread diagnosis — README.md

**Overall: 58/100** · weakest lever: **Emotional Stake (40/100)**

*Most growth / marketing tooling products are competing on features. This one is spread diagnostics for people who already published — for people who are already looking for something like this.*

---

## 1. Scorecard

Higher is better except **Honesty Risk**, where higher is worse and is labelled as such.

| Lever | Score | Basis | Why |
|---|---:|---|---|
| Category Clarity | 87/100 | structural | contains an explicit "it's not X, it's Y" category pairing; a one-line description exists; names an audience (people who) |
| Broadcaster Fit | 59/100 | structural | names no community, so there is no obvious amplifier; references 12 recurring proper nouns (citable, recognisable); at 1621 words a broadcaster must read it to describe it |
| Share Friction | 41/100 | measured | 5 prerequisite/configuration cue(s) raise the cost of a first try; 13 setup steps before first value; 9 code blocks: hard to screenshot, hard to quote |
| Emotional Stake | 40/100 | heuristic | 0 high-arousal term(s), 0 deactivating term(s); no activating language: readers have no physical impulse to forward it |
| Proof Readiness | 77/100 | measured | no unbacked claims detected; 5 specific figure(s) present — verifiable if sourced |
| Launch Timing | 50/100 | heuristic | a first-run path exists but is long |
| Honesty Risk (lower is better) | 4/100 | measured | 0 blocker(s), 0 warning(s), 1 note(s) in the honesty scan |

**Basis key:** `measured` = counted from your document · `structural` = deterministic rule · `heuristic` = judgement · `unavailable` = could not determine.

### Fix this first: Emotional Stake

Add one concrete stake: what does the reader lose by ignoring this, in their own words?

## 2. Category

**You are currently competing in:** growth / marketing tooling *(heuristic)*

**Saturation:** low *(measured)* — GitHub search returned 0 repositories for the topic query

**Adjacent, less crowded categories:**

| Candidate | Why less crowded | Tension | What could break it |
|---|---|---:|---|
| spread diagnostics for people who already published | the category sells creation; almost nobody sells post-mortem | 4/5 | diagnostics cannot promise outcomes, which is unfamiliar to this audience |
| category-selection advice | positions above the tooling layer, where trust is higher | 3/5 | sounds like consulting, so it must ship an artifact, not just advice |

**Proposed positioning:** It's not growth / marketing tooling. It's spread diagnostics for people who already published — for people who are already looking for something like this.

**Proof required:** The frame "spread diagnostics for people who already published" only survives if you can show diagnostics cannot promise outcomes, which is unfamiliar to this audience. If you cannot, the frame is a costume and the first critical reply will say so.

**Fails if:** This positioning fails if people who are already looking for something like this reads it as another version of growth / marketing tooling.
*Observable:* Replies describe the product as "just another X" or ask how it differs from a named incumbent. *(First 24 hours after publishing)*

## 3. The broadcaster

Popularity tracks the largest single broadcast more than it tracks chains (Goel, Watts & Goldstein 2012/2016). So this section names one.

### Primary: One practitioner who already writes about this problem for a living

- **Where to find them:** Search the exact problem phrasing on a newsletter platform and on the platform where your audience already argues about it; pick someone who has published on this twice or more
- **Why they care:** They need material, and a concrete growth / marketing tooling diagnostic is easier to write about than another opinion piece.
- **Why it makes them look good:** They cite a tool that produces a specific, checkable output rather than another framework.
- **What to send:** The one-page diagnosis for their own project, run through the tool unasked. Showing beats telling.
- **Likely amplifier:** Their next post, where one line about your tool reaches more of your audience than a month of posting does.

**Message template**

```text
Hi — I ran your <project/post> through a spread diagnostic I built. It came back with:

Most growth / marketing tooling products are competing on features. This one is spread diagnostics for people who already published — for people who are already looking for something like this.

Useful or noise? No ask either way — happy to delete this if it is the latter.
```

**Do not say:**
- Do not lead with what is wrong with their work.
- Do not attach a press release or a media kit.
- Do not ask them to share before they have replied once.

**Fails if:** This fails if the diagnosis is generic. A practitioner will spot boilerplate in one sentence; only send it if the output names something specific to their project.

### Alternate 1: A community moderator in the single most relevant niche community

- **Where to find them:** The largest Discord/forum/subreddit for the exact audience. Read the pinned self-promotion rules before anything else.
- **Why they care:** Moderators are judged on whether their community gets useful material rather than ads.
- **Why it makes them look good:** Posting a tool with a working demo and no signup wall makes them look like they curate well.
- **What to send:** A build-log style post (what you made, what it told you, what it got wrong) — not an announcement.
- **Likely amplifier:** A pinned message or a wiki link, which keeps working for months.

**Message template**

```text
Built a growth / marketing tooling diagnostic over the weekend. It told me something I did not want to hear about my own project: Most growth / marketing tooling products are competing on features. This one is spread diagnostics for people who already published — for people who are already looking for something like this.

Sharing in case it is useful to others here. Rules-permitting, of course — happy to delete if it is off-topic.
```

**Do not say:**
- Do not post the same text to several communities on the same day.
- Do not DM members to promote the post.
- Do not ignore a self-promo ban because "it is genuinely useful".

**Fails if:** This fails if the community bans self-promotion. Check the rules first; being banned costs more than the post was worth.

### Alternate 2: An aggregator that indexes tools in this space

- **Where to find them:** Awesome-lists, topic indexes and tool directories that accept pull requests or submissions.
- **Why they care:** Their value is coverage; a missing useful tool is a gap in their index.
- **Why it makes them look good:** A clean entry with a correct one-line description.
- **What to send:** One line: "Most growth / marketing tooling products are competing on features. This one is spread diagnostics for people who already published — for people who are already looking for something like this." plus a link and the license.
- **Likely amplifier:** Search traffic to the list, which compounds without you.

**Message template**

```text
Submitting for the list: <name> — Most growth / marketing tooling products are competing on features. This one is spread diagnostics for people who already published — for people who are already looking for something like this.

MIT licensed, no signup, works offline. Happy to adjust the description to your format.
```

**Do not say:**
- Do not submit before the tool actually works end to end.
- Do not submit to ten lists in an hour; it reads as spam.

**Fails if:** This fails if the tool needs an API key to do anything. Indexes prefer zero-friction entries.

## 4. Share friction

| Friction | Evidence | Fix |
|---|---|---|
| Setup cost before first value | 13 explicit setup step(s); 5 prerequisite cue(s) detected | Collapse to a single command and move prerequisites into a collapsible section. |
| Quotability | 1621 words, 16 headings, 9 code blocks | Add a 40-word summary at the top that can be screenshotted on its own. |
| Broadcaster clarity | no community or tribe cue found in the document | Name the community explicitly in the first screen. A broadcaster needs to recognise their own readers. |

## 5. Honesty check

**Passed** — no blocker-level claims found.

| Severity | Found | Rule | Suggestion |
|---|---|---|---|
| note | `100k stars` | hype lexicon | "100k stars" is a claim, not evidence. Replace with the specific mechanism or delete it. |

## 6. Launch assets

### show-hn *(one paragraph under 200 words; plain title)*

```text
Show HN: README.md — spread diagnostics for people who already published

I built this because people who are already looking for something like this keep hitting the same problem, and the existing tools all solve it by adding more surface area.

README.md does one thing: spread diagnostics for people who already published. It runs offline by default, has no signup, and produces a report you can read in a minute.

The honest limitation: it cannot tell you whether your idea is good. It can tell you which lever is weakest and what to fix first — and it will say "do not launch yet" if that is the answer.

Everything is MIT licensed. Feedback welcome, especially where the diagnosis is wrong.
```
> Title must be plain and non-promotional. Do not put "viral" in the title — it triggers the category distrust you are trying to escape.

### x-thread *(first post under 240 characters)*

```text
1/ Most growth / marketing tooling products are competing on features. This one is spread diagnostics for people who already published — for people who are already looking for something like this.

2/ Most launch advice optimises the hook. The diffusion data says the hook is rarely the bottleneck.

3/ Across ~1B diffusion events, cascades over 100 nodes were about 0.025%. Popularity tracks the largest single broadcast, not the chain (Goel, Watts & Goldstein).

4/ So the question is not "how do I go viral". It is "who is the one person who would pass this on, and what do they need from me".

5/ I built README.md to answer that: it scores seven levers, names the weakest, and writes the broadcaster brief.

6/ It never invents numbers. If it does not know something it says so, which makes it less impressive and more useful.

7/ Run it on something you already published: <link>

If it tells you something you did not want to hear, that is the tool working.
```
> Post 3 carries the credibility. If you drop the citation, the thread becomes opinion.

### linkedin *(1200-1800 characters performs best)*

```text
I stopped asking "how do I get this in front of more people" and started asking a harder question.

Most growth / marketing tooling products are competing on features. This one is spread diagnostics for people who already published — for people who are already looking for something like this.

The reframe matters because the first question has no answer. The second one has a specific answer, and it is usually "change the category, not the copy".

I built a small tool that runs the diagnosis: it scores category clarity, broadcaster fit, share friction, and proof readiness, then names the single weakest lever.

It refuses to invent statistics. When it does not know something it says "unavailable" rather than guessing, which is why the numbers are less satisfying and more trustworthy.

It also has a "do not launch yet" output. That is a feature, not a bug: one unpolished launch attempt per project is the real constraint.

<link>
```
> Lead with the reframe. LinkedIn rewards first-person, so do not make this read like a launch announcement.

### product-hunt *(tagline under 60 characters)*

```text
Tagline: Find out why nobody shared it

Description: README.md scores your launch on seven levers, names the weakest one, and writes the broadcaster brief. Runs locally, no signup, refuses to invent statistics. Valid output includes "do not launch yet".
```
> The tagline is a question, not a claim. Claims invite comparison; questions invite a click.

### landing-hero *(headline under 10 words, subhead under 25)*

```text
# Most growth / marketing tooling products are competing on features. This one is spread diagnostics for people who already published — for people who are already looking for something like this.

Score seven levers, find the bottleneck, and get the broadcaster brief. Free, local, and it will tell you not to launch.
```
> The paste-ready line is the headline because it is the most compressed true thing you have.

### email-subject *(under 50 characters, no false urgency)*

```text
Why nobody forwarded it
Your category is the problem, not your writing
A diagnosis you can run in 60 seconds
The weakest lever (and how to find yours)
```
> No countdown language. Subject lines that promise urgency get opened once and trusted never.

### chat-announcement *(under 120 words for Discord/Slack)*

```text
Built a small thing that diagnoses why a launch did not spread. It scores seven levers and names the weakest one — mine came back as "broadcaster fit", which was annoying and correct.

Runs locally, no signup, no API key needed: <link>

It refuses to invent stats, and it will tell you not to launch. Feedback welcome, especially if it is wrong about yours.
```
> Share the result about yourself first. It gives others permission to share theirs.

### broadcaster-paste *(one sentence, no link required)*

```text
Most growth / marketing tooling products are competing on features. This one is spread diagnostics for people who already published — for people who are already looking for something like this.
```
> This is the single most important asset. If a broadcaster cannot repeat this sentence from memory, nothing else here matters.

## 7. Pre-launch checklist

- [ ] **[BLOCKER]** Replace the one-line description with the proposed positioning sentence.
      <sub>The description is the only text most people will ever read; if it names the wrong category, nothing downstream recovers.</sub>
- [ ] **[BLOCKER]** Produce one screenshot-ready artifact from real data (no personal information).
      <sub>A share with no artifact requires the sharer to write an explanation. That is the friction that kills most sharing.</sub>
- [ ] **[BLOCKER]** Write down the failure condition before launch, not after.
      <sub>A plan without a kill criterion cannot be evaluated; it can only be rationalised.</sub>
- [ ] [warning] Send the asset to one named broadcaster and ask for nothing.
      <sub>Broadcast drives popularity more than chains do (Goel et al.), but the first message must not ask for a favour.</sub>
- [ ] **[BLOCKER]** Re-run the honesty scan on the final copy before publishing.
      <sub>Copy drifts during editing; a late "10x" is how a clean draft becomes a liability.</sub>
- [ ] [warning] Pick one channel and one asset. Write the other channels into SUMMARY.md as "later".
      <sub>Simultaneous multi-channel launches split attention and make every channel look like a failure.</sub>
- [ ] [info] Read the first 20 replies manually and note which sentence gets quoted back.
      <sub>The quoted sentence is the next post; the reply sentiment tells you whether the frame landed or backfired.</sub>

## 8. Kill criteria

Written down before launch, so they cannot be rationalised afterwards.

- **The output reads as generic advice rather than a diagnosis of this specific document.**
  - Observable: A reader cannot tell which project the report was about without being told.
  - Horizon: Immediately, on your own read-through
- **A reply corrects a factual claim in the launch copy.**
  - Observable: Any comment disputing a number, a testimonial, or a capability.
  - Horizon: First 24 hours
- **People engage with the frame but nobody forwards it.**
  - Observable: Replies and likes present, shares and DMs absent after 7 days.
  - Horizon: 7 days
- **Installs happen but nobody returns.**
  - Observable: 7-day return rate below 30%.
  - Horizon: 30 days

## 9. Limitations of this report

- Category saturation is a keyword heuristic; only the numeric band comes from a measurement.
- Emotional stake is estimated from a keyword lexicon, not measured arousal (Berger & Milkman 2012 is the basis, the lexicon is a proxy).
- No claim is made about whether the underlying product is good, useful, or wanted.
- Saturation: GitHub search returned 0 repositories for the topic query

---

Generated by viral-engine 1.0.0 (deterministic) at 2026-11-05T08:47:29.683Z.
Source: readme-text — /home/user/viral-engine/README.md (local-file).