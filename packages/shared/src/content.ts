export type ContentRating = "family" | "mature";
export type Difficulty = "easy" | "medium" | "hard";
export type DifficultySetting = Difficulty | "mixed";

export type { PowerUpMode, TrailDashOptions } from "./trail-dash-options.js";

export interface ContentMeta {
  rating?: ContentRating;
  difficulty?: Difficulty;
}

export interface GameOptions {
  contentRating: ContentRating;
  difficulty: DifficultySetting;
  trailDash?: Partial<import("./trail-dash-options.js").TrailDashOptions>;
}
export const DEFAULT_GAME_OPTIONS: GameOptions = {
  contentRating: "family",
  difficulty: "mixed",
};

export interface PromptEntry extends ContentMeta {
  text: string;
}

export interface FibbageEntry extends ContentMeta {
  prompt?: string;
  truth: string;
  fact?: string;
}

export interface QuizEntry extends ContentMeta {
  question: string;
  choices: string[];
  correct: number;
}

export interface TimelineEntry extends ContentMeta {
  event: string;
  year: number;
}

export interface WouldYouRatherEntry extends ContentMeta {
  a: string;
  b: string;
}

export interface WordEntry extends ContentMeta {
  word: string;
}

export interface CategoryEntry extends ContentMeta {
  name: string;
}

function itemRating(item: ContentMeta): ContentRating {
  return item.rating ?? "family";
}

export function filterContentPool<T extends ContentMeta>(items: T[], options: GameOptions): T[] {
  let pool =
    options.contentRating === "mature"
      ? items.filter((i) => itemRating(i) === "family" || itemRating(i) === "mature")
      : items.filter((i) => itemRating(i) === "family");

  if (options.difficulty !== "mixed") {
    const byDifficulty = pool.filter((i) => !i.difficulty || i.difficulty === options.difficulty);
    if (byDifficulty.length > 0) pool = byDifficulty;
  }

  return pool.length > 0 ? pool : items;
}

export function filterWordList(entries: WordEntry[], options: GameOptions): string[] {
  return filterContentPool(entries, options).map((e) => e.word);
}

export function filterPromptList(entries: PromptEntry[], options: GameOptions): string[] {
  return filterContentPool(entries, options).map((e) => e.text);
}

export function filterCategoryList(entries: CategoryEntry[], options: GameOptions): string[] {
  return filterContentPool(entries, options).map((e) => e.name);
}
