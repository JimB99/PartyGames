import {
  filterCategoryList,
  filterContentPool,
  filterPromptList,
  filterWordList,
  isDrawableDrawWord,
  type GameOptions,
  type ImpostorCategory,
} from "@party-games/shared";
import { content } from "./content.js";

export interface SplitScenario {
  text: string;
  labelA: string;
  labelB: string;
}

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

export function punchlineBattlePool(options: GameOptions) {
  return filterPromptList(content.punchlineBattle, options);
}

export function hotSeatPool(options: GameOptions) {
  return filterPromptList(content.hotSeat, options);
}

export function drawWordPool(options: GameOptions) {
  return filterWordList(content.drawWords, options).filter(isDrawableDrawWord);
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
  return filterContentPool(
    content.splitRoom as Array<SplitScenario & { rating?: "family" | "mature" }>,
    options,
  );
}

export function spectrumPool(options: GameOptions) {
  return filterContentPool(content.spectrum as Array<{ left: string; right: string; rating?: "family" | "mature" }>, options);
}

export function crowdCallPool(options: GameOptions) {
  return filterContentPool(
    content.crowdCall as Array<{ text: string; choices: string[]; rating?: "family" | "mature" }>,
    options,
  );
}

export function impostorPool(options: GameOptions): ImpostorCategory[] {
  const packs = content.impostor.filter((c) =>
    options.contentRating === "mature"
      ? (c.rating ?? "family") === "mature"
      : (c.rating ?? "family") !== "mature",
  );
  const cat = options.impostorCategory ?? "all";
  if (cat === "all" || cat === "random") return packs;
  const narrowed = packs.filter((c) => c.id === cat);
  return narrowed.length > 0 ? narrowed : packs;
}

export function forbiddenCluePool(options: GameOptions) {
  return filterContentPool(content.forbiddenClue, options);
}

export function agentGridWordPool(options: GameOptions): string[] {
  if (options.contentRating === "mature") {
    return filterWordList(content.drawWords, options).filter(
      (w) => w.length >= 4 && w.length <= 12 && /^[a-z ]+$/i.test(w),
    );
  }
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
  if (options.contentRating === "mature") {
    return filterWordList(content.drawWords, options).filter(
      (w) => w.length >= 5 && w.length <= 14 && !w.includes(" "),
    );
  }
  return [...content.dictionary].filter((w) => w.length >= 5 && w.length <= 10);
}

export function dictionaryForWordRush(_options: GameOptions): Set<string> {
  return content.dictionary;
}
