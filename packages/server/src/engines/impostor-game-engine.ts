import {
  resolveImpostorStyle,
  type GameAction,
  type GameOptions,
  type ImpostorStyle,
  type ImpostorCategory,
  type RoomContext,
} from "@party-games/shared";
import {
  createDrawImpostorState,
  drawImpostorHostView,
  drawImpostorPlayerView,
  onDrawImpostorAction,
  onDrawImpostorTick,
  type DrawImpostorState,
} from "./draw-impostor-engine.js";
import {
  createImpostorState,
  impostorHostView,
  impostorPlayerView,
  onImpostorAction,
  onImpostorTick,
  type ImpostorState,
} from "./impostor-engine.js";

export type ImpostorGameState =
  | { style: "verbal"; inner: ImpostorState }
  | { style: "draw"; inner: DrawImpostorState };

export function createImpostorGameState(
  style: ImpostorStyle,
  verbalPool: ImpostorCategory[],
  drawLocations: Array<{ name: string; category: string }>,
  playerIds: string[],
  gameOptions?: GameOptions,
): ImpostorGameState {
  if (style === "draw") {
    return { style: "draw", inner: createDrawImpostorState(drawLocations, playerIds, gameOptions) };
  }
  return { style: "verbal", inner: createImpostorState(verbalPool, playerIds, 4) };
}

function withImpostorStyle<T extends { data: Record<string, unknown> }>(view: T, style: ImpostorStyle): T {
  return { ...view, data: { ...view.data, impostorStyle: style } };
}

export function onImpostorGameAction(
  state: ImpostorGameState,
  playerId: string,
  action: GameAction,
  ctx: RoomContext,
): ImpostorGameState {
  if (state.style === "draw") {
    return { style: "draw", inner: onDrawImpostorAction(state.inner, playerId, action, ctx) };
  }
  return { style: "verbal", inner: onImpostorAction(state.inner, playerId, action, ctx) };
}

export function onImpostorGameTick(state: ImpostorGameState): ImpostorGameState {
  if (state.style === "draw") {
    return { style: "draw", inner: onDrawImpostorTick(state.inner) };
  }
  return { style: "verbal", inner: onImpostorTick(state.inner) };
}

export function impostorGameHostView(state: ImpostorGameState) {
  if (state.style === "draw") {
    return withImpostorStyle(drawImpostorHostView(state.inner), state.style);
  }
  return withImpostorStyle(impostorHostView(state.inner), state.style);
}

export function impostorGamePlayerView(state: ImpostorGameState, playerId: string) {
  if (state.style === "draw") {
    return withImpostorStyle(drawImpostorPlayerView(state.inner, playerId), state.style);
  }
  return withImpostorStyle(impostorPlayerView(state.inner, playerId), state.style);
}

export function impostorGameRoundScores(state: ImpostorGameState): Record<string, number> {
  return state.inner.roundScores;
}

export function impostorGameIsGameOver(state: ImpostorGameState): boolean {
  return state.inner.phase === "ended";
}

export function impostorGameNeedsTick(state: ImpostorGameState): boolean {
  return state.inner.phase !== "ended";
}

export function resolveImpostorGameStyle(options: GameOptions): ImpostorStyle {
  return resolveImpostorStyle(options);
}
