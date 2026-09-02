import type { RoomSnapshot } from "@party-games/shared";
import { playerColor } from "../hooks/usePartyRoom";
import { BlockStackBoard } from "./BlockStackBoard";

interface BlockStackPlayerData {
  id: string;
  board: number[][];
  alive: boolean;
  score: number;
  deathRank: number | null;
}

export function BlockStackArena({ data, room }: { data: Record<string, unknown>; room: RoomSnapshot }) {
  const players = (data.players as BlockStackPlayerData[]) ?? [];

  return (
    <div
      className="grid w-full gap-3"
      data-testid="block-stack-arena"
      style={{ gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}
    >
      {players.map((p) => {
        const nick = room.players.find((pl) => pl.id === p.id)?.nickname ?? p.id;
        const pl = room.players.find((pl) => pl.id === p.id);
        return (
          <div key={p.id} className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-2 min-w-0">
            <div className="mb-1 flex items-center justify-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: playerColor(pl?.colorIndex ?? 0) }}
              />
              <p className="truncate text-center text-xs font-bold">{nick} · {p.score}</p>
            </div>
            <BlockStackBoard
              board={p.board}
              compact
              alive={p.alive}
            />
          </div>
        );
      })}
    </div>
  );
}
