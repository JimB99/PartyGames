import { mergeScores } from "./lobby.js";

export function scoreCommitKey(
  activeGameId: string,
  phase: string,
  round: number,
): string {
  return phase === "ended" ? `${activeGameId}:final` : `${activeGameId}:r${round}`;
}

export function shouldSkipScoreCommit(
  committedRoundKeys: Set<string>,
  activeGameId: string,
  phase: string,
  round: number,
): boolean {
  const commitKey = scoreCommitKey(activeGameId, phase, round);
  if (committedRoundKeys.has(commitKey)) return true;
  if (phase === "ended") {
    const lastRoundKey = `${activeGameId}:r${round}`;
    if (committedRoundKeys.has(lastRoundKey)) return true;
  }
  return false;
}

export function commitRoundScores(
  inGameScores: Record<string, number>,
  committedRoundKeys: Set<string>,
  activeGameId: string,
  phase: string,
  round: number,
  roundScores: Record<string, number>,
): { inGameScores: Record<string, number>; committed: boolean } {
  if (shouldSkipScoreCommit(committedRoundKeys, activeGameId, phase, round)) {
    return { inGameScores, committed: false };
  }
  const commitKey = scoreCommitKey(activeGameId, phase, round);
  committedRoundKeys.add(commitKey);
  return {
    inGameScores: mergeScores(inGameScores, roundScores),
    committed: true,
  };
}

export interface PersistedLobbySnapshot {
  players: Array<{ id: string; nickname: string; colorIndex: number; connected: boolean }>;
  sessionScores: Record<string, number>;
  committedRoundKeys: string[];
  gameOptionsByGame: Record<string, unknown>;
  selectedGameId: string | null;
}

export function serializeLobbySnapshot(lobby: {
  players: PersistedLobbySnapshot["players"];
  sessionScores: Record<string, number>;
  committedRoundKeys: Set<string>;
  gameOptionsByGame: Record<string, unknown>;
  selectedGameId: string | null;
}): PersistedLobbySnapshot {
  return {
    players: lobby.players.map((p) => ({ ...p })),
    sessionScores: { ...lobby.sessionScores },
    committedRoundKeys: [...lobby.committedRoundKeys],
    gameOptionsByGame: { ...lobby.gameOptionsByGame },
    selectedGameId: lobby.selectedGameId,
  };
}

export function hydrateLobbySnapshot(stored: PersistedLobbySnapshot): {
  players: PersistedLobbySnapshot["players"];
  sessionScores: Record<string, number>;
  committedRoundKeys: Set<string>;
} {
  return {
    players: stored.players.map((p) => ({ ...p, connected: false })),
    sessionScores: { ...stored.sessionScores },
    committedRoundKeys: new Set(stored.committedRoundKeys),
  };
}
