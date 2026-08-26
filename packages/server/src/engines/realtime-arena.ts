import type { GameAction } from "@party-games/shared";
import {
  createCurveState,
  fireWeapon,
  isFireablePowerUp,
  resetCurveRound,
  tickCurveState,
  tryJump,
  type CurveState,
} from "@party-games/shared";
import type { TrailDashOptions } from "@party-games/shared";
import { tickBots } from "./curve-bot.js";

export type { CurveState } from "@party-games/shared";

export function createCurveGameState(
  humanIds: string[],
  botIds: string[],
  botNames: Record<string, string>,
  options: TrailDashOptions,
): CurveState {
  return createCurveState(humanIds, botIds, botNames, options);
}

export function advanceCurve(state: CurveState, playerIds: string[], botIds: string[]): CurveState {
  if (state.phase === "instructions") {
    state.phase = "playing";
    state.timerEndsAt = Date.now() + state.options.roundTimeSec * 1000;
    for (const p of state.players) p.direction = "none";
    return state;
  }
  if (state.phase === "round_end") {
    if (state.round >= state.maxRounds) {
      state.phase = "ended";
      state.timerEndsAt = null;
      return state;
    }
    state.round += 1;
    const fresh = resetCurveRound(state, playerIds, botIds);
    fresh.round = state.round;
    fresh.maxRounds = state.maxRounds;
    return fresh;
  }
  return state;
}

export function onCurveAction(state: CurveState, playerId: string, action: GameAction): CurveState {
  if (action.kind === "curve_turn" && state.phase === "playing") {
    const p = state.players.find((pl) => pl.id === playerId);
    if (p?.alive) p.direction = action.direction;
  }
  if (action.kind === "curve_jump" && state.phase === "playing") {
    const p = state.players.find((pl) => pl.id === playerId);
    if (p) tryJump(p);
  }
  if (action.kind === "curve_fire" && state.phase === "playing") {
    const p = state.players.find((pl) => pl.id === playerId);
    if (p) fireWeapon(state, p);
  }
  if (action.kind === "advance" && state.phase === "instructions") {
    const botIds = state.players.filter((p) => p.isBot).map((p) => p.id);
    const humanIds = state.players.filter((p) => !p.isBot).map((p) => p.id);
    return advanceCurve(state, humanIds, botIds);
  }
  if (action.kind === "advance" && state.phase === "round_end") {
    const botIds = state.players.filter((p) => p.isBot).map((p) => p.id);
    const humanIds = state.players.filter((p) => !p.isBot).map((p) => p.id);
    return advanceCurve(state, humanIds, botIds);
  }
  return state;
}

export function onCurveTick(state: CurveState, playerIds: string[], botIds: string[]): CurveState {
  if (state.phase === "playing") {
    tickBots(state);
    tickCurveState(state);
    return state;
  }
  if (state.timerEndsAt && Date.now() >= state.timerEndsAt) {
    if (state.phase === "instructions" || state.phase === "round_end") {
      return advanceCurve(state, playerIds, botIds);
    }
  }
  return state;
}

export function curveHostView(state: CurveState) {
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    data: {
      width: state.width,
      height: state.height,
      players: state.players.map((p) => ({
        id: p.id,
        x: p.x,
        y: p.y,
        angle: p.angle,
        alive: p.alive,
        trail: p.trail,
        colorIndex: p.colorIndex,
        jumpTicksRemaining: p.jumpTicksRemaining,
        heldPowerUp: p.heldPowerUp,
        coinsThisRound: p.coinsThisRound,
        deathRank: p.deathRank,
      })),
      coins: state.coins,
      powerUps: state.powerUps,
      projectiles: state.projectiles,
      explosions: state.explosions,
      wallHoles: state.wallHoles,
      botNames: state.botNames,
      roundWinner: state.roundWinner,
      roundScores: state.roundScores,
      deathOrder: state.deathOrder,
      coinValue: state.options.coinValue,
      powerUpMode: state.options.powerUpMode,
    },
  };
}

export function curvePlayerView(state: CurveState, playerId: string) {
  const p = state.players.find((pl) => pl.id === playerId);
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    data: {
      alive: p?.alive,
      coinValue: state.options.coinValue,
      powerUpMode: state.options.powerUpMode,
    },
    playerData: {
      isAlive: p?.alive,
      jumpCooldown: p?.jumpCooldownTicks ?? 0,
      heldPowerUp: p?.heldPowerUp ?? null,
      coinsThisRound: p?.coinsThisRound ?? 0,
      canFire: isFireablePowerUp(p?.heldPowerUp ?? null),
    },
  };
}
