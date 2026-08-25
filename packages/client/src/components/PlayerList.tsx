import type { RoomSnapshot } from "@party-games/shared";
import { playerColor } from "../hooks/usePartyRoom";

export function PlayerList({ players }: { players: RoomSnapshot["players"] }) {
  return (
    <ul className="grid gap-2">
      {players.map((p) => (
        <li
          key={p.id}
          className="flex items-center gap-3 rounded-xl bg-zinc-800/80 px-4 py-3"
        >
          <span
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: playerColor(p.colorIndex) }}
          />
          <span className="font-medium">{p.nickname}</span>
          <span className="ml-auto text-xs text-zinc-500">
            {p.connected ? "online" : "away"}
          </span>
        </li>
      ))}
    </ul>
  );
}
