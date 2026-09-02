import {
  DEFAULT_GAME_OPTIONS,
  DEFAULT_TIMELINE_PTS_PER_YEAR_OFF,
  TIMELINE_PTS_PER_YEAR_MAX,
  type DifficultySetting,
  type GameId,
  type GameMeta,
  type GameOptions,
  type QuestionDisplayMode,
  type SpeedScoringMode,
} from "@party-games/shared";

const OPTION_ROW = "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between min-w-0";
const OPTION_LABEL = "text-zinc-300 shrink-0";
const OPTION_SELECT = "min-w-0 w-full sm:max-w-[55%] rounded-lg border border-zinc-600 bg-zinc-900 px-3 py-2 text-sm";

export function GameOptionsPanel({
  game,
  options,
  onChange,
}: {
  game: GameMeta;
  options: GameOptions;
  onChange: (options: GameOptions) => void;
}) {
  if (
    !game.supportsDifficulty &&
    !game.supportsMatureContent &&
    !game.supportsQuestionDisplay &&
    !game.supportsTimelinePtsPerYear &&
    !game.supportsSpeedScoring &&
    !game.supportsPaddleMode &&
    !game.supportsCharadesMode
  ) {
    return null;
  }

  return (
    <div
      className="rounded-2xl border border-zinc-700 bg-zinc-800/40 p-4 space-y-4 overflow-x-hidden min-w-0"
      data-testid="game-options-panel"
    >
      <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">Game options</h3>

      {game.supportsMatureContent && (
        <div className={OPTION_ROW}>
          <span className={OPTION_LABEL}>Content</span>
          <div className="flex rounded-xl bg-zinc-900 p-1 shrink-0">
            <RatingButton
              label="Family"
              testId="game-option-content-family"
              active={options.contentRating === "family"}
              onClick={() => onChange({ ...options, contentRating: "family" })}
            />
            <RatingButton
              label="18+"
              testId="game-option-content-mature"
              active={options.contentRating === "mature"}
              onClick={() => onChange({ ...options, contentRating: "mature" })}
            />
          </div>
        </div>
      )}

      {game.supportsDifficulty && (
        <div className={OPTION_ROW}>
          <span className={OPTION_LABEL}>Difficulty</span>
          <select
            className={OPTION_SELECT}
            value={options.difficulty}
            onChange={(e) =>
              onChange({ ...options, difficulty: e.target.value as DifficultySetting })
            }
          >
            <option value="mixed">Mixed</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      )}

      {game.supportsQuestionDisplay && (
        <div className={OPTION_ROW}>
          <span className={OPTION_LABEL}>TV display</span>
          <select
            className={OPTION_SELECT}
            value={options.questionDisplay ?? "tv_prompt_only"}
            onChange={(e) =>
              onChange({ ...options, questionDisplay: e.target.value as QuestionDisplayMode })
            }
          >
            <option value="tv_prompt_only">TV: question only</option>
            <option value="tv_full">TV: show answers</option>
          </select>
        </div>
      )}

      {game.supportsTimelinePtsPerYear && (
        <div className="space-y-2 min-w-0">
          <div className={OPTION_ROW}>
            <span className={OPTION_LABEL}>Pts per year off</span>
            <span className="text-sm text-zinc-400 shrink-0">
              {(options.timelinePtsPerYearOff ?? DEFAULT_TIMELINE_PTS_PER_YEAR_OFF) >= TIMELINE_PTS_PER_YEAR_MAX
                ? "All (exact year only)"
                : `${options.timelinePtsPerYearOff ?? DEFAULT_TIMELINE_PTS_PER_YEAR_OFF} pts/year`}
            </span>
          </div>
          <input
            type="range"
            min={1}
            max={TIMELINE_PTS_PER_YEAR_MAX}
            step={1}
            value={options.timelinePtsPerYearOff ?? DEFAULT_TIMELINE_PTS_PER_YEAR_OFF}
            onChange={(e) =>
              onChange({ ...options, timelinePtsPerYearOff: Number(e.target.value) })
            }
            className="w-full"
          />
        </div>
      )}

      {game.supportsSpeedScoring && (
        <div className={OPTION_ROW}>
          <span className={OPTION_LABEL}>Speed scoring</span>
          <select
            className={OPTION_SELECT}
            value={options.speedScoring ?? "bonus"}
            onChange={(e) =>
              onChange({ ...options, speedScoring: e.target.value as SpeedScoringMode })
            }
          >
            <option value="bonus">Rank by speed</option>
            <option value="off">Off (flat points)</option>
          </select>
        </div>
      )}

      {game.supportsPaddleMode && (
        <div className={OPTION_ROW}>
          <span className={OPTION_LABEL}>Mode</span>
          <div className="flex rounded-xl bg-zinc-900 p-1 shrink-0">
            <RatingButton
              label="Pong"
              testId="game-option-paddle-pong"
              active={(options.paddleMode ?? "pong") === "pong"}
              onClick={() => onChange({ ...options, paddleMode: "pong" })}
            />
            <RatingButton
              label="Turbo Pong"
              testId="game-option-paddle-hockey"
              active={options.paddleMode === "hockey"}
              onClick={() => onChange({ ...options, paddleMode: "hockey" })}
            />
          </div>
        </div>
      )}

      {game.supportsCharadesMode && (
        <div className={OPTION_ROW}>
          <span className={OPTION_LABEL}>Play style</span>
          <div className="flex rounded-xl bg-zinc-900 p-1 shrink-0">
            <RatingButton
              label="Solo"
              testId="game-option-charades-solo"
              active={(options.charadesMode ?? "solo") === "solo"}
              onClick={() => onChange({ ...options, charadesMode: "solo" })}
            />
            <RatingButton
              label="Teams"
              testId="game-option-charades-teams"
              active={options.charadesMode === "teams"}
              onClick={() => onChange({ ...options, charadesMode: "teams" })}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function RatingButton({
  label,
  active,
  onClick,
  testId,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  testId?: string;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      onClick={onClick}
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
        active ? "bg-violet-600 text-white" : "text-zinc-400 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

export function resolveGameOptions(
  gameId: GameId,
  gameOptionsByGame: Partial<Record<GameId, GameOptions>>,
): GameOptions {
  return gameOptionsByGame[gameId] ?? DEFAULT_GAME_OPTIONS;
}
