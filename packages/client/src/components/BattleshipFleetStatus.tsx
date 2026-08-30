export type FleetBarShip = { length: number; placed?: boolean; sunk: boolean };

export function BattleshipFleetStatus({
  label,
  fleetLengths,
  sunkLengths = [],
  placedLengths,
}: {
  label: string;
  fleetLengths: number[];
  sunkLengths?: number[];
  placedLengths?: number[];
}) {
  const sunkPool = [...sunkLengths];
  const placedPool = placedLengths ? [...placedLengths] : null;

  const ships: FleetBarShip[] = fleetLengths.map((length) => {
    const sunkIdx = sunkPool.indexOf(length);
    const sunk = sunkIdx >= 0;
    if (sunk) sunkPool.splice(sunkIdx, 1);

    let placed = true;
    if (placedPool) {
      const placedIdx = placedPool.indexOf(length);
      placed = placedIdx >= 0;
      if (placed) placedPool.splice(placedIdx, 1);
    }

    return { length, placed, sunk };
  });

  return (
    <div className="space-y-1" data-testid="battleship-fleet-status">
      <p className="text-center text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {ships.map((ship, i) => (
          <div
            key={`${ship.length}-${i}`}
            className={`flex items-center gap-0.5 rounded-md border px-2 py-1 ${
              ship.sunk
                ? "border-red-800 bg-red-950/50"
                : ship.placed
                  ? "border-emerald-800 bg-emerald-950/40"
                  : "border-zinc-700 bg-zinc-900/60"
            }`}
          >
            {Array.from({ length: ship.length }, (_, j) => (
              <span
                key={j}
                className={`block h-3 w-3 rounded-sm ${
                  ship.sunk ? "bg-red-500" : ship.placed ? "bg-emerald-500" : "bg-zinc-600"
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
