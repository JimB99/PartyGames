import type { RoomSnapshot } from "@party-games/shared";
import { BattleshipGrid } from "./BattleshipGrid";

export function BattleshipArena({
  data,
  room,
}: {
  data: Record<string, unknown>;
  room: RoomSnapshot;
}) {
  const gridSize = (data.gridSize as number) ?? 10;
  const fleets = (data.fleets as Array<{ id: string; alive: boolean; targetGrid: (null | "hit" | "miss")[][] }>) ?? [];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {fleets.map((f) => {
        const nick = room.players.find((p) => p.id === f.id)?.nickname ?? f.id;
        const shots = f.targetGrid.flatMap((row, y) =>
          row.map((cell, x) => (cell ? { x, y, hit: cell === "hit" } : null)).filter(Boolean),
        ) as Array<{ x: number; y: number; hit: boolean }>;
        return (
          <div key={f.id} className={`rounded-xl border p-3 ${f.alive ? "border-zinc-700" : "border-red-900 opacity-50"}`}>
            <p className="mb-2 text-center font-bold">{nick}</p>
            <div className="flex justify-center">
              <BattleshipGrid size={gridSize} shots={shots} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
