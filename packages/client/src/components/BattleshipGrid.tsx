import type { Ship } from "@party-games/shared";

type GridCell = null | "ship" | "hit" | "miss" | "pending" | "sunk";

function cellColor(cell: GridCell, showShips: boolean): string {
  if (cell === "hit" || cell === "sunk") return "#ef4444";
  if (cell === "miss") return "#3b82f6";
  if (cell === "ship" && showShips) return "#52525b";
  if (cell === "pending") return "#a855f7";
  return "#18181b";
}

export function BattleshipGrid({
  size,
  ships,
  shots,
  sunkCells,
  showShips = false,
  onCellClick,
  disabled,
}: {
  size: number;
  ships?: Ship[];
  shots?: Array<{ x: number; y: number; hit: boolean }>;
  sunkCells?: Array<{ x: number; y: number }>;
  showShips?: boolean;
  onCellClick?: (x: number, y: number) => void;
  disabled?: boolean;
}) {
  const cells: GridCell[][] = Array.from({ length: size }, () => Array(size).fill(null));
  if (showShips && ships) {
    for (const ship of ships) {
      for (const c of ship.cells) {
        if (c.y < size && c.x < size) cells[c.y][c.x] = "ship";
      }
    }
  }
  for (const c of sunkCells ?? []) {
    if (c.y < size && c.x < size) cells[c.y][c.x] = "sunk";
  }
  for (const s of shots ?? []) {
    if (s.y < size && s.x < size) cells[s.y][s.x] = s.hit ? "hit" : "miss";
  }

  return (
    <div className="w-full max-w-[min(100%,18rem)]" data-testid="battleship-grid">
      <div
        className="grid w-full gap-0.5"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
      {cells.flatMap((row, y) =>
        row.map((cell, x) => (
          <button
            key={`${x}-${y}`}
            type="button"
            disabled={disabled || cell === "hit" || cell === "miss"}
            onClick={() => onCellClick?.(x, y)}
            className="aspect-square w-full rounded-sm border border-zinc-700 disabled:cursor-default"
            style={{ backgroundColor: cellColor(cell, showShips) }}
            aria-label={`Cell ${x},${y}`}
          />
        )),
      )}
      </div>
    </div>
  );
}
