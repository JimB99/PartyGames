import {
  resolveDrawVoteStyle,
  resolveDrawingStyle,
  type DrawingStyle,
  type GameAction,
  type GameOptions,
  type RoomContext,
} from "@party-games/shared";
import {
  chainHostView,
  chainPlayerView,
  createChainSketchState,
  onChainAction,
  onChainTick,
  type ChainSketchState,
} from "./chain-sketch-engine.js";
import {
  createDrawVoteState,
  drawVoteHostView,
  drawVotePlayerView,
  onDrawVoteAction,
  onDrawVoteTick,
  type DrawVoteState,
} from "./draw-vote-engine.js";
import {
  createDrawState,
  drawHostView,
  drawPlayerView,
  onDrawAction,
  onDrawTick,
  type DrawState,
} from "./drawing-engine.js";

export type DrawingGameState =
  | { style: "pictionary"; inner: DrawState }
  | { style: "telephone"; inner: ChainSketchState }
  | { style: "all-draw"; inner: DrawVoteState };

export function createDrawingGameState(
  style: DrawingStyle,
  words: string[],
  playerIds: string[],
  gameOptions?: GameOptions,
): DrawingGameState {
  if (style === "telephone") {
    return { style: "telephone", inner: createChainSketchState(words, playerIds, gameOptions) };
  }
  if (style === "all-draw") {
    const voteStyle = resolveDrawVoteStyle(gameOptions ?? { contentRating: "family", difficulty: "mixed" });
    const mode = voteStyle === "guess-artist" ? "artistGuess" : "bestDrawing";
    return {
      style: "all-draw",
      inner: createDrawVoteState(words, playerIds, mode, 3, gameOptions),
    };
  }
  return { style: "pictionary", inner: createDrawState(words, playerIds, undefined, gameOptions) };
}

function withDrawingStyle<T extends { data: Record<string, unknown> }>(
  view: T,
  style: DrawingStyle,
  drawVoteStyle?: "best-drawing" | "guess-artist",
): T {
  return {
    ...view,
    data: {
      ...view.data,
      drawingStyle: style,
      ...(drawVoteStyle ? { drawVoteStyle } : {}),
    },
  };
}

export function onDrawingGameAction(
  state: DrawingGameState,
  playerId: string,
  action: GameAction,
  ctx: RoomContext,
): DrawingGameState {
  if (state.style === "telephone") {
    return { style: "telephone", inner: onChainAction(state.inner, playerId, action, ctx) };
  }
  if (state.style === "all-draw") {
    return { style: "all-draw", inner: onDrawVoteAction(state.inner, playerId, action, ctx) };
  }
  return { style: "pictionary", inner: onDrawAction(state.inner, playerId, action, ctx) };
}

export function onDrawingGameTick(state: DrawingGameState, playerIds: string[]): DrawingGameState {
  if (state.style === "telephone") {
    return { style: "telephone", inner: onChainTick(state.inner) };
  }
  if (state.style === "all-draw") {
    return {
      style: "all-draw",
      inner: onDrawVoteTick(state.inner, state.inner.wordsPool, playerIds),
    };
  }
  return { style: "pictionary", inner: onDrawTick(state.inner, undefined, playerIds) };
}

export function drawingGameHostView(state: DrawingGameState, playerIds: string[], gameOptions?: GameOptions) {
  if (state.style === "telephone") {
    return withDrawingStyle(chainHostView(state.inner), state.style);
  }
  if (state.style === "all-draw") {
    const voteStyle = resolveDrawVoteStyle(gameOptions ?? { contentRating: "family", difficulty: "mixed" });
    return withDrawingStyle(drawVoteHostView(state.inner), state.style, voteStyle);
  }
  return withDrawingStyle(drawHostView(state.inner, playerIds), state.style);
}

export function drawingGamePlayerView(state: DrawingGameState, playerId: string, playerIds: string[], gameOptions?: GameOptions) {
  if (state.style === "telephone") {
    return withDrawingStyle(chainPlayerView(state.inner, playerId), state.style);
  }
  if (state.style === "all-draw") {
    const voteStyle = resolveDrawVoteStyle(gameOptions ?? { contentRating: "family", difficulty: "mixed" });
    return withDrawingStyle(drawVotePlayerView(state.inner, playerId), state.style, voteStyle);
  }
  return withDrawingStyle(drawPlayerView(state.inner, playerId, playerIds), state.style);
}

export function drawingGameRoundScores(state: DrawingGameState): Record<string, number> {
  return state.inner.roundScores;
}

export function drawingGameIsGameOver(state: DrawingGameState): boolean {
  return state.inner.phase === "ended";
}

export function drawingGameNeedsTick(state: DrawingGameState): boolean {
  return state.inner.phase !== "ended";
}
