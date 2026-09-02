/**
 * Build-time content import: tags existing prompts, fetches OpenTDB quiz,
 * harvests TruthOrDareBot + nhie.io for mature pools.
 *
 * Run: pnpm import-content
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  diversifyNhieStatement,
  duplicateTruthRate,
  filterRepetitiveTruths,
  isFactCheckTruthValid,
  looksLikeGeneratedFactCheckTruth,
  looksLikeConvertedNhieFactCheck,
  isPlaceholderTruth,
  isReverseFactTrivial,
  MIN_CONTENT_POOL_SIZE,
  orderedSequenceRatio,
  rebalanceWitShowdownPrefixes,
  buildReverseFactsFromQuiz,
} from "../packages/shared/src/content-quality.ts";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONTENT = join(ROOT, "packages/shared/content");

type Rating = "family" | "mature";
type Difficulty = "easy" | "medium" | "hard";

const MATURE_KEYWORDS =
  /\b(sex|naked|nude|drunk|alcohol|weed|cocaine|porn|orgasm|masturbat|cheat|affair|strip|twerk|kiss a stranger|hookup|one night stand)\b/i;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function writeJson(rel: string, data: unknown) {
  const path = join(CONTENT, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`  wrote ${rel} (${Array.isArray(data) ? data.length : "object"} items)`);
}

function readJson<T>(rel: string): T {
  return JSON.parse(readFileSync(join(CONTENT, rel), "utf8")) as T;
}

function isMatureText(text: string): boolean {
  return MATURE_KEYWORDS.test(text);
}

function promptEntry(text: string, rating: Rating = "family", difficulty?: Difficulty) {
  return { text, rating, ...(difficulty ? { difficulty } : {}) };
}

function wordEntry(word: string, rating: Rating = "family", difficulty?: Difficulty) {
  return { word, rating, ...(difficulty ? { difficulty } : {}) };
}

function wordText(w: string | { word: unknown }): string {
  if (typeof w === "string") return w;
  const inner = w.word;
  if (typeof inner === "string") return inner;
  if (inner && typeof inner === "object" && "word" in inner) {
    return wordText(inner as { word: unknown });
  }
  return "";
}

function categoryText(c: string | { name: unknown }): string {
  if (typeof c === "string") return c;
  const inner = c.name;
  if (typeof inner === "string") return inner;
  if (inner && typeof inner === "object" && "name" in inner) {
    return categoryText(inner as { name: unknown });
  }
  return "";
}

function categoryEntry(name: string, rating: Rating = "family", difficulty?: Difficulty) {
  return { name, rating, ...(difficulty ? { difficulty } : {}) };
}

const PGS_BASE = "https://unpkg.com/party-game-sentences@1.2.10/dist/json";
const OPEN_TRIVIA_QA_BASE =
  "https://raw.githubusercontent.com/uberspot/OpenTriviaQA/master/categories";
const PARTY_WORD_LISTS_URL =
  "https://raw.githubusercontent.com/ylwl1997/party-game-word-lists/main/word-lists.json";
const PQ_WORDS_URL = "https://raw.githubusercontent.com/pandaqi/pq-words/master/lib-pqWords.json";
const DWYL_WORDS_URL =
  "https://raw.githubusercontent.com/dwyl/english-words/master/words_alpha.txt";
const HUMAN_HISTORY_INDEX =
  "https://api.github.com/repos/mattbierner/all-of-human-history/contents/data";
const TIMELINE_YEAR_MIN = 1600;
const TIMELINE_YEAR_MAX = 2024;
const TIMELINE_CAP = 2500;

function loadCuratedBracketTopics(): Array<{ name: string; rating: Rating; difficulty: Difficulty }> {
  const raw = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "bracket-topics.json"), "utf8")) as { family: string[]; mature: string[] };
  const out: Array<{ name: string; rating: Rating; difficulty: Difficulty }> = [];
  for (const name of raw.family) out.push(categoryEntry(name, "family", "medium"));
  for (const name of raw.mature) out.push(categoryEntry(name, "mature", "medium"));
  return out;
}

type TimelineRow = {
  event: string;
  year: number;
  rating: Rating;
  difficulty: Difficulty;
};

function cleanTimelineEvent(text: string): string {
  return text
    .replace(/['']/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function timelineDifficulty(year: number): Difficulty {
  if (year >= 1950) return "easy";
  if (year >= 1850) return "medium";
  return "hard";
}

async function fetchHumanHistoryTimeline(): Promise<TimelineRow[]> {
  const out: TimelineRow[] = [];
  const seen = new Set<string>();
  try {
    const index = await fetchJson<Array<{ name: string; download_url: string }>>(HUMAN_HISTORY_INDEX);
    for (const file of index) {
      if (!file.name.endsWith(".json") || !file.download_url) continue;
      const events = await fetchJson<
        Array<{ event: string; start?: { year: number }; end?: { year: number } }>
      >(file.download_url);
      let added = 0;
      for (const row of events) {
        const year = row.start?.year;
        if (!year || year < TIMELINE_YEAR_MIN || year > TIMELINE_YEAR_MAX) continue;
        const event = cleanTimelineEvent(row.event);
        if (!event || event.length < 8 || event.length > 120) continue;
        if (/^\d/.test(event)) continue;
        const key = `${year}|${event.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          event,
          year,
          rating: isMatureText(event) ? "mature" : "family",
          difficulty: timelineDifficulty(year),
        });
        added++;
        if (out.length >= TIMELINE_CAP) break;
      }
      console.log(`    all-of-human-history/${file.name}: +${added}`);
      await sleep(80);
      if (out.length >= TIMELINE_CAP) break;
    }
  } catch (e) {
    console.warn("    all-of-human-history failed:", e);
  }
  return out;
}

const OPEN_TRIVIA_QA_CATEGORIES: Array<{ slug: string; difficulty: Difficulty; max: number }> = [
  { slug: "for-kids", difficulty: "easy", max: 500 },
  { slug: "general", difficulty: "medium", max: 500 },
  { slug: "entertainment", difficulty: "medium", max: 400 },
  { slug: "geography", difficulty: "medium", max: 400 },
  { slug: "science-technology", difficulty: "hard", max: 400 },
  { slug: "history", difficulty: "hard", max: 300 },
  { slug: "sports", difficulty: "medium", max: 300 },
  { slug: "movies", difficulty: "medium", max: 300 },
];

type QuizRow = {
  question: string;
  choices: string[];
  correct: number;
  rating: Rating;
  difficulty: Difficulty;
};

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url}: ${res.status}`);
  return res.json() as Promise<T>;
}

async function fetchText(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url}: ${res.status}`);
  return res.text();
}

function parseOpenTriviaQA(text: string, difficulty: Difficulty): QuizRow[] {
  const results: QuizRow[] = [];
  const blocks = text.split(/\n(?=#Q)/);
  for (const block of blocks) {
    const lines = block.trim().split("\n").filter(Boolean);
    if (!lines[0]?.startsWith("#Q")) continue;
    const question = lines[0].replace(/^#Q\s*/, "").trim();
    if (!question) continue;

    const choiceLines = lines.filter((l) => /^[A-D]\s/.test(l));
    if (choiceLines.length < 2) continue;
    const choices = choiceLines.map((l) => l.slice(2).trim()).filter(Boolean);
    if (choices.length < 2) continue;

    const marker = lines.find((l) => l.startsWith("^"));
    let correct = 0;
    if (marker) {
      const answer = marker.replace(/^\^\s*/, "").trim();
      const idx = choices.findIndex((c) => c === answer);
      correct = idx >= 0 ? idx : 0;
    }

    results.push({ question, choices, correct, rating: "family", difficulty });
  }
  return results;
}

async function fetchOpenTriviaQABulk(): Promise<QuizRow[]> {
  const out: QuizRow[] = [];
  const seen = new Set<string>();
  for (const { slug, difficulty, max } of OPEN_TRIVIA_QA_CATEGORIES) {
    try {
      const text = await fetchText(`${OPEN_TRIVIA_QA_BASE}/${slug}`);
      const parsed = parseOpenTriviaQA(text, difficulty);
      let added = 0;
      for (const row of parsed) {
        const key = row.question.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(row);
        added++;
        if (added >= max) break;
      }
      console.log(`    OpenTriviaQA/${slug}: +${added}`);
      await sleep(200);
    } catch (e) {
      console.warn(`    OpenTriviaQA/${slug} failed:`, e);
    }
  }
  return out;
}

function flattenPqWords(
  root: Record<string, unknown>,
  tiers: Difficulty[] = ["easy", "medium"],
): Array<{ word: string; difficulty: Difficulty }> {
  const out: Array<{ word: string; difficulty: Difficulty }> = [];
  function walk(obj: unknown, difficulty: Difficulty) {
    if (Array.isArray(obj)) {
      for (const w of obj) {
        if (typeof w === "string" && w.length >= 3 && w.length <= 35 && /^[a-zA-Z][a-zA-Z\s'-]*$/.test(w)) {
          out.push({ word: w.trim(), difficulty });
        }
      }
      return;
    }
    if (obj && typeof obj === "object") {
      for (const v of Object.values(obj)) walk(v, difficulty);
    }
  }
  const nouns = root.nouns as Record<string, unknown> | undefined;
  if (!nouns) return out;
  for (const tier of tiers) {
    if (nouns[tier]) walk(nouns[tier], tier);
  }
  return out;
}

async function fetchBulkSources(): Promise<{
  quiz: QuizRow[];
  witShowdown: Array<{ text: string; rating: Rating; difficulty?: Difficulty }>;
  hotSeat: Array<{ text: string; rating: Rating; difficulty?: Difficulty }>;
  caption: Array<{ text: string; rating: Rating; difficulty?: Difficulty }>;
  wyr: Array<{ a: string; b: string; rating: Rating; difficulty: Difficulty }>;
  drawWords: Array<{ word: string; rating: Rating; difficulty: Difficulty }>;
  charadesWords: Array<{ word: string; rating: Rating; difficulty: Difficulty }>;
  bracketCategories: Array<{ name: string; rating: Rating; difficulty: Difficulty }>;
  timeline: TimelineRow[];
  dictionaryWords: string[];
}> {
  console.log("  fetching bulk static datasets…");

  const quiz: QuizRow[] = [];
  const wit-showdown: Array<{ text: string; rating: Rating; difficulty?: Difficulty }> = [];
  const hotSeat: Array<{ text: string; rating: Rating; difficulty?: Difficulty }> = [];
  const caption: Array<{ text: string; rating: Rating; difficulty?: Difficulty }> = [];
  const wyr: Array<{ a: string; b: string; rating: Rating; difficulty: Difficulty }> = [];
  const drawWords: Array<{ word: string; rating: Rating; difficulty: Difficulty }> = [];
  const charadesWords: Array<{ word: string; rating: Rating; difficulty: Difficulty }> = [];
  const bracketCategories: Array<{ name: string; rating: Rating; difficulty: Difficulty }> = [
    ...loadCuratedBracketTopics(),
  ];
  let dictionaryWords: string[] = [];

  const timeline = await fetchHumanHistoryTimeline();
  console.log(`    timeline events: +${timeline.length}`);

  // party-game-sentences (MIT)
  try {
    const pgsTrivia = await fetchJson<
      Array<{
        sentence: string;
        correct: string;
        choices: string[];
        difficulty?: string;
        category?: string;
      }>
    >(`${PGS_BASE}/trivia.json`);
    for (const row of pgsTrivia) {
      const choices = shuffle([...row.choices]);
      const correct = choices.indexOf(row.correct);
      if (correct < 0) continue;
      const diff = (row.difficulty?.toLowerCase() as Difficulty) || "medium";
      quiz.push({
        question: row.sentence,
        choices,
        correct,
        rating: "family",
        difficulty: diff === "easy" || diff === "hard" ? diff : "medium",
      });
    }
    console.log(`    party-game-sentences trivia: +${pgsTrivia.length}`);

    const pgsWyr = await fetchJson<Array<[string, string] | { a: string; b: string }>>(
      `${PGS_BASE}/would-you-rather.json`,
    );
    for (const row of pgsWyr) {
      const a = Array.isArray(row) ? row[0] : row.a;
      const b = Array.isArray(row) ? row[1] : row.b;
      if (!a || !b) continue;
      const rating: Rating = isMatureText(`${a} ${b}`) ? "mature" : "family";
      wyr.push({ a, b, rating, difficulty: "medium" });
    }
    console.log(`    party-game-sentences WYR: +${pgsWyr.length}`);

    const pgsNhie = await fetchJson<string[]>(`${PGS_BASE}/never-have-i-ever.json`);
    for (const sentence of pgsNhie) {
      const text = sentence.replace(/^Never have I ever /i, "").trim();
      const rating: Rating = isMatureText(text) ? "mature" : "family";
      wit-showdown.push(promptEntry(diversifyNhieStatement(sentence, wit-showdown.length), rating));
      hotSeat.push(promptEntry(adaptTruthToHotSeat(text), rating));
    }
    console.log(`    party-game-sentences NHIE: +${pgsNhie.length}`);

    const pgsTod = await fetchJson<{ truth?: string[]; dare?: string[] }>(`${PGS_BASE}/truth-or-dare.json`);
    for (const truth of pgsTod.truth ?? []) {
      const rating: Rating = isMatureText(truth) ? "mature" : "family";
      wit-showdown.push(promptEntry(adaptTruthToWitShowdown(truth), rating));
      hotSeat.push(promptEntry(adaptTruthToHotSeat(truth), rating));
    }
    for (const dare of pgsTod.dare ?? []) {
      const rating: Rating = isMatureText(dare) ? "mature" : "family";
      caption.push(promptEntry(adaptDareToCaption(dare), rating));
      const word = adaptDareToDraw(dare);
      if (word) drawWords.push(wordEntry(word, rating, "medium"));
      if (word) charadesWords.push(wordEntry(word, rating, "medium"));
    }
    console.log(
      `    party-game-sentences TOD: +${(pgsTod.truth?.length ?? 0) + (pgsTod.dare?.length ?? 0)}`,
    );
  } catch (e) {
    console.warn("    party-game-sentences failed:", e);
  }

  // OpenTriviaQA bulk (CC BY-SA 4.0)
  const oaQuiz = await fetchOpenTriviaQABulk();
  quiz.push(...oaQuiz);

  // party-game-word-lists
  try {
    const lists = await fetchJson<{
      categories: Record<string, { name: string; words: string[] }>;
    }>(PARTY_WORD_LISTS_URL);
    for (const cat of Object.values(lists.categories)) {
      bracketCategories.push(categoryEntry(cat.name, "family", "medium"));
      for (const word of cat.words) {
        charadesWords.push(wordEntry(word, "family", "medium"));
        if (word.split(/\s+/).length <= 2) {
          drawWords.push(
            wordEntry(word, "family", word.length <= 6 ? "easy" : "medium"),
          );
        }
      }
    }
    console.log(
      `    party-game-word-lists: +${Object.keys(lists.categories).length} categories`,
    );
  } catch (e) {
    console.warn("    party-game-word-lists failed:", e);
  }

  // pq-words
  try {
    const pq = await fetchJson<Record<string, unknown>>(PQ_WORDS_URL);
    const flat = flattenPqWords(pq);
    for (const { word, difficulty } of flat) {
      drawWords.push(wordEntry(word, "family", difficulty));
      charadesWords.push(wordEntry(word, "family", difficulty));
    }
    console.log(`    pq-words: +${flat.length} words`);
  } catch (e) {
    console.warn("    pq-words failed:", e);
  }

  // dwyl english-words subset for Word Rush dictionary (capped for bundle size)
  const DICTIONARY_CAP = 12000;
  try {
    const text = await fetchText(DWYL_WORDS_URL);
    dictionaryWords = text
      .split("\n")
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length >= 4 && w.length <= 10 && /^[a-z]+$/.test(w))
      .slice(0, DICTIONARY_CAP);
    console.log(`    dwyl/english-words: +${dictionaryWords.length} (filtered, cap ${DICTIONARY_CAP})`);
  } catch (e) {
    console.warn("    dwyl/english-words failed:", e);
  }

  return {
    quiz,
    wit-showdown,
    hotSeat,
    caption,
    wyr,
    drawWords,
    charadesWords,
    bracketCategories,
    timeline,
    dictionaryWords,
  };
}

async function fetchOpenTdb(): Promise<
  Array<{ question: string; choices: string[]; correct: number; rating: Rating; difficulty: Difficulty }>
> {
  const results: Array<{
    question: string;
    choices: string[];
    correct: number;
    rating: Rating;
    difficulty: Difficulty;
  }> = [];
  const seen = new Set<string>();
  let token: string | undefined;

  try {
    const tokenRes = await fetch("https://opentdb.com/api_token.php?command=request");
    const tokenJson = (await tokenRes.json()) as { token?: string };
    token = tokenJson.token;
    if (token) {
      await fetch(`https://opentdb.com/api_token.php?command=reset&token=${token}`);
    }
  } catch {
    console.warn("  OpenTDB token request failed — skipping live fetch");
    return results;
  }

  for (const difficulty of ["easy", "medium", "hard"] as Difficulty[]) {
    for (let page = 0; page < 20; page++) {
      const url = new URL("https://opentdb.com/api.php");
      url.searchParams.set("amount", "50");
      url.searchParams.set("type", "multiple");
      url.searchParams.set("difficulty", difficulty);
      if (token) url.searchParams.set("token", token);

      try {
        const res = await fetch(url);
        const json = (await res.json()) as {
          response_code: number;
          results?: Array<{
            question: string;
            correct_answer: string;
            incorrect_answers: string[];
            difficulty: string;
          }>;
        };
        if (json.response_code !== 0 || !json.results?.length) break;

        for (const row of json.results) {
          const question = decodeHtml(row.question);
          if (seen.has(question)) continue;
          seen.add(question);
          const correct = decodeHtml(row.correct_answer);
          const incorrect = row.incorrect_answers.map(decodeHtml);
          const choices = shuffle([correct, ...incorrect]);
          const correctIndex = choices.indexOf(correct);
          results.push({
            question,
            choices,
            correct: correctIndex,
            rating: "family",
            difficulty,
          });
        }
        await sleep(1200);
      } catch (e) {
        console.warn(`  OpenTDB fetch error (${difficulty}):`, e);
        break;
      }
    }
  }
  return results;
}

function decodeHtml(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ");
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function harvestTruthOrDare(
  endpoint: string,
  rating: string,
  max = 200,
): Promise<Array<{ text: string; rating: Rating }>> {
  const out: Array<{ text: string; rating: Rating }> = [];
  const seen = new Set<string>();
  for (let i = 0; i < max; i++) {
    try {
      const url = `https://api.truthordarebot.xyz${endpoint}?rating=${rating}`;
      const res = await fetch(url);
      if (!res.ok) break;
      const json = (await res.json()) as { question?: string };
      const text = json.question?.trim();
      if (!text || seen.has(text)) continue;
      seen.add(text);
      out.push({
        text,
        rating: rating.toLowerCase() === "r" ? "mature" : "family",
      });
      await sleep(400);
    } catch {
      break;
    }
  }
  return out;
}

async function harvestNhie(category: string, max = 150): Promise<Array<{ text: string; rating: Rating }>> {
  const out: Array<{ text: string; rating: Rating }> = [];
  const seen = new Set<string>();
  let lastId: string | undefined;
  for (let i = 0; i < max; i++) {
    try {
      const url = new URL("https://api.nhie.io/v2/statements/next");
      url.searchParams.set("category", category);
      if (lastId) url.searchParams.set("statement_id", lastId);
      const res = await fetch(url);
      if (!res.ok) break;
      const json = (await res.json()) as { ID?: string; statement?: string };
      if (!json.statement || seen.has(json.statement)) break;
      seen.add(json.statement);
      lastId = json.ID;
      const rating: Rating = category === "offensive" ? "mature" : category === "delicate" ? "mature" : "family";
      out.push({ text: json.statement.replace(/^Never have I ever /i, "").trim(), rating });
      await sleep(200);
    } catch {
      break;
    }
  }
  return out;
}

function adaptTruthToHotSeat(text: string): string {
  const t = text.replace(/\?+$/, "").trim();
  if (/^have you/i.test(t)) return `Their ${t.replace(/^have you /i, "").toLowerCase()}`;
  if (/^what/i.test(t)) return `Their ${t.toLowerCase()}`;
  return `What they'd say about: ${t}`;
}

function adaptTruthToWitShowdown(text: string): string {
  const t = text.replace(/\?+$/, "").trim();
  if (t.length < 80) return t;
  return t.slice(0, 77) + "...";
}

function adaptDareToCaption(text: string): string {
  return `Caption for someone who ${text.replace(/\.$/, "").toLowerCase()}`;
}

function adaptDareToDraw(text: string): string {
  const t = text.replace(/\.$/, "").trim();
  return t.length > 40 ? t.slice(0, 40) : t;
}

async function main() {
  const localOnly = process.argv.includes("--local-only");
  console.log(localOnly ? "Tagging local content (no API harvest)…" : "Importing party game content…");

  // --- Fibbage: strip placeholder truths and fix ratings ---
  function cleanFactCheckPool(
    rows: Array<{ prompt?: string; truth: string; rating?: Rating; difficulty?: Difficulty }>,
  ) {
    const seenTruths = new Set<string>();
    let keptTherapistJoke = false;
    const out: Array<{ prompt: string; truth: string; rating: Rating; difficulty: Difficulty }> = [];

    for (const row of rows) {
      if (!row.prompt?.trim()) continue;
      const truth = row.truth.trim();
      const prompt = row.prompt.trim();

      if (!isFactCheckTruthValid(prompt, truth)) continue;
      if (looksLikeGeneratedFactCheckTruth(truth)) continue;
      if (looksLikeConvertedNhieFactCheck(prompt)) continue;
      if (truth.length > 90) continue;

      if (isPlaceholderTruth(truth)) {
        if (!keptTherapistJoke && prompt.includes("worst thing to yell during a quiet movie")) {
          keptTherapistJoke = true;
        } else {
          continue;
        }
      }

      const rating: Rating =
        row.rating === "mature" || row.rating === "family"
          ? row.rating
          : isMatureText(`${prompt} ${truth}`)
            ? "mature"
            : "family";

      const truthKey = truth.toLowerCase();
      if (seenTruths.has(truthKey)) continue;
      seenTruths.add(truthKey);

      out.push({
        prompt,
        truth,
        rating,
        difficulty: row.difficulty ?? "medium",
      });
    }

    const dupeRate = duplicateTruthRate(out.map((r) => r.truth));
    console.log(`  factCheck: ${out.length} entries, duplicate truth rate ${(dupeRate * 100).toFixed(1)}%`);
    return out;
  }

  const fact-checkRaw = readJson<Array<{ prompt?: string; truth: string; rating?: Rating; difficulty?: Difficulty }>>(
    "prompts/fact-check.json",
  );

  // --- Migrate string arrays to PromptEntry ---
  function migratePrompts(rel: string) {
    const raw = readJson<string[] | Array<{ text: string }>>(rel);
    const entries = raw.map((row) => {
      const text = typeof row === "string" ? row : row.text;
      return promptEntry(text, isMatureText(text) ? "mature" : "family");
    });
    writeJson(rel, entries);
    return entries;
  }

  migratePrompts("prompts/wit-showdown.json");
  migratePrompts("prompts/caption.json");
  migratePrompts("prompts/hot-seat.json");

  function finalizeFactCheckPool(
    rows: Array<{ prompt?: string; truth: string; rating?: Rating; difficulty?: Difficulty }>,
  ) {
    let pool = cleanFactCheckPool(rows);
    if (pool.length < MIN_CONTENT_POOL_SIZE) {
      console.warn(
        `  fact-check pool ${pool.length} below minimum ${MIN_CONTENT_POOL_SIZE} (not filling with generated facts)`,
      );
    }
    pool = cleanFactCheckPool(pool);
    if (pool.length < MIN_CONTENT_POOL_SIZE) {
      console.warn(`  fact-check pool ${pool.length} below minimum ${MIN_CONTENT_POOL_SIZE}`);
    }
    return pool;
  }

  writeJson("prompts/fact-check.json", finalizeFactCheckPool(fact-checkRaw));

  // --- Quiz: bulk datasets + OpenTDB + existing ---
  const existingQuiz = readJson<Array<{ question: string; choices: string[]; correct: number }>>("trivia/quiz.json");
  const taggedExisting = existingQuiz.map((q) => ({
    ...q,
    rating: "family" as Rating,
    difficulty: "medium" as Difficulty,
  }));
  const bulk = localOnly ? null : await fetchBulkSources();
  console.log("  fetching OpenTDB…");
  const openTdb = localOnly ? [] : await fetchOpenTdb();
  const quizMap = new Map<string, QuizRow>();
  for (const q of [...taggedExisting, ...(bulk?.quiz ?? []), ...openTdb]) {
    quizMap.set(q.question, q);
  }
  const mergedQuiz = [...quizMap.values()];
  writeJson("trivia/quiz.json", mergedQuiz);

  // --- Timeline ---
  const timelineRaw = readJson<Array<{ event: string; year: number }>>("trivia/timeline.json");
  writeJson(
    "trivia/timeline.json",
    timelineRaw.map((row) => ({
      ...row,
      rating: "family",
      difficulty: row.year >= 1950 ? "easy" : row.year >= 1800 ? "medium" : "hard",
    })),
  );

  // --- WYR ---
  const wyrRaw = readJson<Array<{ a: string; b: string } | [string, string]>>("would-you-rather.json");
  writeJson(
    "would-you-rather.json",
    wyrRaw.map((row) => {
      const a = Array.isArray(row) ? row[0] : row.a;
      const b = Array.isArray(row) ? row[1] : row.b;
      return {
        a,
        b,
        rating: isMatureText(`${a} ${b}`) ? "mature" : "family",
        difficulty: "medium",
      };
    }),
  );

  // --- Words ---
  const drawRaw = readJson<string[] | Array<{ word: string }>>("words/draw.json");
  writeJson(
    "words/draw.json",
    drawRaw.map((w) => {
      const text = wordText(w);
      return wordEntry(text, "family", text.length <= 6 ? "easy" : "medium");
    }),
  );

  const charadesRaw = readJson<string[] | Array<{ word: string }>>("words/charades.json");
  writeJson(
    "words/charades.json",
    charadesRaw.map((w) => wordEntry(wordText(w), "family", "medium")),
  );

  const bracketRaw = readJson<string[] | Array<{ name: string }>>("categories/bracket.json");
  writeJson(
    "categories/bracket.json",
    dedupeCategories([
      ...bracketRaw.map((name) => {
        const text = categoryText(name);
        return categoryEntry(text, isMatureText(text) ? "mature" : "family", "medium");
      }),
      ...loadCuratedBracketTopics(),
    ]),
  );

  // --- Merge bulk static datasets ---
  if (bulk) {
    writeJson(
      "prompts/wit-showdown.json",
      dedupePrompts([...readJson("prompts/wit-showdown.json"), ...bulk.wit-showdown]),
    );
    writeJson(
      "prompts/hot-seat.json",
      dedupePrompts([...readJson("prompts/hot-seat.json"), ...bulk.hotSeat]),
    );
    writeJson(
      "prompts/caption.json",
      dedupePrompts([...readJson("prompts/caption.json"), ...bulk.caption]),
    );
    writeJson(
      "would-you-rather.json",
      dedupeWyr([...readJson("would-you-rather.json"), ...bulk.wyr]),
    );
    writeJson(
      "words/draw.json",
      dedupeWords([...readJson("words/draw.json"), ...bulk.drawWords]),
    );
    writeJson(
      "words/charades.json",
      dedupeWords([...readJson("words/charades.json"), ...bulk.charadesWords]),
    );
    writeJson(
      "categories/bracket.json",
      dedupeCategories([...readJson("categories/bracket.json"), ...bulk.bracketCategories]),
    );
    writeJson(
      "trivia/timeline.json",
      dedupeTimeline([...readJson("trivia/timeline.json"), ...bulk.timeline]),
    );
    if (bulk.dictionaryWords.length > 0) {
      const dictPath = join(CONTENT, "words/dictionary.txt");
      const extra = [
        "party", "game", "quiz", "trivia", "draw", "guess", "vote", "host", "join",
        "phone", "screen", "pizza", "taco", "music", "dance", "sing", "laugh", "joke",
      ];
      const merged = [...new Set([...bulk.dictionaryWords, ...extra])].sort();
      writeFileSync(dictPath, merged.join(","), "utf8");
      writeFileSync(join(CONTENT, "words/dictionary.json"), JSON.stringify(merged) + "\n", "utf8");
      console.log(`  wrote words/dictionary.txt (${merged.length} words)`);
    }
  }

  function rebuildReverseFacts() {
    const quizRows = readJson<QuizRow[]>("trivia/quiz.json");
    const reverseFromQuiz = buildReverseFactsFromQuiz(quizRows, "family");
    const reversePool = filterRepetitiveTruths(
      reverseFromQuiz.filter((row) => !isReverseFactTrivial(row.fact, row.truth)),
    );
    const reverseSeen = new Set<string>();
    const reverseDeduped = reversePool.filter((row) => {
      const k = row.fact.toLowerCase();
      if (reverseSeen.has(k)) return false;
      reverseSeen.add(k);
      return true;
    });
    if (reverseDeduped.length < MIN_CONTENT_POOL_SIZE) {
      console.warn(`  reverse facts pool only ${reverseDeduped.length} entries (target ${MIN_CONTENT_POOL_SIZE}+)`);
    } else {
      console.log(`  reverse facts: ${reverseDeduped.length} entries (quiz ${reverseFromQuiz.length})`);
    }
    writeJson("prompts/reverse-fact.json", reverseDeduped);
  }

  rebuildReverseFacts();

  // --- Harvest mature content ---
  if (localOnly) {
    console.log("  skipping API harvest (--local-only)");
    console.log("Done (local only). Run without --local-only to fetch OpenTDB + mature APIs.");
    return;
  }

  console.log("  harvesting TruthOrDareBot + nhie.io…");
  const truthsR = await harvestTruthOrDare("/v1/truth", "r", 150);
  const truthsPg13 = await harvestTruthOrDare("/v1/truth", "pg13", 100);
  const daresR = await harvestTruthOrDare("/api/dare", "r", 100);
  const wyrR = await harvestTruthOrDare("/api/wyr", "r", 200);
  const nhieOffensive = await harvestNhie("offensive", 120);
  const nhieDelicate = await harvestNhie("delicate", 80);

  const matureTruths = [...truthsR, ...truthsPg13];
  const matureWyrFromApi = wyrR.map((row) => {
    const parts = row.text.split(/\s+or\s+/i);
    if (parts.length >= 2) {
      return {
        a: parts[0].trim(),
        b: parts[1].replace(/\?+$/, "").trim(),
        rating: "mature" as Rating,
        difficulty: "medium" as Difficulty,
      };
    }
    return null;
  }).filter(Boolean);

  // Extend pools (read current files — bulk merge may have run above)
  const wit-showdownExtended = rebalanceWitShowdownPrefixes(
    dedupePrompts([
      ...readJson<Array<{ text: string }>>("prompts/wit-showdown.json"),
      ...matureTruths.map((t) => promptEntry(adaptTruthToWitShowdown(t.text), "mature")),
      ...nhieOffensive.map((t, i) =>
        promptEntry(diversifyNhieStatement(t.text, i + 100), "mature"),
      ),
    ]),
  );
  writeJson("prompts/wit-showdown.json", wit-showdownExtended);

  const hotSeatExtended = [
    ...readJson<Array<{ text: string }>>("prompts/hot-seat.json"),
    ...matureTruths.map((t) => promptEntry(adaptTruthToHotSeat(t.text), "mature")),
  ];
  writeJson("prompts/hot-seat.json", dedupePrompts(hotSeatExtended));

  const captionExtended = [
    ...readJson<Array<{ text: string }>>("prompts/caption.json"),
    ...daresR.map((d) => promptEntry(adaptDareToCaption(d.text), "mature")),
  ];
  writeJson("prompts/caption.json", dedupePrompts(captionExtended));

  const currentFibbage = readJson<Array<{ prompt?: string; truth: string; rating?: Rating; difficulty?: Difficulty }>>(
    "prompts/fact-check.json",
  );
  const fact-checkExtended = [
    ...currentFibbage
      .filter((row) => row.prompt && isFactCheckTruthValid(row.prompt, row.truth) && !looksLikeGeneratedFactCheckTruth(row.truth))
      .map((row, i) => ({
        prompt: row.prompt!,
        truth: row.truth,
        rating: row.rating ?? "family",
        difficulty: row.difficulty ?? ((i % 2 === 0 ? "easy" : "medium") as Difficulty),
      })),

  ];
  writeJson("prompts/fact-check.json", finalizeFactCheckPool(fact-checkExtended));

  const drawExtended = [
    ...readJson<Array<{ word: unknown }>>("words/draw.json").map((w) => {
      const text = wordText(w);
      return wordEntry(text, "family", text.length <= 6 ? "easy" : "medium");
    }),
    ...daresR.map((d) => wordEntry(adaptDareToDraw(d.text), "mature", "hard")),
  ];
  writeJson("words/draw.json", dedupeWords(drawExtended));

  const charadesExtended = [
    ...readJson<Array<{ word: unknown }>>("words/charades.json").map((w) =>
      wordEntry(wordText(w), "family", "medium"),
    ),
    ...daresR.slice(0, 40).map((d) => wordEntry(adaptDareToDraw(d.text), "mature", "hard")),
  ];
  writeJson("words/charades.json", dedupeWords(charadesExtended));

  const wyrExtended = [
    ...readJson<Array<{ a: string; b: string; rating?: Rating; difficulty?: Difficulty }>>(
      "would-you-rather.json",
    ),
    ...matureWyrFromApi,
  ];
  writeJson("would-you-rather.json", dedupeWyr(wyrExtended));

  const bracketExtended = [
    ...readJson<Array<{ name: unknown }>>("categories/bracket.json").map((name) =>
      categoryEntry(categoryText(name), "family", "medium"),
    ),
    categoryEntry("embarrassing confessions", "mature", "medium"),
    categoryEntry("dating disasters", "mature", "medium"),
    categoryEntry("worst ex stories", "mature", "hard"),
  ];
  writeJson("categories/bracket.json", dedupeCategories(bracketExtended));

  function tagMatureQuiz(
    items: Array<{
      question: string;
      choices: string[];
      correct: number;
      rating?: Rating;
      difficulty?: Difficulty;
    }>,
  ) {
    return items.filter((q) => {
      const choices = q.choices.map((c) => c.trim().toLowerCase());
      const yesNoOnly =
        choices.length <= 4 && choices.every((c) => ["yes", "no", "maybe", "no comment"].includes(c));
      const confession = /^(have you|did you|do you|are you|what's your|what is your)/i.test(q.question);
      if (yesNoOnly && confession) return false;
      return true;
    }).map((q) => ({
      ...q,
      rating:
        q.rating === "mature" || isMatureText(`${q.question} ${q.choices.join(" ")}`)
          ? ("mature" as Rating)
          : (q.rating ?? "family"),
    }));
  }

  writeJson("trivia/quiz.json", tagMatureQuiz(dedupeQuiz([...readJson("trivia/quiz.json")])));

  rebuildReverseFacts();

  // Expand dictionary from existing + common words (if bulk did not already write it)
  if (!bulk?.dictionaryWords.length) {
    const dictPath = join(CONTENT, "words/dictionary.txt");
    let dictWords = existsSync(dictPath)
      ? readFileSync(dictPath, "utf8").split(",").map((w) => w.trim().toLowerCase()).filter(Boolean)
      : [];
    const extra = [
      "party", "game", "quiz", "trivia", "draw", "guess", "vote", "host", "join",
      "phone", "screen", "pizza", "taco", "music", "dance", "sing", "laugh", "joke",
    ];
    dictWords = [...new Set([...dictWords, ...extra])].sort();
    writeFileSync(dictPath, dictWords.join(","), "utf8");
    writeFileSync(join(CONTENT, "words/dictionary.json"), JSON.stringify(dictWords) + "\n", "utf8");
    console.log(`  wrote words/dictionary.txt (${dictWords.length} words)`);
  }

  const fact-checkFinal = readJson<Array<{ truth: string }>>("prompts/fact-check.json");
  const fact-checkTexts = fact-checkFinal.map((r) => r.truth);
  console.log(
    `  quality report: fact-check dupes ${(duplicateTruthRate(fact-checkTexts) * 100).toFixed(1)}%, ordered ${(orderedSequenceRatio(fact-checkTexts) * 100).toFixed(1)}%`,
  );

  console.log("Done.");
}

function dedupeTimeline(items: TimelineRow[]) {
  const seen = new Set<string>();
  return items.filter((p) => {
    const k = `${p.year}|${p.event.toLowerCase()}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function dedupePrompts(items: Array<{ text: string; rating?: Rating; difficulty?: Difficulty }>) {
  const seen = new Set<string>();
  return items.filter((p) => {
    const k = p.text.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function dedupeWords(items: Array<{ word: string; rating?: Rating; difficulty?: Difficulty }>) {
  const seen = new Set<string>();
  return items.filter((p) => {
    const k = typeof p.word === "string" ? p.word.toLowerCase().trim() : "";
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function dedupeCategories(items: Array<{ name: string; rating?: Rating; difficulty?: Difficulty }>) {
  const map = new Map<string, { name: string; rating?: Rating; difficulty?: Difficulty }>();
  for (const p of items) {
    const k = typeof p.name === "string" ? p.name.toLowerCase().trim() : "";
    if (!k) continue;
    const existing = map.get(k);
    if (!existing || (p.rating === "mature" && existing.rating !== "mature")) {
      map.set(k, p);
    }
  }
  return [...map.values()];
}

function dedupeWyr(
  items: Array<{ a: string; b: string; rating?: Rating; difficulty?: Difficulty }>,
) {
  const seen = new Set<string>();
  return items.filter((p) => {
    const k = `${p.a}|${p.b}`.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function dedupeQuiz(
  items: Array<{
    question: string;
    choices: string[];
    correct: number;
    rating?: Rating;
    difficulty?: Difficulty;
  }>,
) {
  const seen = new Set<string>();
  return items.filter((p) => {
    const k = p.question.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
