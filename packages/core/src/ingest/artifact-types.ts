/**
 * Artifact types: what kind of thing is being judged.
 *
 * The brief asks for around thirty input types. Most of them are not ingestion
 * problems — they are the same text reached a different way. Three are genuinely
 * different and this file is honest about all three:
 *
 *  1. **Images need OCR.** There is no OCR here. Adding a dependency that
 *     downloads a model would break the offline promise, and pretending to read an
 *     image would be the worst possible failure for this tool. Instead the type is
 *     declared `needs-external: ocr` and the CLI tells the user how to supply the
 *     text (`tesseract image.png - | viral-engine analyze --text -`), which works
 *     today, offline, with software they already have.
 *
 *  2. **Audio and video need transcription.** Same reasoning, same answer
 *     (Whisper locally, or the platform's own captions), same honest label.
 *
 *  3. **Everything else is text with a declared type**, and the type matters
 *     because it changes what good looks like: a changelog is judged on what broke
 *     and who it affects; a cold outreach message is judged almost entirely on
 *     whether it is a request for unpaid labour; a nonprofit campaign is judged on
 *     whether the beneficiary is a subject or a prop.
 *
 * The `expects` field is the useful part: for each type it names the thing that
 * *must* be present for that type to work at all, so scoring can be type-aware
 * instead of applying developer-README rules to a book proposal.
 */

export interface ArtifactTypeSpec {
  key: ArtifactType;
  label: string;
  /** What the reader is trying to do when they encounter this. */
  readerJob: string;
  /** Present-or-fail requirements for this type. */
  expects: string[];
  /** The failure that is specific to this type and invisible to a generic rubric. */
  characteristicFailure: string;
  ingest: 'text' | 'needs-external: ocr' | 'needs-external: transcription' | 'public-api';
  /** How a user gets usable text in without any of our code touching a network. */
  workaround?: string;
}

export type ArtifactType =
  | 'open-source-repo'
  | 'landing-page'
  | 'essay'
  | 'blog-post'
  | 'newsletter'
  | 'readme'
  | 'release-notes'
  | 'changelog'
  | 'research-paper'
  | 'preprint'
  | 'whitepaper'
  | 'conference-abstract'
  | 'book-proposal'
  | 'course-outline'
  | 'podcast-episode'
  | 'video'
  | 'short-form-video-script'
  | 'social-thread'
  | 'product-hunt-listing'
  | 'app-store-listing'
  | 'job-post'
  | 'cold-outreach'
  | 'email-announcement'
  | 'community-announcement'
  | 'nonprofit-campaign'
  | 'art-project'
  | 'personal-brand-statement'
  | 'student-project'
  | 'grant-application'
  | 'dataset-or-benchmark'
  | 'screenshot'
  | 'slide-deck'
  | 'document';

const SPECS: Record<ArtifactType, Omit<ArtifactTypeSpec, 'key'>> = {
  'open-source-repo': {
    label: 'Open-source repository',
    readerJob: 'decide in fifteen seconds whether this solves their problem, then whether it is safe to depend on',
    expects: ['a one-line description', 'an install or usage command', 'a license', 'a stated scope or limitation'],
    characteristicFailure:
      'A reader cannot tell what it does from the description, so they leave; or they install it and it does not work on their machine, which they tell nine people about.',
    ingest: 'public-api',
    workaround: 'paste the README, or point at a local checkout',
  },
  'landing-page': {
    label: 'Landing page',
    readerJob: 'decide whether this is for them and what it costs, in one screen',
    expects: ['a headline that names the job', 'who it is for', 'what happens next', 'the price or the absence of one'],
    characteristicFailure: 'The page is a list of features with no claim, so the reader cannot tell whether missing it would cost them anything.',
    ingest: 'text',
  },
  essay: {
    label: 'Essay',
    readerJob: 'decide whether the argument is worth their next ten minutes',
    expects: ['a claim in the first paragraph', 'a reason to believe it', 'an admission of what it does not cover'],
    characteristicFailure: 'The essay is interesting but never states its thesis, so nothing is quotable and nothing is arguable.',
    ingest: 'text',
  },
  'blog-post': {
    label: 'Blog post',
    readerJob: 'decide whether to keep reading or go back to the search results',
    expects: ['a title that says what it delivers', 'a first sentence that is not throat-clearing', 'a reason to keep reading'],
    characteristicFailure:
      'The first 200 words are context the reader already has, so the reader leaves before reaching the thing only this author could have said.',
    ingest: 'text',
  },
  newsletter: {
    label: 'Newsletter',
    readerJob: 'decide whether to open the next one',
    expects: ['a subject line that is a promise', 'one idea', 'a reason this issue exists'],
    characteristicFailure: 'Four ideas in one issue, none of which the reader remembers on Thursday.',
    ingest: 'text',
  },
  readme: {
    label: 'README',
    readerJob: 'decide whether this is worth five minutes of setup',
    expects: ['what it is', 'how to run it', 'why it exists'],
    characteristicFailure: 'The first screen is a slogan and a badge wall; the command is 900 words down.',
    ingest: 'text',
  },
  'release-notes': {
    label: 'Release notes',
    readerJob: 'work out whether this release breaks them',
    expects: ['what changed', 'who it affects', 'what to do about it'],
    characteristicFailure: 'A list of features with the one breaking change buried in the middle.',
    ingest: 'text',
  },
  changelog: {
    label: 'Changelog',
    readerJob: 'audit what changed between two versions',
    expects: ['version numbers', 'dates', 'breaking changes marked as such'],
    characteristicFailure: 'Versions are labelled but breaking changes are not, so the changelog cannot be trusted for upgrades.',
    ingest: 'text',
  },
  'research-paper': {
    label: 'Research paper',
    readerJob: 'decide whether the claim is supported and whether to cite it',
    expects: ['a specific claim', 'a method', 'a limitation section', 'reproducibility statement'],
    characteristicFailure: 'The abstract claims more than the results support, which is the single most common way a paper damages its authors.',
    ingest: 'text',
  },
  preprint: {
    label: 'Preprint',
    readerJob: 'decide whether to read now or wait for review',
    expects: ['a claim', 'a method', 'an explicit "not peer reviewed" marker'],
    characteristicFailure: 'Presented as settled. Preprints that omit the caveat get cited as findings.',
    ingest: 'text',
  },
  whitepaper: {
    label: 'Whitepaper',
    readerJob: 'work out whether this is an argument or an advertisement',
    expects: ['a problem statement', 'a mechanism', 'a comparison to alternatives', 'an admission of trade-offs'],
    characteristicFailure: 'Trade-offs are absent, which marks it as marketing regardless of its technical content.',
    ingest: 'text',
  },
  'conference-abstract': {
    label: 'Conference talk abstract',
    readerJob: 'decide whether to attend, from a programme of ninety',
    expects: ['what the audience will leave knowing', 'who it is for', 'what the speaker has done that qualifies them'],
    characteristicFailure: 'The abstract describes the topic rather than the takeaway, so it reads like every other abstract in the track.',
    ingest: 'text',
  },
  'book-proposal': {
    label: 'Book proposal',
    readerJob: 'decide whether this book needs to exist and whether this person can write it',
    expects: ['the argument', 'the audience and its size, honestly', 'a sample chapter', 'competing titles and why this differs'],
    characteristicFailure: 'The audience is described as "everyone interested in X", which is the proposal equivalent of no audience.',
    ingest: 'text',
  },
  'course-outline': {
    label: 'Course outline',
    readerJob: 'decide whether the time spent will produce a capability',
    expects: ['what the learner can do at the end', 'the sequence', 'how it is assessed'],
    characteristicFailure: 'Modules are named after topics rather than capabilities, so the learner cannot tell what they will be able to do.',
    ingest: 'text',
  },
  'podcast-episode': {
    label: 'Podcast episode',
    readerJob: 'decide from the title and description whether to spend forty minutes',
    expects: ['an episode-specific title', 'what the listener learns', 'a reason this guest'],
    characteristicFailure: 'The description is a biography of the guest rather than a reason to listen.',
    ingest: 'text',
  },
  video: {
    label: 'Video',
    readerJob: 'decide in five seconds whether to keep watching',
    expects: ['a title that states the payoff', 'the payoff before 30 seconds', 'a description that is not keyword soup'],
    characteristicFailure: 'The first thirty seconds are an intro animation and a request to subscribe.',
    ingest: 'needs-external: transcription',
    workaround: 'export the captions and pass the text: `viral-engine analyze --text caption.vtt`',
  },
  'short-form-video-script': {
    label: 'Short-form video script',
    readerJob: 'decide in one second whether to stop scrolling',
    expects: ['a first line that is a claim or a question the viewer has', 'one idea', 'nothing that requires context'],
    characteristicFailure: 'The script opens with setup, which is invisible on mute and skipped by everyone.',
    ingest: 'text',
  },
  'social-thread': {
    label: 'Social thread',
    readerJob: 'decide whether post one earns post two',
    expects: ['a first post that stands alone', 'one idea', 'a reason to keep going'],
    characteristicFailure: 'Post one is a hook with no content, and the substance starts at post four where nobody is.',
    ingest: 'text',
  },
  'product-hunt-listing': {
    label: 'Product Hunt listing',
    readerJob: 'decide whether to upvote, and whether to come back tomorrow',
    expects: ['a tagline that names the job', 'a first image that explains it', 'an honest maker comment'],
    characteristicFailure: 'The tagline is a category word, so it competes on the same axis as everything else on the page.',
    ingest: 'text',
  },
  'app-store-listing': {
    label: 'App store listing',
    readerJob: 'decide from a screenshot and three lines whether to install',
    expects: ['a subtitle that names the job', 'screenshots that show the job being done', 'no promises the app cannot keep'],
    characteristicFailure: 'The screenshots show features rather than outcomes, so the listing is indistinguishable from its neighbours.',
    ingest: 'text',
  },
  'job-post': {
    label: 'Job post',
    readerJob: 'decide whether this is a real role and whether they would be respected in it',
    expects: ['what the person will own', 'the level, honestly', 'the range, or why it is absent'],
    characteristicFailure: 'A list of twenty technologies and no statement of what the hire is for.',
    ingest: 'text',
  },
  'cold-outreach': {
    label: 'Cold outreach message',
    readerJob: 'decide in two seconds whether this is worth their time',
    expects: ['a specific reason it is them', 'no ask in the first message', 'an easy way to say no'],
    characteristicFailure: 'It asks for unpaid labour from a stranger. The rubric weights this type almost entirely on that question.',
    ingest: 'text',
  },
  'email-announcement': {
    label: 'Email announcement',
    readerJob: 'decide from the subject line whether to open',
    expects: ['a subject that is not a tease', 'one action', 'why now'],
    characteristicFailure: 'The subject line withholds the point to force an open, which costs the sender the next open.',
    ingest: 'text',
  },
  'community-announcement': {
    label: 'Community announcement',
    readerJob: 'decide whether this belongs here',
    expects: ['the community\'s own conventions respected', 'disclosure that it is the author posting', 'no cross-posted identical text'],
    characteristicFailure: 'The same text posted to six communities, which is visible to anyone in two of them.',
    ingest: 'text',
  },
  'nonprofit-campaign': {
    label: 'Nonprofit campaign',
    readerJob: 'decide whether to give, and to whom the credit goes',
    expects: ['the beneficiary as a subject, not a prop', 'a specific ask', 'what the money does'],
    characteristicFailure: 'The people served appear only as evidence of need, which is the characteristic ethical failure of the form.',
    ingest: 'text',
  },
  'art-project': {
    label: 'Art project description',
    readerJob: 'decide whether to engage with the work',
    expects: ['what the work is', 'what it is about, in the artist\'s own words', 'how to experience it'],
    characteristicFailure: 'The statement explains the work in a register that excludes the audience it is addressed to.',
    ingest: 'text',
  },
  'personal-brand-statement': {
    label: 'Personal brand statement',
    readerJob: 'decide whether this person is worth following',
    expects: ['what they do that is specific', 'evidence they have done it', 'who it is for'],
    characteristicFailure: 'Adjectives instead of work. "Passionate about building things" describes everyone and therefore no one.',
    ingest: 'text',
  },
  'student-project': {
    label: 'Student project',
    readerJob: 'assess the work and the learning, not the market',
    expects: ['what was attempted', 'what was learned', 'what would be done differently'],
    characteristicFailure: 'Judged on spread when the point was comprehension. The rubric weights this type accordingly.',
    ingest: 'text',
  },
  'grant-application': {
    label: 'Grant application',
    readerJob: 'decide whether this use of money produces public benefit',
    expects: ['the public benefit', 'the mechanism', 'how it would be measured', 'the risk'],
    characteristicFailure: 'Outcomes are described in language that cannot fail, which reads to a reviewer as evasion.',
    ingest: 'text',
  },
  'dataset-or-benchmark': {
    label: 'Dataset or benchmark',
    readerJob: 'decide whether to use it and whether to trust it',
    expects: ['provenance', 'license', 'known bias', 'an evaluation protocol'],
    characteristicFailure: 'A leaderboard with no statement of what it does not measure, which makes it gameable by construction.',
    ingest: 'text',
  },
  screenshot: {
    label: 'Screenshot',
    readerJob: 'work out what is happening without context',
    expects: ['legible text at mobile width', 'one thing to look at'],
    characteristicFailure: 'An interface shot with no caption, which communicates nothing to someone who does not already know the product.',
    ingest: 'needs-external: ocr',
    workaround: '`tesseract shot.png - | viral-engine analyze --text -` works offline today, with no new dependency.',
  },
  'slide-deck': {
    label: 'Slide deck',
    readerJob: 'decide whether to keep paying attention or read the deck later',
    expects: ['a title that states the claim', 'one idea per slide', 'a deck that makes sense without the speaker'],
    characteristicFailure: 'The deck is a teleprompter, so it is useless when forwarded — which is the only way it travels.',
    ingest: 'text',
  },
  document: {
    label: 'Document',
    readerJob: 'the reader\'s job is unknown, which is itself the problem',
    expects: ['a stated purpose', 'a stated audience'],
    characteristicFailure: 'A document with no declared type gets a generic judgment, and a generic judgment is nearly always wrong.',
    ingest: 'text',
  },
};

export const ARTIFACT_TYPES: ArtifactTypeSpec[] = (Object.keys(SPECS) as ArtifactType[]).map((key) => ({
  key,
  ...SPECS[key],
}));

export function artifactTypeSpec(key: string): ArtifactTypeSpec | undefined {
  return ARTIFACT_TYPES.find((t) => t.key === key);
}

/**
 * Guesses the type from the text. Deliberately conservative: `document` is the
 * honest answer for anything it cannot tell, because a wrong type applies the
 * wrong rubric and produces a confident, useless judgment.
 */
export function guessArtifactType(text: string, hint?: string): { type: ArtifactType; basis: 'declared' | 'structural' | 'default' } {
  if (hint && SPECS[hint as ArtifactType]) return { type: hint as ArtifactType, basis: 'declared' };

  const t = text.toLowerCase();
  if (/^(?:#{1,3}\s*)?changelog|## \[?\d+\.\d+\.\d+/m.test(text)) return { type: 'changelog', basis: 'structural' };
  if (/\brelease notes?\b|\bwhat'?s new\b/i.test(t)) return { type: 'release-notes', basis: 'structural' };
  if (/\babstract\b[\s\S]{0,2000}\b(?:method|results?|conclusion)\b/i.test(t) && /\breferences\b|\bcitations?\b/i.test(t)) {
    return { type: 'preprint', basis: 'structural' };
  }
  if (/\bDear (?:reviewers?|committee)\b|\brequest(?:ed)? (?:funding|amount)\b|\bgrant\b/i.test(t)) {
    return { type: 'grant-application', basis: 'structural' };
  }
  if (/\bsubject:\s/i.test(text) && /\bunsubscribe\b/i.test(t)) return { type: 'newsletter', basis: 'structural' };
  if (/\bsubject:\s/i.test(text) && /\n\s*(?:hi|hello|dear)\b/i.test(text)) return { type: 'email-announcement', basis: 'structural' };
  if (/\b(?:README|getting started|installation)\b/i.test(text) && /```/.test(text) && /\b(?:license|contributing)\b/i.test(t)) {
    return { type: 'readme', basis: 'structural' };
  }
  if (/```[a-z]*\n\s*(?:npx|npm i|pip install|cargo|go get)/.test(text) && /\b(?:github\.com)\b/i.test(t)) {
    return { type: 'open-source-repo', basis: 'structural' };
  }
  if (/\b(?:1\/|🧵|thread\b)/i.test(text) && text.length < 4000 && /\n\n/.test(text)) return { type: 'social-thread', basis: 'structural' };
  if (/\b(?:upvote|makers?|hunters?)\b/i.test(t) && /\bproduct\b/i.test(t)) return { type: 'product-hunt-listing', basis: 'structural' };
  if (/\b(?:download on the app store|google play)\b/i.test(t)) return { type: 'app-store-listing', basis: 'structural' };
  if (/\b(?:we'?re hiring|apply now|job description|responsibilities)\b/i.test(t)) return { type: 'job-post', basis: 'structural' };
  if (/\b(?:donate|donation|beneficiar\w+|volunteers?)\b/i.test(t)) return { type: 'nonprofit-campaign', basis: 'structural' };
  if (/\b(?:slide \d|agenda|deck)\b/i.test(t)) return { type: 'slide-deck', basis: 'structural' };
  if (/\b(?:dataset|benchmark|leaderboard|eval set)\b/i.test(t)) return { type: 'dataset-or-benchmark', basis: 'structural' };
  if (/\b(?:artist statement|the work|gallery|exhibition)\b/i.test(t)) return { type: 'art-project', basis: 'structural' };
  if (/\b(?:course|curriculum|module|syllabus|learners?)\b/i.test(t)) return { type: 'course-outline', basis: 'structural' };
  if (/\b(?:book proposal|manuscript|chapter outline|comp titles)\b/i.test(t)) return { type: 'book-proposal', basis: 'structural' };
  if (/\b(?:episode|podcast|guest|listeners?)\b/i.test(t)) return { type: 'podcast-episode', basis: 'structural' };
  if (/\b(?:proposal|whitepaper|white paper|executive summary)\b/i.test(t)) return { type: 'whitepaper', basis: 'structural' };

  return { type: 'document', basis: 'default' };
}
