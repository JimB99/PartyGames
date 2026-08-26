export function scoresForAllPlayers(
  playerIds: string[],
  scores: Record<string, number>,
): Array<{ playerId: string; points: number }> {
  return playerIds.map((playerId) => ({
    playerId,
    points: scores[playerId] ?? 0,
  }));
}
