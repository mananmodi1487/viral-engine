#!/usr/bin/env node
/**
 * Turns a failed build log into GitHub check annotations.
 *
 * Why this exists: the Rust binding has never compiled clean, and from outside the
 * run the entire failure was "rust binding · fail · 18s". Job logs live behind a
 * blob host and step summaries are not exposed on the check-run API, so the actual
 * diagnostic was unreachable. Annotations *are* readable from the pull request and
 * from the API, so the error text needs to be in them.
 *
 * The first attempt grepped for `^error: ` and matched nothing — cargo's output is
 * not guaranteed to start a diagnostic at column zero (colour codes, indentation,
 * `error[E0308]:` forms, build-script noise), and a filter that matches nothing is
 * indistinguishable from a build that failed silently. This version always emits
 * something: the recognised diagnostics if it finds any, and the tail of the log
 * either way.
 *
 * Usage: node scripts/ci-annotate.mjs --title clippy --file /tmp/clippy.log
 */
import { readFileSync, existsSync } from 'node:fs';

const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};

const title = flag('title', 'build');
const file = flag('file', '');
const max = Number(flag('max', '12'));

if (!file) {
  console.error('usage: node scripts/ci-annotate.mjs --title <name> --file <log>');
  process.exit(2);
}

if (!existsSync(file)) {
  console.log(`::error title=${title}::the build produced no log file at ${file}`);
  process.exit(0);
}

const raw = readFileSync(file, 'utf8');
// Strip ANSI SGR sequences and normalise line endings; cargo colourises when it
// thinks it is on a terminal, and every one of those escapes breaks a grep.
const text = raw.replace(/\u001b\[[0-9;]*m/g, '').replace(/\r/g, '');
const lines = text.split('\n').map((l) => l.trimEnd());
const nonEmpty = lines.filter((l) => l.trim().length > 0);

// A diagnostic is an error/warning header, or a test failure marker. Matched
// loosely on purpose: missing a real error is much worse than including a noisy
// line, because the fallback below covers the case where nothing matches.
const diagnostics = nonEmpty.filter((l) =>
  /^(error|warning)(\[[A-Za-z0-9]+\])?:/.test(l.trim()) ||
  /^test .* FAILED$/.test(l.trim()) ||
  /^---- .* stdout ----$/.test(l.trim()) ||
  /^thread '.*' panicked/.test(l.trim()) ||
  /^assertion .*failed/.test(l.trim())
);

const seen = new Set();
const unique = diagnostics.filter((l) => {
  const t = l.trim();
  if (seen.has(t)) return false;
  seen.add(t);
  return true;
});

const emit = (message) => {
  // An annotation message is capped at 1024 characters; a truncated diagnostic is
  // still useful, an over-long annotation is rejected outright.
  const safe = message.replace(/%/g, '%25').replace(/\r?\n/g, '%0A').slice(0, 950);
  console.log(`::error title=${title}::${safe}`);
};

// "error: could not compile `x`" is a summary of diagnostics printed above it. It is
// not itself a diagnosis, so it must not become the headline annotation — but it is
// all some logs contain, and in that case saying so is more useful than saying nothing.
const isSummaryOnly = (l) => /^(error|warning): could not compile /.test(l.trim());
const useful = unique.filter((l) => !isSummaryOnly(l));
const fallback = nonEmpty.filter((l) => !isSummaryOnly(l));

if (useful.length) {
  for (const line of useful.slice(0, max)) emit(line);
} else if (fallback.length) {
  // Nothing matched. Say so, and send the tail anyway — a build that fails with no
  // recognised diagnostic is the case where the log is the only evidence there is.
  emit(`no recognised diagnostic line; last lines of ${file}:`);
  for (const line of fallback.slice(-max)) emit(line);
} else {
  emit(
    `the compiler reported only a summary line and no diagnostic; ${file} does not explain the failure`,
  );
}

console.log(`::notice title=${title}::${nonEmpty.length} log line(s), ${useful.length} diagnostic(s), ${Math.min(useful.length || max, max)} annotated`);
