import type { RoomSnapshot } from "@party-games/shared";
import { tetrisGridLayout } from "@party-games/shared";
import { TetrisBoard } from "./TetrisBoard";

interface TetrisPlayerData {
  id: string;
  board: number[][];
  alive: boolean;
  score: number;
  deathRank: number | null;
}

export function TetrisArena({ data, room }: { data: Record<string, unknown>; room: RoomSnapshot }) {
  const players = (data.players as TetrisPlayerData[]) ?? [];
  const alive = players.filter((p) => p.alive);
  const layout = tetrisGridLayout(Math.max(alive.length, 1));

  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(${layout.cols}, minmax(0, 1fr))` }}
    >
      {players.map((p) => {
        const nick = room.players.find((pl) => pl.id === p.id)?.nickname ?? p.id;
        return (
          <div key={p.id} className="rounded-xl border border-zinc-700 bg-zinc-900/60 p-2">
            <TetrisBoard
              board={p.board}
              compact
              alive={p.alive}
              label={`${nick} · ${p.score}`}
            />
          </div>
        );
      })}
    </div>
  );
}

export function TetrisPhoneControls({
  onInput,
  disabled,
}: {
  onInput: (input: "left" | "right" | "rotate_cw" | "rotate_ccw" | "soft_drop" | "hard_drop") => void;
  disabled?: boolean;
}) {
  let startX = 0;
  let startY = 0;

  return (
    <div
      className="relative min-h-[320px] rounded-2xl border border-zinc-700 bg-zinc-900/40 touch-none select-none"
      onPointerDown={(e) => {
        if (disabled) return;
        startX = e.clientX;
        startY = e.clientY;
        const rect = e.currentTarget.getBoundingClientRect();
        const isLeft = e.clientX - rect.left < rect.width / 2;
        onInput(isLeft ? "rotate_ccw" : "rotate_cw");
      }}
      onPointerUp={(e) => {
        if (disabled) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        if (Math.abs(dx) > Math.abs(dy)) {
          if (dx < -20) onInput("left");
          else if (dx > 20) onInput("right");
        } else if (dy > 30) {
          onInput("soft_drop");
        }
      }}
    >
      <p className="absolute inset-x-0 bottom-3 text-center text-xs text-zinc-500 pointer-events-none">
        Tap halves to rotate · swipe to move/drop
      </p>
    </div>
  );
}
