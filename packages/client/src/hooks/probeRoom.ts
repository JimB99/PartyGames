import type { ServerMessage } from "@party-games/shared";
import PartySocket from "partysocket";

const PARTY_NAME = "room-server";

function getPartyHost(): string {
  const env = import.meta.env.VITE_PARTYKIT_HOST as string | undefined;
  if (env) return env;
  if (import.meta.env.DEV) return "localhost:8787";
  return window.location.host;
}

export async function probeRoomAvailable(
  roomId: string,
): Promise<{ ok: boolean; message?: string }> {
  return new Promise((resolve) => {
    const host = getPartyHost();
    const socket = new PartySocket({
      host,
      room: roomId,
      party: PARTY_NAME,
    });

    let settled = false;
    const finish = (ok: boolean, message?: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      socket.close();
      resolve({ ok, message });
    };

    const timeout = setTimeout(
      () => finish(false, "Could not reach this room. Check the code and try again."),
      8000,
    );

    socket.onopen = () => {
      socket.send(JSON.stringify({ type: "check_room" }));
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(String(event.data)) as ServerMessage;
        if (message.type === "room_available") {
          finish(true);
        } else if (message.type === "error") {
          finish(false, message.message);
        }
      } catch {
        finish(false, "Could not verify the room.");
      }
    };

    socket.onerror = () => finish(false, "Connection failed. Check the code and try again.");
    socket.onclose = () => {
      if (!settled) finish(false, "Could not reach this room.");
    };
  });
}
