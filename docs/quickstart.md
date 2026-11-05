# Quickstart

Two ways in. Pick the one that matches how you like to work.

---

## 1. No install (the skill)

If you use Claude, you don't need any of the code in this repo. `SKILL.md` is the whole tool.

```bash
mkdir -p ~/.claude/skills/viral-engine
curl -fsSL https://raw.githubusercontent.com/mananmodi1487/viral-engine/main/SKILL.md \
  -o ~/.claude/skills/viral-engine/SKILL.md
```

Then:

```
/viral-engine a daily habit tracker app for busy professionals
```

You get eight sections back: the bet, the diagnosis, three hooks, positioning, structure, distribution, a 48-hour plan, and a scorecard.

---

## 2. The CLI (the engine)

```bash
git clone https://github.com/mananmodi1487/viral-engine
cd viral-engine
npm ci
```

### Analyse a repository

```bash
npx tsx packages/cli/src/index.ts analyze mananmodi1487/viral-engine
```

### Analyse a local file

```bash
npx tsx packages/cli/src/index.ts analyze ./README.md --offline
```

### Analyse pasted copy

```bash
npx tsx packages/cli/src/index.ts analyze --text "It's not a habit tracker. It's placement-risk management for students."
```

### Analyse a landing page

```bash
npx tsx packages/cli/src/index.ts analyze https://example.com
```

---

## Output formats

```bash
# terminal (default) — the 20-line version
npx tsx packages/cli/src/index.ts analyze ./README.md --offline

# markdown — for a PR comment, a doc, or a gist
npx tsx packages/cli/src/index.ts analyze ./README.md --offline --format md -o report.md

# JSON — for scripting; full typed schema
npx tsx packages/cli/src/index.ts analyze ./README.md --offline --format json -o report.json

# self-contained HTML — email it, or open it on a plane
npx tsx packages/cli/src/index.ts analyze ./README.md --offline --format html -o report.html
```

---

## The flags that matter

| Flag | Why you'd use it |
|---|---|
| `--offline` | Zero network calls. Also sets `--provider none`. Use this for private code. |
| `--provider none` | Deterministic only. This is the default, not a downgrade. |
| `--provider ollama` | Local model adds narrative prose. Nothing else changes. |
| `--ci` | Compact single-line output; exits 3 on honesty blockers. |
| `--fail-on-honesty` | Exit non-zero on blockers — for a pre-commit hook or CI gate. |
| `--saturation-count 4200` | Skip the GitHub query and supply the category size yourself. |

---

## Web UI

```bash
npm run web
# → http://localhost:4173
```

Paste a repo, a URL, or your copy. Everything runs in that process: no analytics, no cookies, no third-party requests. There is also `/report?target=owner/repo` for a shareable HTML page.

---

## Exit codes

```
0  report produced, no honesty blockers
1  unexpected error
2  usage error
3  honesty blockers found (with --fail-on-honesty or --ci)
```

---

## Using it as a CI gate

Add `.github/workflows/spread-check.yml`:

```yaml
name: spread check
on:
  pull_request:
    paths: ['README.md', 'docs/**']
permissions:
  contents: read
  pull-requests: write
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: mananmodi1487/viral-engine/.github/actions/spread-check@main
        with:
          path: README.md
          fail-on: blockers
```

The action posts one comment (updating it on re-runs instead of spamming) with the score, the weakest lever, and any honesty blockers.

---

## Reading the report

The output is deliberately ordered so you can stop early:

1. **Scorecard** — the weakest lever is stated above the table. Start there.
2. **Category** — what you're actually competing with, and one less-crowded alternative.
3. **Broadcaster** — one named kind of person, where to find them, and a paste-ready message.
4. **Share friction** — why forwarding is expensive, with the fix for each.
5. **Honesty** — anything that would get you publicly corrected.
6. **Assets** — Show HN, thread, LinkedIn, tagline, hero, subjects, chat announcement.
7. **Checklist** — blockers first.
8. **Kill criteria** — written before launch so they can't be rationalised after.

**If it says "do not launch yet", that is the tool working.** It means the likely outcome is a launch that produces no signal, and one unpolished attempt per project is the real constraint.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `no provider credentials found` | Nothing configured | Not an error. If you don't want the note, pass `--provider none`. |
| `saturation: unknown` | Network blocked or no query | Pass `--saturation-count N`, or accept it — the report marks it `unavailable` rather than guessing. |
| `Repository not found (404)` | Wrong spelling, or private | Check the name; for private repos pass a local file instead. |
| Scores feel wrong | Lexicons are coarse | You're right to doubt them. Every dimension states its basis; open an issue with the text. |
| `Internal honesty violation` | A bug in the generator | Please report it with your input. This error means our own output failed our own policy. |
