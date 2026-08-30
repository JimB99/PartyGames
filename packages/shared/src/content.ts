export type ContentRating = "family" | "mature";
export type Difficulty = "easy" | "medium" | "hard";
export type DifficultySetting = Difficulty | "mixed";
export type QuestionDisplayMode = "tv_prompt_only" | "tv_full";
export type SpeedScoringMode = "off" | "bonus";

export type { PowerUpMode, TrailDashOptions } from "./trail-dash-options.js";

export interface ContentMeta {
  rating?: ContentRating;
  difficulty?: Difficulty;
}

export interface GameOptions {
  contentRating: ContentRating;
  difficulty: DifficultySetting;
  trailDash?: Partial<import("./trail-dash-options.js").TrailDashOptions>;
  questionDisplay?: QuestionDisplayMode;
  speedScoring?: SpeedScoringMode;
  speedBonusMax?: number;
  /** Timeline accuracy: points deducted per year off (1–1000; 1000 = exact year only). */
  timelinePtsPerYearOff?: number;
  outOfPlaceCategory?: "all" | "places" | "things" | "jobs" | "random";
  paddleMode?: "pong" | "hockey";
}
export const DEFAULT_TIMELINE_PTS_PER_YEAR_OFF = 20;
export const TIMELINE_PTS_PER_YEAR_MAX = 1000;
export const DEFAULT_GAME_OPTIONS: GameOptions = {
  contentRating: "family",
  difficulty: "mixed",
  questionDisplay: "tv_prompt_only",
  speedScoring: "bonus",
  speedBonusMax: 500,
};

export function resolveQuestionDisplay(options: GameOptions): QuestionDisplayMode {
  return options.questionDisplay ?? "tv_prompt_only";
}

export function resolveSpeedBonusMax(options: GameOptions): number {
  return options.speedBonusMax ?? 500;
}

export function isSpeedScoringEnabled(options: GameOptions): boolean {
  return (options.speedScoring ?? "bonus") === "bonus";
}

/** Human-readable label for the speed-scoring lobby option. */
export function speedScoringLabel(mode: SpeedScoringMode | undefined): string {
  return mode === "off" ? "Off" : "Rank by speed";
}

export function resolveTimelinePtsPerYearOff(options: GameOptions): number {
  const pts = options.timelinePtsPerYearOff ?? DEFAULT_TIMELINE_PTS_PER_YEAR_OFF;
  return Math.max(1, Math.min(pts, TIMELINE_PTS_PER_YEAR_MAX));
}

export function timelineAccuracyPoints(yearsOff: number, ptsPerYearOff: number): number {
  return Math.max(0, 1000 - yearsOff * ptsPerYearOff);
}

export interface PromptEntry extends ContentMeta {
  text: string;
}

export interface FactCheckEntry extends ContentMeta {
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

export interface OutOfPlaceCategory {
  id: string;
  label: string;
  items: string[];
}

export interface ForbiddenClueCard extends ContentMeta {
  word: string;
  forbidden: string[];
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
