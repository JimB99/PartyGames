import {
  PLAYER_COLORS,
  ROOM_CODE_CHARS,
  type ClientMessage,
  type GameId,
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
  enabled?: boolean;
}

export function usePartyRoom({
  roomId,
  role,
  nickname,
  playerId: initialPlayerId,
  enabled = true,
}: UsePartyRoomOptions) {
  const [roomState, setRoomState] = useState<RoomSnapshot | null>(null);
  const [playerView, setPlayerView] = useState<PlayerViewSnapshot | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<PartySocket | null>(null);
  const playerIdRef = useRef(initialPlayerId ?? sessionStorage.getItem(`pg-player-${roomId}`));

  const send = useCallback((message: ClientMessage) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    if (!enabled || !roomId) return;

    const host = getPartyHost();
    const protocol = host.includes("localhost") ? "ws" : "wss";
    const socket = new PartySocket({
      host,
      room: roomId,
      party: PARTY_NAME,
    });

    socketRef.current = socket;

    socket.onopen = () => {
      setConnected(true);
      setError(null);
      const storedId = playerIdRef.current;
      send({
        type: "join",
        role,
        nickname: nickname ?? undefined,
        playerId: role === "player" ? storedId ?? undefined : undefined,
      });
    };

    socket.onclose = () => setConnected(false);

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(String(event.data)) as ServerMessage;
        if (message.type === "room_state") {
          setRoomState(message.state);
          if (message.state.playerId) {
            playerIdRef.current = message.state.playerId;
            sessionStorage.setItem(`pg-player-${roomId}`, message.state.playerId);
          }
        } else if (message.type === "player_view") {
          setPlayerView(message.view);
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
  }, [enabled, roomId, role, nickname, send]);

  const selectGame = useCallback((gameId: GameId) => send({ type: "select_game", gameId }), [send]);
  const startGame = useCallback(() => send({ type: "start_game" }), [send]);
  const returnToLobby = useCallback(() => send({ type: "return_to_lobby" }), [send]);
  const playerAction = useCallback((action: ClientMessage extends { type: "player_action"; action: infer A } ? A : never) => {
    send({ type: "player_action", action });
  }, [send]);
  const hostAction = useCallback((action: ClientMessage extends { type: "host_action"; action: infer A } ? A : never) => {
    send({ type: "host_action", action });
  }, [send]);

  return {
    roomState,
    playerView,
    connected,
    error,
    playerId: playerIdRef.current,
    selectGame,
    startGame,
    returnToLobby,
    playerAction,
    hostAction,
  };
}
