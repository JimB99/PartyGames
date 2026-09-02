import {
  DISCONNECT_GRACE_MS,
  HOST_DISCONNECT_GRACE_MS,
  DEFAULT_GAME_OPTIONS,
  type ClientMessage,
  type ConnectionRole,
  type GameAction,
  type GameId,
  type RoomContext,
  type RoomSnapshot,
  type ServerMessage,
  uniqueId,
  resolveTrailDashOptions,
  resolveHostControls,
  validateClientMessage,
  validateRawMessageSize,
  assembleHostView,
  assemblePlayerView,
} from "@party-games/shared";
import {
  Server,
  type Connection,
  type ConnectionContext,
  type WSMessage,
} from "partyserver";
import {
  addPlayer,
  applyInGameScoresToSession,
  createLobby,
  deletePlayer,
  getGameOptions,
  mergeScores,
  removePlayer,
  resetInGameScores,
  sanitizeNickname,
  setPlayerColor,
  snapshotSessionScores,
  type LobbyState,
} from "./lobby.js";
import { getGame, listGames } from "./registry.js";
import { actionLimiter, drawLimiter, hostAdminLimiter } from "./rate-limiter.js";
import { PersistenceQueue } from "./persistence-queue.js";
import { mintHostToken, verifyHostToken } from "./host-capability.js";

interface ConnectionMeta {
  role: ConnectionRole;
  playerId: string | null;
  nickname: string;
}

const ROOM_STORAGE_KEY = "room-state";

interface PersistedRoomState {
  lobby: Omit<LobbyState, "disconnectTimers" | "hostDisconnectTimer" | "committedRoundKeys"> & {
    committedRoundKeys: string[];
  };
  roomPhase: "lobby" | "playing";
  gameState: unknown;
  activeGameId: GameId | null;
  hostToken: string | null;
}

export class RoomServer extends Server {
  /** PartyServer Durable Object state (storage) — present at runtime. */
  declare ctx: {
    storage: {
      put(key: string, value: unknown): Promise<void>;
      get<T>(key: string): Promise<T | undefined>;
    };
  };
  lobby!: LobbyState;
  gameModule: ReturnType<typeof getGame> | null = null;
  gameState: unknown = null;
  roomPhase: "lobby" | "playing" = "lobby";
  activeGameId: GameId | null = null;
  connectionMeta = new Map<string, ConnectionMeta>();
  tickTimer: ReturnType<typeof setInterval> | null = null;
  persistence = new PersistenceQueue();
  hostToken: string | null = null;

  private gamePhase(state: unknown): string {
    if (!state || typeof state !== "object") return "";
    return String((state as { phase?: string }).phase ?? "");
  }

  private hydrateLobby(stored: PersistedRoomState["lobby"]): LobbyState {
    return {
      ...stored,
      disconnectTimers: new Map(),
      hostDisconnectTimer: null,
      committedRoundKeys: new Set(stored.committedRoundKeys),
      players: stored.players.map((p) => ({ ...p, connected: false })),
    };
  }

  private async persistRoom(critical = false): Promise<void> {
    const write = async () => {
      const { disconnectTimers: _dt, hostDisconnectTimer: _ht, committedRoundKeys, ...lobbyRest } = this.lobby;
      const payload: PersistedRoomState = {
        lobby: {
          ...lobbyRest,
          committedRoundKeys: [...committedRoundKeys],
        },
        roomPhase: this.roomPhase,
        gameState: this.gameState,
        activeGameId: this.activeGameId,
        hostToken: this.hostToken,
      };
      await this.ctx.storage.put(ROOM_STORAGE_KEY, payload);
    };
    if (critical) {
      await this.persistence.enqueueCritical(write);
    } else {
      this.persistence.enqueueTransient(write);
    }
  }

  private restoreGameModule(): void {
    if (!this.activeGameId || !this.gameState) {
      this.gameModule = null;
      return;
    }
    this.gameModule = getGame(this.activeGameId) ?? null;
    if (this.gameModule?.needsTick?.(this.gameState)) {
      this.startTick();
    }
  }

  private syncInGameScores(): void {
    if (this.roomPhase !== "playing" || !this.gameModule || !this.gameState || !this.activeGameId) {
      return;
    }

    const roundScores = this.gameModule.getRoundScores(this.gameState);
    if (this.gameModule.meta.roundScoresAreCumulative) {
      this.lobby.inGameScores = { ...roundScores };
      return;
    }

    const view = this.gameModule.getHostView(this.gameState, this.getRoomContext());
    const scoringPhases = new Set(["reveal", "scoreboard", "ended", "match_end", "round_end"]);
    if (!scoringPhases.has(view.phase) || Object.keys(roundScores).length === 0) {
      return;
    }

    const commitKey =
      view.phase === "ended"
        ? `${this.activeGameId}:final`
        : `${this.activeGameId}:r${view.round}`;
    if (this.lobby.committedRoundKeys.has(commitKey)) return;

    if (view.phase === "ended") {
      const lastRoundKey = `${this.activeGameId}:r${view.round}`;
      if (this.lobby.committedRoundKeys.has(lastRoundKey)) return;
    }

    this.lobby.inGameScores = mergeScores(this.lobby.inGameScores, roundScores);
    this.lobby.committedRoundKeys.add(commitKey);
  }

  private commitSessionScoresIfEnded(): void {
    if (!this.gameModule || !this.gameState) return;
    if (!this.gameModule.isGameOver(this.gameState)) return;
    if (this.lobby.gameScoresCommitted) return;

    this.syncInGameScores();
    applyInGameScoresToSession(
      this.lobby,
      this.gameModule.meta.roundScoresAreCumulative ?? false,
    );
    this.lobby.gameScoresCommitted = true;
  }

  async onStart() {
    const stored = await this.ctx.storage.get<PersistedRoomState>(ROOM_STORAGE_KEY);
    if (stored?.lobby) {
      this.lobby = this.hydrateLobby(stored.lobby);
      this.roomPhase = stored.roomPhase;
      this.gameState = stored.gameState;
      this.activeGameId = stored.activeGameId;
      this.hostToken = stored.hostToken ?? null;
      this.restoreGameModule();
    } else {
      this.lobby = createLobby(this.name);
      this.hostToken = mintHostToken();
    }
  }

  onConnect(connection: Connection, _ctx: ConnectionContext) {
    connection.send(JSON.stringify({ type: "room_state", state: this.buildSnapshot(connection.id, "player", null) }));
  }

  onClose(connection: Connection) {
    const meta = this.connectionMeta.get(connection.id);
    if (!meta) return;

    if (meta.role === "host") {
      this.lobby.hostConnectionId = null;
      this.startHostDisconnectGrace();
    }

    if (meta.playerId) {
      removePlayer(this.lobby, meta.playerId);
      const playerId = meta.playerId;
      const timer = setTimeout(() => {
        this.lobby.disconnectTimers.delete(playerId);
        if (this.roomPhase !== "playing") {
          deletePlayer(this.lobby, playerId);
          this.broadcastAll();
        }
      }, DISCONNECT_GRACE_MS);
      this.lobby.disconnectTimers.set(meta.playerId, timer);
    }

    this.connectionMeta.delete(connection.id);
    this.broadcastAll();
    this.maybeShutdownEmptyRoom();
  }

  maybeShutdownEmptyRoom() {
    if (this.connectionCount() > 0) return;
    if (this.roomPhase === "playing") return;
    if (this.lobby.hostDisconnectTimer) return;
    if (this.lobby.hostSessionActive) return;
    this.shutdownRoom();
  }

  startHostDisconnectGrace() {
    if (this.lobby.hostDisconnectTimer) {
      clearTimeout(this.lobby.hostDisconnectTimer);
    }
    this.lobby.hostDisconnectTimer = setTimeout(() => {
      this.lobby.hostDisconnectTimer = null;
      if (this.hasActiveHost()) return;
      if (this.roomPhase === "playing") return;
      this.shutdownRoom();
    }, HOST_DISCONNECT_GRACE_MS);
  }

  clearHostDisconnectGrace() {
    if (this.lobby.hostDisconnectTimer) {
      clearTimeout(this.lobby.hostDisconnectTimer);
      this.lobby.hostDisconnectTimer = null;
    }
  }

  hasActiveHost(): boolean {
    if (this.lobby.hostConnectionId) {
      const host = this.getConnection(this.lobby.hostConnectionId);
      if (host) return true;
    }
    return this.lobby.hostSessionActive && this.lobby.hostDisconnectTimer != null;
  }

  connectionCount(): number {
    let count = 0;
    for (const _conn of this.getConnections()) count++;
    return count;
  }

  shutdownRoom() {
    this.stopTick();
    for (const timer of this.lobby.disconnectTimers.values()) {
      clearTimeout(timer);
    }
    this.lobby.disconnectTimers.clear();
    this.clearHostDisconnectGrace();
    this.gameModule = null;
    this.gameState = null;
    this.roomPhase = "lobby";
    this.activeGameId = null;
    this.lobby.paused = false;
    this.lobby.pausedAt = null;
    this.lobby.hostConnectionId = null;
    this.lobby.hostSessionActive = false;
  }

  onMessage(connection: Connection, rawMessage: WSMessage) {
    try {
      const raw = String(rawMessage);
      const sizeCheck = validateRawMessageSize(raw);
      if (!sizeCheck.ok) {
        connection.send(JSON.stringify({ type: "error", message: sizeCheck.message }));
        return;
      }
      const parsed = JSON.parse(raw) as unknown;
      const result = validateClientMessage(parsed);
      if (!result.ok) {
        connection.send(JSON.stringify({ type: "error", message: result.message }));
        return;
      }
      this.handleMessage(result.value, connection);
    } catch {
      connection.send(JSON.stringify({ type: "error", message: "Invalid message" }));
    }
  }

  handleMessage(message: ClientMessage, sender: Connection) {
    const isDrawAction =
      message.type === "player_action" &&
      (message.action.kind === "draw_stroke" || message.action.kind === "draw_undo" || message.action.kind === "draw_clear");
    const limiter = isDrawAction ? drawLimiter : actionLimiter;
    if (!limiter.tryConsume(sender.id)) {
      sender.send(JSON.stringify({ type: "error", message: "Too many actions — slow down" }));
      return;
    }

    switch (message.type) {
      case "ping":
        sender.send(JSON.stringify({ type: "pong" }));
        return;
      case "check_room":
        if (this.hasActiveHost()) {
          sender.send(JSON.stringify({ type: "room_available" }));
        } else if (this.lobby.hostSessionActive) {
          sender.send(
            JSON.stringify({
              type: "error",
              message: "Host is reconnecting — wait a moment and try again.",
            }),
          );
        } else {
          sender.send(
            JSON.stringify({
              type: "error",
              message:
                "No active host in this room. Ask the host to open the game on their screen first.",
            }),
          );
        }
        return;
      case "join":
        this.handleJoin(message, sender);
        return;
      case "select_game":
        if (this.isHost(sender)) this.lobby.selectedGameId = message.gameId;
        this.broadcastAll();
        return;
      case "set_game_options":
        if (this.isHost(sender)) {
          this.lobby.gameOptionsByGame[message.gameId] = message.options;
        }
        this.broadcastAll();
        return;
      case "set_session_playlist":
        if (this.isHost(sender) && this.roomPhase === "lobby") {
          this.lobby.sessionPlaylist = message.gameIds;
          this.lobby.sessionPlaylistIndex = 0;
        }
        this.broadcastAll();
        return;
      case "start_session":
        if (this.isHost(sender)) this.startSession();
        return;
      case "next_session_game":
        if (this.isHost(sender)) this.nextSessionGame();
        return;
      case "clear_session_playlist":
        if (this.isHost(sender) && this.roomPhase === "lobby") {
          this.lobby.sessionPlaylist = [];
          this.lobby.sessionPlaylistIndex = 0;
          this.lobby.sessionActive = false;
        }
        this.broadcastAll();
        return;
      case "start_game":
        if (this.isHost(sender)) this.startGame();
        return;
      case "play_again":
        if (this.isHost(sender)) this.playGameAgain();
        return;
      case "return_to_lobby":
        if (this.isHost(sender)) this.returnToLobby();
        return;
      case "pause_game":
        if (this.isHost(sender)) this.pauseGame();
        return;
      case "resume_game":
        if (this.isHost(sender)) this.resumeGame();
        return;
      case "extend_timer":
        if (this.isHost(sender)) this.extendTimer(message.extraMs);
        return;
      case "player_action":
        this.handleGameAction(sender, message.action, false);
        return;
      case "host_action":
        this.handleGameAction(sender, message.action, true);
        return;
      case "update_profile":
        this.handleUpdateProfile(message, sender);
        return;
    }
  }

  handleUpdateProfile(
    message: { nickname?: string; colorIndex?: number },
    sender: Connection,
  ) {
    const meta = this.connectionMeta.get(sender.id);
    if (!meta?.playerId) {
      sender.send(JSON.stringify({ type: "error", message: "Not joined as a player" }));
      return;
    }

    const player = this.lobby.players.find((p) => p.id === meta.playerId);
    if (!player) return;

    if (message.nickname !== undefined) {
      const nickname = sanitizeNickname(message.nickname);
      player.nickname = nickname;
      meta.nickname = nickname;
    }

    if (message.colorIndex !== undefined) {
      const ok = setPlayerColor(this.lobby, meta.playerId, message.colorIndex);
      if (!ok) {
        sender.send(JSON.stringify({ type: "error", message: "Color already taken" }));
        return;
      }
    }

    this.broadcastAll();
  }

  handleJoin(
    message: { role: ConnectionRole; nickname?: string; playerId?: string; colorIndex?: number },
    sender: Connection,
  ) {
    if (message.role === "host") {
      if (!this.hostToken) this.hostToken = mintHostToken();
      this.clearHostDisconnectGrace();
      this.lobby.hostConnectionId = sender.id;
      this.lobby.hostSessionActive = true;
      this.connectionMeta.set(sender.id, {
        role: "host",
        playerId: null,
        nickname: "Host",
      });
      this.sendState(sender);
      sender.send(JSON.stringify({ type: "host_token", token: this.hostToken }));
      this.broadcastAll();
      return;
    }

    const nickname = sanitizeNickname(message.nickname ?? "Player");
    let playerId = message.playerId;

    if (!playerId) {
      const byName = this.lobby.players.find(
        (p) => !p.connected && p.nickname.toLowerCase() === nickname.toLowerCase(),
      );
      if (byName) playerId = byName.id;
    }
    if (!playerId) playerId = uniqueId();

    const existingPlayer = this.lobby.players.find((p) => p.id === playerId);
    if (!existingPlayer && !this.hasActiveHost()) {
      sender.send(
        JSON.stringify({
          type: "error",
          message:
            "No active host in this room. Ask the host to open the game on their screen first.",
        }),
      );
      return;
    }

    const existingTimer = this.lobby.disconnectTimers.get(playerId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.lobby.disconnectTimers.delete(playerId);
    }

    const player = addPlayer(this.lobby, playerId, nickname);
    if (!player) {
      sender.send(JSON.stringify({ type: "error", message: "Room is full" }));
      return;
    }

    if (this.roomPhase === "playing") {
      player.waiting = true;
    }

    if (message.colorIndex !== undefined) {
      setPlayerColor(this.lobby, playerId, message.colorIndex);
    }

    this.connectionMeta.set(sender.id, { role: "player", playerId, nickname });
    this.sendState(sender);
    this.broadcastAll();
  }

  isHost(conn: Connection): boolean {
    return this.lobby.hostConnectionId === conn.id || this.connectionMeta.get(conn.id)?.role === "host";
  }

  getRoomContext(): RoomContext {
    const activeId = this.activeGameId ?? this.lobby.selectedGameId;
    const gameOptions =
      activeId != null ? getGameOptions(this.lobby, activeId) : DEFAULT_GAME_OPTIONS;
    return {
      roomId: this.lobby.roomId,
      players: this.lobby.players,
      playerIds: this.lobby.players.filter((p) => p.connected).map((p) => p.id),
      gameOptions,
    };
  }

  startGame(gameId?: GameId) {
    const selected = gameId ?? this.lobby.selectedGameId;
    if (!selected) return;

    const game = getGame(selected);
    if (!game) return;

    const ctx = this.getRoomContext();

    if (selected === "trail-dash") {
      const opts = resolveTrailDashOptions(getGameOptions(this.lobby, selected));
      const total = ctx.playerIds.length + opts.botCount;
      if (total < 2) {
        this.sendToHost({
          type: "error",
          message: "Need at least 2 players total (humans + bots)",
        });
        return;
      }
      if (total > 8) {
        this.sendToHost({
          type: "error",
          message: "Maximum 8 players total (humans + bots)",
        });
        return;
      }
    } else if (ctx.playerIds.length < game.meta.minPlayers) {
      this.sendToHost({
        type: "error",
        message: `Need at least ${game.meta.minPlayers} players`,
      });
      return;
    }

    this.gameModule = game;
    this.gameState = game.init(ctx);
    this.roomPhase = "playing";
    this.activeGameId = selected;
    this.lobby.selectedGameId = selected;
    snapshotSessionScores(this.lobby);
    resetInGameScores(this.lobby);
    this.startTick();
    this.broadcastAll();
  }

  startSession() {
    if (this.roomPhase !== "lobby" || this.lobby.sessionPlaylist.length === 0) return;
    this.lobby.sessionActive = true;
    this.lobby.sessionPlaylistIndex = 0;
    this.startGame(this.lobby.sessionPlaylist[0]);
  }

  nextSessionGame() {
    if (!this.lobby.sessionActive || !this.gameModule || !this.gameState) return;
    if (!this.gameModule.isGameOver(this.gameState)) return;

    const nextIndex = this.lobby.sessionPlaylistIndex + 1;
    if (nextIndex >= this.lobby.sessionPlaylist.length) {
      this.lobby.sessionActive = false;
      this.returnToLobby();
      return;
    }

    this.lobby.sessionPlaylistIndex = nextIndex;
    const nextId = this.lobby.sessionPlaylist[nextIndex];
    this.stopTick();
    this.gameModule = null;
    this.gameState = null;
    this.lobby.paused = false;
    this.lobby.pausedAt = null;
    this.startGame(nextId);
  }

  playGameAgain() {
    if (!this.activeGameId || !this.gameModule || !this.gameState) return;
    if (!this.gameModule.isGameOver(this.gameState)) return;

    const gameId = this.activeGameId;
    const game = getGame(gameId);
    if (!game) return;

    const ctx = this.getRoomContext();

    if (gameId === "trail-dash") {
      const opts = resolveTrailDashOptions(getGameOptions(this.lobby, gameId));
      const total = ctx.playerIds.length + opts.botCount;
      if (total < 2 || total > 8) return;
    } else if (ctx.playerIds.length < game.meta.minPlayers) {
      return;
    }

    this.gameModule = game;
    this.gameState = game.init(ctx);
    this.roomPhase = "playing";
    this.lobby.paused = false;
    this.lobby.pausedAt = null;
    snapshotSessionScores(this.lobby);
    resetInGameScores(this.lobby);
    this.startTick();
    this.broadcastAll();
  }

  returnToLobby() {
    this.stopTick();
    for (const timer of this.lobby.disconnectTimers.values()) {
      clearTimeout(timer);
    }
    this.lobby.disconnectTimers.clear();
    this.lobby.players = this.lobby.players.filter((p) => p.connected);
    if (this.roomPhase === "playing") {
      this.syncInGameScores();
      if (!this.lobby.gameScoresCommitted) {
        applyInGameScoresToSession(
          this.lobby,
          this.gameModule?.meta.roundScoresAreCumulative ?? false,
        );
        this.lobby.gameScoresCommitted = true;
      }
    }
    this.gameModule = null;
    this.gameState = null;
    this.roomPhase = "lobby";
    this.activeGameId = null;
    this.lobby.paused = false;
    this.lobby.pausedAt = null;
    resetInGameScores(this.lobby);
    this.broadcastAll();
  }

  pauseGame() {
    if (this.roomPhase !== "playing" || this.lobby.paused) return;
    this.lobby.paused = true;
    this.lobby.pausedAt = Date.now();
    this.stopTick();
    this.broadcastAll();
  }

  resumeGame() {
    if (!this.lobby.paused || this.lobby.pausedAt === null) return;
    const delta = Date.now() - this.lobby.pausedAt;
    this.extendGameTimer(delta);
    this.lobby.paused = false;
    this.lobby.pausedAt = null;
    if (this.roomPhase === "playing") this.startTick();
    this.broadcastAll();
  }

  extendTimer(extraMs: number) {
    if (this.roomPhase !== "playing" || this.lobby.paused) return;
    this.extendGameTimer(extraMs);
    this.broadcastAll();
  }

  extendGameTimer(extraMs: number) {
    if (!this.gameState || typeof this.gameState !== "object") return;
    const state = this.gameState as { timerEndsAt?: number | null; timerTotalMs?: number | null };
    if (state.timerEndsAt) {
      state.timerEndsAt += extraMs;
    }
    if (state.timerTotalMs != null) {
      state.timerTotalMs += extraMs;
    }
  }

  handleGameAction(sender: Connection, action: GameAction, isHostAction: boolean) {
    if (!this.gameModule || !this.gameState) return;
    if (this.lobby.paused && !isHostAction) return;

    const meta = this.connectionMeta.get(sender.id);
    const ctx = this.getRoomContext();
    const prevState = this.gameState;
    const phaseBefore = this.gamePhase(prevState);

    if (isHostAction && this.isHost(sender)) {
      if (this.gameModule.onHostAction) {
        this.gameState = this.gameModule.onHostAction(this.gameState, action, ctx);
      }
      if (
        action.kind === "advance" &&
        this.gameState === prevState &&
        phaseBefore === this.gamePhase(this.gameState) &&
        typeof this.gameState === "object" &&
        this.gameState !== null
      ) {
        const timed = this.gameState as { timerEndsAt?: number | null };
        if (timed.timerEndsAt != null) {
          timed.timerEndsAt = Date.now();
          if (this.gameModule.onTick && this.gameModule.needsTick?.(this.gameState)) {
            this.gameState = this.gameModule.onTick(this.gameState);
          }
        }
      }
    } else if (meta?.playerId) {
      this.gameState = this.gameModule.onPlayerAction(this.gameState, meta.playerId, action, ctx);
    }

    this.syncInGameScores();
    this.commitSessionScoresIfEnded();

    this.broadcastAll();
  }

  startTick() {
    this.stopTick();
    if (!this.gameModule?.needsTick?.(this.gameState)) return;

    const interval = this.gameModule.tickIntervalMs ?? 500;
    this.tickTimer = setInterval(() => {
      if (!this.gameModule || !this.gameState) return;
      if (this.lobby.paused) return;
      if (!this.gameModule.onTick) return;

      try {
        this.gameState = this.gameModule.onTick(this.gameState);

        this.syncInGameScores();
        this.commitSessionScoresIfEnded();

        if (this.gameModule.isGameOver(this.gameState)) {
          this.stopTick();
        }

        this.broadcastAll();
      } catch (err) {
        console.error("Game tick failed:", err);
      }
    }, interval);
  }

  stopTick() {
    if (this.tickTimer) {
      clearInterval(this.tickTimer);
      this.tickTimer = null;
    }
  }

  buildSnapshot(connId: string, defaultRole: ConnectionRole, defaultPlayerId: string | null): RoomSnapshot {
    const meta = this.connectionMeta.get(connId);
    const role = meta?.role ?? defaultRole;
    const playerId = meta?.playerId ?? defaultPlayerId;

    let hostView = null;
    if (this.roomPhase === "playing" && this.gameModule && this.gameState) {
      const view = this.gameModule.getHostView(this.gameState, this.getRoomContext());
      hostView = assembleHostView(
        this.gameModule.meta.id,
        {
          phase: view.phase,
          round: view.round,
          maxRounds: view.maxRounds,
          timerEndsAt: view.timerEndsAt,
          timerTotalMs: view.timerTotalMs ?? null,
          data: view.data,
        },
        resolveHostControls(view),
      );
    }

    return {
      roomId: this.lobby.roomId,
      phase: this.roomPhase,
      paused: this.lobby.paused,
      players: this.lobby.players,
      selectedGameId: this.lobby.selectedGameId,
      activeGameId: this.activeGameId,
      sessionScores: this.lobby.sessionScores,
      gameScores: this.roomPhase === "playing" ? this.lobby.inGameScores : {},
      gameOptionsByGame: this.lobby.gameOptionsByGame,
      activeGameOptions:
        this.roomPhase === "playing" && this.activeGameId
          ? getGameOptions(this.lobby, this.activeGameId)
          : null,
      hostView,
      role,
      playerId,
      games: listGames(),
      sessionPlaylist: this.lobby.sessionPlaylist,
      sessionPlaylistIndex: this.lobby.sessionPlaylistIndex,
      sessionActive: this.lobby.sessionActive,
    };
  }

  buildPlayerView(connId: string): ServerMessage | null {
    const meta = this.connectionMeta.get(connId);
    if (!meta?.playerId || !this.gameModule || !this.gameState) return null;

    const view = this.gameModule.getPlayerView(this.gameState, meta.playerId, this.getRoomContext());
    return {
      type: "player_view",
      view: assemblePlayerView(this.gameModule.meta.id, {
        phase: view.phase,
        round: view.round,
        maxRounds: view.maxRounds,
        timerEndsAt: view.timerEndsAt,
        timerTotalMs: view.timerTotalMs ?? null,
        data: view.data,
        playerData: view.playerData,
      }),
    };
  }

  sendState(conn: Connection) {
    const snapshot = this.buildSnapshot(conn.id, "player", null);
    conn.send(JSON.stringify({ type: "room_state", state: snapshot }));

    const playerView = this.buildPlayerView(conn.id);
    if (playerView) {
      conn.send(JSON.stringify(playerView));
    } else {
      const meta = this.connectionMeta.get(conn.id);
      if (meta?.role === "player") {
        conn.send(JSON.stringify({ type: "player_view_clear" }));
      }
    }
  }

  sendToHost(message: ServerMessage) {
    const hostId = this.lobby.hostConnectionId;
    if (!hostId) return;
    const host = this.getConnection(hostId);
    if (host) {
      host.send(JSON.stringify(message));
    }
  }

  broadcastAll() {
    void this.persistRoom(this.roomPhase === "lobby");
    for (const conn of this.getConnections()) {
      try {
        this.sendState(conn);
      } catch (err) {
        console.error("Broadcast failed:", err);
      }
    }
  }
}
