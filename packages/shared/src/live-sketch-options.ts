import type { GameOptions } from "./content.js";

export type LiveSketchWordSource = "pool" | "choice";
export type LiveSketchPhase =
  | "instructions"
  | "pick"
  | "drawing"
  | "letter-count"
  | "hangman"
  | "reveal"
  | "scoreboard"
  | "ended";

export const LIVE_SKETCH_CUSTOM_WORD_MAX = 40;
export const LIVE_SKETCH_PICK_MS = 45_000;
export const LIVE_SKETCH_LETTER_COOLDOWN_MS = 2_000;
export const LIVE_SKETCH_DRAWER_PTS = 250;
export const LIVE_SKETCH_DRAWER_CAP = 1_000;
export const LIVE_SKETCH_FLAT_GUESS_PTS = 500;
export const LIVE_SKETCH_ROUND_MS_OPTIONS = [60_000, 90_000, 120_000] as const;
export const LIVE_SKETCH_LETTER_COUNT_MS_OPTIONS = [0, 15_000, 30_000, 45_000] as const;
export const LIVE_SKETCH_HANGMAN_MS_OPTIONS = [0, 30_000, 60_000, 90_000] as const;

export const DEFAULT_LIVE_SKETCH_ROUND_MS = 90_000;
export const DEFAULT_LIVE_SKETCH_LETTER_COUNT_MS = 30_000;
export const DEFAULT_LIVE_SKETCH_HANGMAN_MS = 60_000;

export interface LiveSketchSchedule {
  roundMs: number;
  letterAt: number | null;
  hangmanAt: number | null;
}

export function resolveLiveSketchWordSource(options?: GameOptions | null): LiveSketchWordSource {
  return options?.liveSketchWordSource === "choice" ? "choice" : "pool";
}

export function resolveLiveSketchRoundMs(options?: GameOptions | null): number {
  const v = options?.liveSketchRoundMs;
  if (v === 60_000 || v === 90_000 || v === 120_000) return v;
  return DEFAULT_LIVE_SKETCH_ROUND_MS;
}

function clampHint(at: number | null, roundMs: number): number | null {
  if (at === null || at >= roundMs) return null;
  return at;
}

export function resolveLiveSketchLetterCountMs(options?: GameOptions | null): number | null {
  const roundMs = resolveLiveSketchRoundMs(options);
  const v = options?.liveSketchLetterCountMs;
  if (v === 0) return null;
  if (v === 15_000 || v === 30_000 || v === 45_000) return clampHint(v, roundMs);
  return clampHint(DEFAULT_LIVE_SKETCH_LETTER_COUNT_MS, roundMs);
}

export function resolveLiveSketchHangmanMs(options?: GameOptions | null): number | null {
  const roundMs = resolveLiveSketchRoundMs(options);
  const v = options?.liveSketchHangmanMs;
  if (v === 0) return null;
  if (v === 30_000 || v === 60_000 || v === 90_000) return clampHint(v, roundMs);
  return clampHint(DEFAULT_LIVE_SKETCH_HANGMAN_MS, roundMs);
}

export function resolveLiveSketchSchedule(options?: GameOptions | null): LiveSketchSchedule {
  return {
    roundMs: resolveLiveSketchRoundMs(options),
    letterAt: resolveLiveSketchLetterCountMs(options),
    hangmanAt: resolveLiveSketchHangmanMs(options),
  };
}

/** Play phases after `drawing`, in time order. Hangman at/before letter-count skips letter-count. */
export function liveSketchHintPhases(
  schedule: LiveSketchSchedule,
): Array<{ at: number; phase: "letter-count" | "hangman" }> {
  const out: Array<{ at: number; phase: "letter-count" | "hangman" }> = [];
  const { letterAt, hangmanAt } = schedule;
  if (letterAt !== null && (hangmanAt === null || letterAt < hangmanAt)) {
    out.push({ at: letterAt, phase: "letter-count" });
  }
  if (hangmanAt !== null) out.push({ at: hangmanAt, phase: "hangman" });
  return out;
}

export function liveSketchNextPlayPhase(
  phase: LiveSketchPhase,
  schedule: LiveSketchSchedule,
): LiveSketchPhase {
  const hints = liveSketchHintPhases(schedule);
  if (phase === "drawing") return hints[0]?.phase ?? "reveal";
  if (phase === "letter-count") {
    const hangman = hints.find((h) => h.phase === "hangman");
    return hangman ? "hangman" : "reveal";
  }
  if (phase === "hangman") return "reveal";
  return "reveal";
}

export function liveSketchPhaseDurationMs(
  phase: "drawing" | "letter-count" | "hangman",
  schedule: LiveSketchSchedule,
): number {
  const hints = liveSketchHintPhases(schedule);
  if (phase === "drawing") {
    const first = hints[0];
    return (first?.at ?? schedule.roundMs);
  }
  if (phase === "letter-count") {
    const hangman = hints.find((h) => h.phase === "hangman");
    const letter = hints.find((h) => h.phase === "letter-count");
    const start = letter?.at ?? 0;
    const end = hangman?.at ?? schedule.roundMs;
    return Math.max(0, end - start);
  }
  const hangman = hints.find((h) => h.phase === "hangman");
  const start = hangman?.at ?? 0;
  return Math.max(0, schedule.roundMs - start);
}

export function isAllowedCustomLiveSketchWord(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length > 0 && trimmed.length <= LIVE_SKETCH_CUSTOM_WORD_MAX;
}

export function normalizeLiveSketchGuess(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

export function liveSketchGuessMatches(guess: string, word: string): boolean {
  return normalizeLiveSketchGuess(guess) === normalizeLiveSketchGuess(word);
}

export function liveSketchLetterCount(word: string): number {
  return [...word].filter((c) => /[a-z]/i.test(c)).length;
}

export function liveSketchWordCount(word: string): number {
  const parts = word.trim().split(/\s+/).filter(Boolean);
  return parts.length;
}

export function isLiveSketchHangmanLetter(ch: string): boolean {
  return /^[a-z]$/i.test(ch);
}

/** Spaces, digits, and punctuation are visible immediately so they cannot freeze the board. */
export function liveSketchMask(word: string, guessed: Iterable<string>): string {
  const set = new Set([...guessed].map((l) => l.toLowerCase()));
  return [...word]
    .map((c) => {
      if (!isLiveSketchHangmanLetter(c)) return c;
      return set.has(c.toLowerCase()) ? c.toUpperCase() : "_";
    })
    .join(" ");
}

export function liveSketchMaskComplete(word: string, guessed: Iterable<string>): boolean {
  const set = new Set([...guessed].map((l) => l.toLowerCase()));
  return [...word].every((c) => !isLiveSketchHangmanLetter(c) || set.has(c.toLowerCase()));
}
