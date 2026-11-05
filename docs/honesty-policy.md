# Honesty policy

This is the differentiator, so it is enforced in code rather than promised in a README.

## The rules

| Rule | Enforcement |
|---|---|
| **No invented statistics** | `honesty.ts` blocks unsourced figures; generated assets use `[your real number]` |
| **No fabricated testimonials** | `OUTBOUND_RULES` blocks testimonial shapes in our own output |
| **No guaranteed outcomes** | `REPLACEMENT_RULES` blocks guarantee phrasing; the tool never predicts reach |
| **No manufactured outrage** | Not in any template; anger is never recommended as a strategy |
| **Every plan states a failure condition** | `assertFailureConditions()` throws if any is missing |
| **"Do not launch yet" is a valid answer** | `launchPlan.doNotLaunchYet` is first-class, with a banner in every renderer |
| **Inference is labelled inference** | Every score carries `EvidenceBasis` |
| **Unknown is stated, not guessed** | Saturation returns `unknown`/`unavailable`, never a default number |

## Two directions of enforcement

### Inbound — your document

`checkInbound()` scans for claims that invite a public correction. Severity is about consequence, not style:

| Severity | Meaning | Example |
|---|---|---|
| `blocker` | A realistic outcome is being publicly corrected | `guaranteed viral growth`, `trusted by 10,000 professionals` |
| `warning` | Erodes trust, less likely to be called out | `hack the algorithm`, `overnight success` |
| `note` | Empty, not dishonest | `revolutionary`, `seamless` |

Blockers set `doNotLaunchYet` and make CI exit 3.

### Outbound — our own output

`checkOutbound()` runs on the report before it reaches you, using stricter rules. If it fails, `analyze()` **throws** rather than shipping.

The error looks like:

```
Internal honesty violation — the generator produced text that fails its own policy:
  - invented testimonial shape: "testimonial: this was amazing"
This is a bug. Please report it with the input that triggered it.
```

If you see that, the tool is confessing, not blaming you.

## What happens when our own copy violates the policy

This actually happened twice during development, and both are now regression tests.

**Bug 1 — the tool flagged itself.** The outbound scan initially ran over `JSON.stringify(report)`, which includes honesty findings that *quote* the user's bad phrases. So analysing a document with "guaranteed viral" produced a report containing that phrase, which the outbound scan then flagged.

*Fix:* `extractGeneratedText()` projects only the fields we authored, then scans those.

**Bug 2 — warnings were treated as promises.** The sentence "Nobody can promise 100K stars" matched the star-promise rule. A tool that cannot distinguish a warning from a promise is worse than useless, because it punishes exactly the honesty it claims to want.

*Fix:* a negation guard — a match is discarded when the preceding ~70 characters contain `no`, `not`, `never`, `cannot`, `can't`, `nobody`, `without`, `avoid`, `don't`, `doesn't`, `won't`, `fails to`, `against`, `rather than`, or `instead of`.

The fixture `honest-disclaimers` exists to keep bug 2 dead.

## The negation guard's honest limitation

It is a 48-character window of regex. It will:

- **miss** a negation far from the phrase (*"It is not our position, and we have said this repeatedly, that this guarantees virality"*)
- **over-forgive** a claim that happens to follow a negation (*"No fluff. Guaranteed virality."*)

Both are acceptable trade-offs, because the failure direction matters: over-forgiving a claim costs a warning; over-flagging a disclaimer makes the tool attack its own thesis. When in doubt, it lets the sentence through and the `note`-level lexicon still catches most of it.

## Where honesty costs the tool something

Three places where the policy makes the product worse, stated so you can judge the trade:

1. **The report is less impressive.** No fabricated case studies means no "10,000 users" moment. The `examples/` folder is full of `[bracketed]` placeholders instead of results.
2. **`doNotLaunchYet` is a bad user experience and a good outcome.** A tool that always says yes gets used more.
3. **No virality prediction.** The tool cannot tell you whether your launch will work. It can only tell you which lever is weakest. That is a smaller promise and the only one that survives contact with evidence (Goel et al.: ~0.025% of diffusion events exceed 100 nodes).

## What is explicitly not policed

The policy is about **claims**, not tone. All of these are fine and always will be:

- Dry, blunt, or unfriendly writing
- Profanity
- Strong opinions about categories, tools, or incumbents
- Criticism of this repo
- Predictions clearly framed as predictions (`"I expect this to fail because…"`)

Only claims that would be *disproven* are blocked.

## Contributing to the policy

If you find a fabrication pattern the rules miss, open an issue with:

1. The text that slipped through
2. Why it is a fabrication rather than an opinion
3. The severity you think applies

Add the case to `fixtures/benchmark.json` at the same time. A rule without a fixture is a rule that will silently regress.
