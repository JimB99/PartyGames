/** Competition ranking: 1,2,2,4 */
export function competitionRank(scores: Array<{ id: string; value: number }>): Map<string, number> {
  const sorted = [...scores].sort((a, b) => b.value - a.value);
  const ranks = new Map<string, number>();
  let rank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].value < sorted[i - 1].value) rank = i + 1;
    ranks.set(sorted[i].id, rank);
  }
  return ranks;
}

/** Dense ranking: 1,2,2,3 */
export function denseRank(scores: Array<{ id: string; value: number }>): Map<string, number> {
  const sorted = [...scores].sort((a, b) => b.value - a.value);
  const ranks = new Map<string, number>();
  let rank = 0;
  let prev = Number.POSITIVE_INFINITY;
  for (const entry of sorted) {
    if (entry.value < prev) {
      rank += 1;
      prev = entry.value;
    }
    ranks.set(entry.id, rank);
  }
  return ranks;
}

export function mergeRoundDeltas(
  cumulative: Record<string, number>,
  delta: Record<string, number>,
): Record<string, number> {
  const next = { ...cumulative };
  for (const [id, points] of Object.entries(delta)) {
    if (!Number.isFinite(points)) continue;
    next[id] = (next[id] ?? 0) + points;
  }
  return next;
}

export interface ScoreLedgerEntry {
  playerId: string;
  points: number;
  reason: string;
}
