import {
  PLAYER_COLORS,
  ROOM_CODE_CHARS,
  type ClientMessage,
  type GameId,
  type GameOptions,
  type PlayerViewSnapshot,
  type RoomSnapshot,
  type ServerMessage,
} from "@party-games/shared";
import PartySocket from "partysocket";
import { useCallback, useEffect, useRef, useState } from "react";

function getPartyHost(): string {
  const env = import.meta.env.VITE_PARTYKIT_HOST as string | undefined;
  if (env) return env;
  if (import.meta.env.DEV) return "localhost:8787";
  return window.location.host;
}

const PARTY_NAME = "room-server";

export const HOST_ROOM_STORAGE_KEY = "pg-host-room";

export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

export function playerColor(index: number): string {
  return PLAYER_COLORS[index % PLAYER_COLORS.length];
}

interface UsePartyRoomOptions {
  roomId: string;
  role: "host" | "player";
  nickname?: string;
  playerId?: string;
  colorIndex?: number;
  enabled?: boolean;
}

export function usePartyRoom({
  roomId,
  role,
  nickname,
  playerId: initialPlayerId,
  colorIndex: initialColorIndex,
  enabled = true,
}: UsePartyRoomOptions) {
  const [roomState, setRoomState] = useState<RoomSnapshot | null>(null);
  const [playerView, setPlayerView] = useState<PlayerViewSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectionEpoch, setConnectionEpoch] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<PartySocket | null>(null);
  const playerIdRef = useRef(initialPlayerId ?? sessionStorage.getItem(`pg-player-${roomId}`));
  const nicknameRef = useRef(nickname ?? "Player");
  const colorIndexRef = useRef(initialColorIndex);
  nicknameRef.current = nickname ?? "Player";
  if (initialColorIndex !== undefined) colorIndexRef.current = initialColorIndex;

  const send = useCallback((message: ClientMessage) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    if (!enabled || !roomId) return;

    const host = getPartyHost();
    const socket = new PartySocket({
      host,
      room: roomId,
      party: PARTY_NAME,
      maxReconnectionDelay: 10_000,
      minReconnectionDelay: 500,
      reconnectionDelayGrowFactor: 1.3,
    });

    socketRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
      setConnectionEpoch((n) => n + 1);
      setError(null);
      if (role === "host") {
        sessionStorage.setItem(HOST_ROOM_STORAGE_KEY, roomId);
      }
      const storedId = playerIdRef.current;
      send({
        type: "join",
        role,
        nickname: nicknameRef.current,
        playerId: role === "player" ? storedId ?? undefined : undefined,
        colorIndex: role === "player" ? colorIndexRef.current : undefined,
      });
    };

    socket.onclose = () => setConnected(false);

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(String(event.data)) as ServerMessage;
        if (message.type === "room_state") {
          setRoomState(message.state);
          if (message.state.phase === "lobby") {
            setPlayerView(null);
          }
          if (message.state.playerId) {
            playerIdRef.current = message.state.playerId;
            sessionStorage.setItem(`pg-player-${roomId}`, message.state.playerId);
          }
        } else if (message.type === "player_view") {
          setPlayerView(message.view);
        } else if (message.type === "player_view_clear") {
          setPlayerView(null);
        } else if (message.type === "error") {
          setError(message.message);
        }
      } catch {
        setError("Failed to parse server message");
      }
    };

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [enabled, roomId, role, send]);

  const selectGame = useCallback((gameId: GameId) => send({ type: "select_game", gameId }), [send]);
  const setGameOptions = useCallback(
    (gameId: GameId, options: GameOptions) =>
      send({ type: "set_game_options", gameId, options }),
    [send],
  );
  const startGame = useCallback(() => send({ type: "start_game" }), [send]);
  const playAgain = useCallback(() => send({ type: "play_again" }), [send]);
  const returnToLobby = useCallback(() => send({ type: "return_to_lobby" }), [send]);
  const pauseGame = useCallback(() => send({ type: "pause_game" }), [send]);
  const resumeGame = useCallback(() => send({ type: "resume_game" }), [send]);
  const extendTimer = useCallback((extraMs: number) => send({ type: "extend_timer", extraMs }), [send]);
  const setSessionPlaylist = useCallback(
    (gameIds: GameId[]) => send({ type: "set_session_playlist", gameIds }),
    [send],
  );
  const startSession = useCallback(() => send({ type: "start_session" }), [send]);
  const nextSessionGame = useCallback(() => send({ type: "next_session_game" }), [send]);
  const clearSessionPlaylist = useCallback(() => send({ type: "clear_session_playlist" }), [send]);
  const playerAction = useCallback((action: ClientMessage extends { type: "player_action"; action: infer A } ? A : never) => {
    send({ type: "player_action", action });
  }, [send]);
  const hostAction = useCallback((action: ClientMessage extends { type: "host_action"; action: infer A } ? A : never) => {
    send({ type: "host_action", action });
  }, [send]);
  const updateProfile = useCallback(
    (update: { nickname?: string; colorIndex?: number }) => {
      if (update.colorIndex !== undefined) colorIndexRef.current = update.colorIndex;
      if (update.nickname !== undefined) nicknameRef.current = update.nickname;
      send({ type: "update_profile", ...update });
    },
    [send],
  );

  return {
    roomState,
    playerView,
    connected,
    connectionEpoch,
    error,
    playerId: playerIdRef.current,
    selectGame,
    setGameOptions,
    startGame,
    playAgain,
    returnToLobby,
    pauseGame,
    resumeGame,
    extendTimer,
    setSessionPlaylist,
    startSession,
    nextSessionGame,
    clearSessionPlaylist,
    playerAction,
    hostAction,
    updateProfile,
  };
}
