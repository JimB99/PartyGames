import type { ClientMessage, ServerMessage } from "@party-games/shared";
import PartySocket from "partysocket";

const PARTY_NAME = "room-server";
const HOST = process.env.PARTY_WS_HOST ?? "localhost:8787";

export async function isWorkerUp(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(`http://${HOST}/`, { signal: controller.signal });
    clearTimeout(timeout);
    return response.status < 500;
  } catch {
    return false;
  }
}

export function openSocket(roomId: string): PartySocket {
  return new PartySocket({ host: HOST, room: roomId, party: PARTY_NAME });
}

export function waitForMessage(
  socket: PartySocket,
  predicate: (msg: ServerMessage) => boolean,
  timeoutMs = 8000,
): Promise<ServerMessage> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("waitForMessage timeout")), timeoutMs);

    const onMessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(String(event.data)) as ServerMessage;
        if (predicate(msg)) {
          clearTimeout(timeout);
          socket.removeEventListener("message", onMessage);
          resolve(msg);
        }
      } catch {
        /* ignore */
      }
    };

    socket.addEventListener("message", onMessage);
  });
}

export async function connectAndJoin(
  roomId: string,
  role: "host" | "player",
  nickname?: string,
): Promise<PartySocket> {
  const socket = openSocket(roomId);
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("connect timeout")), 5000);
    socket.onopen = () => {
      clearTimeout(timeout);
      resolve();
    };
    socket.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("connect failed"));
    };
  });

  const joinMsg: ClientMessage =
    role === "host"
      ? { type: "join", role: "host" }
      : { type: "join", role: "player", nickname: nickname ?? "Player" };

  socket.send(JSON.stringify(joinMsg));
  await waitForMessage(socket, (m) => m.type === "room_state");
  return socket;
}

export function send(socket: PartySocket, message: ClientMessage): void {
  socket.send(JSON.stringify(message));
}

export async function closeSocket(socket: PartySocket): Promise<void> {
  socket.close();
  socket.removeAllListeners?.();
  await new Promise((r) => setTimeout(r, 50));
}
