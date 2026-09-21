/** Heuristics for automated content QA (import script + tests). */

const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "must", "shall", "can", "need", "dare",
  "ought", "used", "to", "of", "in", "for", "on", "with", "at", "by",
  "from", "as", "into", "through", "during", "before", "after", "above",
  "below", "between", "under", "again", "further", "then", "once", "here",
  "there", "when", "where", "why", "how", "all", "each", "few", "more",
  "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same",
  "so", "than", "too", "very", "just", "and", "but", "if", "or", "because",
  "until", "while", "what", "which", "who", "whom", "this", "that", "these",
  "those", "it", "its", "they", "them", "their", "he", "she", "his", "her",
]);

export const PLACEHOLDER_TRUTHS = [
  "that's what my therapist said!",
  "no comment",
  "yes",
];

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/** How much the fact gives away the truth question (0 = hard, 1 = trivial). */
export function reverseFactTrivialityScore(fact: string, truth: string): number {
  const factTokens = new Set(tokenize(fact));
  const truthTokens = tokenize(truth);
  if (truthTokens.length === 0 || factTokens.size === 0) return 1;

  let overlap = 0;
  for (const t of truthTokens) {
    if (factTokens.has(t)) overlap++;
  }
  const ratio = overlap / truthTokens.length;

  const factLower = fact.toLowerCase();
  const truthLower = truth.toLowerCase();
  if (truthLower.includes(factLower) || factLower.includes(truthLower)) return 1;

  // Penalize when fact is a trivia statement and truth is "What/Which X has Y" mirroring fact nouns
  if (/^(what|which|who|where|when|how)\s/i.test(truth.trim()) && ratio > 0.35) {
    return Math.max(ratio, 0.6);
  }

  return ratio;
}

export function isReverseFactTrivial(fact: string, truth: string, maxScore = 0.35): boolean {
  return reverseFactTrivialityScore(fact, truth) > maxScore;
}

export function isPlaceholderTruth(truth: string): boolean {
  const t = truth.trim().toLowerCase();
  return PLACEHOLDER_TRUTHS.some((p) => t === p || t.includes(p));
}

export function duplicateTruthRate(truths: string[]): number {
  if (truths.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const t of truths) {
    const k = t.trim().toLowerCase();
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  let dupes = 0;
  for (const c of counts.values()) {
    if (c > 1) dupes += c - 1;
  }
  return dupes / truths.length;
}

/** Detect suspicious monotonic ordering (alphabetical runs). */
export function orderedSequenceRatio(texts: string[], windowSize = 20): number {
  if (texts.length < windowSize) return 0;
  let orderedWindows = 0;
  const windows = texts.length - windowSize + 1;
  for (let i = 0; i < windows; i++) {
    const slice = texts.slice(i, i + windowSize);
    const sorted = [...slice].sort((a, b) => a.localeCompare(b));
    if (slice.every((v, j) => v === sorted[j])) orderedWindows++;
  }
  return orderedWindows / windows;
}

export const MIN_CONTENT_POOL_SIZE = 200;
export const MAX_TRUTH_SHARE = 0.02;
export const MAX_WORST_THING_SHARE = 0.2;

export function isQuestionForm(text: string): boolean {
  const t = text.trim();
  if (t.endsWith("?")) return true;
  return /^(what|which|who|when|where|why|how|have you|did you|do you|would you|are you|is it|can you|could you)\b/i.test(
    t,
  );
}

const GENERATED_ROLE_PREFIX =
  /^(Chaotic|Sleepy|Legendary|Tiny|Dramatic|Sneaky|Overcaffeinated|Unbothered|Sparkly|Grumpy|Heroic|Clumsy|Wise|Loud|Mysterious|Sunny|Feral|Fancy|Retro|Cosmic|Cozy|Spicy|Chill|Bold|Shy|Lucky|Cursed|Golden|Silver|Neon)\s/;

/** Combinatorial filler from generateFactCheckFamilyPairs — not real facts. */
export function looksLikeGeneratedFactCheckTruth(truth: string): boolean {
  const t = truth.trim();
  const lower = t.toLowerCase();
  if (/,\s*but make it\s/i.test(t)) return true;
  if (/\bwith extra\b/i.test(t)) return true;
  if (/^Worst thing:/i.test(t)) return true;
  if (/\(\d{1,2}\)$/.test(t)) return true;
  if (FACT_CHECK_TRUTH_BITS.some((b) => lower === b)) return true;
  const bitHits = FACT_CHECK_TRUTH_BITS.filter((b) => lower.includes(b)).length;
  if (bitHits >= 2) return true;
  return false;
}

export function looksLikeConvertedNhieFactCheck(prompt: string): boolean {
  return /^(The worst thing about this is|A confession nobody asked for|Something I've done that I can't take back is|The story that still haunts the group chat is)/i.test(
    prompt.trim(),
  );
}

/** Template mash from expand-thin-pools crowd-call stems + recycled choice sets. */
export function looksLikeTemplateCrowdCall(text: string, choices: string[]): boolean {
  if (/ in this room\?$/i.test(text)) return true;
  if (/^Who here is most into /i.test(text)) return true;
  if (/^Ideal vibe for /i.test(text)) return true;
  if (/^Go-to move for /i.test(text)) return true;
  const blob = choices.join("|").toLowerCase();
  const recycled = [
    "always|sometimes|rarely|never",
    "cheap|splurge|split the bill|whoever offers",
    "quiet|loud|in between|depends",
    "plan it|wing it|ask the group|flip a coin",
  ];
  if (recycled.some((p) => blob === p) && /^(Best |Ideal |Go-to |Who here )/i.test(text)) {
    return true;
  }
  return false;
}

export function looksLikeGeneratedFriendSortRole(name: string): boolean {
  return GENERATED_ROLE_PREFIX.test(name.trim());
}

export function looksLikePlaygroundSpectrumPole(left: string, right: string): boolean {
  return /^(Wagons|Strollers|Training wheels|Push bikes|Seesaws|Monkey bars|Slip n slide|Kiddie pools|Sandbox|Mud kitchen|Hopscotch|Pin the tail|Musical chairs|Treehouses|Playhouses|Swing sets|Helmets|Knee pads|Balance bikes|Goodie bags|Face paint|Balloon animals)$/i.test(
    left,
  ) || /^(Wagons|Strollers|Training wheels|Push bikes|Seesaws|Monkey bars|Slip n slide|Kiddie pools|Sandbox|Mud kitchen|Hopscotch|Pin the tail|Musical chairs|Treehouses|Playhouses|Swing sets|Helmets|Knee pads|Balance bikes|Goodie bags|Face paint|Balloon animals)$/i.test(
    right,
  );
}

export function isFactCheckTruthValid(prompt: string, truth: string): boolean {
  const p = prompt.trim();
  const t = truth.trim();
  if (!p || !t || isPlaceholderTruth(t)) return false;
  if (isQuestionForm(t)) return false;
  if (/^(if you|which is|who in|what is your|what's your)/i.test(t)) return false;
  if (t.length < 4 || t.length > 120) return false;
  if (p.toLowerCase() === t.toLowerCase()) return false;
  return true;
}

/** Detect when the canonical answer would stand out among decoys (length/format). */
export function isObviousBluffTruth(truth: string, decoys: string[]): boolean {
  if (decoys.length === 0) return false;
  const tLen = truth.length;
  const avg = decoys.reduce((sum, d) => sum + d.length, 0) / decoys.length;
  if (tLen > avg * 1.75 && tLen > 70) return true;
  if (isQuestionForm(truth) && decoys.every((d) => !isQuestionForm(d))) return true;
  if (/^worst thing:/i.test(truth) && decoys.every((d) => !/^worst thing:/i.test(d))) return true;
  return false;
}

export function filterRepetitiveTruths<T extends { truth: string }>(
  rows: T[],
  maxShare = MAX_TRUTH_SHARE,
): T[] {
  if (rows.length === 0) return rows;
  const counts = new Map<string, number>();
  for (const row of rows) {
    const k = row.truth.trim().toLowerCase();
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  const maxCount = Math.max(1, Math.floor(rows.length * maxShare));
  return rows.filter((row) => (counts.get(row.truth.trim().toLowerCase()) ?? 0) <= maxCount);
}

export function diversifyNhieStatement(text: string, index: number): string {
  const statement = text.replace(/^Never have I ever /i, "").replace(/\.$/, "").trim();
  const templates = [
    (s: string) => `Worst thing: ${s}`,
    (s: string) => `Confess: ${s}`,
    (s: string) => `Red flag: they've ${s}`,
    (s: string) => `I'll never live down the time I ${s}`,
    (s: string) => `The group chat still has screenshots from when I ${s}`,
    (s: string) => `Nobody knows I once ${s}`,
  ];
  return templates[index % templates.length](statement);
}

export function rebalancePunchlinePrefixes(
  items: Array<{ text: string; rating?: "family" | "mature"; difficulty?: string }>,
): Array<{ text: string; rating?: "family" | "mature"; difficulty?: string }> {
  const worstIdx: number[] = [];
  for (let i = 0; i < items.length; i++) {
    if (/^worst thing:/i.test(items[i].text)) worstIdx.push(i);
  }
  const maxWorst = Math.max(1, Math.floor(items.length * MAX_WORST_THING_SHARE));
  if (worstIdx.length <= maxWorst) return items;

  const out = items.map((row) => ({ ...row }));
  let rebalance = 0;
  for (let j = maxWorst; j < worstIdx.length; j++) {
    const i = worstIdx[j];
    const inner = out[i].text.replace(/^worst thing:\s*/i, "").trim();
    const alt = [
      `Confess: ${inner}`,
      `Red flag: ${inner}`,
      `Hot take: ${inner}`,
      `Unfiltered truth: ${inner}`,
    ][rebalance % 4];
    out[i] = { ...out[i], text: alt };
    rebalance++;
  }
  return out;
}

export function adaptMatureTruthToFactCheck(truthText: string): string {
  const t = truthText.replace(/\?+$/, "").replace(/^worst thing:\s*/i, "").trim();
  if (t.length <= 90) return t;
  const cut = t.slice(0, 87).trim();
  return cut.endsWith(",") ? cut.slice(0, -1) + "…" : cut + "…";
}

export function matureTruthToFactCheckPair(text: string): { prompt: string; truth: string } | null {
  const raw = text.replace(/^worst thing:\s*/i, "").replace(/\?+$/, "").trim();
  if (!raw || isPlaceholderTruth(raw)) return null;

  if (/^(have you|did you)\s+/i.test(text)) {
    const action = raw.replace(/^(have you|did you)\s+/i, "");
    return {
      prompt: "Something I've done that I can't take back is...",
      truth: action.charAt(0).toUpperCase() + action.slice(1),
    };
  }

  if (/^(if you|which is|who in|what is your|what's your)/i.test(raw)) return null;
  if (raw.length > 85) return null;

  if (/^(confess|red flag|hot take|unfiltered truth):/i.test(text)) {
    const inner = text.replace(/^[^:]+:\s*/i, "").trim();
    return {
      prompt: "The story that still haunts the group chat is...",
      truth: adaptMatureTruthToFactCheck(inner),
    };
  }

  return {
    prompt: "A confession nobody asked for:",
    truth: adaptMatureTruthToFactCheck(raw),
  };
}

export function adaptMaturePromptToFactCheck(truthText: string): string {
  return matureTruthToFactCheckPair(truthText)?.prompt ?? "A confession nobody asked for:";
}

export type QuizLike = {
  question: string;
  choices: string[];
  correct: number;
};

export type TimelineLike = { event: string; year: number };

export type ReverseFactEntry = {
  fact: string;
  truth: string;
  rating: "family" | "mature";
  difficulty: "easy" | "medium" | "hard";
};

/** Build reverse-fact pool: fact = short answer, truth = question (Jeopardy-style). */
export function buildReverseFactsFromQuiz(
  rows: QuizLike[],
  rating: "family" | "mature" = "family",
): ReverseFactEntry[] {
  const out: ReverseFactEntry[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const answer = row.choices[row.correct]?.trim();
    const question = row.question.trim();
    if (!answer || !question || answer.length < 2 || answer.length > 80) continue;
    if (/\.\s*$/.test(question)) continue;
    if (question.toLowerCase().includes(answer.toLowerCase())) continue;

    const fact = answer.endsWith(".") ? answer : answer;
    const truth = question.endsWith("?") ? question : `${question}?`;
    if (isReverseFactTrivial(fact, truth, 0.25)) continue;

    const key = `${fact}|${truth}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      fact,
      truth,
      rating,
      difficulty: answer.length <= 6 ? "easy" : answer.length <= 12 ? "medium" : "hard",
    });
  }
  return out;
}

export function buildReverseFactsFromTimeline(_rows: TimelineLike[]): ReverseFactEntry[] {
  // Timeline events produced identical truth strings ("In what year...") which made
  // reverse-fact voting trivial. Timeline content belongs in When Was It, not here.
  return [];
}

/** Family pools must not contain explicit/mature keywords (content-audit parity). */
export const FAMILY_BLOCKLIST =
  /\b(porn\s*star|pornstar|nsfw|nude|erotic|stripper|prostitut|hentai|had sex|sex tape|blowjob|handjob|bdsm|bondage|dominatrix|brothel|dildo|butt plug|lap dance|glory hole|onlyfans|sexting|threesome|masturbat|orgasm|horny|fetish|vibrator|hookup|affair|one night stand|dirty talk)\b|\bprostitut/i;

/** Genuinely spicy/adult themes — not nightlife trivia alone. */
export const SPICY_KEYWORDS =
  /\b(sex|sexy|naked|nude|porn|orgasm|horny|fetish|threesome|masturbat|hookup|affair|stripper|vibrator|erotic|hentai|prostitut|one night stand|dirty talk|sexting|onlyfans|blowjob|handjob|bdsm|bondage|dominatrix|brothel|condom|clitoris|penis|vagina|nipple|anal|oral sex|doggy style|missionary|cowgirl|dildo|butt plug|orgy|voyeur|exhibitionist|foreplay|lap dance|glory hole|safeword|strip club|red light|camel toe|ball gag|cock ring|nipple clamp|merkin|fleshlight|kink|kinky|dominatrix|submissive|fetish|genitalia|ejaculat|cum shot|pornograph|xxx|redtube|pornhub|playboy|hustler|penthouse|escort service|brothel|red light district|skinny dipping|walk of shame|friends with benefits|stripper pole|banana hammock|three-breasted|threesome|orgy|pegging|rimjob|cunnilingus|fellatio|analingus|blue balls|morning wood|wet dream|pubic|labia|scrotum|testicle|foreskin|circumcision|aphrodisiac|aphrodisiacs|libido|arousal|climax|g-spot|prostate|lube|lubricant|sex toy|sex toys|adult film|adult films|adult video|adult industry|adult entertainment|burlesque|striptease|pole dance|sugar daddy|sugar baby|only fans|cam girl|cam boy|webcam model|swinger|swingers|polyamory|open relationship|cuckold|hotwife|milf|dildos|vibrators|buttplug|butt plugs|fetishes|kinks|bdsm|domme|submissive|dominant|safeword|aftercare|spanking|whip|flogger|handcuffs|blindfold|roleplay|role-play|fetish gear|lingerie|thong|g-string|g string|merkin|pasties|pastie|pasties|pasties)\b/i;

const ALCOHOL_ONLY =
  /\b(beer|wine|vodka|whiskey|whisky|tequila|rum|gin|cocktail|mojito|margarita|brewery|speakeasy|hangover|bar tab|open bar|sommelier|brewery|distillery|moonshine|negroni|martini|ipa|alcopop|beer pong|wine tasting|taproom|minibar|speakeasy|prohibition)\b/i;

const DRAWABLE_SPICY =
  /\b(three-breasted|banana hammock|stripper pole|merkin|glory hole|ball gag|cock ring|nipple clamp|fleshlight|butt plug|dildo|vibrator|condom|lingerie|thong|lap dance|pole dance|striptease|walk of shame|one night stand|skinny dipping|dirty dancing|friends with benefits)\b/i;

export function containsMatureKeywords(text: string): boolean {
  if (/\bsuper bowl xxx\b/i.test(text)) return false;
  if (FAMILY_BLOCKLIST.test(text)) return true;
  if (/\bhave sex\b/i.test(text)) return true;
  if (/\b(sexy|threesome|hookup|affair|horny|sext)\b/i.test(text)) return true;
  return false;
}

const NON_SPICY_AFFAIR =
  /\b(dreyfus|watergate|iran[- ]contra|teapot dome|whiskey ring|profumo|lewinsky)\s+affair\b/i;

/** True when content is genuinely spicy/adult, not just alcohol or nightlife trivia. */
export function isSpicyContent(text: string): boolean {
  if (NON_SPICY_AFFAIR.test(text)) return false;
  if (/\bresigned because of the .+ affair\b/i.test(text)) return false;
  return SPICY_KEYWORDS.test(text);
}

/** True when a mature prompt is genuinely spicy, not just alcohol-themed. */
export function isSpicyPrompt(text: string): boolean {
  return isSpicyContent(text);
}

export function isAlcoholThemedOnly(text: string): boolean {
  return ALCOHOL_ONLY.test(text) && !isSpicyContent(text);
}

export function isSpicyQuizRow(row: { question: string; choices: string[] }): boolean {
  return isSpicyContent(`${row.question} ${row.choices.join(" ")}`);
}

export function isSpicyFactCheckPair(prompt: string, truth: string): boolean {
  return isSpicyContent(`${prompt} ${truth}`);
}

export function isSpicyDrawWord(word: string): boolean {
  return isSpicyContent(word) || DRAWABLE_SPICY.test(word);
}

export function isSpicyWyrPair(a: string, b: string): boolean {
  return isSpicyContent(`${a} ${b}`);
}

export function isSpicyBracketName(name: string): boolean {
  return isSpicyContent(name);
}

/** Sexuality / adult-culture themes including news history without explicit slang. */
const MATURE_CULTURE =
  /\b(playboy|porn|pornhub|sexual|sexuality|lgbt|gay|lesbian|queer|transgender|stonewall|contracept|abortion|roe|obrigefell|hiv|aids|viagra|cialis|onlyfans|stripper|prostitut|metoo|weinstein|epstein|deep throat|fifty shades|brokeback|grindr|tinder|bumble|hinge|ashley madison|revenge porn|birth control|kinsey|hefner|flynt|lewinsky|clinton scandal|condom|brothel|red light|erotic|nude|naked|adult film|hookup|dating app|cam girl|sugar daddy|thirst trap|sext|orgy|bdsm|pride march|same-sex marriage|marriage equality|planned parenthood|sex work|sex tape|wardrobe malfunction|magic mike|showgirls|sex education|euphoria|bridgerton|monica lewinsky|stormy daniels|anthony weiner|petraeus|spitzer|cosby|nassar|r\. kelly|maxwell|britney|madonna sex|hugh hefner|larry flynt|affair scandal|impeachment|sex trafficking|intimacy coordinator|sex-positive|sex shop|nymphomaniac|blue is the warmest)\b/i;

export function isMatureCultureContent(text: string): boolean {
  if (NON_SPICY_AFFAIR.test(text)) return false;
  if (/\bresigned because of the .+ affair\b/i.test(text)) return false;
  return isSpicyContent(text) || MATURE_CULTURE.test(text);
}

export function isSpicyTimelineEvent(event: string): boolean {
  return isMatureCultureContent(event);
}

export function normalizeJeopardyResponse(response: string): string {
  let t = response
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:quot|#39|amp|lt|gt);/g, " ")
    .replace(/^[\s"'(]+|[\s"')]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  t = t.replace(/^(what|who|where|when|which|how|name)\s+(is|are|was|were)\s+(the\s+)?/i, "");
  t = t.replace(/^(what|who|where|when|which|how)\s+/i, "");
  t = t.replace(/[?.!]+$/g, "").trim();
  const words = t.split(/\s+/).filter(Boolean);
  if (words.length > 6) t = words.slice(0, 6).join(" ");
  return t;
}

export function clueToQuestion(clue: string): string | null {
  let c = clue
    .replace(/<[^>]+>/g, " ")
    .replace(/&(?:quot|#39|amp|lt|gt);/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!c || c.length > 120) return null;
  if (/\$|_{2,}|click here|shown here|pictured here|audio clue/i.test(c)) return null;

  let q = c;
  if (/^this\b/i.test(c)) q = c.replace(/^this\b/i, "What");
  else if (/^these\b/i.test(c)) q = c.replace(/^these\b/i, "What");
  else if (/^he\b/i.test(c)) q = c.replace(/^he\b/i, "Who");
  else if (/^she\b/i.test(c)) q = c.replace(/^she\b/i, "Who");
  else if (/^they\b/i.test(c)) q = c.replace(/^they\b/i, "Who");
  else if (/^it\b/i.test(c)) q = c.replace(/^it\b/i, "What");
  else if (/^in \d{3,4}\b/i.test(c)) q = c.replace(/^in (\d{3,4})\b/i, "In what year, in $1,");
  else if (/^name\b/i.test(c)) q = c;
  else if (/^(what|which|who|where|when|how)\b/i.test(c)) q = c;
  else return null;

  if (!q.endsWith("?")) q = `${q}?`;
  q = q.replace(/\.+\?$/g, "?").replace(/\s+/g, " ").trim();
  if (q.length > 90) return null;
  if (!/^(who|what|which|where|when|how|name|in what year)\b/i.test(q)) return null;
  return q;
}

export function isValidReverseFactPair(fact: string, truth: string): boolean {
  const f = fact.trim();
  const t = truth.trim();
  if (!f || !t) return false;
  if (f.includes("?") || t.length > 90) return false;
  if (f.split(/\s+/).length > 6 || f.length < 2) return false;
  if (!/^(who|what|which|where|when|how|name|in what year)\b/i.test(t)) return false;
  if (!t.endsWith("?")) return false;
  if (/\.\.+\?/.test(t)) return false;
  if (isReverseFactTrivial(f, t, 0.25)) return false;
  if (t.toLowerCase().includes(f.toLowerCase()) && f.length > 3) return false;
  return true;
}

export type JeopardyClueRow = {
  question?: string;
  clue?: string;
  answer?: string;
  response?: string;
};

export function buildReverseFactsFromJeopardy(
  rows: JeopardyClueRow[],
  rating: "family" | "mature" = "family",
): ReverseFactEntry[] {
  const out: ReverseFactEntry[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const clue = (row.question ?? row.clue ?? "").trim();
    const response = (row.answer ?? row.response ?? "").trim();
    if (!clue || !response) continue;

    const fact = normalizeJeopardyResponse(response);
    const truth = clueToQuestion(clue);
    if (!fact || !truth || !isValidReverseFactPair(fact, truth)) continue;
    const blob = `${fact} ${truth}`;
    if (rating === "family" && containsMatureKeywords(blob)) continue;
    if (rating === "mature" && !isSpicyContent(blob)) continue;

    const key = fact.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({
      fact,
      truth,
      rating,
      difficulty: fact.length <= 6 ? "easy" : fact.length <= 12 ? "medium" : "hard",
    });
  }
  return out;
}

export function scoreDataset<T>(
  items: T[],
  validate: (item: T) => string | null,
  rejectThreshold = 0.1,
): { accepted: T[]; rejected: T[]; rejectRate: number } {
  const accepted: T[] = [];
  const rejected: T[] = [];
  for (const item of items) {
    const err = validate(item);
    if (err) rejected.push(item);
    else accepted.push(item);
  }
  const rejectRate = items.length ? rejected.length / items.length : 0;
  if (rejectRate > rejectThreshold && items.length > 10) {
    console.warn(`  dataset scout: reject rate ${(rejectRate * 100).toFixed(1)}% exceeds ${rejectThreshold * 100}%`);
  }
  return { accepted, rejected, rejectRate };
}

export const FACT_CHECK_PROMPTS = [
  "The world's worst superpower would be...",
  "A terrible name for a pet would be...",
  "The worst thing to hear your gym teacher say is...",
  "A new law requires you to ___ before driving a car",
  "The secret ingredient in grandma's cookies is...",
  "The title of the worst self-help book ever is...",
  "The worst possible wedding toast would start with...",
  "A rejected Olympic sport would be...",
  "The real reason dinosaurs went extinct is...",
  "The worst thing to find in your burrito is...",
  "A horrible theme for a children's birthday party is...",
  "The worst notification to get at 3 AM is...",
  "An awful name for a coffee shop would be...",
  "The least helpful GPS direction ever is...",
  "A terrible superhero weakness would be...",
  "A rejected candy bar flavor would be...",
  "The worst advice a fortune cookie could give is...",
  "An inappropriate thing to bring to a potluck is...",
  "The worst possible airline announcement is...",
  "A banned baby name in my country would be...",
  "The worst thing to yell in a library is...",
  "A terrible slogan for a dentist would be...",
  "The most useless college major would be...",
  "A horrible perfume scent would be called...",
  "The worst thing to step on barefoot is...",
  "A rejected Pixar movie plot is...",
  "The worst prize in a cereal box would be...",
  "A terrible name for a yacht would be...",
  "The least romantic Valentine's gift is...",
  "A horrible name for a metal band is...",
];

export const FACT_CHECK_TRUTH_BITS = [
  "existential dread",
  "moist congress",
  "aggressive politeness",
  "tax-deductible crying",
  "unlicensed dolphins",
  "emotional baggage",
  "a raccoon with opinions",
  "mildly haunted yogurt",
  "competitive sighing",
  "regret with almonds",
  "chaos and nutmeg",
  "passive-aggressive jazz",
  "a TED talk about nothing",
  "suspiciously warm milk",
  "vibes only parking",
  "a haunted spreadsheet",
  "aggressive small talk",
  "weaponized nostalgia",
  "a goose in HR",
  "unresolved backstory",
  "main-character syndrome",
  "beefy disappointment",
  "a limp handshake from fate",
  "feral politeness",
  "a conspiracy of ducks",
  "premium awkwardness",
  "sweaty confidence",
  "a podcast about silence",
  "aggressive neutrality",
  "cheese-based trauma",
];

export type FactCheckPair = {
  prompt: string;
  truth: string;
  rating: "family" | "mature";
  difficulty: "easy" | "medium" | "hard";
};

/** Generate unique family fact-check pairs to reach pool minimums. */
export function generateFactCheckFamilyPairs(target = MIN_CONTENT_POOL_SIZE): FactCheckPair[] {
  const out: FactCheckPair[] = [];
  const seen = new Set<string>();
  let i = 0;
  while (out.length < target && i < target * 40) {
    const prompt = FACT_CHECK_PROMPTS[i % FACT_CHECK_PROMPTS.length];
    const a = FACT_CHECK_TRUTH_BITS[i % FACT_CHECK_TRUTH_BITS.length];
    const b = FACT_CHECK_TRUTH_BITS[(i * 7 + 3) % FACT_CHECK_TRUTH_BITS.length];
    const base =
      i % 4 === 0
        ? `${a.charAt(0).toUpperCase() + a.slice(1)}`
        : i % 4 === 1
          ? `${a} and ${b}`
          : i % 4 === 2
            ? `${a}, but make it ${b}`
            : `${b} with extra ${a}`;
    const truth = i % 8 === 0 ? `${base} (${Math.floor(i / 8) + 1})` : base;
    const key = `${prompt}|${truth}`.toLowerCase();
    if (!seen.has(key) && isFactCheckTruthValid(prompt, truth)) {
      seen.add(key);
      out.push({
        prompt,
        truth,
        rating: "family",
        difficulty: i % 2 === 0 ? "easy" : "medium",
      });
    }
    i++;
  }
  return out;
}
