import {
  DEFAULT_TRAIL_DASH_OPTIONS,
  type Difficulty,
  type GameOptions,
  type PowerUpMode,
  type TrailDashOptions,
} from "@party-games/shared";
import { useEffect } from "react";
import { NumericSettingField } from "./settings/NumericSettingField";

const BOT_DIFFICULTY_HINT: Record<Difficulty, string> = {
  easy: "Shorter look-ahead, turns earlier, jumps less often.",
  medium: "Balanced reaction distance and turning.",
  hard: "Sees farther ahead, turns later, jumps and fires more aggressively.",
};

const POWER_UP_HINT: Record<PowerUpMode, string> = {
  off: "No pickups spawn on the arena.",
  normal: "Speed, ghost, jump, missile, grenade, and burst spawn over time.",
  chaos: "Same power-ups, but more spawn on the floor at once.",
};

export function TrailDashOptionsPanel({
  options,
  onChange,
  maxBots = 7,
}: {
  options: GameOptions;
  onChange: (options: GameOptions) => void;
  maxBots?: number;
}) {
  const hostPacing = options.hostPacing === true;
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

  useEffect(() => {
    if (td.botCount > maxBots) {
      update({ botCount: maxBots });
    }
  }, [maxBots, td.botCount]);

  return (
    <div className="rounded-2xl border border-zinc-700 bg-zinc-800/40 p-4 space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Trail Dash options</h3>

      {!hostPacing && (
        <NumericSettingField
          label="Round time (sec)"
          testId="trail-dash-round-time"
          value={td.roundTimeSec}
          min={30}
          max={120}
          onChange={(roundTimeSec) => update({ roundTimeSec })}
        />
      )}
      {hostPacing && (
        <p className="text-xs text-zinc-500">
          Round time is off in host-paced mode — end each round with Skip when you are ready.
        </p>
      )}

      <NumericSettingField
        label="Rounds"
        testId="trail-dash-max-rounds"
        value={td.maxRounds}
        min={1}
        max={5}
        onChange={(maxRounds) => update({ maxRounds })}
      />

      <NumericSettingField
        label="Bots"
        testId="trail-dash-bot-count"
        value={td.botCount}
        min={0}
        max={maxBots}
        onChange={(botCount) => update({ botCount })}
      />

      <div className="space-y-1">
        <label className="flex items-center justify-between gap-4">
          <span className="text-zinc-300">Bot difficulty</span>
          <select
            className="rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm"
            value={td.botDifficulty}
            data-testid="trail-dash-bot-difficulty"
            onChange={(e) => update({ botDifficulty: e.target.value as Difficulty })}
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
        <p className="text-xs text-zinc-500">{BOT_DIFFICULTY_HINT[td.botDifficulty]}</p>
      </div>

      <NumericSettingField
        label="Coin value"
        testId="trail-dash-coin-value"
        value={td.coinValue}
        min={10}
        max={200}
        onChange={(coinValue) => update({ coinValue })}
      />

      <div className="space-y-1">
        <label className="flex items-center justify-between gap-4">
          <span className="text-zinc-300">Power-ups</span>
          <select
            className="rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm"
            value={td.powerUpMode}
            data-testid="trail-dash-power-ups"
            onChange={(e) => update({ powerUpMode: e.target.value as PowerUpMode })}
          >
            <option value="off">Off</option>
            <option value="normal">Normal</option>
            <option value="chaos">Chaos</option>
          </select>
        </label>
        <p className="text-xs text-zinc-500">{POWER_UP_HINT[td.powerUpMode]}</p>
      </div>
    </div>
  );
}
