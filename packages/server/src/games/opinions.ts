import type { GameModule } from "@party-games/shared";
import { resolveOpinionScoring } from "@party-games/shared";
import { crowdCallPool, splitRoomPool, wouldYouRatherPool } from "../content-pool.js";
import {
  createOpinionsState,
  onOpinionsAction,
  onOpinionsTick,
  opinionsHostView,
  opinionsIsGameOver,
  opinionsNeedsTick,
  opinionsPlayerView,
  opinionsRoundScores,
  type OpinionsState,
} from "../engines/opinions-engine.js";

export const opinionsGame: GameModule<OpinionsState> = {
  meta: {
    id: "opinions",
    name: "Opinions",
    description: "Pick a side — score by majority, minority, or crowd prediction",
    scoringRules: "Majority match +800; minority side +1000; correct crowd prediction +1000.",
    minPlayers: 3,
    maxPlayers: 16,
    category: "social",
    supportsDifficulty: true,
    supportsMatureContent: true,
    supportsOpinionScoring: true,
    roundScoresAreCumulative: false,
  },
  init(ctx) {
    const scoring = resolveOpinionScoring(ctx.gameOptions);
    return createOpinionsState(
      scoring,
      wouldYouRatherPool(ctx.gameOptions),
      splitRoomPool(ctx.gameOptions),
      crowdCallPool(ctx.gameOptions),
      ctx.playerIds,
      ctx.gameOptions,
    );
  },
  onPlayerAction(state, playerId, action, ctx) {
    return onOpinionsAction(state, playerId, action, ctx);
  },
  onHostAction(state, action, ctx) {
    return onOpinionsAction(state, "host", action, ctx);
  },
  onTick(state) {
    const gameOptions = state.scoring === "majority" ? state.inner.gameOptions : undefined;
    return onOpinionsTick(state, gameOptions);
  },
  needsTick: opinionsNeedsTick,
  tickIntervalMs: 500,
  getHostView(state) {
    return opinionsHostView(state, state.scoring === "majority" ? state.inner.gameOptions : undefined);
  },
  getPlayerView(state, playerId) {
    return opinionsPlayerView(state, playerId, state.scoring === "majority" ? state.inner.gameOptions : undefined);
  },
  getRoundScores: opinionsRoundScores,
  isGameOver: opinionsIsGameOver,
};
