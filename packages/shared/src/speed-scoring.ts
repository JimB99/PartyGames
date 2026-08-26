import { RANK_POINTS_BASE, rankPointsForPlace } from "./trail-dash-options.js";

export interface RankedAnswerEntry {
  playerId: string;
  answeredAt: number;
}

export interface RankedScore {
  points: number;
  rankPlace: number;
}

/** Map rank place to points using position as a % of total lobby size (1st always max). */
export function rankPointsByPercentile(
  rankPlace: number,
  totalPlayers: number,
  scale = 1,
): number {
  if (totalPlayers <= 0) return 0;
  if (totalPlayers === 1) return rankPointsForPlace(1, scale);
  const t = (rankPlace - 1) / (totalPlayers - 1);
  const maxPts = rankPointsForPlace(1, scale);
  const minPts = rankPointsForPlace(RANK_POINTS_BASE.length, scale);
  return Math.round(maxPts - t * (maxPts - minPts));
}

/** Assign rank-based points among qualifying answers (earliest correct first). */
export function scoreByAnswerRank(
  entries: RankedAnswerEntry[],
  totalPlayers: number,
  scale = 1,
): Record<string, RankedScore> {
  const sorted = [...entries].sort((a, b) => a.answeredAt - b.answeredAt);
  const result: Record<string, RankedScore> = {};
  sorted.forEach((entry, i) => {
    const rankPlace = i + 1;
    result[entry.playerId] = {
      points: rankPointsByPercentile(rankPlace, totalPlayers, scale),
      rankPlace,
    };
  });
  return result;
}
