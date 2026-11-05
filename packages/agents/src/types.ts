/**
 * Agent contract.
 *
 * Every agent in Viral Engine Commons is a pure function over an `AgentContext`.
 * No agent may call the network, mutate shared state, or write into another
 * agent's output. That constraint is what makes the swarm auditable: you can run
 * any agent alone, in any order, and get the same answer.
 *
 * The second constraint is ethical, and it is encoded in the type: an agent
 * either produces findings or refuses with a reason. It cannot produce findings
 * marked as advisory-only and then have them shipped anyway — refusal is a
 * first-class outcome with its own type.
 */

export interface AgentContext {
  /** Normalised text of the artifact under analysis. */
  text: string;
  title?: string;
  description?: string;
  url?: string;
  /** Deterministic signals, already extracted once and shared. */
  signals: import('../../core/src/signals.js').Signals;
  honesty: import('../../core/src/schemas.js').HonestyCheck;
  /** Optional user declarations; agents must not invent these. */
  declared?: {
    audience?: string;
    broadcaster?: string;
    channel?: string;
    goal?: string;
  };
  language?: string;
  /** 0 in local mode. Agents must surface this rather than hiding it. */
  networkCalls?: number;
}

export interface AgentFinding {
  /** What was observed. Cite the evidence, not an adjective. */
  claim: string;
  /** Where in the artifact. Line, section, or quoted fragment. */
  evidence: string;
  basis: 'measured' | 'structural' | 'heuristic' | 'user-supplied' | 'unavailable';
  confidence: 'low' | 'medium' | 'high';
  /** What a human should do about it. One action. */
  action: string;
}

export interface AgentRefusal {
  refused: true;
  code:
    | 'spam-intent'
    | 'manipulation-intent'
    | 'harassment-intent'
    | 'deception-intent'
    | 'privacy-violation'
    | 'insufficient-evidence';
  reason: string;
  /** What the user can do instead. A refusal without an alternative is just a wall. */
  alternative: string;
}

export interface AgentResult<T> {
  agent: string;
  /** Every agent states what it did NOT determine. */
  limitations: string[];
  findings: AgentFinding[];
  output: T;
}

export type AgentOutcome<T> = AgentResult<T> | AgentRefusal;

export function refuse(
  code: AgentRefusal['code'],
  reason: string,
  alternative: string,
): AgentRefusal {
  return { refused: true, code, reason, alternative };
}

export function isRefusal<T>(x: AgentOutcome<T>): x is AgentRefusal {
  return (x as AgentRefusal).refused === true;
}

/**
 * Shared guard used by every agent that could be repurposed for spam.
 *
 * This is a named function rather than a copy-pasted regex because the abuse
 * policy must be enforced in one place. If it lives in twelve places, eleven of
 * them will drift.
 */
const SPAM_INTENT: Array<{ re: RegExp; code: AgentRefusal['code']; reason: string }> = [
  {
    re: /\b(?:mass|bulk|blast)\s+(?:dm|dms|message|messages|email|emails|outreach|send)\b/i,
    code: 'spam-intent',
    reason: 'The request describes mass unsolicited outreach.',
  },
  {
    re: /\b(?:scrape|scraping|harvest|enumerate)\s+(?:emails?|handles?|contacts?|followers?|members?|users?)\b/i,
    code: 'privacy-violation',
    reason: 'The request asks to harvest personal contact data.',
  },
  {
    re: /\b(?:astroturf|sockpuppets?|fake accounts?|buy (?:likes|followers|upvotes)|vote farm)\b/i,
    code: 'manipulation-intent',
    reason: 'The request describes manufactured engagement.',
  },
  {
    re: /\b(?:raid|brigade|pile on|doxx?|harass)\b/i,
    code: 'harassment-intent',
    reason: 'The request describes coordinated harassment.',
  },
  {
    re: /\b(?:fake|invent(?:ed)?|make\s+up|fabricate)\s+(?:an?\s+|some\s+|the\s+)?(?:testimonial|review|stat|statistic|number|user\s+count|quote)s?\b/i,
    code: 'deception-intent',
    reason: 'The request asks for fabricated social proof.',
  },
  {
    re: /\b(?:bypass|evade|dodge)\s+(?:the\s+)?(?:ban|filter|moderation|rate limit|spam filter)\b/i,
    code: 'spam-intent',
    reason: 'The request asks to evade a platform control.',
  },
];

/**
 * Negation guard, same reasoning as the honesty firewall's.
 *
 * "We will never generate fake testimonials" is the sentence this project exists
 * to publish. Flagging it would make the sentinel the problem — and it did, on
 * this repository's own README, during development. A prohibition is not a
 * request.
 */
const NEGATION = /(?:\bno\b|\bnot\b|\bnever\b|\bcannot\b|\bcan't\b|\bwon't\b|\bdon't\b|\bdoesn't\b|\bnobody\b|\bwithout\b|\bavoid\w*\b|\brefus\w*\b|\bprohibit\w*\b|\bbanned\b|\bforbid\w*\b|\bagainst\b|\brather than\b|\binstead of\b|\bstop\w*\b)[^.!?]{0,60}$/i;

function isNegated(text: string, index: number): boolean {
  return NEGATION.test(text.slice(Math.max(0, index - 90), index));
}

/**
 * A request marker. Someone asking for help is asking *us*; someone describing a
 * bad practice is not.
 */
const REQUEST =
  /(\bhelp me\b|\bhelp us\b|\bi want to\b|\bi'?m trying to\b|\bi need to\b|\bcan you\b|\bcould you\b|\bwrite me\b|\bgenerate\b|\bgive me\b|\bbuild me\b|\bsend (?:this|it|them)\b|\btell me how\b|\bhow do i\b|\bhow can i\b|\bwhat'?s the best way to\b|\banyone know how to\b|\bplease\b)/i;

/**
 * Intent requires a request, not a noun phrase.
 *
 * The first version of this screen refused to analyse this repository's own
 * SKILL.md, because that document contains the line
 *
 *     **Anti-patterns:** launch-day mass DMs; the same text in 12 subreddits; ...
 *
 * Refusing to read a warning *against* a practice is how a safety feature turns
 * into a censor. A hit only counts as intent when either
 *   (a) the sentence containing it is a request ("help me ...", "how do I ..."), or
 *   (b) the whole input is short enough to *be* the request (a bare imperative
 *       such as "scrape their emails and send them this").
 *
 * The trade-off is explicit: an adversarial user can pad a request into a long
 * paragraph to slip past this. That is acceptable, because the screen is one
 * layer of an ethics review, not a classifier, and a false refusal is a real
 * harm — it makes the tool useless on exactly the documents that discuss the
 * problem seriously.
 */
/**
 * A match wrapped in quotation marks or backticks is a citation of the words, not a
 * use of them. Documentation about spam contains spam.
 */
function isQuoted(text: string, index: number, length: number): boolean {
  const end = index + length;
  const pairs: Array<[string, string]> = [['`', '`'], ['"', '"'], ['\u201c', '\u201d'], ['\u2018', '\u2019']];
  for (const [open, close] of pairs) {
    const openAt = text.lastIndexOf(open, index);
    if (openAt === -1 || openAt >= index) continue;
    const closeAt = text.indexOf(close, end);
    if (closeAt === -1) continue;
    // A very long span between quotes is prose that happens to contain one quote
    // character, not a citation. Cap it at a sentence-ish length.
    if (closeAt - openAt <= 240) return true;
  }
  return false;
}

function isRequest(text: string, index: number, textWordCount: number, matchLength = 0): boolean {
  if (isQuoted(text, index, matchLength)) return false;
  if (textWordCount <= 12) return true;
  const sentenceStart = Math.max(0, Math.max(
    text.lastIndexOf('. ', index),
    text.lastIndexOf('\n', index),
    text.lastIndexOf('! ', index),
    text.lastIndexOf('? ', index),
  ));
  const sentenceEnd = (() => {
    const rest = text.slice(index);
    const m = rest.match(/[.!?](?:\s|$)/);
    return m ? index + (m.index ?? rest.length) : text.length;
  })();
  const sentence = text.slice(sentenceStart, sentenceEnd);
  return REQUEST.test(sentence);
}

export function screenForAbuse(text: string): AgentRefusal | null {
  const wordCount = (text ?? '').trim().split(/\s+/).filter(Boolean).length;
  for (const rule of SPAM_INTENT) {
    const re = new RegExp(rule.re.source, rule.re.flags.includes('g') ? rule.re.flags : rule.re.flags + 'g');
    let m: RegExpExecArray | null;
    let hit: RegExpExecArray | null = null;
    while ((m = re.exec(text)) !== null) {
      if (!isNegated(text, m.index) && isRequest(text, m.index, wordCount, m[0].length)) { hit = m; break; }
    }
    if (hit) {
      return refuse(
        rule.code,
        rule.reason,
        'Viral Engine Commons optimises one specific, consented broadcast. Name one real person or community, and write the sentence they would paste. That is the supported path, and it is also the one that works.',
      );
    }
  }
  return null;
}
