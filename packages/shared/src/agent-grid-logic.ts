export type AgentTile = "a" | "b" | "neutral" | "assassin";

export const AGENT_GRID_SIZE = 25;

export function buildAgentKey(startingTeam: "a" | "b"): AgentTile[] {
  const counts: Record<AgentTile, number> =
    startingTeam === "a"
      ? { a: 9, b: 8, neutral: 7, assassin: 1 }
      : { a: 8, b: 9, neutral: 7, assassin: 1 };
  const tiles: AgentTile[] = [];
  for (const [tile, count] of Object.entries(counts) as Array<[AgentTile, number]>) {
    for (let i = 0; i < count; i++) tiles.push(tile);
  }
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }
  return tiles;
}

export type GuessOutcome = "continue" | "end_turn" | "opponent_bonus" | "assassin_loss" | "win";

export function resolveAgentGuess(
  key: AgentTile[],
  revealed: boolean[],
  index: number,
  activeTeam: "a" | "b",
): { outcome: GuessOutcome; tile: AgentTile } {
  const tile = key[index];
  if (revealed[index]) return { outcome: "end_turn", tile };
  if (tile === "assassin") return { outcome: "assassin_loss", tile };
  if (tile === "neutral") return { outcome: "end_turn", tile };
  if (tile !== activeTeam) return { outcome: "opponent_bonus", tile };
  const allRevealed = key.every((t, i) => t !== activeTeam || revealed[i]);
  return { outcome: allRevealed ? "win" : "continue", tile };
}

export function teamWon(key: AgentTile[], revealed: boolean[], team: "a" | "b"): boolean {
  return key.every((t, i) => t !== team || revealed[i]);
}
