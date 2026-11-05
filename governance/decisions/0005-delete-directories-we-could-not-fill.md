# 0005 — Delete directories we could not fill

- **Date:** 2026-04-18
- **Status:** accepted
- **Deciders:** initial author

## Context

The architecture spec listed a large tree: `apps/api`, `apps/browser-extension`,
`apps/vscode-extension`, `apps/chatbot-{slack,discord,telegram}`, `apps/mobile-pwa`,
`packages/{ui,sdk,docs}`, and ten `examples/` subdirectories. Creating them cost nothing and
made the repository look complete.

Every one of them would have been empty, or contain a README explaining what it *would* do.

## Options considered

**A. Keep the directories with `.gitkeep`.** Standard practice. The tree matches the spec, and
a reader can see the intended shape.

**B. Keep them with READMEs describing the plan.** Slightly better: at least a reader knows
nothing is there.

**C. Delete them, and state in the architecture doc that they are planned and not built.**

## Decision

Option C.

## Consequences

- The repository tree is smaller than the specification, which will look like an omission to
  anyone comparing the two documents. `docs/architecture.md` therefore states explicitly which
  surfaces exist and which are specified but unbuilt.
- A reader can tell the difference between "this project has a browser extension" and "this
  project has a plan for a browser extension" without opening anything.
- The cost: a contributor cannot see where their code should go. Mitigated by the architecture
  doc naming the intended path for each unbuilt surface.

## Dissent

None recorded. The argument against was that empty directories communicate intent. The
argument for, which won: **an empty directory is a claim that something exists there.** In a
repository whose central thesis is that software should not claim more than it can support,
shipping eighteen of them would have been the exact hypocrisy the project criticises.
