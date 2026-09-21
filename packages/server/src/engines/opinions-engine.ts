import {
  resolveOpinionScoring,
  type GameAction,
  type GameOptions,
  type OpinionScoring,
  type RoomContext,
} from "@party-games/shared";
import {
  createCrowdState,
  crowdHostView,
  crowdPlayerView,
  onCrowdAction,
  onCrowdTick,
  type CrowdState,
} from "./crowd-call-engine.js";
import {
  createSplitState,
  onSplitAction,
  onSplitTick,
  splitHostView,
  splitPlayerView,
  type SplitState,
} from "./split-room-engine.js";
import {
  createTriviaState,
  onTriviaAction,
  onTriviaTick,
  triviaHostView,
  triviaPlayerView,
  type TriviaState,
} from "./trivia-engine.js";

export type OpinionsState =
  | { scoring: "majority"; inner: TriviaState }
  | { scoring: "minority"; inner: SplitState }
  | { scoring: "predict-majority"; inner: CrowdState };

export function createOpinionsState(
  scoring: OpinionScoring,
  majorityPool: unknown[],
  minorityPool: Array<{ text: string; labelA: string; labelB: string }>,
  predictPool: Array<{ text: string; choices: string[] }>,
  playerIds: string[],
  gameOptions?: GameOptions,
): OpinionsState {
  if (scoring === "minority") {
    return { scoring: "minority", inner: createSplitState(minorityPool, playerIds, 4) };
  }
  if (scoring === "predict-majority") {
    return { scoring: "predict-majority", inner: createCrowdState(predictPool, playerIds, 4) };
  }
  const inner = createTriviaState("would-you-rather", majorityPool, 10, playerIds.length, gameOptions);
  return { scoring: "majority", inner };
}

function withOpinionScoring<T extends { data: Record<string, unknown> }>(
  view: T,
  scoring: OpinionScoring,
): T {
  return {
    ...view,
    data: { ...view.data, opinionScoring: scoring },
  };
}

export function onOpinionsAction(
  state: OpinionsState,
  playerId: string,
  action: GameAction,
  ctx: RoomContext,
): OpinionsState {
  if (state.scoring === "majority") {
    return { scoring: "majority", inner: onTriviaAction(state.inner, playerId, action, ctx) };
  }
  if (state.scoring === "minority") {
    return { scoring: "minority", inner: onSplitAction(state.inner, playerId, action, ctx) };
  }
  return { scoring: "predict-majority", inner: onCrowdAction(state.inner, playerId, action, ctx) };
}

export function onOpinionsTick(state: OpinionsState, gameOptions?: GameOptions): OpinionsState {
  if (state.scoring === "majority") {
    return {
      scoring: "majority",
      inner: onTriviaTick(state.inner, state.inner.itemsPool, gameOptions ?? state.inner.gameOptions),
    };
  }
  if (state.scoring === "minority") {
    return { scoring: "minority", inner: onSplitTick(state.inner) };
  }
  return { scoring: "predict-majority", inner: onCrowdTick(state.inner) };
}

export function opinionsHostView(state: OpinionsState, gameOptions?: GameOptions) {
  if (state.scoring === "majority") {
    const view = triviaHostView(state.inner, gameOptions ?? state.inner.gameOptions);
    return withOpinionScoring(view, state.scoring);
  }
  if (state.scoring === "minority") {
    return withOpinionScoring(splitHostView(state.inner), state.scoring);
  }
  return withOpinionScoring(crowdHostView(state.inner), state.scoring);
}

export function opinionsPlayerView(state: OpinionsState, playerId: string, gameOptions?: GameOptions) {
  if (state.scoring === "majority") {
    const view = triviaPlayerView(state.inner, playerId);
    return withOpinionScoring(view, state.scoring);
  }
  if (state.scoring === "minority") {
    const view = splitPlayerView(state.inner, playerId);
    return withOpinionScoring(view, state.scoring);
  }
  return withOpinionScoring(crowdPlayerView(state.inner, playerId), state.scoring);
}

export function opinionsRoundScores(state: OpinionsState): Record<string, number> {
  if (state.scoring === "majority") return state.inner.roundScores;
  return state.inner.roundScores;
}

export function opinionsIsGameOver(state: OpinionsState): boolean {
  return state.inner.phase === "ended";
}

export function opinionsNeedsTick(state: OpinionsState): boolean {
  return state.inner.phase !== "ended";
}

export function resolveOpinionsScoringFromOptions(options: GameOptions): OpinionScoring {
  return resolveOpinionScoring(options);
}
