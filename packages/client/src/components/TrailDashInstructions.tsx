import {
  activePowerUpsForMode,
  type PowerUpMode,
  type TrailDashPowerUpInfo,
} from "@party-games/shared";

export function TrailDashPowerUpIcon({
  info,
  size = "md",
}: {
  info: TrailDashPowerUpInfo;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "lg" ? "h-16 w-16 text-3xl" : size === "md" ? "h-12 w-12 text-2xl" : "h-9 w-9 text-lg";
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-xl border-2 border-white/20 shadow-lg ${dim}`}
      style={{ backgroundColor: info.color }}
      title={info.name}
    >
      <span aria-hidden>{info.icon}</span>
    </div>
  );
}

export function TrailDashInstructions({
  coinValue,
  powerUpMode,
}: {
  coinValue: number;
  powerUpMode: PowerUpMode;
}) {
  const powerUps = activePowerUpsForMode(powerUpMode);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-500/40 bg-amber-950/30 p-6 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full border-2 border-amber-400 bg-amber-500/20 text-4xl shadow-lg">
          🪙
        </div>
        <p className="text-lg font-semibold text-amber-200">Coins</p>
        <p className="mt-1 text-3xl font-black text-amber-100">+{coinValue} pts each</p>
        <p className="mt-2 text-sm text-amber-200/70">Collect gold coins on the arena floor for bonus score.</p>
      </div>

      {powerUps.length > 0 && (
        <div className="rounded-2xl border border-zinc-600 bg-zinc-800/60 p-6">
          <h3 className="mb-4 text-center text-lg font-bold uppercase tracking-wide text-zinc-300">Power-ups</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {powerUps.map((pu) => (
              <div
                key={pu.kind}
                className="flex items-center gap-3 rounded-xl border border-zinc-600/80 bg-zinc-900/60 p-3"
              >
                <TrailDashPowerUpIcon info={pu} size="lg" />
                <div className="min-w-0 text-left">
                  <p className="font-bold text-white">{pu.name}</p>
                  <p className="text-sm text-zinc-400">{pu.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-center text-sm text-zinc-500">
        Cyan wall portals let you wrap to the opposite side — your trail won&apos;t connect through the arena.
      </p>
    </div>
  );
}
