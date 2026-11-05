# 📂 Examples

Two complete runs of [`SKILL.md`](../SKILL.md), in full JSON. Not excerpts, not summaries — the entire output including the sections that are unflattering.

| File | Input | The move |
|---|---|---|
| [**student-app-example.json**](student-app-example.json) | *"A daily habit tracker app for busy professionals"* | Habit tracker → **placement-risk management** |
| [**blog-post-example.json**](blog-post-example.json) | *"Blog post about AI anxiety"* | AI essay → **workplace change literacy** |

---

## What to look at first

If you only read one section of one file, read **`diagnosis`**.

It's the part that makes this different from a hook generator. Every example shows the 7 levers scored **before** and **after** repositioning, and names the bottleneck in each state:

```json
"bottleneck_as_given": "surprise + identity (tied at 1/5).
 'Habit tracker for busy professionals' is a category with
 zero tension and no tribe.",
```

That sentence is the whole product. The hooks are what you get *after* you know that.

Then look at **`positioning.rejected_frames`** — the frames that were considered and cut, with the reason. A plan that shows no rejected options isn't a plan, it's a preference.

---

## ⚠️ About the numbers

**There are no impressive statistics in these files, and that's deliberate.**

Every metric is a `[bracketed placeholder]` with a note about what to measure. Each file ends with a `guardrail_check` block you can audit:

```json
"guardrail_check": {
  "invented_statistics": "None — all counts are [bracketed] placeholders.",
  "invented_testimonials": "None.",
  "guaranteed_outcomes": "None claimed.",
  "single_call_to_action": "Yes — try it for one semester.",
  "platform_rules_checked": "Flagged for the subreddit self-promo rule."
}
```

If you're evaluating this repo against others in the category, compare *this block* rather than the star count. A growth tool with fictional case studies on launch day is a liability with a due date.

---

## Adding your own

Run the skill, save the JSON, open a PR. Good additions:

- **A domain that isn't tech** — a bakery, a local service, a school club
- **A counter-example** — something that looked viral-ready and flopped
- **A run where the skill said "don't launch yet"** — the most useful kind

Keep the placeholders. Keep the `guardrail_check`. Keep the failure condition.
