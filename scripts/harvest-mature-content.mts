/**
 * Fill 18+ pools with spicy curated adult content and sanitize family/mature splits.
 * Sources: mature-curated.json, mature-curated-games.json, TruthOrDareBot, nhie.io.
 *
 * Run: pnpm harvest-mature
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  containsMatureKeywords,
  diversifyNhieStatement,
  filterRepetitiveTruths,
  isFactCheckTruthValid,
  isSpicyBracketName,
  isSpicyDrawWord,
  isSpicyFactCheckPair,
  isSpicyPrompt,
  isSpicyQuizRow,
  isMatureCultureContent,
  isSpicyTimelineEvent,
  isSpicyWyrPair,
  rebalancePunchlinePrefixes,
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

const ADULT_THEME =
  /\b(budweiser|heineken|guinness|stella artois|brewery|bourbon|tequila|vodka|whiskey|whisky|scotch|speakeasy|prohibition|playboy|blackjack|roulette|casino|hangover|pale ale|india pale|distillery|moonshine|absinthe|negroni|margarita|mojito|bloody mary|martini|open bar|minibar|bartender|cocktail|sommelier|ipa|alcopop|drunk driving|dui|beer pong|wine tasting)\b/i;
const SKIP_RETAG =
  /\b(gin rummy|casino royale|movie cocktail|film cocktail|god of wine|dionysus|bacchus)\b/i;
const WEAK_COCKTAIL_ANSWER =
  /^(ordinary drink|cocktail|shot|beer|coffee \/ tea|homemade liqueur|punch \/ party drink|other\/unknown|soft drink \/ soda)$/i;

const STATIC_COCKTAIL_ROWS: Array<[string, string[], number]> = [
  ["What is the main spirit in a Mojito?", ["Rum", "Vodka", "Gin", "Tequila"], 0],
  ["What is the main spirit in a Margarita?", ["Tequila", "Rum", "Gin", "Vodka"], 0],
  ["What is the main spirit in an Old Fashioned?", ["Whiskey", "Gin", "Rum", "Tequila"], 0],
  ["A classic Negroni is built on which spirit?", ["Gin", "Vodka", "Rum", "Tequila"], 0],
  ["What is the main spirit in a Manhattan?", ["Whiskey", "Gin", "Vodka", "Rum"], 0],
  ["What is the main spirit in a Daiquiri?", ["Rum", "Vodka", "Gin", "Tequila"], 0],
  ["A classic dry Martini is built on which spirit?", ["Gin", "Vodka", "Rum", "Whiskey"], 0],
  ["What is the main spirit in a Bloody Mary?", ["Vodka", "Gin", "Rum", "Tequila"], 0],
  ["What is the main spirit in a Piña Colada?", ["Rum", "Vodka", "Gin", "Tequila"], 0],
  ["What is the main spirit in an Espresso Martini?", ["Vodka", "Gin", "Rum", "Whiskey"], 0],
  ["What is the main spirit in a Whiskey Sour?", ["Whiskey", "Gin", "Rum", "Tequila"], 0],
  ["What is the main spirit in a Cosmopolitan?", ["Vodka", "Gin", "Rum", "Tequila"], 0],
  ["What is the main spirit in a Moscow Mule?", ["Vodka", "Gin", "Rum", "Tequila"], 0],
  ["A French 75 is built on which spirit plus champagne?", ["Gin", "Vodka", "Rum", "Tequila"], 0],
  ["Irish Coffee is coffee mixed with which spirit?", ["Whiskey", "Rum", "Gin", "Vodka"], 0],
  ["A Mimosa is typically champagne and which juice?", ["Orange", "Cranberry", "Pineapple", "Tomato"], 0],
  ["A Bellini is sparkling wine mixed with which fruit puree?", ["Peach", "Strawberry", "Mango", "Banana"], 0],
  ["A Dark 'n' Stormy is rum mixed with what?", ["Ginger beer", "Tonic", "Cola", "Soda water"], 0],
  ["What is the main spirit in a Paloma?", ["Tequila", "Rum", "Gin", "Vodka"], 0],
  ["A Tom Collins is built on which spirit?", ["Gin", "Vodka", "Rum", "Tequila"], 0],
  ["A Gin and Tonic is gin mixed with what?", ["Tonic water", "Soda water", "Ginger ale", "Cola"], 0],
  ["What is the main spirit in a Tequila Sunrise?", ["Tequila", "Rum", "Vodka", "Gin"], 0],
  ["A White Russian is vodka, coffee liqueur, and what?", ["Cream", "Egg white", "Honey", "Mint"], 0],
  ["A Screwdriver is vodka mixed with which juice?", ["Orange", "Cranberry", "Grapefruit", "Tomato"], 0],
  ["A Cuba Libre is rum mixed with what?", ["Cola", "Tonic", "Ginger beer", "Soda water"], 0],
  ["What is the main spirit in a Mai Tai?", ["Rum", "Vodka", "Gin", "Tequila"], 0],
  ["A Sidecar is built on which spirit?", ["Cognac", "Gin", "Vodka", "Tequila"], 0],
  ["A Mint Julep is built on which spirit?", ["Bourbon", "Gin", "Rum", "Vodka"], 0],
  ["A Caipirinha is built on which spirit?", ["Cachaça", "Rum", "Tequila", "Vodka"], 0],
  ["A Pisco Sour is built on which spirit?", ["Pisco", "Gin", "Rum", "Tequila"], 0],
  ["An Aperol Spritz is Aperol, soda, and what?", ["Prosecco", "Gin", "Tonic", "Cola"], 0],
  ["A Kir Royale is crème de cassis and what?", ["Champagne", "Gin", "Vodka", "Rum"], 0],
  ["A Boulevardier is whiskey, Campari, and what?", ["Sweet vermouth", "Tonic", "Soda", "Honey"], 0],
  ["A Last Word cocktail is built on which spirit?", ["Gin", "Vodka", "Rum", "Tequila"], 0],
  ["An Aviation cocktail is built on which spirit?", ["Gin", "Vodka", "Rum", "Whiskey"], 0],
  ["A Bee's Knees is gin, lemon, and what?", ["Honey", "Sugar", "Mint", "Cream"], 0],
  ["Ranch Water is tequila, soda, and which citrus?", ["Lime", "Orange", "Grapefruit", "Lemon"], 0],
  ["A Sazerac is traditionally built on which spirit?", ["Rye whiskey", "Gin", "Rum", "Vodka"], 0],
  ["Campari, sweet vermouth, and soda make which cocktail?", ["Americano", "Negroni", "Manhattan", "Spritz"], 0],
  ["A Long Island Iced Tea is famous for mixing several spirits with what?", ["Cola", "Tonic", "Ginger beer", "Cream"], 0],
];
const STATIC_COCKTAIL_QUIZ: QuizRow[] = STATIC_COCKTAIL_ROWS.map(([question, choices, correct]) => ({
  question,
  choices,
  correct,
  rating: "mature",
  difficulty: "medium",
}));

const CROWD_DRINK_FALLBACK = [
  "Mojito",
  "Margarita",
  "Old Fashioned",
  "Negroni",
  "Manhattan",
  "Daiquiri",
  "Martini",
  "Bloody Mary",
  "Piña Colada",
  "Espresso Martini",
  "Whiskey Sour",
  "Cosmopolitan",
  "Moscow Mule",
  "French 75",
  "Irish Coffee",
  "Mimosa",
  "Bellini",
  "Paloma",
  "Tom Collins",
  "Gin and Tonic",
  "Tequila Sunrise",
  "White Russian",
  "Screwdriver",
  "Cuba Libre",
  "Mai Tai",
  "Sidecar",
  "Mint Julep",
  "Caipirinha",
  "Pisco Sour",
  "Aperol Spritz",
  "Kir Royale",
  "Boulevardier",
  "Last Word",
  "Aviation",
  "Bee's Knees",
  "Ranch Water",
  "Sazerac",
  "Americano",
  "Long Island Iced Tea",
  "Dark and Stormy",
];

const CAPTION_SCENES = [
  "two exes stuck in the same elevator",
  "someone hiding behind a plant at a wedding",
  "a group chat screenshot projected at a party",
  "the last person still dancing at 3am",
  "a plus-one who knows nobody",
  "someone checking dating apps at a family dinner",
  "the office party karaoke mic",
  "a hotel hallway walk of almost-shame",
  "friends pretending they don't see the couple fighting",
  "someone Venmo-requesting an ex",
  "the open bar line at a reunion",
  "a toast that went too honest",
  "someone leaving a house party with the host's hoodie",
  "the morning-after brunch table of silence",
  "a rideshare with too much honesty",
  "the group pretending the situationship is fine",
  "someone unmuting the family chat by accident",
  "a dating-app meet-cute that is going poorly",
  "the coworker crush at the holiday party",
  "a plus-one eating cake alone",
  "friends ranking last night's decisions",
  "someone finding their own thirst trap on a TV",
  "the designated driver watching the chaos",
  "a wedding afterparty coat pile confession",
  "two people realizing they dated the same person",
  "the group chat naming the night's disaster",
  "someone trying to sneak out of a sleepover as an adult",
  "a bar tab nobody wants to split",
  "the last call stampede",
  "a hotel minibar crime scene",
  "friends hiding an ex's incoming call",
  "someone practicing a define-the-relationship speech",
  "the office Slack after the party",
  "a karaoke duet that is too much",
  "the leftover pizza conference at 4am",
  "someone googling 'is this a date'",
  "friends staging an intervention about a situationship",
  "a reunion nametag with an unfortunate nickname",
  "the shared-bathroom morning after a house party",
  "someone returning a hoodie via mailbox",
  "the screenshot that should not have been sent",
  "friends ranking red flags like it's trivia",
  "a wedding seating chart revenge placement",
  "the last person to learn they were the topic",
  "someone writing a toast that is actually a roast",
  "the bartender who knows too much",
  "a prenup conversation at a wine bar",
  "someone deleting their dating app in the bathroom",
  "the bachelor-party scavenger hunt",
  "a couple arguing over the Uber rating",
  "someone using a fake name at last call",
  "the friend who brought an ex as a plus-one",
  "a table of empty shot glasses and one water",
  "someone hiding their ring in a coat pocket",
  "the group reconstructing last night from photos",
  "a hotel elevator with yesterday's clothes",
  "someone tipping with leftover dating-app matches",
  "the afterparty that moved to a parking garage",
  "a voicemail that should have stayed unsent",
  "friends comparing hangover breakfast orders",
  "someone realizing the DJ played their song with an ex",
  "the coat-check ticket that started a rumor",
  "a rooftop smoker circle of confessions",
  "someone Googling the bar's closing time at 1am",
  "the friend who volunteered as designated adult",
];

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function shuffle<T>(arr: T[], seed = 9): T[] {
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
  const mature = Array.isArray(data) ? data.filter((r) => r && typeof r === "object" && r.rating === "mature").length : "?";
  console.log(`  wrote ${rel} (${n}, mature ${mature})`);
}

async function cachedFetchJson<T>(name: string, url: string): Promise<T | null> {
  mkdirSync(CACHE, { recursive: true });
  const path = join(CACHE, name);
  if (existsSync(path)) return JSON.parse(readFileSync(path, "utf8")) as T;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "PartyGames-mature-harvest/1.0" } });
    if (!res.ok) throw new Error(`${url} ${res.status}`);
    const json = (await res.json()) as T;
    writeFileSync(path, JSON.stringify(json));
    return json;
  } catch (e) {
    console.warn(`  skip ${name}:`, e instanceof Error ? e.message : e);
    return null;
  }
}

function mergeBy<T>(existing: T[], extra: T[], keyFn: (row: T) => string): T[] {
  const seen = new Set(existing.map(keyFn));
  const out = [...existing];
  for (const row of extra) {
    const k = keyFn(row);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(row);
  }
  return out;
}

const LEGACY_IMPOSTOR_PACKS = new Set([
  "nightlife",
  "after-hours",
  "dating-life",
  "morning-after",
  "bar-jobs",
  "wedding-chaos",
]);

type CuratedGames = {
  factCheck?: Array<{ prompt: string; truth: string }>;
  quiz?: Array<{ question: string; choices: string[]; correct: number }>;
  draw?: string[];
  bracket?: string[];
  timeline?: Array<{ event: string; year: number }>;
  impostor?: Array<{ id: string; label: string; rating: Rating; items: string[] }>;
  reverseFact?: Array<{ fact: string; truth: string }>;
  wyr?: Array<{ a: string; b: string }>;
  spectrum?: Array<{ left: string; right: string }>;
  splitRoom?: Array<{ text: string; labelA: string; labelB: string }>;
  friendSortRoles?: string[];
  crowdCall?: Array<{ text: string; choices: string[] }>;
};

function loadCuratedGames(): CuratedGames {
  const path = join(CONTENT, "prompts/mature-curated-games.json");
  if (!existsSync(path)) return {};
  return loadJson<CuratedGames>("prompts/mature-curated-games.json");
}

function fixFamilyLeaks<T extends { rating?: Rating }>(rows: T[], textFn: (row: T) => string): T[] {
  return rows.map((row) => {
    if ((row.rating ?? "family") !== "family") return row;
    const blob = textFn(row);
    if (containsMatureKeywords(blob) || isSpicyPrompt(blob)) {
      return { ...row, rating: "mature" as Rating };
    }
    return row;
  });
}

function pruneNonSpicyMature<T extends { rating?: Rating }>(
  rows: T[],
  isSpicy: (row: T) => boolean,
): T[] {
  return rows.map((row) => {
    if ((row.rating ?? "family") !== "mature") return row;
    return isSpicy(row) ? row : { ...row, rating: "family" as Rating };
  });
}

function parseWyr(question: string): [string, string] | null {
  const t = question.replace(/^would you rather\s+/i, "").replace(/\?+$/, "").trim();
  const parts = t.split(/\s+or\s+/i);
  if (parts.length !== 2) return null;
  const a = parts[0].trim();
  const b = parts[1].trim();
  if (a.length < 6 || b.length < 6 || a.length > 90 || b.length > 90) return null;
  return [a, b];
}

type TodRow = { id?: string; question?: string; rating?: string };

async function harvestTod(kind: string, max: number): Promise<string[]> {
  const cacheName = `tod-r-${kind}.json`;
  const cachePath = join(CACHE, cacheName);
  const out: string[] = existsSync(cachePath) ? (JSON.parse(readFileSync(cachePath, "utf8")) as string[]) : [];
  const seen = new Set(out.map((t) => t.toLowerCase()));
  if (out.length >= max) {
    console.log(`  TruthOrDareBot ${kind}: ${out.length} (cache)`);
    return out.slice(0, max);
  }
  let misses = 0;
  const url = kind === "truth"
    ? "https://api.truthordarebot.xyz/v1/truth?rating=r"
    : `https://api.truthordarebot.xyz/api/${kind}?rating=r`;
  for (let i = out.length; i < max && misses < 8; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": "PartyGames-mature-harvest/1.0" } });
      if (!res.ok) {
        misses++;
        await sleep(1100);
        continue;
      }
      const json = (await res.json()) as TodRow;
      const text = json.question?.trim();
      if (!text || seen.has(text.toLowerCase())) {
        misses++;
      } else {
        seen.add(text.toLowerCase());
        out.push(text);
        misses = 0;
      }
      await sleep(1100);
    } catch {
      misses++;
      await sleep(1100);
    }
  }
  mkdirSync(CACHE, { recursive: true });
  writeFileSync(cachePath, JSON.stringify(out, null, 2));
  console.log(`  TruthOrDareBot ${kind}: ${out.length}`);
  return out;
}

async function harvestNhie(category: string, max: number): Promise<string[]> {
  const cachePath = join(CACHE, `nhie-${category}.json`);
  const out: string[] = existsSync(cachePath) ? (JSON.parse(readFileSync(cachePath, "utf8")) as string[]) : [];
  const seen = new Set(out.map((t) => t.toLowerCase()));
  if (out.length >= max) {
    console.log(`  nhie.io ${category}: ${out.length} (cache)`);
    return out.slice(0, max);
  }
  let lastId: string | undefined;
  let dupes = 0;
  for (let i = out.length; i < max && dupes < 8; i++) {
    try {
      const url = new URL("https://api.nhie.io/v2/statements/next");
      url.searchParams.set("category", category);
      if (lastId) url.searchParams.set("statement_id", lastId);
      const res = await fetch(url.toString(), { headers: { "User-Agent": "PartyGames-mature-harvest/1.0" } });
      if (!res.ok) break;
      const json = (await res.json()) as { ID?: string; statement?: string };
      const stmt = json.statement?.replace(/^Never have I ever /i, "").trim();
      if (!stmt) break;
      lastId = json.ID;
      const key = stmt.toLowerCase();
      if (seen.has(key)) {
        dupes++;
        continue;
      }
      seen.add(key);
      out.push(stmt);
      dupes = 0;
      await sleep(200);
    } catch {
      break;
    }
  }
  mkdirSync(CACHE, { recursive: true });
  writeFileSync(cachePath, JSON.stringify(out, null, 2));
  console.log(`  nhie.io ${category}: ${out.length}`);
  return out;
}

type Cocktail = {
  strDrink?: string;
  strAlcoholic?: string;
  strIngredient1?: string;
  strIngredient2?: string;
  strCategory?: string;
  strGlass?: string;
};

async function harvestCocktails(): Promise<Cocktail[]> {
  const drinks: Cocktail[] = [];
  const seen = new Set<string>();
  for (const letter of "abcdefghijklmnopqrstuvwxyz") {
    const data = await cachedFetchJson<{ drinks: Cocktail[] | null }>(
      `cocktaildb-${letter}.json`,
      `https://www.thecocktaildb.com/api/json/v1/1/search.php?f=${letter}`,
    );
    await sleep(40);
    for (const d of data?.drinks ?? []) {
      const name = d.strDrink?.trim();
      if (!name || seen.has(name.toLowerCase())) continue;
      if (!/^alcoholic$/i.test(d.strAlcoholic ?? "")) continue;
      seen.add(name.toLowerCase());
      drinks.push(d);
    }
  }
  console.log(`  CocktailDB alcoholic drinks: ${drinks.length}`);
  return drinks;
}

function cocktailQuizzes(drinks: Cocktail[]): QuizRow[] {
  const ingredients = [
    ...new Set(
      drinks
        .map((d) => d.strIngredient1?.trim())
        .filter((x): x is string => Boolean(x) && x.length >= 3 && !/^(water|ice|sugar|salt)$/i.test(x)),
    ),
  ];
  const glasses = [
    ...new Set(drinks.map((d) => d.strGlass?.trim()).filter((x): x is string => Boolean(x) && x.length >= 4)),
  ];
  const out: QuizRow[] = [];
  const ingCounts = new Map<string, number>();

  for (const d of shuffle(drinks, 5)) {
    if (out.length >= 400) break;
    const name = d.strDrink!.trim();
    if (name.length < 3 || name.length > 36) continue;

    const ing = d.strIngredient1?.trim();
    const canIng =
      Boolean(ing) &&
      ingredients.length >= 4 &&
      !/^(water|ice|sugar|salt)$/i.test(ing!) &&
      !name.toLowerCase().includes(ing!.toLowerCase()) &&
      (ingCounts.get(ing!.toLowerCase()) ?? 0) < 12;

    if (canIng) {
      const decoys = shuffle(
        ingredients.filter((x) => x.toLowerCase() !== ing!.toLowerCase()),
        name.length,
      ).slice(0, 3);
      if (decoys.length === 3) {
        const choices = shuffle([ing!, ...decoys], name.length + 1);
        out.push({
          question: `What is the main ingredient in a ${name}?`,
          choices,
          correct: choices.indexOf(ing!),
          rating: "mature",
          difficulty: "medium",
        });
        ingCounts.set(ing!.toLowerCase(), (ingCounts.get(ing!.toLowerCase()) ?? 0) + 1);
      }
    }

    const glass = d.strGlass?.trim();
    if (glass && glasses.length >= 4 && !name.toLowerCase().includes(glass.toLowerCase())) {
      const decoys = shuffle(
        glasses.filter((x) => x.toLowerCase() !== glass.toLowerCase()),
        name.length + 7,
      ).slice(0, 3);
      if (decoys.length === 3) {
        const choices = shuffle([glass, ...decoys], name.length + 8);
        out.push({
          question: `A ${name} is typically served in which glass?`,
          choices,
          correct: choices.indexOf(glass),
          rating: "mature",
          difficulty: "hard",
        });
      }
    }
  }
  return out.filter((q) => q.question.length >= 18 && q.question.length <= 140 && q.correct >= 0);
}

async function main() {
  const localOnly = process.argv.includes("--local-only");
  console.log(`Filling 18+ (spicy mature) pools${localOnly ? " [local-only]" : ""}…`);

  console.log("  generating mature-curated-games.json…");
  await import("./generate-mature-curated-games.mts");
  const curatedGames = loadCuratedGames();

  // --- Quick Quiz: demote alcohol-trivia mature rows, add spicy curated MCQ ---
  const quiz = loadJson<QuizRow[]>("trivia/quiz.json");
  let demotedQuiz = 0;
  for (const row of quiz) {
    if (row.rating !== "mature") continue;
    if (!isSpicyQuizRow(row)) {
      row.rating = "family";
      demotedQuiz++;
    }
  }
  const curatedQuiz: QuizRow[] = (curatedGames.quiz ?? []).map((row) => ({
    ...row,
    rating: "mature" as const,
    difficulty: "medium" as const,
  }));
  const quizNext = fixFamilyLeaks(
    mergeBy(quiz, curatedQuiz, (r) => r.question.toLowerCase()),
    (row) => `${row.question} ${row.choices.join(" ")}`,
  );
  saveJson("trivia/quiz.json", shuffle(quizNext, 11));
  console.log(`  quiz demoted ${demotedQuiz} non-spicy mature, curated +${curatedQuiz.length}`);

  // --- Fact Check: spicy fibbage only (not quiz copies) ---
  const factCheck = loadJson<Array<{ prompt: string; truth: string; rating?: Rating; difficulty?: Difficulty }>>(
    "prompts/fact-check.json",
  );
  const curatedFacts = (curatedGames.factCheck ?? [])
    .filter((row) => isFactCheckTruthValid(row.prompt, row.truth) && isSpicyFactCheckPair(row.prompt, row.truth))
    .map((row) => ({
      prompt: row.prompt,
      truth: row.truth,
      rating: "mature" as const,
      difficulty: "medium" as const,
    }));
  const factPruned = pruneNonSpicyMature(factCheck, (row) =>
    isSpicyFactCheckPair(row.prompt, row.truth),
  );
  const factLeaksFixed = fixFamilyLeaks(factPruned, (row) => `${row.prompt} ${row.truth}`);
  const factNext = filterRepetitiveTruths(
    mergeBy(factLeaksFixed, curatedFacts, (r) => `${r.prompt}|${r.truth}`.toLowerCase()),
  );
  saveJson("prompts/fact-check.json", shuffle(factNext, 13));

  // --- Crowd call: drop non-spicy mature drink prompts ---
  const crowd = loadJson<Array<{ text: string; choices: string[]; rating?: Rating }>>("prompts/crowd-call.json");
  const curatedCrowd = (curatedGames.crowdCall ?? []).map((row) => ({
    ...row,
    rating: "mature" as const,
  }));
  const crowdNext = fixFamilyLeaks(
    mergeBy(
      pruneNonSpicyMature(crowd, (row) => isSpicyPrompt(`${row.text} ${row.choices.join(" ")}`)),
      curatedCrowd,
      (r) => `${r.text}|${r.choices.join("|")}`.toLowerCase(),
    ),
    (row) => `${row.text} ${row.choices.join(" ")}`,
  );
  saveJson("prompts/crowd-call.json", shuffle(crowdNext, 23));

  // --- Draw & Guess: spicy drawable words only ---
  const draw = loadJson<Array<{ word: string; rating?: Rating; difficulty?: Difficulty }>>("words/draw.json");
  const curatedDraw = (curatedGames.draw ?? []).map((word) => ({
    word,
    rating: "mature" as const,
    difficulty: (word.length <= 8 ? "easy" : word.length <= 14 ? "medium" : "hard") as Difficulty,
  }));
  const drawPruned = fixFamilyLeaks(
    pruneNonSpicyMature(draw, (row) => isSpicyDrawWord(row.word)),
    (row) => row.word,
  );
  saveJson("words/draw.json", mergeBy(drawPruned, curatedDraw, (r) => r.word.toLowerCase()));

  const charadesExtra = loadJson<Array<{ word: string; rating?: Rating; difficulty?: Difficulty }>>(
    "words/charades-mature-extra.json",
  );
  const charadesFiltered = charadesExtra.filter((row) => isSpicyDrawWord(row.word));
  const curatedCharades = (curatedGames.draw ?? [])
    .filter((word) => word.length <= 32 && !/^(perform|do a |call a )/i.test(word))
    .map((word) => ({
      word,
      rating: "mature" as const,
      difficulty: (word.length <= 10 ? "easy" : word.length <= 18 ? "medium" : "hard") as Difficulty,
    }));
  saveJson(
    "words/charades-mature-extra.json",
    mergeBy(charadesFiltered, curatedCharades, (r) => r.word.toLowerCase()),
  );

  // --- When Was It: curated spicy timeline events ---
  const timeline = loadJson<Array<{ event: string; year: number; rating?: Rating; difficulty?: Difficulty }>>(
    "trivia/timeline.json",
  );
  const timelinePruned = pruneNonSpicyMature(timeline, (row) => isSpicyTimelineEvent(row.event));
  const curatedTimeline = (curatedGames.timeline ?? []).map((row) => ({
    ...row,
    rating: "mature" as const,
    difficulty: "medium" as const,
  }));
  const timelineNext = fixFamilyLeaks(
    mergeBy(timelinePruned, curatedTimeline, (r) => `${r.event}|${r.year}`.toLowerCase()),
    (row) => row.event,
  );
  saveJson("trivia/timeline.json", timelineNext);

  // --- Bracket Battle: spicy category names ---
  const brackets = loadJson<Array<{ name: string; rating?: Rating; difficulty?: Difficulty }>>("categories/bracket.json");
  const bracketPruned = pruneNonSpicyMature(brackets, (row) => isSpicyBracketName(row.name));
  const curatedBrackets = (curatedGames.bracket ?? []).map((name) => ({
    name,
    rating: "mature" as const,
    difficulty: "medium" as const,
  }));
  saveJson(
    "categories/bracket.json",
    mergeBy(bracketPruned, curatedBrackets, (r) => r.name.toLowerCase()),
  );

  // --- Friend sort: spicy role labels ---
  const roles = loadJson<Array<{ name: string; rating?: Rating }>>("categories/friend-sort-roles.json");
  const curatedRoles = (curatedGames.friendSortRoles ?? []).map((name) => ({
    name,
    rating: "mature" as const,
  }));
  saveJson(
    "categories/friend-sort-roles.json",
    fixFamilyLeaks(
      mergeBy(
        pruneNonSpicyMature(roles, (row) => isSpicyPrompt(row.name)),
        curatedRoles,
        (r) => r.name.toLowerCase(),
      ),
      (row) => row.name,
    ),
  );

  // --- Impostor: replace legacy nightlife packs with coherent spicy themes ---
  const impostor = loadJson<Array<{ id: string; label: string; rating?: Rating; items: string[] }>>(
    "categories/impostor.json",
  );
  const curatedImpostor = curatedGames.impostor ?? [];
  const curatedImpostorIds = new Set(curatedImpostor.map((p) => p.id.toLowerCase()));
  const impostorFamily = impostor.filter(
    (pack) =>
      (pack.rating ?? "family") === "family" &&
      !LEGACY_IMPOSTOR_PACKS.has(pack.id) &&
      !curatedImpostorIds.has(pack.id.toLowerCase()),
  );
  saveJson("categories/impostor.json", [...impostorFamily, ...curatedImpostor]);

  // --- Reverse Fact mature rows merged here (Jeopardy harvest adds family rows) ---
  const reverseFact = loadJson<Array<{ fact: string; truth: string; rating?: Rating; difficulty?: Difficulty }>>(
    "prompts/reverse-fact.json",
  );
  const reversePruned = reverseFact.filter(
    (row) =>
      (row.rating ?? "family") !== "mature" ||
      isMatureCultureContent(`${row.fact ?? ""} ${row.truth}`),
  );
  const curatedReverse = (curatedGames.reverseFact ?? []).map((row) => ({
    ...row,
    rating: "mature" as const,
    difficulty: "medium" as const,
  }));
  saveJson(
    "prompts/reverse-fact.json",
    mergeBy(reversePruned, curatedReverse, (r) => `${r.fact}|${r.truth}`.toLowerCase()),
  );

  const truths = localOnly ? [] : await harvestTod("truth", 100);
  const nhies = localOnly ? [] : await harvestTod("nhie", 80);
  const wyrs = localOnly ? [] : await harvestTod("wyr", 80);
  const nhieIo = localOnly
    ? []
    : [...(await harvestNhie("offensive", 80)), ...(await harvestNhie("delicate", 80))];

  const curatedPath = join(CONTENT, "prompts/mature-curated.json");
  const curated = existsSync(curatedPath)
    ? loadJson<{
        punchline?: string[];
        hotSeat?: string[];
        wyr?: Array<{ a: string; b: string }>;
        splitRoom?: Array<{ text: string; labelA: string; labelB: string }>;
        spectrum?: Array<{ left: string; right: string }>;
      }>("prompts/mature-curated.json")
    : {};

  const hot = loadJson<Array<{ text: string; rating?: Rating }>>("prompts/hot-seat.json");
  const extraHot: Array<{ text: string; rating: Rating }> = [
    { text: "Have they ever sent a text they immediately regretted?", rating: "mature" },
    { text: "Have they ever left a party without saying goodbye?", rating: "mature" },
    { text: "Have they ever used a fake name at a bar?", rating: "mature" },
    { text: "Have they ever been someone's plus-one disaster?", rating: "mature" },
    { text: "Have they ever argued over an Uber rating?", rating: "mature" },
    { text: "Have they ever reconstructed a night from photos?", rating: "mature" },
    { text: "Have they ever brought an ex to a wedding?", rating: "mature" },
    { text: "Have they ever been the designated adult on purpose?", rating: "mature" },
    { text: "Have they ever hidden a tab from the group?", rating: "mature" },
    { text: "Have they ever stayed until the lights came on?", rating: "mature" },
  ];
  for (const t of [...(curated.hotSeat ?? []), ...truths, ...nhies.map((s) => (s.startsWith("Never have I ever") ? s : `Never have I ever ${s}`)), ...nhieIo]) {
    let text = t.replace(/^Never have I ever /i, "").trim();
    if (/^have you /i.test(text)) text = text.replace(/^have you /i, "Have they ");
    else if (!text.endsWith("?")) text = `Have they ever ${text}?`;
    if (text.length >= 12 && text.length <= 110 && isSpicyPrompt(text)) {
      extraHot.push({ text, rating: "mature" });
    }
  }
  const hotMerged = shuffle(mergeBy(hot, extraHot, (r) => r.text.toLowerCase()), 41);
  const hotLeaksFixed = fixFamilyLeaks(hotMerged, (row) => row.text);
  const hotFiltered = hotLeaksFixed.filter(
    (row) => (row.rating ?? "family") !== "mature" || isSpicyPrompt(row.text),
  );
  saveJson("prompts/hot-seat.json", hotFiltered);

  const punchline = loadJson<Array<{ text: string; rating?: Rating }>>("prompts/punchline-battle.json");
  const extraPunchline = [
    ...(curated.punchline ?? []).map((text) => ({ text, rating: "mature" as const })),
    ...truths.filter((t) => !t.endsWith("?") && t.length >= 12 && t.length <= 90),
    ...[...nhies, ...nhieIo].map((t, i) => diversifyNhieStatement(t, i)),
  ]
    .filter((r) => {
      const text = typeof r === "string" ? r : r.text;
      return text.length >= 12 && text.length <= 110 && isSpicyPrompt(text);
    })
    .map((r) => (typeof r === "string" ? { text: r, rating: "mature" as const } : r));
  const punchlineMerged = rebalancePunchlinePrefixes(
    shuffle(mergeBy(punchline, extraPunchline, (r) => r.text.toLowerCase()), 37),
  );
  const punchlineLeaksFixed = fixFamilyLeaks(punchlineMerged, (row) => row.text);
  const punchlineFiltered = punchlineLeaksFixed.filter(
    (row) => (row.rating ?? "family") !== "mature" || isSpicyPrompt(row.text),
  );
  saveJson("prompts/punchline-battle.json", punchlineFiltered);

  const wyrFile = loadJson<Array<{ a: string; b: string; rating?: Rating; difficulty?: Difficulty }>>(
    "would-you-rather.json",
  );
  const extraWyr = [
    ...(curatedGames.wyr ?? []).map(({ a, b }) => ({
      a,
      b,
      rating: "mature" as const,
      difficulty: "medium" as const,
    })),
    ...(curated.wyr ?? []).map(({ a, b }) => ({
      a,
      b,
      rating: "mature" as const,
      difficulty: "medium" as const,
    })),
    ...wyrs
      .map(parseWyr)
      .filter((x): x is [string, string] => Boolean(x))
      .filter(([a, b]) => isSpicyWyrPair(a, b))
      .map(([a, b]) => ({ a, b, rating: "mature" as const, difficulty: "medium" as const })),
  ];
  const wyrMerged = mergeBy(wyrFile, extraWyr, (r) => `${r.a}|${r.b}`.toLowerCase());
  const wyrNext = fixFamilyLeaks(
    pruneNonSpicyMature(wyrMerged, (row) => isSpicyWyrPair(row.a, row.b)),
    (row) => `${row.a} ${row.b}`,
  );
  saveJson("would-you-rather.json", wyrNext);

  const split = loadJson<Array<{ text: string; labelA: string; labelB: string; rating?: Rating }>>(
    "prompts/split-room.json",
  );
  const extraSplit = [
    ...(curatedGames.splitRoom ?? []).map((r) => ({ ...r, rating: "mature" as const })),
    ...(curated.splitRoom ?? []).map((r) => ({ ...r, rating: "mature" as const })),
    ...extraWyr
      .filter((r) => r.a.length <= 40 && r.b.length <= 40)
      .map((r) => ({ text: "Would you rather", labelA: r.a, labelB: r.b, rating: "mature" as const })),
  ];
  saveJson(
    "prompts/split-room.json",
    mergeBy(split, extraSplit, (r) => `${r.labelA}|${r.labelB}`.toLowerCase()),
  );

  const spectrum = loadJson<Array<{ left: string; right: string; rating?: Rating }>>("prompts/spectrum.json");
  const extraSpec = [
    ...(curatedGames.spectrum ?? []).map((r) => ({ ...r, rating: "mature" as const })),
    ...(curated.spectrum ?? []).map((r) => ({ ...r, rating: "mature" as const })),
    ...extraWyr
      .filter((r) => r.a.length <= 28 && r.b.length <= 28)
      .map((r) => ({ left: r.a, right: r.b, rating: "mature" as const })),
  ];
  saveJson(
    "prompts/spectrum.json",
    mergeBy(spectrum, extraSpec, (r) => `${r.left}|${r.right}`.toLowerCase()),
  );

  console.log("Mature harvest done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
