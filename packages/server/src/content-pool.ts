import {
  filterCategoryList,
  filterContentPool,
  filterPromptList,
  filterWordList,
  type Difficulty,
  type GameOptions,
} from "@party-games/shared";
import { content } from "./content.js";

export function quizPool(options: GameOptions) {
  return filterContentPool(content.quiz, options);
}

export function timelinePool(options: GameOptions) {
  return filterContentPool(content.timeline, options);
}

export function wouldYouRatherPool(options: GameOptions) {
  return filterContentPool(content.wouldYouRather, options);
}

export function fibbagePool(options: GameOptions) {
  return filterContentPool(content.fibbage, options);
}

export function fibbageReversePool(options: GameOptions) {
  return filterContentPool(content.fibbageReverse, options);
}

export function quiplashPool(options: GameOptions) {
  return filterPromptList(content.quiplash, options);
}

export function captionPool(options: GameOptions) {
  return filterPromptList(content.caption, options);
}

export function hotSeatPool(options: GameOptions) {
  return filterPromptList(content.hotSeat, options);
}

export function drawWordPool(options: GameOptions) {
  return filterWordList(content.drawWords, options);
}

export function charadesWordPool(options: GameOptions) {
  return filterWordList(content.charadesWords, options);
}

export function bracketCategoryPool(options: GameOptions) {
  return filterCategoryList(content.bracketCategories, options);
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
