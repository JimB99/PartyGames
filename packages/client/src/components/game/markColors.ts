import type { RoomSnapshot } from "@party-games/shared";
import { playerColor } from "../../hooks/usePartyRoom";

export function markColorsForPlayers(room: RoomSnapshot, xPlayerId: string, oPlayerId: string) {
  const xPl = room.players.find((p) => p.id === xPlayerId);
  const oPl = room.players.find((p) => p.id === oPlayerId);
  return {
    x: playerColor(xPl?.colorIndex ?? 0),
    o: playerColor(oPl?.colorIndex ?? 1),
  };
}

export function connectFourMarkColors(room: RoomSnapshot, pair: unknown) {
  if (!Array.isArray(pair) || pair.length < 2) return undefined;
  return markColorsForPlayers(room, String(pair[0]), String(pair[1]));
}
