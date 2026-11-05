# 🙏 Credits

This skill is a synthesis. Almost none of the underlying insight is original to this repo — the assembly, the diagnostic order, and the honesty constraints are. Here's exactly where each piece comes from.

---

## The research this is built on

**Jonah Berger** — *Contagious* (2013) and Berger & Milkman (2012), "What Makes Online Content Viral?", *Journal of Marketing Research* 49(2), 192–205.
The arousal finding (awe/anger/anxiety spread; sadness doesn't) and the STEPPS framework are the backbone of the diagnosis phase. If you only read one thing on this list, read the 2012 paper.

**Katherine Milkman** — co-author on the above. The experimental design that separated *activation* from *valence* is the reason this skill asks "does this activate?" instead of "is this positive?"

**Sharad Goel, Duncan Watts & Daniel Goldstein** — "The structure of online diffusion networks" (ACM EC, 2012), extended by Goel, Anderson, Hofman & Watts, "The Structural Virality of Online Diffusion" (*Management Science*, 2016).
This is where [The Broadcaster Rule](research/virality-patterns.md#3-the-broadcaster-rule-) comes from. The finding that popularity tracks the largest broadcast — and that big cascades are ~0.025% of events — is the most useful corrective to viral-lottery thinking available.

**George Loewenstein** — "The Psychology of Curiosity" (*Psychological Bulletin*, 1994).
The curiosity gap as a deprivation state rather than a mood. The distinction between withholding a mechanism and withholding a payoff is his.

**The New York Times Customer Insight Group** — *The Psychology of Sharing* (2011).
The 94%-consider-the-recipient finding and the six sharer personas. This is why the skill forces you to name a *specific recipient* before publishing.

**Chip & Daniel Heath** — *Made to Stick* (2007).
Adjacent rather than foundational — SUCCESs is about memorability, not transmission — but the "concrete beats abstract" discipline runs through the whole hook phase.

**Daniel Kahneman** — *Thinking, Fast and Slow* (2011).
Dual-process framing explains why "insider knowledge" lands faster than an argument does. Cited as background, not as a virality finding.

**Derek Sivers, Kevin Kelly, and the "1,000 true fans" tradition** — the reason this repo's playbook targets 1,000 stars instead of 100,000. Kelly's "1,000 True Fans" (2008) and Sivers' writing on small audiences shaped the realistic growth curve in [SUMMARY.md](SUMMARY.md).

---

## Claude and the skill format

**Anthropic's Claude** — this was built as a Claude Skill, and the skill format (a `SKILL.md` with YAML frontmatter, a name, and a description that tells the model when to trigger) is Anthropic's design. The structure of `SKILL.md` here follows the conventions documented in Anthropic's skill authoring guidance.

**The broader Claude and skill-builder community** — the pattern of shipping a skill as a single readable file, with examples in a folder, is community convention rather than official spec. It works, and it's why this repo has no build step.

*Note: this repo is not affiliated with or endorsed by Anthropic. "Claude" is referenced descriptively.*

---

## Prior art in growth tooling

**Gabriel Weinberg & Justin Mares** — *Traction* (2015). The 19-channel framework, and the discipline of naming a channel instead of saying "marketing."

**Brian Balfour's writing on growth loops** — the loop framing in the distribution phase (artifact → share → user → new artifact) descends from growth-loop thinking rather than funnel thinking.

**April Dunford** — *Obviously Awesome* (2019). Positioning as category selection, not messaging. The "It's not X. It's Y." structure is a simplification of her approach, and it loses some of her rigor in the process.

---

## What is original to this repo

To be specific, rather than vague-claiming "original thinking":

1. **The 7-lever diagnosis with a named bottleneck.** Existing frameworks list drivers; they don't score them and force you to fix the weakest one first.
2. **The "two share mechanisms, never three" constraint.** A design rule, not a research finding. Pick two; three reads as desperate.
3. **The honesty guardrails as a hard output constraint.** Placeholder brackets instead of invented statistics, a mandatory failure condition per plan, a required `guardrail_check` block. This is the part most growth content omits.
4. **The output contract.** Eight fixed sections, in order, every time — so results are comparable across runs instead of vibes-based.
5. **The 48-hour checklist format.** Time-boxed, one person, no budget. Adaptive rather than original, but the specificity is the point.

---

## Tools used to build this

- **Claude** (Anthropic) — drafting, structuring, and research synthesis
- **resvg** — rendering the SVG diagrams in [`/assets`](assets/) so they're verified rather than assumed to work
- **GitHub** — where it lives

---

## Corrections welcome

If a citation here is wrong, misattributed, or overstated, open an issue. Getting the research right matters more than the repo looking confident — that's the whole thesis.

**Priority corrections:** misquoted findings, wrong years, findings that have been superseded, and any place where this repo states an inference as though it were a result.
