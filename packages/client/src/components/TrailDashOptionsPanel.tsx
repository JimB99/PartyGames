import {
  DEFAULT_TRAIL_DASH_OPTIONS,
  type Difficulty,
  type GameOptions,
  type PowerUpMode,
  type TrailDashOptions,
} from "@party-games/shared";

export function TrailDashOptionsPanel({
  options,
  onChange,
}: {
  options: GameOptions;
  onChange: (options: GameOptions) => void;
}) {
  const td: TrailDashOptions = {
    ...DEFAULT_TRAIL_DASH_OPTIONS,
    ...options.trailDash,
  };

  const update = (patch: Partial<TrailDashOptions>) => {
    onChange({
      ...options,
      trailDash: { ...td, ...patch },
    });
  };

  return (
    <div className="rounded-2xl border border-zinc-700 bg-zinc-800/40 p-4 space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Trail Dash options</h3>

      <label className="flex items-center justify-between gap-4">
        <span className="text-zinc-300">Round time (sec)</span>
        <input
          type="number"
          min={30}
          max={120}
          value={td.roundTimeSec}
          onChange={(e) => update({ roundTimeSec: Number(e.target.value) })}
          className="w-20 rounded-lg border border-zinc-600 bg-zinc-900 px-2 py-1 text-sm"
        />
      </label>

      <label className="flex items-center justify-between gap-4">
        <span className="text-zinc-300">Rounds</span>
        <input
          type="number"
          min={1}
          max={5}
          value={td.maxRounds}
          onChange={(e) => update({ maxRounds: Number(e.target.value) })}
          className="w-20 rounded-lg border border-zinc-600 bg-zinc-900 px-2 py-1 text-sm"
        />
      </label>

      <label className="flex items-center justify-between gap-4">
        <span className="text-zinc-300">Bots</span>
        <input
          type="number"
          min={0}
          max={7}
          value={td.botCount}
          onChange={(e) => update({ botCount: Number(e.target.value) })}
          className="w-20 rounded-lg border border-zinc-600 bg-zinc-900 px-2 py-1 text-sm"
        />
      </label>

      <label className="flex items-center justify-between gap-4">
        <span className="text-zinc-300">Bot difficulty</span>
        <select
          className="rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm"
          value={td.botDifficulty}
          onChange={(e) => update({ botDifficulty: e.target.value as Difficulty })}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </label>

      <label className="flex items-center justify-between gap-4">
        <span className="text-zinc-300">Coin value</span>
        <input
          type="number"
          min={10}
          max={200}
          value={td.coinValue}
          onChange={(e) => update({ coinValue: Number(e.target.value) })}
          className="w-20 rounded-lg border border-zinc-600 bg-zinc-900 px-2 py-1 text-sm"
        />
      </label>

      <label className="flex items-center justify-between gap-4">
        <span className="text-zinc-300">Rank point scale</span>
        <input
          type="number"
          min={0.5}
          max={3}
          step={0.1}
          value={td.rankPointScale}
          onChange={(e) => update({ rankPointScale: Number(e.target.value) })}
          className="w-20 rounded-lg border border-zinc-600 bg-zinc-900 px-2 py-1 text-sm"
        />
      </label>

      <label className="flex items-center justify-between gap-4">
        <span className="text-zinc-300">Power-ups</span>
        <select
          className="rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm"
          value={td.powerUpMode}
          onChange={(e) => update({ powerUpMode: e.target.value as PowerUpMode })}
        >
          <option value="off">Off</option>
          <option value="normal">Normal</option>
          <option value="chaos">Chaos</option>
        </select>
      </label>

      <label className="flex items-center justify-between gap-4">
        <span className="text-zinc-300">Wall holes</span>
        <input
          type="number"
          min={0}
          max={4}
          value={td.wallHoles}
          onChange={(e) => update({ wallHoles: Number(e.target.value) })}
          className="w-20 rounded-lg border border-zinc-600 bg-zinc-900 px-2 py-1 text-sm"
        />
      </label>
    </div>
  );
}
