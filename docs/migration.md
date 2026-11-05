# Migration from the prompt-only version

`SKILL.md` still works exactly as before. Nothing in this document is required reading if you only use the skill in Claude.

The CLI is **additive**: it implements the same diagnosis in code so it can run in CI, on a schedule, and without a model.

---

## What changed, and why

| Before (v0.x) | After (v1.0) | Reason |
|---|---|---|
| Diagnosis lived only in a prompt | Prompt **and** deterministic engine | Scores must be reproducible; a model cannot be the thing that decides whether a number is real |
| Output was prose | Prose **and** a typed `DiagnosisReport` | Prose cannot be tested, diffed, or gated in CI |
| Honesty was a prompt instruction | Honesty is a **programmatic** scan, in both directions | Instructions can be ignored; a failing test cannot |
| No scorecard | Seven dimensions with `EvidenceBasis` | "Fix the weakest lever" requires knowing which lever is weakest |
| An LLM was required | LLM is **optional** | Local-first, no vendor lock-in, works on a plane |
| No tests | 49 tests + an evaluation harness | A rule without a fixture regresses silently |

---

## Nothing was removed

- `SKILL.md` — unchanged in behaviour, still the entry point for Claude users
- `research/virality-patterns.md` — unchanged, still the citation basis
- `templates/` — unchanged
- `examples/` — unchanged
- `CASE_STUDY.md` — unchanged, still the repo's own diagnosis
- The honesty policy — **strengthened**, not relaxed

---

## If you used the old skill prompt

The prompts are now versioned in `prompts/`:

| Prompt | Replaces |
|---|---|
| `prompts/skill.md` | The v0.x `SKILL.md` behaviour, as a standalone prompt |
| `prompts/diagnose.md` | The seven-lever diagnosis phase |
| `prompts/rewrite-positioning.md` | The positioning phase |
| `prompts/broadcaster-brief.md` | The Broadcaster Rule section |
| `prompts/launch-assets.md` | The assets section |

They carry the same constraints. None of them can produce a report without a failure condition.

---

## If you had shell scripts or a fork

The four things most likely to break:

1. **Output shape.** If you parsed the old prose, switch to `--format json` and read `DiagnosisReport`. The schema is versioned (`schemaVersion: "1.0.0"`) and validated on every run.
2. **Exit codes.** `0` clean, `1` error, `2` usage, `3` honesty blockers. The old script probably ignored exit codes; CI depends on them now.
3. **`--offline` implies `--provider none`.** If you relied on a provider being called, pass `--provider anthropic` explicitly.
4. **Numbers will differ.** The deterministic scores are new. If you were quoting a score from a model before, it is not comparable.

---

## Backwards compatibility guarantees

- `SKILL.md` will not be deleted or renamed.
- The eight-section output format will not change shape without a `schemaVersion` bump.
- New honesty rules may be **added** at any time — a document that passed yesterday may warn today. That is deliberate: the rules tighten as we find gaps.
- Existing `blocker` rules will not be downgraded. If something was dangerous to publish, it stays dangerous.

---

## Deprecations

| Item | Status | Replacement |
|---|---|---|
| Analysing by piping a file through stdin | Not implemented | `analyze <path>` |
| `--format yaml` | Never existed; do not add it | `--format json` |
| `fail-on: regression` in the Action | **Accepted but not implemented** (reports, exits 0) | Use `fail-on: blockers` until base-branch comparison ships |

That last row is a real gap, documented here rather than silently accepted.

---

## Upgrading in one command

```bash
git pull
npm ci
npm test
npm run bench
npx tsx packages/cli/src/index.ts analyze ./README.md --offline
```

If the last command produces a report and the first two pass, you are migrated.
