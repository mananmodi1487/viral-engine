# The feature ledger

The ambitious list, with the status of each. **Built** means there is code and a test. **Partial**
means something real exists and it is not what the name promises. **Specified** means it is
designed here and not implemented, with the reason.

This table is the honest version. The version where everything is checked is the version nobody
believes.

| # | Feature | Status | Where | What it actually does |
|---|---|---|---|---|
| 1 | **Time Machine Mode** | built | `agents/time-machine.ts` | Shows how the same artifact reads to a reader in 2012, 2019, and 2026, and labels every era `speculative` with the basis for the guess. It is a prompt for thinking about category drift, not a prediction. |
| 2 | **Antifragile Mode** | partial | `analyze/ods.ts` → `failure_conditions` | Turns the worst plausible outcome into a pre-committed response: what you would do if the kill criterion fires. The "would do" half is a table of actions; it is not a decision engine. |
| 3 | **Broadcaster Consent Mailbox** | specified | — | An inbox where a recipient can mark "do not contact me again", shared across tools via a hashed address list. **Blocked on privacy design**: a shared do-not-contact list is a list of people, and building it badly creates the thing it is meant to prevent. Needs the ethics council, which is vacant. |
| 4 | **Global Category Radar** | partial | `agents/saturation-radar.ts` | Reports crowding from what the document itself says, and returns `"unknown"` otherwise. There is no market data and no plan to scrape any. Naming it "global" would be a lie, so the report calls it a saturation *estimate* with a basis. |
| 5 | **Launch Weather Report** | specified | — | A daily summary of "what today looks like" for a launch: platform incident status, whether a major event is dominating attention. Every honest version of this needs live data from platforms that do not expose it, and a dishonest version is a horoscope. |
| 6 | **Honest Hook Generator** | built | `agents/asset-alchemist.ts`, `agents/honesty-firewall.ts` | Generates openings tagged by *mechanism* (negative comparison, concrete number, named enemy, compressed loss, receipt, absurd specificity), and every one passes the honesty firewall before it is shown. The mechanism is the useful part; the words are disposable. |
| 7 | **Screenshot Factory** | built | `report/ods-html.ts` → `odsSvgAssets()` | Generates a scorecard SVG, a before/after SVG, and alt text for each. `--output svg` writes them plus a gallery with the alt text in plain sight. No headless browser, no 40 MB dependency. |
| 8 | **One-Click Ethical Launch Kit** | built | `apps/cli` → `assets`, `experiment`, `broadcaster` | Repo description, one-liner, three hook mechanisms, a broadcaster brief with a no-ask message, a pre-launch test set, and failure conditions — in one command, with every placeholder marked so you cannot accidentally publish a number the tool made up. |
| 9 | **Public Positioning Museum** | built | `apps/web` → `/museum` | A gallery of before/after repositionings, every exhibit labelled `composite` or `anecdotal`. The exhibits are constructed examples, not real launches, and the page says so on every card. |
| 10 | **Anti-Hype Badge** | built | `report/*`, `--output svg` | A badge you can embed that states the AQI and the band, with the mandatory disclaimer baked into the SVG's `<desc>`. It is not a "viral score" badge, and the alt text says so to anyone using a screen reader. |
| 11 | **Kill Your Darling Mode** | built | `analyze/ods.ts` → `what_not_to_say` | Takes the sentence you are most attached to and argues against it: what it implies that you cannot support, who it excludes, and what a hostile reader does with it. |
| 12 | **Founder Therapy Mode** | specified | — | A reflective mode for the emotional side of a launch that did nothing. **Deliberately unbuilt.** It is the feature most likely to be done badly (a chatbot performing empathy) and the one where a bad version does real harm. It needs a clinician's input, not a prompt. |
| 13 | **Community Moderator Mode** | partial | `agents/critic-simulator.ts` | Simulates the moderator's reading: does this break the community's rules, is it self-promotion, will it be removed. The actual rules of a specific community are not in the tool and cannot be — they change and they are not published as machine-readable text. |
| 14 | **Research Paper Mode** | specified | — | Exports the document plus its method as a citable artefact with a DOI-able structure. Blocked on nothing technical; it is blocked on the fact that a method with a single-author benchmark should not be dressed as a paper. After the eval dataset has outside contributions, this becomes worth building. |
| 15 | **Student Mode** | partial | `academy/` | The academy exists and is designed for classroom use at 30 minutes per session. There is no student-facing mode in the CLI; a class currently runs `npm run academy`. |
| 16 | **Nonprofit Mode** | specified | — | A rubric variant where the "job" is a beneficiary's need rather than a customer's, and where a broadcaster is a partner organisation rather than a curator. Specified because the dimensions genuinely differ; unbuilt because inventing alternative weights without a nonprofit's input would be a guess presented as a rubric. |
| 17 | **Artist Mode** | specified | — | Same shape: a portfolio and a launch are different artifacts, and the failure conditions are different. Unbuilt for the same reason as 16. |
| 18 | **Developer Docs Mode** | built | `apps/cli` → `analyze ./README.md`, `--output markdown` | Treats a README as launch copy, which it is. Reports install-step friction, quotable-line absence, and claim quality. This is the mode the tool was built in and the one with the most evidence behind it. |
| 19 | **Accessibility Auto-Fix** | partial | `agents/sentinels.ts` | Detects missing and non-descriptive alt text, and proposes a rewrite for each image based on surrounding context. It **does not** edit your files, and the proposal is labelled as needing a human, because an automatically generated alt text is frequently worse than none. |
| 20 | **Offline Launch Pack** | built | `--offline` + `--output svg` + `--output markdown` | Everything needed to launch with no network: the report, the assets, the alt text, the broadcaster brief, and the tests, in one directory. Verified by `doctor --offline` and by a service worker that never caches `/api/`. |

---

## Summary

| Status | Count | Which |
|---|---|---|
| Built | 9 | 1, 6, 7, 8, 9, 10, 11, 18, 20 |
| Partial | 5 | 2, 4, 13, 15, 19 |
| Specified, not built | 6 | 3, 5, 12, 14, 16, 17 |
| **Total** | **20** | |

An earlier draft of this table said 10 / 5 / 5, which is 20 and was wrong: feature 5 was counted in
both partial and specified. The correction is left visible because a document that quietly fixes
its own arithmetic is a document you cannot audit.

---

## The five that are not built, and why

None of them are unbuilt for lack of ambition. Each is unbuilt because the honest version requires
something that does not exist yet:

| Feature | The real blocker |
|---|---|
| Broadcaster Consent Mailbox | A shared do-not-contact list is a list of people. It needs a privacy design and a governance body that can hold it. The council is vacant. |
| Launch Weather Report | Needs live platform data that is not exposed. The available version is astrology with a dashboard. |
| Founder Therapy Mode | Needs a clinician. A chatbot performing empathy at someone in a bad week is the worst thing this product could ship. |
| Nonprofit Mode / Artist Mode | Need the input of nonprofits and artists. Inventing alternative weights without them produces a rubric that looks universal and is one person's guess. |
| Research Paper Mode | Should not exist until the benchmark has outside contributors, or it dresses a self-report as a paper. |

**The pattern:** every unbuilt feature is one where shipping a plausible-looking version would be
easy and would be a lie. That is the whole thesis of this repository applied to its own roadmap.
