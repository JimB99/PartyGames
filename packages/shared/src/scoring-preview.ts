import type { GameId, GameMeta } from "./constants.js";
import { isSpeedScoringEnabled, resolveTimelinePtsPerYearOff, resolveTriviaFormat, type GameOptions } from "./content.js";
import { rankPointsByPercentile } from "./speed-scoring.js";
import { resolveTrailDashOptions } from "./trail-dash-options.js";

export interface PlacementRow {
  place: number;
  label: string;
  points: number;
}

export interface ScoringPreview {
  kind: "placement" | "rules";
  title: string;
  summary: string;
  rows?: PlacementRow[];
  notes?: string[];
}

const RANK_GAME_IDS = new Set<GameId>([
  "trail-dash",
  "block-stack",
  "grid-blast",
  "trivia",
  "bluff",
  "hangman-race",
  "word-rush",
  "drawing",
]);

function usesSpeedRankScoring(gameId: GameId, options: GameOptions): boolean {
  if (gameId === "trail-dash") return true;
  if (gameId === "block-stack" || gameId === "grid-blast") return true;
  return isSpeedScoringEnabled(options);
}

function effectivePlayerCount(gameId: GameId, humanCount: number, options: GameOptions): number {
  if (gameId === "trail-dash") {
    const td = resolveTrailDashOptions(options);
    return humanCount + td.botCount;
  }
  return Math.max(1, humanCount);
}

function placementTable(playerCount: number, scale: number): PlacementRow[] {
  const labels = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
  const places = Math.min(Math.max(playerCount, 1), 8);
  return Array.from({ length: places }, (_, i) => ({
    place: i + 1,
    label: labels[i] ?? `${i + 1}th`,
    points: rankPointsByPercentile(i + 1, playerCount, scale),
  }));
}

export function buildScoringPreview(
  game: GameMeta,
  options: GameOptions,
  humanCount: number,
): ScoringPreview {
  const playerCount = effectivePlayerCount(game.id, humanCount, options);
  const notes: string[] = [];

  if (game.id === "trail-dash") {
    const td = resolveTrailDashOptions(options);
    notes.push(`Coins: +${td.coinValue} pts each`);
    notes.push(`Power-ups: ${td.powerUpMode}`);
    return {
      kind: "placement",
      title: "Placement points",
      summary: "Last alive ranks highest.",
      rows: placementTable(playerCount, 1),
      notes,
    };
  }

  if (RANK_GAME_IDS.has(game.id) && usesSpeedRankScoring(game.id, options)) {
    if (game.supportsSpeedScoring) {
      notes.push(
        isSpeedScoringEnabled(options)
          ? "Faster correct answers rank higher."
          : "Speed ranking off — flat points per correct answer.",
      );
    }
    if (game.id === "trivia" && resolveTriviaFormat(options) === "timeline") {
      const ptsPerYear = resolveTimelinePtsPerYearOff(options);
      notes.push(
        ptsPerYear >= 1000
          ? "Exact year only for full accuracy points."
          : `${ptsPerYear} pts deducted per year off (up to 1000).`,
      );
    }
    return {
      kind: "placement",
      title: "Placement points",
      summary: "Points by finish rank for this lobby size.",
      rows: placementTable(playerCount, 1),
      notes: notes.length > 0 ? notes : undefined,
    };
  }

  return {
    kind: "rules",
    title: "Scoring",
    summary: game.scoringRules,
    notes: notes.length > 0 ? notes : undefined,
  };
}
