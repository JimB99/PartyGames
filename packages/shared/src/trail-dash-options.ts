import type { Difficulty, GameOptions } from "./content.js";

export type PowerUpMode = "off" | "normal" | "chaos";

export interface TrailDashOptions {
  roundTimeSec: number;
  maxRounds: number;
  botCount: number;
  botDifficulty: Difficulty;
  coinValue: number;
  rankPointScale: number;
  powerUpMode: PowerUpMode;
  wallHoles: number;
}

export const DEFAULT_TRAIL_DASH_OPTIONS: TrailDashOptions = {
  roundTimeSec: 90,
  maxRounds: 3,
  botCount: 0,
  botDifficulty: "medium",
  coinValue: 50,
  rankPointScale: 1,
  powerUpMode: "normal",
  wallHoles: 2,
};

export const RANK_POINTS_BASE = [1000, 750, 500, 300, 150, 100, 50, 25] as const;

export function rankPointsForPlace(place: number, scale: number): number {
  const base = RANK_POINTS_BASE[Math.min(place - 1, RANK_POINTS_BASE.length - 1)] ?? 25;
  return Math.round(base * scale);
}

export function resolveTrailDashOptions(gameOptions: GameOptions): TrailDashOptions {
  const td = gameOptions.trailDash ?? {};
  return {
    roundTimeSec: clamp(td.roundTimeSec ?? DEFAULT_TRAIL_DASH_OPTIONS.roundTimeSec, 30, 120),
    maxRounds: clamp(td.maxRounds ?? DEFAULT_TRAIL_DASH_OPTIONS.maxRounds, 1, 5),
    botCount: clamp(td.botCount ?? DEFAULT_TRAIL_DASH_OPTIONS.botCount, 0, 7),
    botDifficulty:
      td.botDifficulty ??
      (gameOptions.difficulty === "mixed" ? "medium" : gameOptions.difficulty),
    coinValue: clamp(td.coinValue ?? DEFAULT_TRAIL_DASH_OPTIONS.coinValue, 10, 200),
    rankPointScale: clamp(td.rankPointScale ?? DEFAULT_TRAIL_DASH_OPTIONS.rankPointScale, 0.5, 3),
    powerUpMode: td.powerUpMode ?? DEFAULT_TRAIL_DASH_OPTIONS.powerUpMode,
    wallHoles: clamp(td.wallHoles ?? DEFAULT_TRAIL_DASH_OPTIONS.wallHoles, 0, 4),
  };
}

export function createBotIds(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `bot-${i + 1}`);
}

export function createBotNames(botIds: string[]): Record<string, string> {
  const names: Record<string, string> = {};
  for (const id of botIds) {
    const num = id.replace("bot-", "");
    names[id] = `Bot ${num}`;
  }
  return names;
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}
