import type { GameOptions } from "./content.js";

export type BluffMode = "fill-blank" | "reverse-question";
export type TriviaFormat = "quiz" | "timeline";
export type PromptVoteStyle = "bracket" | "hot-seat";
export type OpinionScoring = "majority" | "minority" | "predict-majority";
export type DrawingStyle = "pictionary" | "telephone" | "all-draw";
export type DrawVoteStyle = "best-drawing" | "guess-artist";
export type ImpostorStyle = "verbal" | "draw";

export function resolveBluffMode(options: GameOptions): BluffMode {
  return options.bluffMode === "reverse-question" ? "reverse-question" : "fill-blank";
}

export function resolveTriviaFormat(options: GameOptions): TriviaFormat {
  return options.triviaFormat === "timeline" ? "timeline" : "quiz";
}

export function resolvePromptVoteStyle(options: GameOptions): PromptVoteStyle {
  return options.promptVoteStyle === "hot-seat" ? "hot-seat" : "bracket";
}

export function resolveOpinionScoring(options: GameOptions): OpinionScoring {
  if (options.opinionScoring === "minority") return "minority";
  if (options.opinionScoring === "predict-majority") return "predict-majority";
  return "majority";
}

export function resolveDrawingStyle(options: GameOptions): DrawingStyle {
  if (options.drawingStyle === "telephone") return "telephone";
  if (options.drawingStyle === "all-draw") return "all-draw";
  return "pictionary";
}

export function resolveDrawVoteStyle(options: GameOptions): DrawVoteStyle {
  return options.drawVoteStyle === "guess-artist" ? "guess-artist" : "best-drawing";
}

export function resolveImpostorStyle(options: GameOptions): ImpostorStyle {
  return options.impostorStyle === "draw" ? "draw" : "verbal";
}
