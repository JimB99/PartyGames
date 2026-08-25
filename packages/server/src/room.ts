import {
  DISCONNECT_GRACE_MS,
  type ClientMessage,
  type ConnectionRole,
  type GameAction,
  type GameId,
  type RoomContext,
  type RoomSnapshot,
  type ServerMessage,
  uniqueId,
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
      const timer = setTimeout(() => {
        deletePlayer(this.lobby, meta.playerId!);
        this.lobby.disconnectTimers.delete(meta.playerId!);
        this.broadcastAll();
      }, DISCONNECT_GRACE_MS);
      this.lobby.disconnectTimers.set(meta.playerId, timer);
    }

    this.connectionMeta.delete(connection.id);
    this.broadcastAll();
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
      case "join":
        this.handleJoin(message, sender);
        return;
      case "select_game":
        if (this.isHost(sender)) this.lobby.selectedGameId = message.gameId;
        this.broadcastAll();
        return;
      case "start_game":
        if (this.isHost(sender)) this.startGame();
        return;
      case "return_to_lobby":
        if (this.isHost(sender)) this.returnToLobby();
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
    const playerId = message.playerId ?? uniqueId();

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
    return {
      roomId: this.lobby.roomId,
      players: this.lobby.players,
      playerIds: this.lobby.players.filter((p) => p.connected).map((p) => p.id),
    };
  }

  startGame() {
    const gameId = this.lobby.selectedGameId;
    if (!gameId) return;

    const game = getGame(gameId);
    if (!game) return;

    const ctx = this.getRoomContext();
    if (ctx.playerIds.length < game.meta.minPlayers) {
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
    this.gameModule = null;
    this.gameState = null;
    this.roomPhase = "lobby";
    this.activeGameId = null;
    this.lobby.selectedGameId = null;
    this.broadcastAll();
  }

  handleGameAction(sender: Connection, action: GameAction, isHostAction: boolean) {
    if (!this.gameModule || !this.gameState) return;

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
      if (!this.gameModule.onTick) return;

      this.gameState = this.gameModule.onTick(this.gameState);

      if (this.gameModule.isGameOver(this.gameState)) {
        const roundScores = this.gameModule.getRoundScores(this.gameState);
        this.lobby.sessionScores = mergeScores(this.lobby.sessionScores, roundScores);
        this.stopTick();
      }

      this.broadcastAll();
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
        data: view.data,
      };
    }

    return {
      roomId: this.lobby.roomId,
      phase: this.roomPhase,
      players: this.lobby.players,
      selectedGameId: this.lobby.selectedGameId,
      activeGameId: this.activeGameId,
      sessionScores: this.lobby.sessionScores,
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
      this.sendState(conn);
    }
  }
}
