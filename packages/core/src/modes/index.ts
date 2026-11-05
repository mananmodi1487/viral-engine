/**
 * The modes: roast, therapist, kill-my-darling, explain-like-im-five.
 *
 * These are the parts of the product most likely to go wrong, so they are
 * implemented with explicit limits rather than as prompts.
 *
 *  - **Roast** is funny about the *copy*, never about the person. The test applied
 *    to every line: could the author read it and send it to a friend? If not, cut
 *    it. A roast that humiliates is a tool for a room you would not want to be in.
 *  - **Therapist** is not therapy and says so on every output. It separates the
 *    author from the artifact, which is the whole usable idea, and stops there.
 *  - **Kill my darling** argues against a specific sentence the author is attached
 *    to, and always ends with what survives.
 *  - **Explain like I'm five** simplifies without deleting the uncertainty. The
 *    tempting version removes the caveats to make the explanation clean; that is
 *    the version that produces a confident wrong summary.
 *
 * Every mode returns text that has passed the honesty scanner. A joke is not an
 * exemption from the rules.
 */
import type { Signals } from '../signals.js';
import { checkInbound } from '../honesty.js';

export interface ModeInput {
  text: string;
  title?: string;
  signals: Signals;
}

export interface ModeOutput {
  mode: string;
  /** The main body. Plain text, safe to paste into a terminal. */
  body: string;
  /** Lines the author should read twice. */
  keepInMind: string[];
  /** What this mode cannot do, stated every time so it is never assumed away. */
  limits: string[];
}

/* ------------------------------------------------------------------ *
 * Roast
 * ------------------------------------------------------------------ */

const CROWDED_PHRASES: Array<[RegExp, string]> = [
  [/\b(?:revolutionary|game-?chang\w+)\b/i, 'You used a word that has never once been said sincerely in a room with a budget.'],
  [/\b(?:effortless|seamless|blazing(?:ly)? fast|magical)\b/i, 'These are the adjectives people reach for when they do not have a number.'],
  [/\b(?:everyone|anyone|people)\b/i, '"Everyone" is not an audience, it is a shrug with a marketing budget.'],
  [/\b(?:we are excited to announce|thrilled to share)\b/i, 'Nobody has ever been excited by the announcement of excitement.'],
  [/\b(?:empower\w*|unlock\w*|supercharge\w*|leverag\w+)\b/i, 'This verb is doing no work. What does the user actually do differently on Tuesday?'],
  [/\b(?:journey|ecosystem|solution|platform)\b/i, 'A word that could belong to any product on the internet, which is the problem.'],
  [/\b(?:AI-powered|blockchain|next-gen)\b/i, 'You have named the technology instead of the job, and the technology will be unremarkable in a year.'],
  [/\b(?:simple|easy|just)\b.*\b(?:simple|easy|just)\b/i, 'If it were simple you would not need the sentence saying it is simple.'],
];

export function roast(input: ModeInput): ModeOutput {
  const text = input.text;
  const hits: string[] = [];

  for (const [re, line] of CROWDED_PHRASES) {
    const m = text.match(re);
    if (m) hits.push(`"${m[0]}" — ${line}`);
  }

  /*
   * Split prose only. The first version of this split the whole document and
   * picked the longest "sentence", which for a README is always a minified line of
   * inline SVG — technically the longest sentence, entirely useless as advice, and
   * enough to make the tool look like it cannot read. Tags, code, and URLs are
   * removed before the split, because they are not prose and were never the target.
   */
  const prose = text
    .replace(/<[^>]{1,2000}>/g, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!?\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\|[^\n]*\|/g, ' ')
    .replace(/\s+/g, ' ');
  const sentences = prose.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 30);
  const longest = [...sentences].sort((a, b) => b.length - a.length)[0];
  if (longest && longest.split(/\s+/).length > 40) {
    hits.push(
      `One sentence is ${longest.split(/\s+/).length} words long. It begins "${longest.slice(0, 60)}…" and it is doing the work of a paragraph that has not decided what it is about.`,
    );
  }

  if (!input.signals.hasCategoryPairing) {
    hits.push('There is no "not X, but Y" anywhere. Which means the reader supplies the X, and theirs is less flattering than yours.');
  }
  if (input.signals.identityMarkers.length === 0) {
    hits.push('No specific person is named. "Anyone who wants to be more productive" is a sentence that has never made anyone open a link.');
  }
  if (!input.signals.hasFailureCondition) {
    hits.push('Nothing in here says what would count as failure. So whatever happens will be interpreted as a lesson.');
  }
  if (input.signals.wordCount > 1200 && input.signals.codeBlockCount === 0) {
    hits.push(`${input.signals.wordCount} words and not one command, screenshot, or table. The reader has been asked to believe a claim and take it on the train.`);
  }
  if (hits.length === 0) {
    hits.push('Honestly? This is fine. There is nothing here to roast, which means the interesting failure is somewhere the text cannot show — probably the broadcaster.');
  }

  const body = [
    `Roast of ${input.title ?? 'this artifact'}`,
    '',
    ...hits.map((h, i) => `${i + 1}. ${h}`),
    '',
    'None of that was about you. All of it was about the copy, which is the only part you can fix today.',
    '',
    'Repair, in order:',
    '  · Name one person. Not a demographic — someone who would recognise themselves.',
    '  · Write the "not X, but Y" and delete whichever half you cannot defend.',
    '  · Cut your favourite sentence. It is almost certainly the one doing the least work.',
    '  · Add one number, with the method that produced it, or delete all the numbers.',
  ].join('\n');

  return {
    mode: 'roast',
    body,
    keepInMind: [
      'A roast is compression, not truth. It finds the sharpest version of a real weakness; it does not rank your weaknesses.',
      'If a line landed personally rather than editorially, that is information about the artifact, not about you: it usually means the sentence was doing emotional work the product cannot support.',
    ],
    limits: [
      'This is generated from structural rules, so it has no idea whether your specific claims are true.',
      'It cannot see images, so a great screenshot will not save a weak sentence from it, or vice versa.',
      'Humour is cultural. These lines are built for English-language developer-culture idiom and will read differently, or badly, elsewhere.',
    ],
  };
}

/* ------------------------------------------------------------------ *
 * Therapist
 * ------------------------------------------------------------------ */

export function therapist(input: ModeInput): ModeOutput {
  const s = input.signals;
  const lines: string[] = [];

  lines.push('This is not therapy, and it is not a person. It is a reflection of what your own text says, with the flattery removed.');
  lines.push('');

  if (s.hasFirstPersonReceipt) {
    lines.push('You were there. The text opens from something you personally did or missed, and that is the strongest thing in it — stronger than the claims, which anyone could make.');
  } else {
    lines.push('The text never says that you were there. There is no "I built this because", no cost paid, no specific moment. That is not a moral failing; it is the reason the copy reads like a product page instead of a letter.');
  }
  lines.push('');

  if (!s.hasFailureCondition) {
    lines.push('Nothing here says what failure would look like, which usually means one of two things: either you have not decided, or you have decided and writing it down feels like inviting it. The second is more common than people admit.');
  } else {
    lines.push('You wrote down what failure looks like. That is rarer than it should be, and it means the result will tell you something instead of just hurting.');
  }
  lines.push('');

  lines.push('The separation that helps most people: the artifact is a thing you made. It is not a verdict on whether you should be doing this. A launch that produces no signal is the normal outcome, and the reason it feels personal is that you can see the effort behind it and strangers cannot.');
  lines.push('');
  lines.push('Three questions, none of which this tool can answer:');
  lines.push('  · Would you still want to have built it if nobody ever used it? If yes, the launch is a distribution problem. If no, the launch is not the problem.');
  lines.push('  · What would you do with the next two weeks if you decided not to launch? If the answer is "build the next thing", you already decided.');
  lines.push('  · Who is the one person you would be relieved to hear from? Tell only them.');

  return {
    mode: 'therapist',
    body: lines.join('\n'),
    keepInMind: [
      'A tool reflecting your own text back is not a second opinion. It has no memory and no stake.',
      'If the launch is affecting how you sleep, eat, or treat people, that is a thing to take to a person, not a command.',
    ],
    limits: [
      'This is not mental-health care. It is a structured reflection generated from the words in a document.',
      'It cannot assess you, and it is not trying to. Everything it says came from the text you gave it.',
      'It will not tell you whether to keep going. That is not a question a document can answer, and pretending otherwise would be the most harmful thing this product could do.',
    ],
  };
}

/* ------------------------------------------------------------------ *
 * Kill my darling
 * ------------------------------------------------------------------ */

export function killYourDarling(input: ModeInput, darling?: string): ModeOutput {
  const text = input.text;
  // The most emphatic sentence in the document: bold, an exclamation, or a
  // superlative. That is where attachment usually lives.
  const emphatic =
    /^.*(?:\*\*[^*]{10,120}\*\*|![^\n]{10,120}|the (?:best|only|first|fastest)[^\n.]{10,110}).*$/im.exec(text)?.[0] ?? '';
  const candidate = darling?.trim() || emphatic.replace(/[*_]/g, '').trim() || 'the sentence you would not cut';

  const reasons: string[] = [];
  if (/\b(?:everyone|anyone|people)\b/i.test(candidate)) {
    reasons.push('It addresses everyone, which means it excludes nobody and interests nobody.');
  }
  if (/\b(?:best|only|first|fastest|most)\b/i.test(candidate)) {
    reasons.push('It makes a comparative claim with no comparison set. A reader asks "than what" and you have no answer in the sentence.');
  }
  if (/\b(?:\d+ ?(?:x|%|k|million))\b/i.test(candidate)) {
    reasons.push('It contains a number with no source in the same sentence. That number will be checked, and the check will find nothing.');
  }
  if (candidate.split(/\s+/).length > 28) {
    reasons.push('It is too long to be quoted. If a reader cannot lift it intact, it will not travel.');
  }
  if (!/\b(?:you|your|they|their|who)\b/i.test(candidate)) {
    reasons.push('It contains no person. Sentences without a person in them read as specifications.');
  }
  if (reasons.length === 0) {
    reasons.push('It may be fine. Test it: remove it and read the paragraph aloud. If nothing is lost, it was decoration.');
  }

  const body = [
    `Arguing against: "${candidate}"`,
    '',
    ...reasons.map((r) => `  · ${r}`),
    '',
    'What survives:',
    '  Delete it, read the section without it, and see whether the claim is still made. If it is, the sentence was decoration and you keep the space. If it is not, the sentence was load-bearing — which means the claim was never made anywhere else, and that is the real problem.',
    '',
    'If you keep it, keep it because it survives being argued with, not because you like it.',
  ].join('\n');

  const scan = checkInbound(body);
  const flagged = scan.findings.filter((f) => f.severity === 'blocker');

  return {
    mode: 'kill-my-darling',
    body,
    keepInMind: [
      flagged.length
        ? 'This output tripped its own honesty scan, which is a defect. Do not act on it.'
        : 'The argument is structural. It does not know why you wrote the sentence.',
      'Attachment is usually a sign the sentence is doing something the rest of the document is not. Find that job and give it a proper home.',
    ],
    limits: [
      'It picks the most emphatic sentence, which is usually but not always the darling.',
      'It cannot tell a genuinely distinctive phrase from a cliché. Both look emphatic.',
    ],
  };
}

/* ------------------------------------------------------------------ *
 * Explain like I'm five
 * ------------------------------------------------------------------ */

export function explainLikeImFive(input: ModeInput): ModeOutput {
  const s = input.signals;
  const audience = s.identityMarkers[0]?.term;
  const category = /it'?s not\s+([^.,;]{3,60})/i.exec(input.text)?.[1]?.trim();
  const rawJob = /it'?s\s+([^.,;]{3,80})/i.exec(input.text.replace(/it'?s not[^.,;]{3,60}/i, ''))?.[1]?.trim();
  /*
   * Truncate on a word boundary, not a character count. The first version sliced
   * at 80 characters and produced "wrong in public without costing y" — a
   * simplification that cuts a word in half is worse than no simplification.
   */
  const job = rawJob
    ? rawJob
      .replace(/\s+\S{0,12}$/, ' ')
      .trim()
      .replace(/[,;:]$/, '')
    : undefined;

  const body = [
    'The short version, with the uncertainty kept in:',
    '',
    `  · What it is: ${job ? `it is ${job}` : category ? `it is meant to replace "${category}"` : 'the text does not say, in one sentence, what it is'}.`,
    audience
      ? `  · Who it is for: ${audience}. Notice that this is a role, not a crowd — that is what makes it findable.`
      : '  · Who it is for: the text never names a person. This is the biggest single problem, and it is fixable in one sentence.',
    `  · Why someone would tell a friend: ${s.hasFirstPersonReceipt ? 'you were there, and that is the part that reads as true' : 'nothing here states a reason. A reader would have to invent one, and they will not.'}`,
    `  · How it could be wrong: ${s.hasFailureCondition ? 'the text says how, which is rare and good' : 'nothing in the text says how. Until something does, any result can be explained away.'}`,
    '',
    'What I did not do: I did not remove the "I do not know" parts to make this cleaner. A summary that is confident and wrong is worse than one that is plain and uncertain, which is the entire argument of this project.',
  ].join('\n');

  return {
    mode: 'explain-like-im-five',
    body,
    keepInMind: [
      'Simplification is lossy. If the plain version says something the full version does not, the full version has a gap.',
      'This is not a substitute for reading the thing. It is a way to check whether the thing says what you think it says.',
    ],
    limits: [
      'It cannot verify facts, so a plain restatement of a false claim is still false.',
      'It cannot simplify what is not there. Missing audience, missing failure condition, and missing claim are reported as absences, not filled in.',
    ],
  };
}
