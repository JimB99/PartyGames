export function scoresForAllPlayers(
  playerIds: string[],
  scores: Record<string, number>,
): Array<{ playerId: string; points: number }> {
  return playerIds.map((playerId) => ({
    playerId,
    points: scores[playerId] ?? 0,
  }));
}

/** Live header: Game is this game; Total is previous session games plus this game. */
export function scoresForLiveBar(
  playerIds: string[],
  sessionScores: Record<string, number>,
  gameScores: Record<string, number>,
): Array<{ playerId: string; gamePts: number; totalPts: number }> {
  return playerIds.map((playerId) => {
    const gamePts = gameScores[playerId] ?? 0;
    const sessionPts = sessionScores[playerId] ?? 0;
    return {
      playerId,
      gamePts,
      totalPts: sessionPts + gamePts,
    };
  });
}
