import { allShipsPlaced, type GameAction, type Ship } from "@party-games/shared";
import { useMemo, useState } from "react";
import { FleetDuelFleetStatus } from "./FleetDuelFleetStatus";
import { FleetDuelGrid } from "./FleetDuelGrid";

function Btn({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled = false,
  testId,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  className?: string;
  disabled?: boolean;
  testId?: string;
}) {
  const base = "rounded-xl px-4 py-3 text-base font-bold transition active:scale-95";
  const styles =
    variant === "secondary"
      ? "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
      : variant === "danger"
        ? "bg-red-700 text-white hover:bg-red-600"
        : "bg-violet-600 text-white hover:bg-violet-500";
  return (
    <button type="button" data-testid={testId} disabled={disabled} onClick={onClick} className={`${base} ${styles} ${className} disabled:opacity-40`}>
      {children}
    </button>
  );
}

export function FleetDuelPlacement({
  gridSize,
  fleet,
  fleetLengths,
  onAction,
}: {
  gridSize: number;
  fleet: Ship[];
  fleetLengths: number[];
  onAction: (action: GameAction) => void;
}) {
  const [shipIndex, setShipIndex] = useState(0);
  const [horizontal, setHorizontal] = useState(true);

  const nextUnplaced = useMemo(() => fleet.findIndex((s) => s.cells.length < s.length), [fleet]);
  const activeIndex = nextUnplaced >= 0 ? nextUnplaced : shipIndex;
  const placedLengths = fleet.filter((s) => s.cells.length === s.length).map((s) => s.length);
  const allPlaced = allShipsPlaced({ id: "", ships: fleet, shots: [], alive: true, hitsThisRound: 0 });

  return (
    <div className="space-y-4">
      <FleetDuelFleetStatus label="Your fleet" fleetLengths={fleetLengths} placedLengths={placedLengths} />
      <p className="text-center text-sm text-zinc-400">
        {allPlaced
          ? "Fleet ready — tap Ready! when you're set."
          : `Place ship ${activeIndex + 1} of ${fleet.length} (${fleet[activeIndex]?.length ?? 0} cells) · ${horizontal ? "Horizontal" : "Vertical"}`}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {fleet.map((ship, i) => {
          const placed = ship.cells.length === ship.length;
          return (
            <button
              key={i}
              type="button"
              disabled={placed || allPlaced}
              onClick={() => setShipIndex(i)}
              className={`min-h-11 min-w-11 rounded-lg border px-3 py-2 text-sm font-bold ${
                i === activeIndex ? "border-violet-400 bg-violet-950" : "border-zinc-700 bg-zinc-900"
              } ${placed ? "opacity-40" : ""}`}
            >
              {ship.length}
            </button>
          );
        })}
        <Btn variant="secondary" disabled={allPlaced} onClick={() => setHorizontal((h) => !h)}>
          Rotate
        </Btn>
        <Btn variant="secondary" testId="fleet-duel-random" onClick={() => onAction({ kind: "fleet_duel_random" })}>
          Surprise me
        </Btn>
      </div>
      <p className="text-center text-xs text-zinc-500">Don&apos;t want to place ships? We&apos;ll drop a legal fleet for you.</p>
      <div className="flex justify-center">
        <FleetDuelGrid
          size={gridSize}
          ships={fleet}
          showShips
          disabled={allPlaced}
          onCellClick={(x, y) =>
            !allPlaced &&
            onAction({ kind: "fleet_duel_place", shipIndex: activeIndex, x, y, horizontal })
          }
        />
      </div>
      {allPlaced && (
        <Btn className="w-full" testId="fleet-duel-ready" onClick={() => onAction({ kind: "fleet_duel_ready" })}>
          Ready!
        </Btn>
      )}
    </div>
  );
}
