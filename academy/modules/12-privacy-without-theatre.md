# 12 — Privacy without theatre

**25 minutes.** Proving something by not doing it, which is harder than it sounds.

## Why privacy matters *here* specifically

This tool reads your unpublished work. A launch description before publication is one of the
more revealing things a person writes: it contains what you are betting on, what you fear, who
you hope will notice, and where you are weak. If analysing it requires sending it to a server,
the honest user does not run it, and the reckless user is harmed quietly.

So: no account, no telemetry, no network in `--offline`, and a machine-readable claim that you
can check.

## "No telemetry" is a claim you can verify

Three ways, in increasing order of effort:

1. **Read the code.** `grep`s that should return nothing:
   ```bash
   grep -rn "fetch(\|https://" packages/core/src/ | grep -v "example"
   ```
2. **Run offline and watch.** Unplug the network, or run inside a namespace with no route.
3. **Run `doctor --offline`.** It reports zero network calls because `--offline` sets the
   provider to `none` and the ingest layer has no network path at all.

A tool that says "we don't track you" in a footer, while loading a font from a CDN, has
contradicted itself. The claim has to be structural.

## The three privacy failures that matter in launch tools

**1. Analytics on the report.** If the web app sends the document to a scoring endpoint that
logs it, the tool is a data collection device with a diagnostic interface.

**2. Personalisation by surveillance.** Building a broadcaster target list by examining
someone's public history is not research, it is reconnaissance, and it is the mechanism by which
outreach tools become harassment tools.

**3. Telemetry that is "anonymous".** Aggregated usage data still reveals which artifacts are
being analysed, by whom, and when — and for an unreleased product, timing alone is information.

## What this project actually does

| Claim | How it is true |
|---|---|
| No account | there is no accounts table, no auth, no user record |
| No cookies | the web app sets none; check `/api/health` |
| No telemetry by default | no analytics dependency, no beacon, no third-party script tag |
| Offline works | `--offline` implies `--provider none`; ingest is pure local parsing |
| Your document is not stored | the server holds it in memory for one request |
| Rate limit is per-IP, in memory | for abuse prevention, not usage measurement; resets on restart |

## The limit of the claim

Running against a *hosted* analysis endpoint means your text leaves your machine. This tool
supports that only because some users cannot run a local model, and it says so in the terminal
whenever a remote provider is used. If that is unacceptable to you, `--offline` is the default
path and the local mode is first-class, not a degraded version.

## Exercise

`../exercises/12-prove-offline.md`

Run the tool with no network access. Confirm the report is identical to the online one. Then
run the `grep` above on the core package and see what you find. If you find a network call in a
code path that claims to be local, that is a bug and a PR is welcome.

## What this module cannot tell you

- Whether your own machine is compromised. Local-first protects your document from us, not from
  everything.
- Whether a "local" model is actually local. Check that the endpoint is `127.0.0.1`; a hosted
  endpoint configured as "local" is a common misconfiguration.
