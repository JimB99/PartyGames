import { pickRandom, type GameAction, type RoomContext } from "@party-games/shared";

export type CurvePhase = "instructions" | "playing" | "round_end" | "ended";

export interface CurvePlayer {
  id: string;
  x: number;
  y: number;
  angle: number;
  alive: boolean;
  direction: "left" | "right" | "none";
  trail: Array<{ x: number; y: number }>;
  colorIndex: number;
}

export interface CurveState {
  phase: CurvePhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  width: number;
  height: number;
  players: CurvePlayer[];
  roundScores: Record<string, number>;
  roundWinner?: string;
}

const ARENA_W = 800;
const ARENA_H = 600;
const SPEED = 3;
const TURN_SPEED = 0.08;
const ROUND_MS = 90000;

export function createCurveState(playerIds: string[]): CurveState {
  const positions = [
    { x: 100, y: 100, angle: 0 },
    { x: ARENA_W - 100, y: 100, angle: Math.PI },
    { x: 100, y: ARENA_H - 100, angle: 0 },
    { x: ARENA_W - 100, y: ARENA_H - 100, angle: Math.PI },
    { x: ARENA_W / 2, y: 100, angle: Math.PI / 2 },
    { x: ARENA_W / 2, y: ARENA_H - 100, angle: -Math.PI / 2 },
    { x: 100, y: ARENA_H / 2, angle: 0 },
    { x: ARENA_W - 100, y: ARENA_H / 2, angle: Math.PI },
  ];
  const players: CurvePlayer[] = playerIds.map((id, i) => ({
    id,
    x: positions[i % positions.length].x,
    y: positions[i % positions.length].y,
    angle: positions[i % positions.length].angle,
    alive: true,
    direction: "none" as const,
    trail: [{ x: positions[i % positions.length].x, y: positions[i % positions.length].y }],
    colorIndex: i,
  }));
  return {
    phase: "instructions",
    round: 1,
    maxRounds: 3,
    timerEndsAt: Date.now() + 5000,
    width: ARENA_W,
    height: ARENA_H,
    players,
    roundScores: {},
  };
}

function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.hypot(ax - bx, ay - by);
}

function segmentHit(
  px: number, py: number,
  ax: number, ay: number,
  bx: number, by: number,
  threshold = 4,
): boolean {
  const dx = bx - ax;
  const dy = by - ay;
  const len = Math.hypot(dx, dy);
  if (len < 1) return dist(px, py, ax, ay) < threshold;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (len * len)));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return dist(px, py, cx, cy) < threshold;
}

function checkCollisions(state: CurveState) {
  for (const p of state.players) {
    if (!p.alive) continue;
    if (p.x < 5 || p.x > state.width - 5 || p.y < 5 || p.y > state.height - 5) {
      p.alive = false;
      continue;
    }
    for (const other of state.players) {
      const trail = other.trail;
      for (let i = 1; i < trail.length; i++) {
        if (segmentHit(p.x, p.y, trail[i - 1].x, trail[i - 1].y, trail[i].x, trail[i].y)) {
          p.alive = false;
          break;
        }
      }
      if (!p.alive) break;
    }
  }
}

export function tickCurve(state: CurveState): CurveState {
  if (state.phase !== "playing") return state;

  for (const p of state.players) {
    if (!p.alive) continue;
    if (p.direction === "left") p.angle -= TURN_SPEED;
    if (p.direction === "right") p.angle += TURN_SPEED;
    p.x += Math.cos(p.angle) * SPEED;
    p.y += Math.sin(p.angle) * SPEED;
    const last = p.trail[p.trail.length - 1];
    if (!last || dist(last.x, last.y, p.x, p.y) > 3) {
      p.trail.push({ x: p.x, y: p.y });
    }
  }
  checkCollisions(state);

  const alive = state.players.filter((p) => p.alive);
  if (alive.length <= 1 || (state.timerEndsAt && Date.now() >= state.timerEndsAt)) {
    state.roundWinner = alive[0]?.id;
    if (state.roundWinner) {
      state.roundScores[state.roundWinner] = (state.roundScores[state.roundWinner] ?? 0) + 1000;
    }
    state.phase = "round_end";
    state.timerEndsAt = Date.now() + 5000;
  }
  return state;
}

export function advanceCurve(state: CurveState, playerIds: string[]): CurveState {
  if (state.phase === "instructions") {
    state.phase = "playing";
    state.timerEndsAt = Date.now() + ROUND_MS;
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
    return resetCurveRound(state, playerIds);
  }
  return state;
}

function resetCurveRound(state: CurveState, playerIds: string[]): CurveState {
  const fresh = createCurveState(playerIds);
  state.players = fresh.players;
  state.phase = "instructions";
  state.timerEndsAt = Date.now() + 5000;
  state.roundWinner = undefined;
  return state;
}

export function onCurveAction(state: CurveState, playerId: string, action: GameAction): CurveState {
  if (action.kind === "curve_turn" && state.phase === "playing") {
    const p = state.players.find((pl) => pl.id === playerId);
    if (p?.alive) p.direction = action.direction;
  }
  if (action.kind === "advance" && state.phase === "instructions") {
    return advanceCurve(state, state.players.map((p) => p.id));
  }
  if (action.kind === "advance" && state.phase === "round_end") {
    return advanceCurve(state, state.players.map((p) => p.id));
  }
  return state;
}

export function onCurveTick(state: CurveState, playerIds: string[]): CurveState {
  if (state.phase === "playing") {
    tickCurve(state);
    return state;
  }
  if (state.timerEndsAt && Date.now() >= state.timerEndsAt) {
    if (state.phase === "instructions" || state.phase === "round_end") {
      return advanceCurve(state, playerIds);
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
      })),
      roundWinner: state.roundWinner,
      roundScores: state.roundScores,
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
    },
    playerData: {
      isAlive: p?.alive,
    },
  };
}
