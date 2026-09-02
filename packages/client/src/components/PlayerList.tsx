import type { RoomSnapshot } from "@party-games/shared";
import { PlayerColorSwatch, playerColorName } from "./PlayerColorSwatch";

export function PlayerList({ players }: { players: RoomSnapshot["players"] }) {
  return (
    <ul className="grid gap-2">
      {players.map((p) => (
        <li
          key={p.id}
          className="flex items-center gap-3 rounded-xl bg-zinc-800/80 px-4 py-3"
        >
          <PlayerColorSwatch index={p.colorIndex} title={playerColorName(p.colorIndex)} />
          <span className="font-medium">{p.nickname}</span>
          <span className="ml-auto text-xs text-zinc-500">
            {p.connected ? "online" : "away"}
          </span>
        </li>
      ))}
    </ul>
  );
}
