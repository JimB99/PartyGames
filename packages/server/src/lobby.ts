import {
  MAX_PLAYERS,
  PLAYER_COLORS,
  ROOM_CODE_CHARS,
  type GameId,
  type Player,
} from "@party-games/shared";

export interface LobbyState {
  roomId: string;
  players: Player[];
  hostConnectionId: string | null;
  selectedGameId: GameId | null;
  sessionScores: Record<string, number>;
  disconnectTimers: Map<string, ReturnType<typeof setTimeout>>;
}

export function createLobby(roomId: string): LobbyState {
  return {
    roomId,
    players: [],
    hostConnectionId: null,
    selectedGameId: null,
    sessionScores: {},
    disconnectTimers: new Map(),
  };
}

export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

export function addPlayer(
  lobby: LobbyState,
  playerId: string,
  nickname: string,
): Player | null {
  if (lobby.players.length >= MAX_PLAYERS) return null;
  const existing = lobby.players.find((p) => p.id === playerId);
  if (existing) {
    existing.nickname = nickname;
    existing.connected = true;
    return existing;
  }
  const colorIndex = lobby.players.length % PLAYER_COLORS.length;
  const player: Player = { id: playerId, nickname, colorIndex, connected: true };
  lobby.players.push(player);
  lobby.sessionScores[playerId] = lobby.sessionScores[playerId] ?? 0;
  return player;
}

export function removePlayer(lobby: LobbyState, playerId: string): void {
  const player = lobby.players.find((p) => p.id === playerId);
  if (player) player.connected = false;
}

export function deletePlayer(lobby: LobbyState, playerId: string): void {
  lobby.players = lobby.players.filter((p) => p.id !== playerId);
  delete lobby.sessionScores[playerId];
}

export function mergeScores(
  sessionScores: Record<string, number>,
  roundScores: Record<string, number>,
): Record<string, number> {
  const merged = { ...sessionScores };
  for (const [id, pts] of Object.entries(roundScores)) {
    merged[id] = (merged[id] ?? 0) + pts;
  }
  return merged;
}
