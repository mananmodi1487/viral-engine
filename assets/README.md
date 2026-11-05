# 🎨 Assets

Every diagram in this repo is an **SVG**: open, editable, no build step, renders on GitHub, scales without blurring, and works in dark and light contexts (they're all dark-background cards by design).

| File | Used in | What it shows |
|---|---|---|
| [**hero.svg**](hero.svg) | README top | Animated: cycles through three real outputs of one run |
| [**before-after.svg**](before-after.svg) | README "47%" section | The repositioning moment — same product, new category, lever scores before and after |
| [**hooks.svg**](hooks.svg) | README "Proof it works" | Three hooks, each with its pattern, audience, and **the way it fails** |
| [**output-sections.svg**](output-sections.svg) | README "Try it now" | The eight sections returned by a single run |

---

## Editing them

Open the `.svg` in any text editor. They're hand-written, no generator, no framework, readable attributes.

Palette, if you want to extend one consistently:

| Token | Hex | Use |
|---|---|---|
| Background | `#0d1117` | Canvas |
| Card | `#161b22` | Panels |
| Border | `#21262d` / `#30363d` | Dividers |
| Text primary | `#e6edf3` | Headlines |
| Text secondary | `#8b949e` | Body |
| Green | `#3fb950` | Working / after / positive |
| Red | `#f85149` | Bottleneck / risk / before |
| Blue | `#58a6ff` | Pattern labels |
| Amber | `#d29922` | Warnings / insider |

Fonts are declared as `ui-sans-serif, system-ui` and `ui-monospace, Menlo` so they fall back gracefully everywhere.

---

## A note on the animated hero

`hero.svg` uses SMIL `<animate>` for a 12-second loop. It works on GitHub in most browsers; where SMIL is unsupported it degrades to a **static first frame that still reads correctly** — the positioning statement. Nothing is lost.

**No GIF.** A GIF would be 3–10 MB and blurry at GitHub's render width; this SVG is a few KB and sharper than a retina screenshot. If you need a GIF for a launch post, export one from the SVG at 2x and it'll look right — just don't commit it here.

---

## Verified, not assumed

These files were rendered and visually checked before shipping (via `resvg`), not written and hoped about. If you change one, render it and look at it — SVG text clipping is the failure mode that doesn't announce itself.
