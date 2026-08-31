import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  DEFAULT_GAME_OPTIONS,
  filterContentPool,
  filterPromptList,
  filterWordList,
  filterCategoryList,
  type CategoryEntry,
  type FactCheckEntry,
  type PromptEntry,
  type QuizEntry,
  type TimelineEntry,
  type WordEntry,
  type WouldYouRatherEntry,
} from "./content.js";
import {
  duplicateTruthRate,
  isFactCheckTruthValid,
  isObviousBluffTruth,
  isPlaceholderTruth,
  isQuestionForm,
  isReverseFactTrivial,
  MIN_CONTENT_POOL_SIZE,
  orderedSequenceRatio,
  reverseFactTrivialityScore,
} from "./content-quality.js";

const CONTENT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "content");
const MAX_DUPLICATE_TRUTH_RATE = 0.02;
const MAX_TRIVIAL_REVERSE_FACT_RATE = 0.15;
const MAX_ORDERED_SEQUENCE_RATIO = 0.05;
const MAX_SHARED_REVERSE_TRUTH_RATE = 0.02;

function loadJson<T>(rel: string): T {
  return JSON.parse(readFileSync(join(CONTENT_DIR, rel), "utf8")) as T;
}

function assertNonEmpty(value: string, label: string) {
  assert.ok(value.trim().length > 0, `${label} must be non-empty`);
}

function assertRating(item: { rating?: string }, label: string) {
  if (item.rating !== undefined) {
    assert.ok(item.rating === "family" || item.rating === "mature", `${label}: invalid rating`);
  }
}

describe("content validation", () => {
  it("quiz.json entries are valid", () => {
    const items = loadJson<QuizEntry[]>("trivia/quiz.json");
    const seen = new Set<string>();
    assert.ok(items.length >= MIN_CONTENT_POOL_SIZE, "quiz pool too small");
    for (const [i, item] of items.entries()) {
      assertNonEmpty(item.question, `quiz[${i}].question`);
      assert.ok(item.choices.length >= 2, `quiz[${i}].choices`);
      assert.ok(item.correct >= 0 && item.correct < item.choices.length, `quiz[${i}].correct`);
      assertRating(item, `quiz[${i}]`);
      assert.ok(!seen.has(item.question), `duplicate quiz question: ${item.question}`);
      seen.add(item.question);
    }
    const filtered = filterContentPool(items, DEFAULT_GAME_OPTIONS);
    assert.ok(filtered.length >= 10, "filtered quiz pool too small");
  });

  it("timeline.json entries are valid", () => {
    const items = loadJson<TimelineEntry[]>("trivia/timeline.json");
    assert.ok(items.length >= MIN_CONTENT_POOL_SIZE);
    for (const [i, item] of items.entries()) {
      assertNonEmpty(item.event, `timeline[${i}].event`);
      assert.ok(Number.isFinite(item.year), `timeline[${i}].year`);
      assertRating(item, `timeline[${i}]`);
    }
  });

  it("would-you-rather.json entries are valid", () => {
    const items = loadJson<WouldYouRatherEntry[]>("would-you-rather.json");
    assert.ok(items.length >= MIN_CONTENT_POOL_SIZE);
    for (const [i, item] of items.entries()) {
      assertNonEmpty(item.a, `wyr[${i}].a`);
      assertNonEmpty(item.b, `wyr[${i}].b`);
      assertRating(item, `wyr[${i}]`);
    }
  });

  for (const file of ["fact-check.json", "reverse-fact.json"] as const) {
    it(`prompts/${file} entries are valid`, () => {
      const items = loadJson<FactCheckEntry[]>(`prompts/${file}`);
      assert.ok(items.length >= MIN_CONTENT_POOL_SIZE, `${file} pool below ${MIN_CONTENT_POOL_SIZE}`);
      for (const [i, item] of items.entries()) {
        assertNonEmpty(item.truth, `${file}[${i}].truth`);
        assertRating(item, `${file}[${i}]`);
      }
    });
  }

  for (const file of ["wit-showdown.json", "caption.json", "hot-seat.json"] as const) {
    it(`prompts/${file} entries are valid`, () => {
      const items = loadJson<PromptEntry[]>(`prompts/${file}`);
      assert.ok(items.length >= MIN_CONTENT_POOL_SIZE, `${file} pool below ${MIN_CONTENT_POOL_SIZE}`);
      for (const [i, item] of items.entries()) {
        assertNonEmpty(item.text, `${file}[${i}].text`);
        assertRating(item, `${file}[${i}]`);
      }
      const filtered = filterPromptList(items, DEFAULT_GAME_OPTIONS);
      assert.ok(filtered.length >= 10, `filtered ${file} pool too small`);
    });
  }

  for (const file of ["draw.json", "charades.json"] as const) {
    it(`words/${file} entries are valid`, () => {
      const items = loadJson<WordEntry[]>(`words/${file}`);
      assert.ok(items.length >= MIN_CONTENT_POOL_SIZE, `${file} pool below ${MIN_CONTENT_POOL_SIZE}`);
      for (const [i, item] of items.entries()) {
        assertNonEmpty(item.word, `${file}[${i}].word`);
        assertRating(item, `${file}[${i}]`);
      }
      const filtered = filterWordList(items, DEFAULT_GAME_OPTIONS);
      assert.ok(filtered.length >= 10, `filtered ${file} pool too small`);
    });
  }

  it("categories/bracket.json entries are valid", () => {
    const items = loadJson<CategoryEntry[]>("categories/bracket.json");
    assert.ok(items.length >= MIN_CONTENT_POOL_SIZE);
    for (const [i, item] of items.entries()) {
      assertNonEmpty(item.name, `bracket[${i}].name`);
      assertRating(item, `bracket[${i}]`);
    }
    const filtered = filterCategoryList(items, DEFAULT_GAME_OPTIONS);
    assert.ok(filtered.length >= 10);
  });

  it("dictionary.txt has words", () => {
    const raw = readFileSync(join(CONTENT_DIR, "words", "dictionary.txt"), "utf8");
    const words = raw.split(",").map((w) => w.trim()).filter(Boolean);
    assert.ok(words.length >= 100, "dictionary too small");
    const json = JSON.parse(readFileSync(join(CONTENT_DIR, "words", "dictionary.json"), "utf8")) as string[];
    assert.equal(json.length, words.length, "dictionary.json out of sync with dictionary.txt");
  });

  it("fact-check pool avoids placeholder truths and duplicate truth spam", () => {
    const items = loadJson<FactCheckEntry[]>("prompts/fact-check.json");
    const truths = items.map((i) => i.truth);
    const placeholders = truths.filter((t) => isPlaceholderTruth(t));
    assert.ok(placeholders.length <= 1, `too many placeholder truths: ${placeholders.length}`);
    assert.ok(
      duplicateTruthRate(truths) <= MAX_DUPLICATE_TRUTH_RATE,
      `duplicate truth rate ${duplicateTruthRate(truths)} exceeds ${MAX_DUPLICATE_TRUTH_RATE}`,
    );
    const questions = items.filter((i) => isQuestionForm(i.truth));
    assert.equal(questions.length, 0, "fact-check truths must not be questions");
    for (const item of items) {
      assert.ok(
        isFactCheckTruthValid(item.prompt ?? "", item.truth),
        `invalid fact-check pair: ${item.prompt} -> ${item.truth}`,
      );
    }
  });

  it("reverse-fact pool is large and mostly non-trivial", () => {
    const items = loadJson<FactCheckEntry[]>("prompts/reverse-fact.json");
    assert.ok(items.length >= MIN_CONTENT_POOL_SIZE, "reverse fact pool too small");
    assert.ok(
      duplicateTruthRate(items.map((i) => i.truth)) <= MAX_SHARED_REVERSE_TRUTH_RATE,
      "reverse facts share too many identical truth strings",
    );
    const yearQuestion = items.filter((i) => i.truth === "In what year did this take place?");
    assert.equal(yearQuestion.length, 0, "timeline-style duplicate truths must be excluded");
    const sample = items.slice(0, Math.min(200, items.length));
    const trivial = sample.filter((item) => {
      const fact = (item as FactCheckEntry & { fact?: string }).fact ?? "";
      return isReverseFactTrivial(fact, item.truth);
    });
    const trivialRate = trivial.length / sample.length;
    assert.ok(
      trivialRate <= MAX_TRIVIAL_REVERSE_FACT_RATE,
      `trivial reverse-fact rate ${trivialRate} exceeds ${MAX_TRIVIAL_REVERSE_FACT_RATE}`,
    );
    assert.ok(reverseFactTrivialityScore("Paris", "What is the capital of France?") < 0.5);
  });

  it("prompt pools are not alphabetically ordered", () => {
    for (const file of ["wit-showdown.json", "caption.json", "hot-seat.json"] as const) {
      const items = loadJson<PromptEntry[]>(`prompts/${file}`);
      const texts = items.map((i) => i.text);
      const ratio = orderedSequenceRatio(texts, 20);
      assert.ok(
        ratio <= MAX_ORDERED_SEQUENCE_RATIO,
        `${file} ordered sequence ratio ${ratio} exceeds ${MAX_ORDERED_SEQUENCE_RATIO}`,
      );
      if (file === "wit-showdown.json") {
        const worst = texts.filter((t) => /^worst thing:/i.test(t)).length;
        assert.ok(
          worst / texts.length <= 0.25,
          `wit-showdown 'Worst thing:' prefix exceeds 25% (${worst}/${texts.length})`,
        );
      }
    }
  });

  it("quiz mature entries are real trivia not yes/no confessions", () => {
    const items = loadJson<QuizEntry[]>("trivia/quiz.json");
    const mature = items.filter((i) => i.rating === "mature");
    for (const q of mature) {
      const choices = q.choices.map((c) => c.toLowerCase());
      const yesNoOnly = choices.every((c) => ["yes", "no", "maybe", "no comment"].includes(c));
      const confession = /^(have you|did you|do you|are you|what's your|what is your)/i.test(q.question);
      assert.ok(!(yesNoOnly && confession), `mature quiz confession yes/no: ${q.question}`);
    }
  });

  it("voting truths are not obvious outliers vs sample decoys", () => {
    const factCheck = loadJson<FactCheckEntry[]>("prompts/fact-check.json").filter((f) => f.rating === "family");
    const sample = factCheck.slice(0, 40);
    for (const item of sample) {
      const decoys = sample
        .filter((other) => other.truth !== item.truth)
        .slice(0, 4)
        .map((other) => other.truth);
      assert.ok(!isObviousBluffTruth(item.truth, decoys), `obvious truth: ${item.truth}`);
    }
  });

  it("family and mature pools differ where mature content exists", () => {
    const familyOpts = { ...DEFAULT_GAME_OPTIONS, contentRating: "family" as const };
    const matureOpts = { ...DEFAULT_GAME_OPTIONS, contentRating: "mature" as const };

    const factCheckFamily = filterContentPool(loadJson<FactCheckEntry[]>("prompts/fact-check.json"), familyOpts);
    const factCheckMature = filterContentPool(loadJson<FactCheckEntry[]>("prompts/fact-check.json"), matureOpts);
    assert.ok(factCheckMature.length > factCheckFamily.length, "fact-check mature pool should be larger than family");

    const quizFamily = filterContentPool(loadJson<QuizEntry[]>("trivia/quiz.json"), familyOpts);
    const quizMature = filterContentPool(loadJson<QuizEntry[]>("trivia/quiz.json"), matureOpts);
    assert.ok(quizMature.length >= quizFamily.length);
    assert.ok(
      quizMature.length > quizFamily.length || quizFamily.every((q) => q.rating !== "mature"),
      "quiz mature pool should differ when mature entries exist",
    );
  });

  it("mature charades pool has enough entries after filters", () => {
    const charades = loadJson<WordEntry[]>("words/charades.json");
    const extra = loadJson<WordEntry[]>("words/charades-mature-extra.json");
    const all = [...charades, ...extra];
    const matureOpts = { ...DEFAULT_GAME_OPTIONS, contentRating: "mature" as const };
    const pool = filterWordList(all, matureOpts).filter(
      (w) => w.length <= 32 && !/^(perform|do a |call a )/i.test(w),
    );
    assert.ok(pool.length >= 100, `mature charades pool too small: ${pool.length}`);
  });

  it("family hot-seat prompts exclude mature blocklist", () => {
    const items = loadJson<PromptEntry[]>("prompts/hot-seat.json");
    const blocklist =
      /\b(sex|sexy|naked|nude|porn|bdsm|orgasm|horny|fetish|threesome|masturbat|hard drugs|cocaine|heroin|meth)\b/i;
    const family = items.filter((i) => (i.rating ?? "family") === "family");
    for (const item of family) {
      assert.ok(!blocklist.test(item.text), `family hot-seat mature content: ${item.text}`);
    }
  });

  it("reverse-fact facts are not malformed questions", () => {
    const items = loadJson<FactCheckEntry[]>("prompts/reverse-fact.json");
    for (const item of items) {
      if (item.fact) {
        assert.ok(!item.fact.endsWith("?"), `fact should not be a question: ${item.fact}`);
      }
      if (item.truth) {
        assert.ok(!item.truth.endsWith(".?"), `malformed truth: ${item.truth}`);
        assert.ok(!/\.\.+\?$/.test(item.truth), `malformed truth: ${item.truth}`);
      }
    }
  });
});
