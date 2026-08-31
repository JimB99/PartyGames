import {
  filterCategoryList,
  filterContentPool,
  filterPromptList,
  filterWordList,
  type Difficulty,
  type GameOptions,
  type ImpostorCategory,
} from "@party-games/shared";
import { content } from "./content.js";
import type { SplitScenario } from "../engines/split-room-engine.js";

export function quizPool(options: GameOptions) {
  return filterContentPool(content.quiz, options);
}

export function timelinePool(options: GameOptions) {
  return filterContentPool(content.timeline, options);
}

export function wouldYouRatherPool(options: GameOptions) {
  return filterContentPool(content.wouldYouRather, options);
}

export function factCheckPool(options: GameOptions) {
  return filterContentPool(content.factCheck, options);
}

export function reverseFactPool(options: GameOptions) {
  return filterContentPool(content.reverseFact, options);
}

export function witShowdownPool(options: GameOptions) {
  return filterPromptList(content.witShowdown, options);
}

export function hotSeatPool(options: GameOptions) {
  return filterPromptList(content.hotSeat, options);
}

export function drawWordPool(options: GameOptions) {
  return filterWordList(content.drawWords, options);
}

export function charadesWordPool(options: GameOptions) {
  const maxLen = options.contentRating === "mature" ? 32 : 28;
  return filterWordList(content.charadesWords, options).filter(
    (w) => w.length <= maxLen && !/^(perform|do a |call a )/i.test(w),
  );
}

export function bracketCategoryPool(options: GameOptions) {
  return filterCategoryList(content.bracketCategories, options);
}

export function splitRoomPool(options: GameOptions): SplitScenario[] {
  const family = content.splitRoom;
  const mature: SplitScenario[] = [
    { text: "Dating apps", labelA: "Found love there", labelB: "Never again" },
    { text: "Office parties", labelA: "Free drinks!", labelB: "Mandatory fun" },
    { text: "Talking politics at dinner", labelA: "Keep it spicy", labelB: "Hard pass" },
    { text: "Sleeping in on weekends", labelA: "Sacred ritual", labelB: "Wasted daylight" },
  ];
  return options.contentRating === "mature" ? mature : family;
}

export function spectrumPool(_options: GameOptions) {
  return content.spectrum;
}

export function crowdCallPool(_options: GameOptions) {
  return content.crowdCall;
}

export function impostorPool(options: GameOptions): ImpostorCategory[] {
  const cat = options.impostorCategory ?? "all";
  if (cat === "all" || cat === "random") return content.impostor;
  return content.impostor.filter((c) => c.id === cat);
}

export function forbiddenCluePool(options: GameOptions) {
  return filterContentPool(content.forbiddenClue, options);
}

export function starRatePool(options: GameOptions) {
  const all = filterPromptList(content.witShowdown, options);
  const confession = all.filter(
    (p) =>
      p.startsWith("Nobody knows") ||
      p.startsWith("Unfiltered truth") ||
      p.startsWith("Worst thing") ||
      p.startsWith("Have you ever"),
  );
  return confession.length > 0 ? confession : all;
}

export function agentGridWordPool(options: GameOptions): string[] {
  const common = [...content.dictionary].filter(
    (w) =>
      w.length >= 4 &&
      w.length <= 10 &&
      /^[a-z]+$/i.test(w) &&
      !w.includes("-") &&
      !w.startsWith("a") &&
      !w.startsWith("un") &&
      w.length <= 8,
  );
  if (common.length >= 25) return common;
  return filterWordList(content.drawWords, options).filter((w) => w.length >= 4 && w.length <= 12);
}

export function hangmanWordPool(options: GameOptions): string[] {
  const bounds: Record<Difficulty, { min: number; max: number }> = {
    easy: { min: 5, max: 7 },
    medium: { min: 6, max: 9 },
    hard: { min: 8, max: 12 },
  };
  const dict = [...content.dictionary];
  if (options.difficulty === "mixed") return dict.filter((w) => w.length >= 5 && w.length <= 10);
  const { min, max } = bounds[options.difficulty];
  return dict.filter((w) => w.length >= min && w.length <= max);
}

export function dictionaryForWordRush(options: GameOptions): Set<string> {
  const bounds: Record<Difficulty, { min: number; max: number }> = {
    easy: { min: 3, max: 5 },
    medium: { min: 4, max: 7 },
    hard: { min: 6, max: 12 },
  };
  if (options.difficulty === "mixed") return content.dictionary;
  const { min, max } = bounds[options.difficulty];
  return new Set(
    [...content.dictionary].filter((word) => word.length >= min && word.length <= max),
  );
}
