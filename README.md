<div align="center">

<svg width="880" height="220" viewBox="0 0 880 220" role="img" aria-labelledby="heroTitle heroDesc" xmlns="http://www.w3.org/2000/svg">
  <title id="heroTitle">Viral Engine Commons</title>
  <desc id="heroDesc">A box labelled "generic app description" with an arrow to three boxes: "the category you are actually in", "the person who would post it", and "the failure condition you would honour". A fourth box reads "or: do not launch yet".</desc>
  <rect width="880" height="220" fill="#0d1117"/>
  <text x="440" y="48" fill="#e6edf3" font-family="ui-sans-serif,system-ui,sans-serif" font-size="30" font-weight="700" text-anchor="middle">Viral Engine Commons</text>
  <text x="440" y="76" fill="#8b949e" font-family="ui-sans-serif,system-ui,sans-serif" font-size="14" text-anchor="middle">an open protocol for attempts at diffusion · free forever · runs offline</text>
  <rect x="24" y="104" width="196" height="72" rx="8" fill="none" stroke="#30363d"/>
  <text x="122" y="134" fill="#8b949e" font-family="ui-monospace,monospace" font-size="12" text-anchor="middle">"a productivity app</text>
  <text x="122" y="152" fill="#8b949e" font-family="ui-monospace,monospace" font-size="12" text-anchor="middle">with AI features"</text>
  <text x="248" y="146" fill="#58a6ff" font-family="ui-monospace,monospace" font-size="20">→</text>
  <rect x="280" y="104" width="176" height="72" rx="8" fill="none" stroke="#3fb950"/>
  <text x="368" y="131" fill="#3fb950" font-family="ui-sans-serif,system-ui,sans-serif" font-size="12" text-anchor="middle">the category you</text>
  <text x="368" y="149" fill="#3fb950" font-family="ui-sans-serif,system-ui,sans-serif" font-size="12" text-anchor="middle">are actually in</text>
  <rect x="472" y="104" width="176" height="72" rx="8" fill="none" stroke="#3fb950"/>
  <text x="560" y="131" fill="#3fb950" font-family="ui-sans-serif,system-ui,sans-serif" font-size="12" text-anchor="middle">who would post it,</text>
  <text x="560" y="149" fill="#3fb950" font-family="ui-sans-serif,system-ui,sans-serif" font-size="12" text-anchor="middle">and under what consent</text>
  <rect x="664" y="104" width="192" height="72" rx="8" fill="none" stroke="#d29922"/>
  <text x="760" y="131" fill="#d29922" font-family="ui-sans-serif,system-ui,sans-serif" font-size="12" text-anchor="middle">or: do not</text>
  <text x="760" y="149" fill="#d29922" font-family="ui-sans-serif,system-ui,sans-serif" font-size="12" text-anchor="middle">launch yet</text>
  <text x="440" y="204" fill="#6e7681" font-family="ui-sans-serif,system-ui,sans-serif" font-size="11" text-anchor="middle">no virality prediction · no invented statistics · no telemetry · no account</text>
</svg>

# Viral Engine Commons

**The free universal diffusion protocol.**
An open specification, a local-first engine, and a public evidence commons for the question
everyone asks after publishing something and hearing nothing back:

> *Was this worth reading, or was it just never legible?*

[![CI](https://github.com/mananmodi1487/viral-engine/actions/workflows/ci.yml/badge.svg)](https://github.com/mananmodi1487/viral-engine/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/code-MIT-yellow.svg)](LICENSE)
[![Spec: CC0](https://img.shields.io/badge/spec-CC0%201.0-lightgrey.svg)](licenses/CC0-1.0.txt)
[![Tests](https://img.shields.io/badge/tests-151%20passing-brightgreen)](tests/)
[![Eval](https://img.shields.io/badge/eval-precision%201.000%20%C2%B7%20recall%200.958-blue)](evidence/benchmarks/aqi-detector-results.md)
[![Free forever](https://img.shields.io/badge/free-forever-blueviolet)](#what-free-forever-means)
[![No telemetry](https://img.shields.io/badge/telemetry-none%2C%20by%20default-success)](#privacy-you-can-verify)

[60-second start](#60-second-start) · [What you get](#what-you-actually-get) · [The protocol](protocol/open-diffusion-spec.md) · [Academy](academy/) · [Evidence](evidence/) · [Governance](governance/) · [Honest limits](#honest-limits)

</div>

---

## The 30-second version

You published something. A few people said nice things. Nobody passed it on.

You rewrote the hook. You improved the copy. You posted at a better time. Still nothing. At
this point the usual advice is "be more authentic", which is not actionable, or "post more",
which is how people end up spamming.

**Viral Engine Commons reads what you published and tells you which specific thing is stopping a
stranger from passing it on** — the category you are actually in, the three people who could
carry it and what consent looks like for each, the claim that will not survive being checked, and
the failure condition you should have written before you launched.

It runs on your laptop, in your terminal, with no account. It works offline. When it thinks you
should not launch, it says so.

```
$ npx viral-engine analyze ./README.md --offline

  README.md · 1,847 words · source: user-provided · offline · no network calls

  ATTEMPT QUALITY INDEX  630 / 1000   Workable
  ───────────────────────────────────────────────────────────────────
  This is a rubric score for the attempt, not a forecast. Nothing here
  predicts whether the work will spread, and no implementation of this
  index can.

  Highest leverage      Broadcast stake     22/100  ·  51 points available
  Weakest dimension     Broadcast stake     22/100
  Dimensions scored     20 of 20   ·   basis: 3 measured, 4 structural, 11 heuristic, 2 unavailable

  WHAT TO FIX FIRST
    1. Broadcast stake — nothing here explains why a specific person with
       an audience would spend their reputation on it. Add the reason in
       their terms, in one sentence they could reuse.
    2. Proof readiness — three figures, no sources. Either measure them or
       present them as targets.

  DO NOT LAUNCH YET
    Reason: attempt quality is below 450 with two unmeasured dimensions that
    cannot be resolved from this document.
    This is a valid outcome. Fix the two items above, then re-run.
```

## 60-second start

```bash
# No install, no account, no network.
npx viral-engine analyze ./README.md --offline

# A PDF, a deck, a docx, or a folder. 14 formats, all parsed locally.
npx viral-engine analyze ./pitch-deck.pdf --offline

# Just the number.
npx viral-engine score ./README.md --offline --quiet

# The full report: markdown, HTML, JSON, SVG assets, or an ODS document.
npx viral-engine report ./README.md --offline --output html -o report.html

# Prove to yourself that nothing leaves the machine.
npx viral-engine doctor --offline
```

Everything the tool produces is either a **scorecard** you can diff between commits, an
**ODS document** (JSON, spec'd, validated, machine-readable), or **copy with every placeholder
marked** — so you cannot accidentally publish a number the tool made up.

There is no signup. There is no "pro" command. `viral-engine upgrade` prints, verbatim: *there is
no paid tier.*

## What you actually get

<details>
<summary><strong>1. A scorecard with a reason attached to every number</strong></summary>

Twenty weighted dimensions, 1000 points. Every single one carries: the evidence it was based on,
its confidence, its basis (`measured` / `structural` / `heuristic` / `user-supplied` /
`unavailable`), the assumptions behind it, what data is missing, the improvement action, and the
failure condition that would prove the score wrong.

You cannot get a score without an improvement action and a failure condition. The schema rejects
it. There is no flag to turn that off.

```
category_clarity       62/100  weight 80   heuristic   confidence: medium
  evidence        "it's not a habit tracker. it's placement-risk management"
  assumptions     the reader recognises "placement season"
  missing_data    no evidence of how readers actually describe it
  improvement     name the job, not the adjacent category
  failure_cond    readers describe it as a productivity app
```

**Not a prediction.** A high score means the attempt is well-formed. It says nothing about
whether the work will land.

</details>

<details>
<summary><strong>2. Category cartography: the slot you are actually in</strong></summary>

The engine reads what you wrote, detects the category it implies, and proposes adjacent
categories with the proof each one would need.

| Field | What it answers |
|---|---|
| `current` | the slot a reader will put you in by default |
| `why_less_crowded` | why the adjacent category has more room |
| `credibility_risk` | why a reader might not believe you belong there |
| `tension_score` | how much contrast the reposition creates |
| `proof_needed` | the specific thing you must show to claim it |
| `saturation_estimate` | `"unknown"` unless something was actually measured |

That last row is the whole design in one field. The tool will not invent a market size.

</details>

<details>
<summary><strong>3. A broadcaster brief with no names in it</strong></summary>

Which *kind* of person would carry this, why they would, how to find them, and the consent
status. Never a list of individuals — the type has no field that can hold a handle.

```
$ npx viral-engine broadcaster ./README.md --offline

  BROADCASTER ANALYSIS   3 candidates · max_contacts: 3 · consent: not-contacted
  ───────────────────────────────────────────────────────────────────────
  THE CURATOR
    why them         their reputation is "found a good thing, told you why"
    their reader     someone deciding whether their positioning is the problem
    how to find them newsletters that cover developer tooling and launches
    disqualifier     any list that is sold as a growth channel
    consent          not-contacted. A message may be sent. No ask may be made.

  MESSAGE TEMPLATE — no ask
    Subject: a tool for [their readers' specific problem]
    [one clause showing you know what they cover]
    I built [thing], which does [the job, in their vocabulary]. Free, offline.
    No action needed — sending it in case it is useful.
    If it is not, no reply is the right reply.

  ANTI-SPAM RULES  (required by the schema; the document does not validate without them)
    · one message per person, ever
    · no list, no queue, no automation
    · no follow-up if there is no reply
    · if the community's rules forbid self-linking, they win
```

</details>

<details>
<summary><strong>4. An honesty audit that will block your merge</strong></summary>

Every claim is matched against the patterns that make copy hard to forward: guarantees,
multipliers with no base, testimonials with no source, urgency that is not real, adoption figures
that nobody can check.

It rewrites them into their evidence class rather than deleting them:

| A claim people write | What the audit turns it into | Why |
|---|---|---|
| guaranteed viral growth | `[measured change]` + a plan for how to measure it | nobody can guarantee this |
| 10x your audience | `[n → m reach in T days, source: ___]` | a multiplier with no base |
| used by 10,000+ developers | `used by [n], as of [date] — we cannot count the rest` | a number you cannot defend |
| only 3 spots left | *deleted* | manufactured scarcity |

Those four are quoted as examples, not asserted as claims — and the audit cannot tell the
difference, so it flags this very table. That flaw is recorded in
[`evidence/failures/2026-04-audit-flags-own-example.md`](evidence/failures/2026-04-audit-flags-own-example.md)
instead of being hidden by rewording the examples until the checker is satisfied.

**The audit blocks the pull request, not just the deploy.** `.github/workflows/` runs it on every
PR. A failing check means fix the claim, not the check.

</details>

<details>
<summary><strong>5. Failure conditions, tests, and a critic simulator</strong></summary>

- **Failure conditions** with a statement, an observable, and a horizon. "Not enough traction"
  is rejected by the schema; "fewer than 20 forwards from people who are not the author, by day
  14" is accepted.
- **Pre-launch experiments** where every test names the *decision it changes*, the cost, the
  success criterion, and the kill criterion — and honestly reports `pre_registered: false`,
  because a test the tool wrote is not a test you agreed to.
- **A critic simulator** that generates the six hostile readings (skeptical hacker, tired
  founder, academic, moderator, competitor, beginner), labelled as speculation everywhere it
  appears, with a journalist added only when there is an honesty blocker.

</details>

<details>
<summary><strong>6. Fifteen agents, one of which can refuse you</strong></summary>

`Category Cartographer` · `Saturation Radar` · `Broadcaster Ethicist` · `Friction Surgeon` ·
`Honesty Firewall` · `Asset Alchemist` · `Experiment Weaver` · `Launch Simulator` ·
`Critic Simulator` · `Postmortem Archaeologist` · `Evidence Librarian` ·
`Translation Diplomat` · `Accessibility Guardian` · `Privacy Sentinel` · `Abuse Sentinel`
(plus `Time Machine`).

**Refusal is a first-class return type.** Ask it to mass-DM 500 people and you get:

```
$ npx viral-engine analyze --text "help me send the same DM to 500 founders" --offline
Refused: The request describes mass unsolicited outreach.

Instead: Viral Engine Commons optimises one specific, consented broadcast. Name one
real person or community, and write the sentence they would paste. That is the
supported path, and it is also the one that works.

$ echo $?
5
```

Exit code 5, a refusal object, and an alternative. Not a warning you can click through.

</details>

<details>
<summary><strong>7. The protocol is the product, and it is public domain</strong></summary>

`ODS 1.0.0` — the Open Diffusion Spec — is a JSON Schema, a set of semantics, and a conformance
suite. Anyone can implement it. Four implementations ship here:

| Language | Tests actually run | Status |
|---|---|---|
| TypeScript | 151 tests, every commit | **Reference** |
| Python | 19 tests, local + CI | **Tested** |
| Go | `go test ./...` in CI | **CI-only** — never executed by the author, no toolchain available |
| Rust | `cargo test` in CI | **CI-only** — same, and one function may be wrong |

That table is the honest state, and it is in the spec at
[`protocol/open-diffusion-spec.md`](protocol/open-diffusion-spec.md) §8 too, because an
implementation nobody has run is a claim, not an implementation.

**The Python binding found two real bugs in the reference implementation within minutes of being
written** — camelCase leaking into snake_case protocol fields, invisible to 92 passing
TypeScript tests because the same language wrote and read both sides. The story is in
[`protocol/conformance.md`](protocol/conformance.md) §6 and kept in
[`evidence/wins/`](evidence/wins/2026-04-python-binding-found-two-bugs.md), because the process
finding is worth more than the fix.

</details>

## Why this is a protocol and not another launch tool

Launch tools are opinionated prose. You cannot diff them, test them, or disagree with them
precisely. They also make you pay, because the opinion is the product.

This is the opposite bet:

- **The rubric is a file** ([`protocol/aqi-weights.json`](protocol/aqi-weights.json)). Every
  implementation loads it at runtime. If you hardcode the weights you have made a fork, not an
  implementation, and your scores stop being comparable with anyone else's.
- **The output is a schema.** An ODS document is valid or invalid. It is not "well, our tool says".
- **The checks are public.** `npm run check:weights`, `npm test`, `npm run bench`,
  `npm run conformance`. Every claim in this README has a command behind it.
- **The evidence is public, including the failures.** [`evidence/`](evidence/) has labelled
  records, our own ethics incident, and a benchmark that publishes every case it gets wrong.

## Honest limits

This section exists because a tool that diagnoses overclaiming had better not overclaim.

**What this cannot do:**

- **Predict whether your work will spread.** Nothing can, and the index is explicitly a rubric
  for the *attempt*, not a forecast of the outcome. Two artifacts scoring 720 are comparably
  described. They are not comparably likely to succeed.
- **Measure your market.** There is no scraping, no market data, no competitor tracking.
  `saturation_estimate` is `"unknown"` unless you supply a number.
- **Judge whether the work is any good.** It judges whether the work is *legible*. That is a
  smaller and more tractable question, and it is the only one a document can answer.
- **Replace a reader.** The single most useful test (module 09: five strangers, one question) is
  a human protocol. The tool designs it; it cannot run it.
- **Work well in languages other than English.** The lexicons and the negation logic are
  English-tuned. Every evaluation case is English. `Translation Diplomat` flags idioms that do
  not survive translation; it does not translate.

**Where the current version is weak, specifically:**

| Weakness | Detail |
|---|---|
| One author | Every judgement in this repository, including every ethical judgement, has one perspective behind it. See [`CONTRIBUTORS.md`](CONTRIBUTORS.md). |
| Self-written benchmark | The 32-case dataset and the detectors share an author. Precision 1.000 is a conflict of interest, not an achievement. |
| Two unrun bindings | Go and Rust were written with no compiler available. They are in CI; until that CI is green, they are drafts. |
| Jargon detection | Still partly a word list. The one case it fails in the benchmark is a 160-word wall of prose with nothing quotable, and it is published as a known miss rather than tuned away. |
| Ethics council | Charter written, seats empty. A vacant council is disclosed, not hidden. |

## Privacy you can verify

| Claim | How to check it |
|---|---|
| No account | there is no accounts table, no auth, no user record |
| No cookies | `curl -sI http://localhost:4173/` |
| No telemetry by default | `grep -rn "fetch(\|https://" packages/core/src/` |
| Offline really is offline | `npx viral-engine doctor --offline` → "this command made no network requests" |
| Your document is not stored | the web app holds it in memory for one request |
| Rate limiting is per-IP, in memory | for abuse prevention, not usage measurement; resets on restart |

Running against a *hosted* model means your text leaves your machine. The terminal says so
whenever that happens. `--offline` is the default path, and local mode
(Ollama / llama.cpp / LM Studio) is first-class, not a degraded version.

## What free forever means

Free means free. Not "free tier".

There is no paywall, no premium tier, no seat limit, no feature gate, no trial, no locked schema,
no template behind an email, no "enterprise-only intelligence". `viral-engine upgrade` exists
only to print that there is no paid tier, and a test asserts it.

Funding is permitted from donations, grants, public-interest sponsorship, and optional consulting
that never degrades the free product. It is forbidden to sell data, sell telemetry, sell placement
inside generated advice, or make the free product worse in order to sell anything.

**If revenue and access ever conflict, access wins and the funding is what changes.** That
sentence is in [`governance/README.md`](governance/README.md) §9 so the decision is not made in a
bad quarter by someone under pressure.

The commitments are not a promise by one person. They are in the git history, in `LICENSE`, and
partly in the test suite. A PR that changes their substance needs a supermajority, unanimous
consent from the ethics council, and a 90-day window for anyone to fork with the old terms
disclosed.

## The academy

Fifteen modules, about seven hours, no signup. Not tactics — tactics expire and half of them are
manipulation. Four things that do not expire: how diffusion actually works, how to describe what
you made so a stranger can locate it, how to find the person who would carry it without becoming
a spammer, and how to know when to stop.

```bash
npm run academy -- 04 ./README.md    # run the checker for module 04 on your own work
```

The checkers refuse to write the answer for you. The repositioning sentence has to be yours,
because a generated sentence is exactly the generic copy the academy exists to prevent.

Start at [`academy/README.md`](academy/README.md).

## The evidence commons

A public record of what happened when people tried to make something spread. Wins, failures,
postmortems, benchmarks, broadcaster patterns, hook patterns, category shifts, ethics incidents.

Every record carries a label chosen by the evidence, not by the author's confidence:
`verified` · `reproducible` · `self-reported` · `anecdotal` · `unclear` · `contested` ·
`private-redacted`.

**You cannot compute a success rate from it**, and [`evidence/README.md`](evidence/README.md)
says so at the top, because wins get submitted and failures get deleted.

## Repository map

```
protocol/           the spec, the weights, the schema, conformance, examples
packages/core/      ingest (14 formats) · signals · AQI · ODS analysis · reports · evals
packages/agents/    fifteen agents, refusals included
packages/protocol/  TS reference + Python, Go, Rust bindings
packages/plugin-sdk/ the extension contract, with the rubric sealed
packages/providers/ the model contract (local-first, no-network default)
apps/cli/           15 commands · exit codes 0-5 · 7 output formats
apps/web/           zero-dependency server + app, no cookies, strict CSP
academy/            15 modules and their checkers
evidence/           labelled records, benchmarks, and our own incidents
governance/         commitments, council charter, decision log
licenses/           MIT code · CC0 spec · CC BY prose
```

Unbuilt surfaces (API, browser extension, VS Code extension, PWA, Slack/Discord/Telegram bots,
email plugin, CMS plugins) are specified in [`docs/architecture.md`](docs/architecture.md) and
**deliberately absent from the tree**. An empty directory is a claim that something exists there.

## Try it on this repository

The tool refuses to flatter its own home:

```bash
npx viral-engine analyze ./README.md --offline
```

Running the tool on this file returns **583/1000, Workable**, and **`do_not_launch_yet: true`**
with two honesty blockers — because the honesty-audit section above quotes the phrases the audit
catches, and the audit cannot distinguish a quotation from an assertion. The detailed record is
in [`evidence/failures/2026-04-audit-flags-own-example.md`](evidence/failures/2026-04-audit-flags-own-example.md).

That number will be wrong by the time you read it: this sentence is part of the document being
scored. Which is the point — a score that cannot be quoted reliably is a score that has to be
re-run, and every report ends with the command to re-run it.

## Contributing

The most valuable contribution is a disagreement with a claim, recorded in public. The second
most valuable is a failure record.

```bash
npm ci && npm run check     # weights · typecheck · 151 tests
npm run bench               # evaluation harness; fails on a precision regression
```

Read [`governance/README.md`](governance/README.md) before proposing a change to the commitments.
A fork is a legitimate disagreement and the window is always open — but a silent fork is also how
"free forever" quietly becomes "free for now", so the argument in public comes first.

## Citation

```
Viral Engine Commons. (2026). Open Diffusion Spec 1.0.0.
https://github.com/mananmodi1487/viral-engine/blob/main/protocol/open-diffusion-spec.md
```

The honest citation includes what it cannot do:

> ODS is a rubric protocol for describing an attempt at diffusion, not a predictive model of
> diffusion. Its scores are reproducible by design and have no demonstrated causal relationship
> with reach.

<div align="center">

---

**Most things do not spread. This helps you tell the difference between a work that failed and a
work that was never legible enough to be judged.**

Free forever · MIT / CC0 / CC BY · no account · no telemetry · runs offline

</div>
