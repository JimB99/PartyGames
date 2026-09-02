/**
 * Replace generated filler with human-authored datasets.
 * Sources: OpenTriviaQA (CC BY-SA), party-game-sentences (MIT), dariusk/corpora (CC0).
 *
 * Run: pnpm harvest-content
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildReverseFactsFromQuiz,
  FACT_CHECK_PROMPTS,
  filterRepetitiveTruths,
  isFactCheckTruthValid,
  isReverseFactTrivial,
  looksLikeConvertedNhieFactCheck,
  looksLikeGeneratedFactCheckTruth,
  looksLikeGeneratedFriendSortRole,
  looksLikePlaygroundSpectrumPole,
  looksLikeTemplateCrowdCall,
  rebalanceWitShowdownPrefixes,
} from "../packages/shared/src/content-quality.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = join(ROOT, "packages/shared/content");
const CACHE = join(ROOT, "scripts/.cache");

type Rating = "family" | "mature";
type Difficulty = "easy" | "medium" | "hard";
type QuizRow = {
  question: string;
  choices: string[];
  correct: number;
  rating: Rating;
  difficulty: Difficulty;
};

const OPEN_TRIVIA_QA_BASE = "https://raw.githubusercontent.com/uberspot/OpenTriviaQA/master/categories";
const PGS_BASE = "https://unpkg.com/party-game-sentences@1.2.10/dist/json";
const OCCUPATIONS_URL =
  "https://raw.githubusercontent.com/dariusk/corpora/master/data/humans/occupations.json";
const ARCHETYPES_URL =
  "https://raw.githubusercontent.com/dariusk/corpora/master/data/archetypes/character.json";

const QA_CATEGORIES: Array<{ slug: string; difficulty: Difficulty; max: number }> = [
  { slug: "for-kids", difficulty: "easy", max: 280 },
  { slug: "general", difficulty: "medium", max: 400 },
  { slug: "entertainment", difficulty: "medium", max: 280 },
  { slug: "geography", difficulty: "medium", max: 280 },
  { slug: "sports", difficulty: "medium", max: 250 },
  { slug: "movies", difficulty: "medium", max: 280 },
  { slug: "music", difficulty: "medium", max: 220 },
  { slug: "television", difficulty: "medium", max: 220 },
  { slug: "animals", difficulty: "easy", max: 200 },
  { slug: "hobbies", difficulty: "medium", max: 200 },
  { slug: "people", difficulty: "medium", max: 180 },
  { slug: "world", difficulty: "hard", max: 180 },
  { slug: "literature", difficulty: "hard", max: 160 },
  { slug: "science-technology", difficulty: "hard", max: 220 },
  { slug: "history", difficulty: "hard", max: 220 },
  { slug: "video-games", difficulty: "medium", max: 160 },
  { slug: "humanities", difficulty: "hard", max: 140 },
  { slug: "rated", difficulty: "medium", max: 180 },
];

const MATURE_RE =
  /\b(sex|sexy|naked|nude|porn|orgasm|horny|fetish|threesome|masturbat|hookup|affair|stripper|vibrator|erotic|hentai)\b|\bprostitut/i;

const NHIE_SPAM =
  /sandboarding|ice climbing in|freestyle moto|monster truck|wingsuit|dune in |slopestyle|quarterpipe|halfpipe|heli-ski|street luge|demolition derby|volcano boarding|BASE jumping|freestyle snow|freestyle ski|freestyle BMX|freestyle skate|gone ice climbing|been in a freestyle/i;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function decodeEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&ldquo;|&rdquo;/g, '"')
    .replace(/&lsquo;|&rsquo;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shuffle<T>(arr: T[], seed = 7): T[] {
  const out = [...arr];
  let s = seed >>> 0;
  for (let i = out.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function loadJson<T>(rel: string): T {
  return JSON.parse(readFileSync(join(CONTENT, rel), "utf8")) as T;
}

function saveJson(rel: string, data: unknown) {
  writeFileSync(join(CONTENT, rel), `${JSON.stringify(data, null, 2)}\n`);
  const n = Array.isArray(data) ? data.length : "object";
  console.log(`  wrote ${rel} (${n})`);
}

function ratingOf(text: string, fallback: Rating = "family"): Rating {
  return MATURE_RE.test(text) ? "mature" : fallback;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "PartyGames-content-harvest/1.0" } });
  if (!res.ok) throw new Error(`${url} ${res.status}`);
  return res.text();
}

async function cachedFetchText(name: string, url: string): Promise<string | null> {
  mkdirSync(CACHE, { recursive: true });
  const path = join(CACHE, name);
  if (existsSync(path)) return readFileSync(path, "utf8");
  try {
    const text = await fetchText(url);
    writeFileSync(path, text);
    return text;
  } catch (e) {
    console.warn(`  skip ${name}:`, e instanceof Error ? e.message : e);
    return null;
  }
}

async function cachedFetchJson<T>(name: string, url: string): Promise<T | null> {
  const text = await cachedFetchText(name, url);
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    console.warn(`  skip ${name}: invalid JSON`);
    return null;
  }
}

function partyFitQuiz(row: QuizRow): boolean {
  const q = row.question;
  if (q.length < 18 || q.length > 140) return false;
  if (row.choices.length < 3 || row.choices.length > 4) return false;
  const unique = new Set(row.choices.map((c) => c.toLowerCase()));
  if (unique.size !== row.choices.length) return false;
  if (row.choices.some((c) => c.length < 1 || c.length > 56)) return false;
  if (row.choices.every((c) => /^(true|false)$/i.test(c))) return false;
  if (/which of the following (is not|are not)/i.test(q)) return false;
  if (/\ball of the above\b|\bnone of the above\b/i.test(row.choices.join(" "))) return false;
  if (row.correct < 0 || row.correct >= row.choices.length) return false;
  return true;
}

function parseOpenTriviaQA(text: string, difficulty: Difficulty): QuizRow[] {
  const results: QuizRow[] = [];
  const blocks = text.split(/\n(?=#Q)/);
  for (const block of blocks) {
    const lines = block.trim().split("\n").filter(Boolean);
    if (!lines[0]?.startsWith("#Q")) continue;
    const question = decodeEntities(lines[0].replace(/^#Q\s*/, "").trim());
    if (!question) continue;
    const choiceLines = lines.filter((l) => /^[A-D]\s/.test(l));
    if (choiceLines.length < 3) continue;
    const choices = choiceLines.map((l) => decodeEntities(l.slice(2).trim())).filter(Boolean);
    if (choices.length < 3) continue;
    const marker = lines.find((l) => l.startsWith("^"));
    let correct = 0;
    if (marker) {
      const answer = decodeEntities(marker.replace(/^\^\s*/, "").trim());
      const idx = choices.findIndex((c) => c === answer);
      correct = idx >= 0 ? idx : 0;
    }
    const blob = `${question} ${choices.join(" ")}`;
    const row: QuizRow = {
      question,
      choices,
      correct,
      rating: ratingOf(blob, "family"),
      difficulty,
    };
    if (partyFitQuiz(row)) results.push(row);
  }
  return results;
}

function quizToFactCheck(row: QuizRow) {
  const truth = row.choices[row.correct]?.trim();
  if (!truth) return null;
  if (!isFactCheckTruthValid(row.question, truth)) return null;
  if (row.question.length > 100) return null;
  if (looksLikeGeneratedFactCheckTruth(truth)) return null;
  if (/^(true|false|yes|no)$/i.test(truth)) return null;
  if (truth.length < 4 || truth.length > 70) return null;
  return {
    prompt: row.question,
    truth,
    rating: row.rating,
    difficulty: row.difficulty,
  };
}

function wyrCore(s: string): string {
  return s
    .toLowerCase()
    .replace(/have the (ability|power) to /g, "")
    .replace(/be able to /g, "")
    .replace(/the (ability|power) of /g, "")
    .replace(/control and manipulate /g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isBoringWyr(a: string, b: string): boolean {
  if (/control and manipulate/.test(`${a} ${b}`.toLowerCase())) return true;
  if (a.length < 6 || b.length < 6) return true;
  if (a.length > 90 || b.length > 90) return true;
  if (a.toLowerCase() === b.toLowerCase()) return true;
  const ac = wyrCore(a);
  const bc = wyrCore(b);
  if (!ac || !bc || ac === bc) return true;
  return false;
}

function flattenWyrRow(row: unknown): [string, string] | null {
  if (!Array.isArray(row) || row.length < 2) {
    if (row && typeof row === "object" && "a" in row && "b" in row) {
      return [String((row as { a: string }).a), String((row as { b: string }).b)];
    }
    return null;
  }
  const a = row[0];
  const b = row[1];
  if (typeof a !== "string" || typeof b !== "string") return null;
  return [a, b];
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function familyCount<T extends { rating?: string }>(rows: T[]): number {
  return rows.filter((r) => (r.rating ?? "family") === "family").length;
}

function matureCount<T extends { rating?: string }>(rows: T[]): number {
  return rows.filter((r) => r.rating === "mature").length;
}

function nhieOk(text: string, prefixCounts: Map<string, number>): boolean {
  if (text.length < 8 || text.length > 72) return false;
  if (NHIE_SPAM.test(text)) return false;
  const words = text.split(/\s+/);
  if (words.length > 10) return false;
  const prefix = words.slice(0, 3).join(" ").toLowerCase();
  const n = prefixCounts.get(prefix) ?? 0;
  if (n >= 2) return false;
  prefixCounts.set(prefix, n + 1);
  return true;
}

async function main() {
  console.log("Harvesting human-authored content…");
  const report: string[] = [];

  const quizByQuestion = new Map<string, QuizRow>();
  for (const row of loadJson<QuizRow[]>("trivia/quiz.json")) {
    const next: QuizRow = {
      ...row,
      question: decodeEntities(row.question),
      choices: row.choices.map(decodeEntities),
      rating: row.rating ?? ratingOf(row.question, "family"),
      difficulty: row.difficulty ?? "medium",
    };
    if (partyFitQuiz(next)) quizByQuestion.set(next.question, next);
  }
  const existingQuizKept = quizByQuestion.size;
  console.log(`  existing quiz after quality filter: ${existingQuizKept}`);

  for (const { slug, difficulty, max } of QA_CATEGORIES) {
    const text = await cachedFetchText(`oa-${slug}.txt`, `${OPEN_TRIVIA_QA_BASE}/${slug}`);
    await sleep(60);
    if (!text) continue;
    let added = 0;
    for (const row of parseOpenTriviaQA(text, difficulty)) {
      if (quizByQuestion.has(row.question)) continue;
      quizByQuestion.set(row.question, row);
      added++;
      if (added >= max) break;
    }
    console.log(`  OpenTriviaQA/${slug}: +${added}`);
    report.push(`OpenTriviaQA/${slug} +${added}`);
  }

  const quiz = shuffle([...quizByQuestion.values()], 11).slice(0, 4200);
  saveJson("trivia/quiz.json", quiz);

  const MATURE_FACT_SEEDS: Array<{ prompt: string; truth: string; rating: Rating; difficulty: Difficulty }> = [
    { prompt: "The US constitutional amendment that established Prohibition is the...", truth: "18th Amendment", rating: "mature", difficulty: "medium" },
    { prompt: "The year nationwide Prohibition ended in the United States is...", truth: "1933", rating: "mature", difficulty: "easy" },
    { prompt: "The US amendment that repealed Prohibition is the...", truth: "21st Amendment", rating: "mature", difficulty: "medium" },
    { prompt: "The Las Vegas Strip is actually located in which community?", truth: "Paradise", rating: "mature", difficulty: "hard" },
    { prompt: "Playboy magazine's first issue featured which actress on the cover?", truth: "Marilyn Monroe", rating: "mature", difficulty: "medium" },
    { prompt: "The first Playboy issue was published in which year?", truth: "1953", rating: "mature", difficulty: "medium" },
    { prompt: "The bourbon mash bill must be at least what percent corn?", truth: "51 percent", rating: "mature", difficulty: "hard" },
    { prompt: "Absinthe's famous green color historically came from which herb?", truth: "Wormwood", rating: "mature", difficulty: "medium" },
    { prompt: "The cocktail Gin and Tonic was promoted to fight which disease?", truth: "Malaria", rating: "mature", difficulty: "medium" },
    { prompt: "James Bond's classic martini order is...", truth: "Vodka martini, shaken not stirred", rating: "mature", difficulty: "easy" },
    { prompt: "The German beer purity law is called the...", truth: "Reinheitsgebot", rating: "mature", difficulty: "hard" },
    { prompt: "Champagne can only be labeled Champagne if it comes from which country?", truth: "France", rating: "mature", difficulty: "easy" },
    { prompt: "The card game named after a Nevada city is...", truth: "Blackjack", rating: "mature", difficulty: "easy" },
    { prompt: "A 'royal flush' is the highest hand in which game?", truth: "Poker", rating: "mature", difficulty: "easy" },
    { prompt: "The Kentucky Derby's traditional drink is the...", truth: "Mint julep", rating: "mature", difficulty: "medium" },
    { prompt: "Tequila must be made in which country?", truth: "Mexico", rating: "mature", difficulty: "easy" },
    { prompt: "The Speakeasy was a secret bar from which US era?", truth: "Prohibition", rating: "mature", difficulty: "easy" },
    { prompt: "Scotch whisky must be aged at least how many years?", truth: "Three years", rating: "mature", difficulty: "hard" },
    { prompt: "The 'hair of the dog' hangover folk remedy refers to...", truth: "More alcohol", rating: "mature", difficulty: "easy" },
    { prompt: "The casino game with a spinning wheel and ball is...", truth: "Roulette", rating: "mature", difficulty: "easy" },
    { prompt: "A 'flight' at a brewery is usually a set of...", truth: "Small beer samples", rating: "mature", difficulty: "easy" },
    { prompt: "The wine region of Napa Valley is in which US state?", truth: "California", rating: "mature", difficulty: "easy" },
    { prompt: "IPA beer originally stood for...", truth: "India Pale Ale", rating: "mature", difficulty: "medium" },
    { prompt: "The legal US drinking age in all states today is...", truth: "Twenty-one", rating: "mature", difficulty: "easy" },
    { prompt: "Moonshine is traditionally associated with illegally made...", truth: "Whiskey", rating: "mature", difficulty: "medium" },
  ];
  const jokePrompts = new Set(FACT_CHECK_PROMPTS);
  const seenJokePrompt = new Set<string>();
  const existingFact = loadJson<Array<{ prompt?: string; truth: string; rating?: Rating; difficulty?: Difficulty }>>(
    "prompts/fact-check.json",
  );
  const keptHand = existingFact.filter((row) => {
    if (!row.prompt) return false;
    if (!isFactCheckTruthValid(row.prompt, row.truth)) return false;
    if (looksLikeGeneratedFactCheckTruth(row.truth)) return false;
    if (looksLikeConvertedNhieFactCheck(row.prompt)) return false;
    const isTriviaPrompt =
      /^(what|which|who|when|where|why|how|this |in what|the year)\b/i.test(row.prompt) ||
      row.prompt.endsWith("?") ||
      row.prompt.length > 85;
    if (isTriviaPrompt && !jokePrompts.has(row.prompt)) return false;
    if (!jokePrompts.has(row.prompt) && row.prompt.length > 70) return false;
    if (jokePrompts.has(row.prompt)) {
      if (seenJokePrompt.has(row.prompt)) return false;
      seenJokePrompt.add(row.prompt);
    }
    return true;
  });

  const factFromQuiz = quiz.map(quizToFactCheck).filter((x): x is NonNullable<typeof x> => Boolean(x));
  const partyFacts = factFromQuiz.filter((row) => {
    const q = row.prompt;
    if (q.length > 110) return false;
    if (row.truth.length > 42) return false;
    return /^(what|which|who|where|when|how many|how much)\b/i.test(q) || q.endsWith("?");
  });
  const factMap = new Map<string, (typeof factFromQuiz)[number]>();
  for (const row of [
    ...keptHand.map((r) => ({
      prompt: r.prompt!,
      truth: r.truth,
      rating: (r.rating ?? "family") as Rating,
      difficulty: (r.difficulty ?? "medium") as Difficulty,
    })),
    ...MATURE_FACT_SEEDS,
    ...shuffle(partyFacts, 13).slice(0, 750),
  ]) {
    const k = row.truth.toLowerCase();
    if (factMap.has(k)) continue;
    factMap.set(k, row);
  }
  const factCheck = filterRepetitiveTruths(shuffle([...factMap.values()], 13));
  saveJson("prompts/fact-check.json", factCheck);
  report.push(
    `fact-check ${factCheck.length} family=${familyCount(factCheck)} mature=${matureCount(factCheck)} (jokes ${keptHand.length})`,
  );

  const reverse = filterRepetitiveTruths(
    buildReverseFactsFromQuiz(quiz, "family")
      .map((row) => ({
        ...row,
        rating: ratingOf(`${row.fact} ${row.truth}`, row.rating),
      }))
      .filter((row) => !isReverseFactTrivial(row.fact, row.truth) && !row.truth.endsWith(".?") && !/\.\.+\?$/.test(row.truth)),
  );
  const reverseSeen = new Set<string>();
  const reverseDeduped = shuffle(
    reverse.filter((row) => {
      const k = row.fact.toLowerCase();
      if (reverseSeen.has(k)) return false;
      reverseSeen.add(k);
      return true;
    }),
    17,
  );
  saveJson("prompts/reverse-fact.json", reverseDeduped.slice(0, 500));
  report.push(`reverse-fact ${Math.min(reverseDeduped.length, 500)}`);

  const pgsWyr = await cachedFetchJson<unknown[]>("pgs-wyr.json", `${PGS_BASE}/would-you-rather.json`);
  const existingWyr = loadJson<Array<{ a: string; b: string; rating?: Rating; difficulty?: Difficulty }>>(
    "would-you-rather.json",
  );
  const wyrMap = new Map<string, { a: string; b: string; rating: Rating; difficulty: Difficulty }>();
  let superpowerFromPgs = 0;
  const ingestWyr = (aRaw: string, bRaw: string, rating: Rating, fromPgs: boolean) => {
    const a = decodeEntities(aRaw).replace(/^would you rather /i, "").trim();
    const b = decodeEntities(bRaw).trim();
    if (isBoringWyr(a, b)) return;
    const isPower = /ability to|power to|be able to|super strength|teleport|time travel/i.test(`${a} ${b}`);
    if (fromPgs && isPower) {
      if (superpowerFromPgs >= 40) return;
    }
    const k = [wyrCore(a), wyrCore(b)].sort().join("|");
    if (wyrMap.has(k)) return;
    wyrMap.set(k, { a, b, rating: ratingOf(`${a} ${b}`, rating), difficulty: "medium" });
    if (fromPgs && isPower) superpowerFromPgs++;
  };
  for (const row of existingWyr) ingestWyr(row.a, row.b, row.rating ?? "family", false);
  if (pgsWyr) {
    let added = 0;
    for (const row of pgsWyr) {
      const pair = flattenWyrRow(row);
      if (!pair) continue;
      const before = wyrMap.size;
      ingestWyr(pair[0], pair[1], "family", true);
      if (wyrMap.size > before) added++;
    }
    console.log(`  party-game-sentences WYR kept +${added} (superpower from PGS ${superpowerFromPgs})`);
  }
  const wyrAll = shuffle([...wyrMap.values()], 19);
  const wyrMundane = wyrAll.filter((r) => !/ability to|power to|be able to|teleport|time travel/i.test(`${r.a} ${r.b}`));
  const wyrPowers = wyrAll.filter((r) => /ability to|power to|be able to|teleport|time travel/i.test(`${r.a} ${r.b}`));
  const wyrPowerFamily = wyrPowers.filter((r) => r.rating === "family").slice(0, 120);
  const wyrPowerMature = wyrPowers.filter((r) => r.rating === "mature").slice(0, 20);
  const wyr = shuffle([...wyrMundane, ...wyrPowerFamily, ...wyrPowerMature], 19);
  saveJson("would-you-rather.json", wyr);
  report.push(`would-you-rather ${wyr.length} family=${familyCount(wyr)} mature=${matureCount(wyr)}`);

  const existingCrowd = loadJson<Array<{ text: string; choices: string[]; rating?: Rating }>>(
    "prompts/crowd-call.json",
  );
  const crowdMap = new Map<string, { text: string; choices: string[]; rating: Rating }>();
  for (const row of existingCrowd) {
    if (looksLikeTemplateCrowdCall(row.text, row.choices)) continue;
    if (row.choices.length < 2) continue;
    crowdMap.set(row.text.toLowerCase(), {
      text: row.text,
      choices: row.choices,
      rating: row.rating ?? "family",
    });
  }
  const keptCrowd = crowdMap.size;
  let crowdFromWyr = 0;
  for (const row of wyr) {
    if (row.a.length > 42 || row.b.length > 42) continue;
    const text = "Would you rather?";
    const key = `${row.a}|${row.b}`.toLowerCase();
    if (crowdMap.has(key)) continue;
    crowdMap.set(key, {
      text,
      choices: [row.a, row.b],
      rating: row.rating,
    });
    crowdFromWyr++;
    if (crowdFromWyr >= 140) break;
  }
  // Unique "Would you rather?" text would collapse; use the pair as the prompt.
  const crowdFixed = new Map<string, { text: string; choices: string[]; rating: Rating }>();
  for (const row of crowdMap.values()) {
    const text = row.choices.length === 2 && row.text === "Would you rather?"
      ? `Would you rather ${row.choices[0]} or ${row.choices[1]}?`
      : row.text;
    if (text.length > 140) continue;
    crowdFixed.set(text.toLowerCase(), { ...row, text });
  }
  let crowdFromQuiz = 0;
  for (const row of quiz) {
    if (row.choices.length !== 4 || row.rating !== "family") continue;
    if (crowdFixed.has(row.question.toLowerCase())) continue;
    crowdFixed.set(row.question.toLowerCase(), {
      text: row.question,
      choices: row.choices,
      rating: "family",
    });
    crowdFromQuiz++;
    if (crowdFromQuiz >= 220) break;
  }
  const crowdAll = [...crowdFixed.values()];
  const crowdOpinionAll = crowdAll.filter((r) => !/^Would you rather /i.test(r.text));
  const crowdMatureOp = crowdOpinionAll.filter((r) => r.rating === "mature");
  const crowdFamilyOp = shuffle(
    crowdOpinionAll.filter((r) => r.rating !== "mature"),
    5,
  ).slice(0, Math.max(0, 260 - crowdMatureOp.length));
  const crowdOpinion = [...crowdMatureOp, ...crowdFamilyOp];
  const crowdWyr = shuffle(
    crowdAll.filter((r) => /^Would you rather /i.test(r.text)),
    6,
  ).slice(0, 90);
  const crowd = shuffle([...crowdOpinion, ...crowdWyr], 23);
  saveJson("prompts/crowd-call.json", crowd);
  report.push(
    `crowd-call ${crowd.length} (kept ${keptCrowd}, wyr ${crowdFromWyr}, quiz ${crowdFromQuiz}) family=${familyCount(crowd)} mature=${matureCount(crowd)}`,
  );

  const existingSplit = loadJson<Array<{ text: string; labelA: string; labelB: string; rating?: Rating }>>(
    "prompts/split-room.json",
  );
  const splitMap = new Map<string, { text: string; labelA: string; labelB: string; rating: Rating }>();
  for (const row of existingSplit) {
    const k = `${row.labelA}|${row.labelB}`.toLowerCase();
    splitMap.set(k, {
      text: row.text,
      labelA: row.labelA,
      labelB: row.labelB,
      rating: row.rating ?? "family",
    });
  }
  let splitFromWyr = 0;
  for (const row of wyr) {
    if (row.a.length > 40 || row.b.length > 40) continue;
    const k = `${row.a}|${row.b}`.toLowerCase();
    if (splitMap.has(k)) continue;
    splitMap.set(k, {
      text: "Would you rather",
      labelA: row.a,
      labelB: row.b,
      rating: row.rating,
    });
    splitFromWyr++;
    if (splitFromWyr >= 180) break;
  }
  const split = shuffle([...splitMap.values()], 29);
  saveJson("prompts/split-room.json", split);
  report.push(`split-room ${split.length} family=${familyCount(split)} mature=${matureCount(split)}`);

  const existingSpectrum = loadJson<Array<{ left: string; right: string; rating?: Rating }>>(
    "prompts/spectrum.json",
  );
  const specMap = new Map<string, { left: string; right: string; rating: Rating }>();
  for (const row of existingSpectrum) {
    if (looksLikePlaygroundSpectrumPole(row.left, row.right)) continue;
    specMap.set(`${row.left}|${row.right}`.toLowerCase(), {
      left: row.left,
      right: row.right,
      rating: row.rating ?? "family",
    });
  }
  let specFromWyr = 0;
  for (const row of wyr) {
    if (row.a.length > 28 || row.b.length > 28) continue;
    const k = `${row.a}|${row.b}`.toLowerCase();
    if (specMap.has(k)) continue;
    specMap.set(k, { left: row.a, right: row.b, rating: row.rating });
    specFromWyr++;
    if (specFromWyr >= 80) break;
  }
  const spectrum = shuffle([...specMap.values()], 31);
  saveJson("prompts/spectrum.json", spectrum);
  report.push(`spectrum ${spectrum.length} family=${familyCount(spectrum)} mature=${matureCount(spectrum)}`);

  const pgsNhie = await cachedFetchJson<string[]>("pgs-nhie.json", `${PGS_BASE}/never-have-i-ever.json`);
  const pgsTod = await cachedFetchJson<{ truth?: string[]; dare?: string[] }>(
    "pgs-tod.json",
    `${PGS_BASE}/truth-or-dare.json`,
  );

  const existingWit = loadJson<Array<{ text: string; rating?: Rating }>>("prompts/wit-showdown.json");
  const witMap = new Map<string, { text: string; rating: Rating }>();
  for (const row of existingWit) {
    if (/^Worst thing: (had |played |gone |been )/i.test(row.text)) continue;
    witMap.set(row.text.toLowerCase(), { text: row.text, rating: row.rating ?? "family" });
  }
  const existingHot = loadJson<Array<{ text: string; rating?: Rating }>>("prompts/hot-seat.json");
  const hotMap = new Map<string, { text: string; rating: Rating }>();
  for (const row of existingHot) {
    hotMap.set(row.text.toLowerCase(), { text: row.text, rating: row.rating ?? ratingOf(row.text) });
  }
  const nhiePrefixes = new Map<string, number>();
  if (pgsNhie) {
    let addedHot = 0;
    for (const sentence of pgsNhie) {
      const text = decodeEntities(sentence).replace(/^Never have I ever /i, "").trim();
      if (!nhieOk(text, nhiePrefixes)) continue;
      const rating = ratingOf(text, "family");
      const hot = `Have they ever ${text}?`;
      if (!hotMap.has(hot.toLowerCase())) {
        hotMap.set(hot.toLowerCase(), { text: hot, rating });
        addedHot++;
      }
    }
    console.log(`  party-game-sentences NHIE hot-seat +${addedHot}`);
  }
  if (pgsTod?.truth) {
    let embarrassingKept = 0;
    let added = 0;
    for (const raw of pgsTod.truth) {
      const t = decodeEntities(raw).trim();
      if (t.length < 12 || t.length > 110) continue;
      const embarrassing = /most embarrassing/i.test(t);
      if (embarrassing) {
        if (embarrassingKept >= 8) continue;
        embarrassingKept++;
      }
      let hot = t;
      if (/^Have you /i.test(t)) hot = t.replace(/^Have you /i, "Have they ");
      else if (/^What is your /i.test(t)) hot = t.replace(/^What is your /i, "What is their ");
      else if (/^What's your /i.test(t)) hot = t.replace(/^What's your /i, "What's their ");
      const rating = ratingOf(hot, "family");
      if (!hotMap.has(hot.toLowerCase())) {
        hotMap.set(hot.toLowerCase(), { text: hot, rating });
        added++;
      }
    }
    console.log(`  party-game-sentences truths hot-seat +${added}`);
  }
  saveJson("prompts/wit-showdown.json", rebalanceWitShowdownPrefixes(shuffle([...witMap.values()], 37)));
  saveJson("prompts/hot-seat.json", shuffle([...hotMap.values()], 41));
  report.push(`wit-showdown ${witMap.size}, hot-seat ${hotMap.size}`);

  const existingCaption = loadJson<Array<{ text: string; rating?: Rating }>>("prompts/caption.json");
  const capMap = new Map<string, { text: string; rating: Rating }>();
  for (const row of existingCaption) {
    if (/^Caption for someone who /i.test(row.text)) continue;
    capMap.set(row.text.toLowerCase(), { text: row.text, rating: row.rating ?? ratingOf(row.text) });
  }
  const drawWords = loadJson<Array<{ word?: string; rating?: string } | string>>("words/draw.json");
  let capFromDraw = 0;
  for (const w of drawWords) {
    const word = typeof w === "string" ? w : w.word;
    if (!word || word.split(/\s+/).length > 3) continue;
    if (word.length < 3 || word.length > 22) continue;
    if (/^(perform|do a |call a )/i.test(word)) continue;
    const entryRating = typeof w === "object" && w.rating === "mature" ? "mature" : "family";
    if (entryRating === "mature") continue;
    const text = `Caption for ${/^[aeiou]/i.test(word) ? "an" : "a"} ${word}`;
    if (capMap.has(text.toLowerCase())) continue;
    capMap.set(text.toLowerCase(), { text, rating: "family" });
    capFromDraw++;
    if (capMap.size >= 320) break;
    if (capFromDraw >= 80) break;
  }
  const capRows = [...capMap.values()];
  const capScenes = capRows.filter((r) => !/^Caption for an? \S+$/i.test(r.text));
  const capGeneric = capRows.filter((r) => /^Caption for an? \S+$/i.test(r.text));
  const caption = shuffle(
    [...capScenes, ...capGeneric.slice(0, Math.max(0, 300 - capScenes.length))],
    47,
  );
  saveJson("prompts/caption.json", caption);
  report.push(`caption ${caption.length} (dropped dare-captions, +${capFromDraw} from draw words)`);

  const rolesRaw = loadJson<Array<string | { name: string; rating?: string }>>(
    "categories/friend-sort-roles.json",
  );
  const roleMap = new Map<string, { name: string; rating: Rating }>();
  for (const r of rolesRaw) {
    const name = typeof r === "string" ? r : r.name;
    const rating = (typeof r === "object" ? r.rating : "family") as Rating;
    if (/\b(Repairer|Surgeon|Scientist|Manager|Officer|Analyst|Specialist|Coordinator|Consultant|Examiner|Inspector|Engineer|Police|Marker|Cutter|Tender|Setter|Laborer|Helper|Operator|Technician|Clerk)\b/i.test(name) && name.includes(" ")) continue;
    if (looksLikeGeneratedFriendSortRole(name)) continue;
    if (name.length < 3 || name.length > 28) continue;
    roleMap.set(name.toLowerCase(), { name, rating: rating === "mature" ? "mature" : "family" });
  }
  const occupations = await cachedFetchJson<{ occupations: string[] }>("occupations.json", OCCUPATIONS_URL);
  if (occupations?.occupations) {
    let added = 0;
    for (const job of occupations.occupations) {
      if (job.split(/\s+/).length !== 1) continue;
      if (job.length < 4 || job.length > 14) continue;
      if (/firer|fitter|tender|handler|grader|sorter|packer|logist|biophys/i.test(job)) continue;
      const name = titleCase(job);
      if (roleMap.has(name.toLowerCase())) continue;
      roleMap.set(name.toLowerCase(), { name, rating: "family" });
      if (roleMap.size >= 260) break;
      added++;
      if (added >= 150) break;
    }
    console.log(`  corpora occupations: +${added}`);
  }
  const archetypes = await cachedFetchJson<{
    characters: Array<{ name: string }>;
  }>("archetypes.json", ARCHETYPES_URL);
  if (archetypes?.characters) {
    for (const c of archetypes.characters) {
      if (/slave|victim|waif|death/i.test(c.name)) continue;
      const name = `The ${titleCase(c.name)}`;
      const rating: Rating = /temptress|hedonist|sycophant/i.test(c.name) ? "mature" : "family";
      if (!roleMap.has(name.toLowerCase())) roleMap.set(name.toLowerCase(), { name, rating });
    }
  }
  const roles = shuffle([...roleMap.values()], 43);
  saveJson("categories/friend-sort-roles.json", roles);
  report.push(`friend-sort ${roles.length} family=${familyCount(roles)} mature=${matureCount(roles)}`);

  console.log("\nHarvest report:");
  for (const line of report) console.log(`  ${line}`);

  const samples: Array<[string, string[]]> = [
    ["fact-check", factCheck.slice(0, 4).map((r) => `${r.prompt} → ${r.truth}`)],
    ["crowd-call", crowd.slice(0, 4).map((r) => `${r.text} [${r.choices.join(" / ")}]`)] ,
    ["wyr", wyr.slice(0, 4).map((r) => `${r.a} / ${r.b}`)],
    ["friend-sort", roles.slice(0, 8).map((r) => r.name)],
  ];
  console.log("\nSamples:");
  for (const [name, rows] of samples) {
    console.log(`  ${name}:`);
    for (const row of rows) console.log(`    - ${row}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
