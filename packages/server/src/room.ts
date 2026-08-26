import {
  DISCONNECT_GRACE_MS,
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
} from "@party-games/shared";
import {
  Server,
  type Connection,
  type ConnectionContext,
  type WSMessage,
} from "partyserver";
import {
  addPlayer,
  createLobby,
  deletePlayer,
  getGameOptions,
  mergeScores,
  removePlayer,
  type LobbyState,
} from "./lobby.js";
import { getGame, listGames } from "./registry.js";

interface ConnectionMeta {
  role: ConnectionRole;
  playerId: string | null;
  nickname: string;
}

export class RoomServer extends Server {
  lobby!: LobbyState;
  gameModule: ReturnType<typeof getGame> | null = null;
  gameState: unknown = null;
  roomPhase: "lobby" | "playing" = "lobby";
  activeGameId: GameId | null = null;
  connectionMeta = new Map<string, ConnectionMeta>();
  tickTimer: ReturnType<typeof setInterval> | null = null;

  async onStart() {
    this.lobby = createLobby(this.name);
  }

  onConnect(connection: Connection, _ctx: ConnectionContext) {
    connection.send(JSON.stringify({ type: "room_state", state: this.buildSnapshot(connection.id, "player", null) }));
  }

  onClose(connection: Connection) {
    const meta = this.connectionMeta.get(connection.id);
    if (!meta) return;

    if (meta.role === "host") {
      this.lobby.hostConnectionId = null;
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
    // Keep in-progress games alive through brief disconnects / lag spikes.
    if (this.roomPhase === "playing") return;
    this.shutdownRoom();
  }

  hasActiveHost(): boolean {
    if (!this.lobby.hostConnectionId) return false;
    return this.getConnection(this.lobby.hostConnectionId) != null;
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
      const message = JSON.parse(String(rawMessage)) as ClientMessage;
      this.handleMessage(message, connection);
    } catch {
      connection.send(JSON.stringify({ type: "error", message: "Invalid message" }));
    }
  }

  handleMessage(message: ClientMessage, sender: Connection) {
    switch (message.type) {
      case "ping":
        sender.send(JSON.stringify({ type: "pong" }));
        return;
      case "check_room":
        if (this.hasActiveHost()) {
          sender.send(JSON.stringify({ type: "room_available" }));
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
      case "start_game":
        if (this.isHost(sender)) this.startGame();
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
    }
  }

  handleJoin(
    message: { role: ConnectionRole; nickname?: string; playerId?: string },
    sender: Connection,
  ) {
    if (message.role === "host") {
      this.lobby.hostConnectionId = sender.id;
      this.lobby.hostSessionActive = true;
      this.connectionMeta.set(sender.id, {
        role: "host",
        playerId: null,
        nickname: "Host",
      });
      this.sendState(sender);
      this.broadcastAll();
      return;
    }

    const nickname = (message.nickname ?? "Player").trim().slice(0, 24) || "Player";
    let playerId = message.playerId;

    if (!playerId && this.roomPhase === "playing") {
      const byName = this.lobby.players.find((p) => !p.connected && p.nickname === nickname);
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

    this.connectionMeta.set(sender.id, { role: "player", playerId, nickname });
    this.sendState(sender);
    this.broadcastAll();
  }

  isHost(conn: Connection): boolean {
    return this.lobby.hostConnectionId === conn.id;
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

  startGame() {
    const gameId = this.lobby.selectedGameId;
    if (!gameId) return;

    const game = getGame(gameId);
    if (!game) return;

    const ctx = this.getRoomContext();

    if (gameId === "curve-fever") {
      const opts = resolveTrailDashOptions(getGameOptions(this.lobby, gameId));
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
    this.activeGameId = gameId;
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
    this.gameModule = null;
    this.gameState = null;
    this.roomPhase = "lobby";
    this.activeGameId = null;
    this.lobby.paused = false;
    this.lobby.pausedAt = null;
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

    if (isHostAction && this.isHost(sender)) {
      if (this.gameModule.onHostAction) {
        this.gameState = this.gameModule.onHostAction(this.gameState, action, ctx);
      }
    } else if (meta?.playerId) {
      this.gameState = this.gameModule.onPlayerAction(this.gameState, meta.playerId, action, ctx);
    }

    if (this.gameModule.isGameOver(this.gameState)) {
      const roundScores = this.gameModule.getRoundScores(this.gameState);
      this.lobby.sessionScores = mergeScores(this.lobby.sessionScores, roundScores);
    }

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

        if (this.gameModule.isGameOver(this.gameState)) {
          const roundScores = this.gameModule.getRoundScores(this.gameState);
          this.lobby.sessionScores = mergeScores(this.lobby.sessionScores, roundScores);
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
      hostView = {
        gameId: this.gameModule.meta.id,
        phase: view.phase,
        round: view.round,
        maxRounds: view.maxRounds,
        timerEndsAt: view.timerEndsAt,
        timerTotalMs: view.timerTotalMs ?? null,
        data: view.data,
      };
    }

    return {
      roomId: this.lobby.roomId,
      phase: this.roomPhase,
      paused: this.lobby.paused,
      players: this.lobby.players,
      selectedGameId: this.lobby.selectedGameId,
      activeGameId: this.activeGameId,
      sessionScores: this.lobby.sessionScores,
      gameOptionsByGame: this.lobby.gameOptionsByGame,
      activeGameOptions:
        this.roomPhase === "playing" && this.activeGameId
          ? getGameOptions(this.lobby, this.activeGameId)
          : null,
      hostView,
      role,
      playerId,
      games: listGames(),
    };
  }

  buildPlayerView(connId: string): ServerMessage | null {
    const meta = this.connectionMeta.get(connId);
    if (!meta?.playerId || !this.gameModule || !this.gameState) return null;

    const view = this.gameModule.getPlayerView(this.gameState, meta.playerId, this.getRoomContext());
    return {
      type: "player_view",
      view: {
        gameId: this.gameModule.meta.id,
        phase: view.phase,
        round: view.round,
        maxRounds: view.maxRounds,
        timerEndsAt: view.timerEndsAt,
        timerTotalMs: view.timerTotalMs ?? null,
        data: view.data,
        playerData: view.playerData,
      },
    };
  }

  sendState(conn: Connection) {
    const snapshot = this.buildSnapshot(conn.id, "player", null);
    conn.send(JSON.stringify({ type: "room_state", state: snapshot }));

    const playerView = this.buildPlayerView(conn.id);
    if (playerView) {
      conn.send(JSON.stringify(playerView));
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
    for (const conn of this.getConnections()) {
      try {
        this.sendState(conn);
      } catch (err) {
        console.error("Broadcast failed:", err);
      }
    }
  }
}
