# Contributing

Three rules, then the practical bits.

1. **No fabricated data.** Not in fixtures, not in examples, not in a comment. If you need a number, write `[your real number]`.
2. **Every rule ships with a fixture.** A rule without a test regresses silently within two months.
3. **Say when you are guessing.** If a threshold is a judgement rather than a finding, label it. `heuristic` exists for exactly this.

---

## Setup

```bash
git clone https://github.com/mananmodi1487/viral-engine
cd viral-engine
npm ci
npm test          # 49 tests
npm run bench     # evaluation harness, gates on precision/recall
npm run typecheck
```

---

## Adding a hook or claim rule

For a phrase that invites a public correction.

**1.** Append to `REPLACEMENT_RULES` in `packages/core/src/honesty.ts`:

```ts
{
  pattern: /\byour phrase here\b/gi,
  label: 'short name',
  severity: 'blocker' | 'warning' | 'note',
  suggestion: 'What to write instead — specific, not "be more honest".',
}
```

**2.** Add a positive test in `tests/honesty.test.ts`.

**3.** Add a **negative** test. Every rule needs one: a sentence where the phrase appears but must not be flagged. Without it, the negation guard gets bypassed and the tool starts attacking honest disclaimers.

**Choosing severity:**

| | Use when |
|---|---|
| `blocker` | A realistic outcome is a public correction |
| `warning` | Erodes trust, unlikely to be called out |
| `note` | Empty rhetoric, not dishonest |

**Never** add a rule that fires on the phrase inside a warning about that phrase. Test it.

---

## Adding a provider

**1.** Implement the interface in `packages/core/src/providers/index.ts`:

```ts
export function myProvider(): Provider {
  return {
    name: 'my-provider',
    model: process.env.MY_API_KEY_MODEL ?? 'default-model',
    isAvailable: () => Boolean(process.env.MY_API_KEY),
    async complete(req) {
      // return { text, provider: 'my-provider', model }
    },
  };
}
```

**2.** Register it in `ALL_PROVIDERS` and decide its place in `AUTO_ORDER`.

**Placement rule:** local providers go first. If your provider runs on the user's machine, it goes ahead of every hosted one.

**3.** Add a test that `resolveProvider()` returns it when the key is present, and that the interface shape holds.

**4.** Do not let your provider influence scores, broadcaster selection, or failure conditions. It adds prose. That boundary is the architecture.

---

## Adding a case study

Put it in `examples/case-study-N.md`. Required sections:

- The bet (what, who, why it spreads, biggest risk)
- The diagnosis (seven levers, before and after, bottleneck named)
- Hooks with **how each one fails**
- Positioning, including the frames you rejected and why
- Two share mechanisms
- Distribution with named seed nodes
- First 48 hours
- Scorecard with thresholds
- **The failure condition**
- **A guardrail check table**

The rejected options are the most valuable part. A case study that shows no rejected options is a preference, not a case study.

**Failure reports are worth more than success stories.** If you ran the tool on something that flopped, write that up. It is rarer and it is more useful.

---

## Improving scoring

Scoring changes are the highest-risk contributions, because a score is a claim.

**Requirements for a scoring change:**

1. **State the basis.** Is it measured, structural, or heuristic? If heuristic, say so in the rationale string.
2. **Justify the direction, not the weight.** "Should category pairing raise the score?" is answerable. "Should it be +30 or +35?" mostly is not — say what you were optimising for.
3. **Show the delta on the fixtures.** Run `npm run bench` before and after and paste both numbers.
4. **Do not make scores predict outcomes.** If your change makes the tool claim reach or virality, it will be rejected.

**What gets rejected immediately:**

- Any weight calibrated so the author's own project scores well
- Any heuristic relabelled as measured
- Any dimension without a `fix` string

---

## Growing the benchmark (the most useful contribution)

The current benchmark is 7 fixtures at 100%, written by the same person who wrote the rules. That is a smoke test, not evidence.

**What would make it real:**

- 30+ genuine documents, including several that demonstrably failed
- Written by people who did not write the rules
- With the outcome recorded where known

Add cases to `fixtures/benchmark.json`:

```json
{
  "id": "descriptive-id",
  "description": "Why this case is interesting",
  "expect": ["weakCategory"],
  "mustNotFlag": ["inflatedClaims"],
  "document": "..."
}
```

**Label partially.** Only name the signals the case is actually about. Labelling all five for every case produces invented expectations and a benchmark that looks good and measures nothing.

`mustNotFlag` is the important field. Positive cases prove a rule fires; negative cases prove it does not fire on honest writing. The `honest-disclaimers` fixture exists solely to keep that behaviour dead.

---

## Pull request checklist

- [ ] `npm test` passes
- [ ] `npm run bench` passes its gate
- [ ] `npm run typecheck` clean
- [ ] New rule has both a positive and a negative test
- [ ] No invented numbers anywhere, including comments
- [ ] Every new recommendation has a failure condition
- [ ] If output shape changed, `schemaVersion` bumped
- [ ] If a heuristic was added, it is labelled `heuristic`

---

## What gets closed

Not to be unwelcoming — these have come up repeatedly:

- **"Add fake testimonials as placeholders."** No. Placeholders are `[bracketed]`, not invented people.
- **"Guarantee results for marketing copy."** No.
- **"Make it detect virality."** It cannot, and claiming otherwise is the problem this repo exists to fix.
- **"Use engagement bait in the templates."** No. Short-term reach, long-term reputation loss.

If you think one of these is wrong, open an issue and argue it. The reasoning matters more than the rule.
