/**
 * Deterministic signal extraction.
 *
 * Everything in this file is rule-based and reproducible: same document in, same
 * signals out, no model involved. That is deliberate — the scores that drive the
 * report are auditable, and an LLM (when enabled) only ever *explains* them.
 *
 * Lexicons are drawn from the repo's research file. Where a lexicon encodes a
 * judgement rather than a published finding, the comment says so.
 */

export interface CountedTerm {
  term: string;
  count: number;
}

export interface Signals {
  wordCount: number;
  sentenceCount: number;
  /** Ratio of long words; proxy for jargon density. Higher = harder to forward. */
  jargonDensity: number;
  /** Numbers used as claims (percentages, multipliers, big figures). */
  quantitativeClaims: string[];
  highArousal: CountedTerm[];
  deactivating: CountedTerm[];
  identityMarkers: CountedTerm[];
  tribeMarkers: CountedTerm[];
  shareFrictionMarkers: CountedTerm[];
  ctaMarkers: CountedTerm[];
  hypeTerms: CountedTerm[];
  receiptClaims: string[];
  guaranteePhrases: string[];
  hasFirstPersonReceipt: boolean;
  hasEnemy: boolean;
  hasFailureCondition: boolean;
  hasCategoryPairing: boolean;
  installSteps: number;
  dependencyMentions: number;
  properNouns: string[];
  codeBlockCount: number;
  headingCount: number;
}

/**
 * Lexicon parser. Entries are separated by newlines or commas so that multi-word
 * phrases ("before you begin") stay intact while word lists on one line still work.
 * Splitting on whitespace would silently merge a whole line into one useless term.
 */
const lex = (s: string): string[] =>
  s
    .split(/[\n,]+/)
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);

/**
 * High-arousal terms. Berger & Milkman (2012) found awe, anger and anxiety
 * increase sharing while deactivating emotions decrease it. This lexicon is a
 * coarse keyword proxy for that finding, not a measurement of arousal.
 */
export const HIGH_AROUSAL = lex(`
shocking
outrageous
furious
rage
angry
alarming
terrifying
panic
stunning
astonishing
unbelievable
incredible
mind-blowing
unstoppable
explosive
devastating
brutal
ruthless
slashed
crushed
destroyed
exposed
banned
secret
hidden
nobody tells you
they don't want you to
stop doing
quit
wasting
bleeding
dying
broke
urgent
immediately
before it's too late
`);

/** Deactivating terms — high intensity, low activation. Subdued, wistful, resigned. */
export const DEACTIVATING = lex(`
sadly
unfortunately
melancholy
wistful
nostalgic
gentle
quiet
calm
peaceful
somber
resigned
bittersweet
slowly
eventually
gradually
in time
`);

/** Identity markers: sharing this says something about the sharer. */
export const IDENTITY = lex(`
people who
real builders
engineers
designers
founders
writers
students
contractors
freelancers
marketers
recruiters
teachers
researchers
analysts
managers
maintainers
developers
operators
if you're the kind of person
serious operators
practitioners
professionals who
experts who
anyone who
`);

/**
 * Tribe markers. Berger's "Public"/tribal idea, operationalised crudely: named
 * communities, shared enemies, and in-group vocabulary.
 */
export const TRIBE = lex(`
community
communities
discord
subreddit
r/
forum
slack group
team
teammates
colleagues
peers
fellow
maintainers
contributors
industry
niche
vertical
practitioners
`);

export const SHARE_FRICTION = lex(`
prerequisites
dependencies
dependency
install
requires
setup
configure
environment variable
configuration
yaml
docker
kubernetes
before you begin
first you need
you'll need
in development
wip
experimental
unstable
`);

export const CTA = lex(`
star
fork
try it
install
run it
download
sign up
join
share
subscribe
contribute
open an issue
read more
get started
start free
book a call
`);

/**
 * Anti-hype lexicon. These are the phrases the honesty check blocks.
 * Each maps to a suggestion in honesty.ts.
 */
export const HYPE = lex(`
guaranteed viral
guaranteed to go viral
100k stars
hack the algorithm
gaming the algorithm
secret trick
growth hack
overnight success
blow up
10x your
never fails
always works
revolutionary
game-changing
game changer
world-class
best-in-class
cutting-edge
next-generation
seamless
effortless
unlimited
instant results
passive income
`);

/** Receipt claims: a specific number that either checks out or doesn't. */
const RECEIPT_PATTERNS = [
  /\b\d[\d,.]*\s*(?:→|->|to)\s*\d[\d,.]*\s*(?:users|stars|downloads|signups|customers|subscribers)/gi,
  /\b\d[\d,.]*\s*(?:users|stars|downloads|signups|customers|subscribers|readers)\b/gi,
  /\b\d+(?:\.\d+)?\s*(?:x|×)\s+(?:growth|faster|more|increase)/gi,
  /\b\d{1,3}(?:\.\d+)?%/g,
];

const GUARANTEE_PATTERNS = [
  /\bguarantee[ds]?\b/gi,
  /\bwill (?:definitely|certainly|always)\b/gi,
  /\b100%\s*(?:sure|guaranteed|certain)\b/gi,
  /\bnever fails?\b/gi,
];

const QUANT_PATTERNS = [
  /\b\d[\d,.]*\s*(?:users|stars|downloads|customers|subscribers|readers|installs)\b/gi,
  /\b\d{1,3}(?:\.\d+)?%/g,
  /\b\d+(?:\.\d+)?\s*x\b/gi,
];

function countTerms(text: string, lexicon: string[]): CountedTerm[] {
  const hay = text.toLowerCase();
  const out: CountedTerm[] = [];
  for (const term of lexicon) {
    // word-boundary-ish match that tolerates multiword phrases
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`, 'gi');
    const m = hay.match(re);
    if (m && m.length > 0) out.push({ term, count: m.length });
  }
  return out.sort((a, b) => b.count - a.count);
}

function uniqMatches(text: string, patterns: RegExp[]): string[] {
  const found = new Set<string>();
  for (const p of patterns) {
    const re = new RegExp(p.source, p.flags.includes('g') ? p.flags : p.flags + 'g');
    const m = text.match(re);
    if (m) m.forEach((x) => found.add(x.trim().toLowerCase()));
  }
  return [...found];
}

/** Naive proper-noun extraction: capitalised tokens that are not sentence-initial common words. */
function extractProperNouns(text: string): string[] {
  const stop = new Set([
    'The', 'A', 'An', 'This', 'That', 'These', 'Those', 'It', 'We', 'You', 'I',
    'If', 'But', 'And', 'Or', 'So', 'Then', 'When', 'What', 'Why', 'How', 'Who',
    'Run', 'Read', 'Try', 'Note', 'Every', 'Most', 'Some', 'All', 'No', 'Not',
    'Yes', 'One', 'Two', 'Three', 'Here', 'There', 'Because', 'Since', 'While',
  ]);
  const seen = new Map<string, number>();
  const re = /\b([A-Z][a-zA-Z0-9]{2,})\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const w = m[1];
    if (stop.has(w)) continue;
    seen.set(w, (seen.get(w) ?? 0) + 1);
  }
  return [...seen.entries()]
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([w]) => w);
}

export function extractSignals(text: string): Signals {
  const body = text ?? '';
  const words = body.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentenceCount = Math.max(1, (body.match(/[.!?]+\s|[.!?]+$/g) ?? []).length);
  const longWords = words.filter((w) => w.replace(/[^a-zA-Z]/g, '').length >= 10).length;
  const jargonDensity = wordCount === 0 ? 0 : longWords / wordCount;

  const highArousal = countTerms(body, HIGH_AROUSAL);
  const deactivating = countTerms(body, DEACTIVATING);
  const identityMarkers = countTerms(body, IDENTITY);
  const tribeMarkers = countTerms(body, TRIBE);
  const shareFrictionMarkers = countTerms(body, SHARE_FRICTION);
  const ctaMarkers = countTerms(body, CTA);
  const hypeTerms = countTerms(body, HYPE);

  // Setup steps appear as list items AND as lines inside fenced code blocks,
  // which is the more common form in a README. Counting only list items made the
  // engine claim "no first-run path" about a file full of npx commands.
  const installSteps = (
    body.match(
      /(?:^|\n)\s*(?:\d+\.|[-*])?\s*(?:\$\s*)?(?:npm|npx|pnpm|yarn|pip|pipx|curl|git clone|docker|brew|cargo|go install)\b/gi,
    ) ?? []
  ).length;
  const dependencyMentions = (body.match(/\b(?:dependencies|requires|prerequisites|node\.js|python|docker)\b/gi) ?? []).length;
  const codeBlockCount = (body.match(/```/g) ?? []).length / 2;
  const headingCount = (body.match(/^#{1,6}\s/gm) ?? []).length;

  return {
    wordCount,
    sentenceCount,
    jargonDensity,
    quantitativeClaims: uniqMatches(body, QUANT_PATTERNS).slice(0, 20),
    highArousal,
    deactivating,
    identityMarkers,
    tribeMarkers,
    shareFrictionMarkers,
    ctaMarkers,
    hypeTerms,
    receiptClaims: uniqMatches(body, RECEIPT_PATTERNS).slice(0, 20),
    guaranteePhrases: uniqMatches(body, GUARANTEE_PATTERNS),
    hasFirstPersonReceipt: /\bI\s+(?:built|shipped|tracked|spent|ran|tested|launched|wrote)\b/i.test(body),
    hasEnemy: /\b(?:designed to|built to|wants you to|keeps you|makes you)\b/i.test(body),
    hasFailureCondition: /\bthis (?:fails|breaks|won't work) if\b/i.test(body),
    hasCategoryPairing: /\bit'?s not\b[\s\S]{0,200}?\bit'?s\b/i.test(body),
    installSteps,
    dependencyMentions,
    properNouns: extractProperNouns(body),
    codeBlockCount: Math.round(codeBlockCount),
    headingCount,
  };
}
