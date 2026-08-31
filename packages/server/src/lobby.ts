import {
  DEFAULT_GAME_OPTIONS,
  MAX_PLAYERS,
  PLAYER_COLORS,
  ROOM_CODE_CHARS,
  type GameId,
  type GameOptions,
  type Player,
} from "@party-games/shared";

export interface LobbyState {
  roomId: string;
  players: Player[];
  hostConnectionId: string | null;
  selectedGameId: GameId | null;
  sessionScores: Record<string, number>;
  gameOptionsByGame: Partial<Record<GameId, GameOptions>>;
  sessionPlaylist: GameId[];
  sessionPlaylistIndex: number;
  sessionActive: boolean;
  disconnectTimers: Map<string, ReturnType<typeof setTimeout>>;
  hostDisconnectTimer: ReturnType<typeof setTimeout> | null;
  paused: boolean;
  pausedAt: number | null;
  hostSessionActive: boolean;
  /** Points earned in the current game (all completed rounds). */
  inGameScores: Record<string, number>;
  /** Session totals at the start of the current game (for cumulative scoring). */
  sessionScoresAtGameStart: Record<string, number>;
  committedRoundKeys: Set<string>;
  gameScoresCommitted: boolean;
}

export function createLobby(roomId: string): LobbyState {
  return {
    roomId,
    players: [],
    hostConnectionId: null,
    selectedGameId: null,
    sessionScores: {},
    gameOptionsByGame: {},
    sessionPlaylist: [],
    sessionPlaylistIndex: 0,
    sessionActive: false,
    disconnectTimers: new Map(),
    hostDisconnectTimer: null,
    paused: false,
    pausedAt: null,
    hostSessionActive: false,
    inGameScores: {},
    sessionScoresAtGameStart: {},
    committedRoundKeys: new Set(),
    gameScoresCommitted: false,
  };
}

export function resetInGameScores(lobby: LobbyState): void {
  lobby.inGameScores = {};
  lobby.committedRoundKeys = new Set();
  lobby.gameScoresCommitted = false;
}

export function nextAvailableColorIndex(lobby: LobbyState): number {
  const taken = new Set(
    lobby.players.filter((p) => p.connected).map((p) => p.colorIndex),
  );
  for (let i = 0; i < PLAYER_COLORS.length; i++) {
    if (!taken.has(i)) return i;
  }
  return lobby.players.length % PLAYER_COLORS.length;
}

export function isColorTaken(
  lobby: LobbyState,
  colorIndex: number,
  exceptPlayerId?: string,
): boolean {
  if (colorIndex < 0 || colorIndex >= PLAYER_COLORS.length) return true;
  return lobby.players.some(
    (p) => p.connected && p.id !== exceptPlayerId && p.colorIndex === colorIndex,
  );
}

export function setPlayerColor(
  lobby: LobbyState,
  playerId: string,
  colorIndex: number,
): boolean {
  if (isColorTaken(lobby, colorIndex, playerId)) return false;
  const player = lobby.players.find((p) => p.id === playerId);
  if (!player) return false;
  player.colorIndex = colorIndex;
  return true;
}

export function sanitizeNickname(raw: string): string {
  return raw.trim().slice(0, 24) || "Player";
}

export function getGameOptions(lobby: LobbyState, gameId: GameId): GameOptions {
  return lobby.gameOptionsByGame[gameId] ?? DEFAULT_GAME_OPTIONS;
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
  const colorIndex = nextAvailableColorIndex(lobby);
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

/** Apply in-game totals to session — cumulative games use snapshot + totals, others merge deltas. */
export function applyInGameScoresToSession(
  lobby: LobbyState,
  cumulative: boolean,
): void {
  if (cumulative) {
    const start = lobby.sessionScoresAtGameStart;
    const ids = new Set([
      ...Object.keys(start),
      ...Object.keys(lobby.inGameScores),
      ...lobby.players.map((p) => p.id),
    ]);
    for (const id of ids) {
      lobby.sessionScores[id] = (start[id] ?? 0) + (lobby.inGameScores[id] ?? 0);
    }
    return;
  }
  lobby.sessionScores = mergeScores(lobby.sessionScores, lobby.inGameScores);
}

export function snapshotSessionScores(lobby: LobbyState): void {
  lobby.sessionScoresAtGameStart = { ...lobby.sessionScores };
}
