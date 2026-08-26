import type { PowerUpMode, TrailDashOptions } from "./trail-dash-options.js";
import { rankPointsForPlace } from "./trail-dash-options.js";

export type CurvePhase = "instructions" | "playing" | "round_end" | "ended";
export type TurnDirection = "left" | "right" | "none";
export type PowerUpKind = "speed" | "gap" | "shrink" | "missile" | "grenade";
export type WallEdge = "top" | "bottom" | "left" | "right";

export const ARENA_W = 800;
export const ARENA_H = 600;
export const BASE_SPEED = 3;
export const BASE_TURN_SPEED = 0.08;
export const DEFAULT_HIT_RADIUS = 4;
export const SHRINK_HIT_RADIUS = 2;
export const TRAIL_POINT_DIST = 3;
export const WALL_MARGIN = 5;
export const JUMP_DURATION_TICKS = 15;
export const JUMP_COOLDOWN_TICKS = 75;
export const SPEED_MULTIPLIER = 1.6;
export const SPEED_EFFECT_TICKS = 125;
export const GAP_EFFECT_TICKS = 50;
export const SHRINK_EFFECT_TICKS = 125;
export const COIN_PICKUP_RADIUS = 12;
export const POWERUP_PICKUP_RADIUS = 14;
export const GRENADE_FUSE_TICKS = 38;
export const GRENADE_RADIUS = 60;
export const MISSILE_SPEED = 8;
export const GRENADE_SPEED = 4;
export const EXPLOSION_DISPLAY_TICKS = 10;

export interface TrailPoint {
  x: number;
  y: number;
}

export interface WallHole {
  edge: WallEdge;
  start: number;
  length: number;
}

export interface CurvePlayer {
  id: string;
  x: number;
  y: number;
  angle: number;
  alive: boolean;
  direction: TurnDirection;
  trail: TrailPoint[];
  colorIndex: number;
  jumpTicksRemaining: number;
  jumpCooldownTicks: number;
  gapTicksRemaining: number;
  speedMultiplier: number;
  speedEffectTicks: number;
  shrinkEffectTicks: number;
  hitRadius: number;
  heldPowerUp: PowerUpKind | null;
  coinsThisRound: number;
  deathRank: number | null;
  isBot: boolean;
}

export interface Coin {
  id: string;
  x: number;
  y: number;
}

export interface PowerUpPickup {
  id: string;
  kind: PowerUpKind;
  x: number;
  y: number;
}

export interface Projectile {
  id: string;
  ownerId: string;
  kind: "missile" | "grenade";
  x: number;
  y: number;
  vx: number;
  vy: number;
  fuseTicks: number | null;
}

export interface Explosion {
  x: number;
  y: number;
  radius: number;
  ticksRemaining: number;
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
  botNames: Record<string, string>;
  coins: Coin[];
  powerUps: PowerUpPickup[];
  projectiles: Projectile[];
  explosions: Explosion[];
  wallHoles: WallHole[];
  deathOrder: string[];
  options: TrailDashOptions;
}

const SPAWN_POSITIONS = [
  { x: 100, y: 100, angle: 0 },
  { x: ARENA_W - 100, y: 100, angle: Math.PI },
  { x: 100, y: ARENA_H - 100, angle: 0 },
  { x: ARENA_W - 100, y: ARENA_H - 100, angle: Math.PI },
  { x: ARENA_W / 2, y: 100, angle: Math.PI / 2 },
  { x: ARENA_W / 2, y: ARENA_H - 100, angle: -Math.PI / 2 },
  { x: 100, y: ARENA_H / 2, angle: 0 },
  { x: ARENA_W - 100, y: ARENA_H / 2, angle: Math.PI },
];

export function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

export function segmentHit(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  threshold = DEFAULT_HIT_RADIUS,
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

function createPlayer(id: string, index: number, isBot: boolean): CurvePlayer {
  const pos = SPAWN_POSITIONS[index % SPAWN_POSITIONS.length];
  return {
    id,
    x: pos.x,
    y: pos.y,
    angle: pos.angle,
    alive: true,
    direction: "none",
    trail: [{ x: pos.x, y: pos.y }],
    colorIndex: index,
    jumpTicksRemaining: 0,
    jumpCooldownTicks: 0,
    gapTicksRemaining: 0,
    speedMultiplier: 1,
    speedEffectTicks: 0,
    shrinkEffectTicks: 0,
    hitRadius: DEFAULT_HIT_RADIUS,
    heldPowerUp: null,
    coinsThisRound: 0,
    deathRank: null,
    isBot,
  };
}

export function generateWallHoles(count: number, width: number, height: number): WallHole[] {
  if (count <= 0) return [];
  const edges: WallEdge[] = ["top", "bottom", "left", "right"];
  const holes: WallHole[] = [];
  const holeLength = 80;
  for (let i = 0; i < count; i++) {
    const edge = edges[i % edges.length];
    const maxStart = edge === "top" || edge === "bottom" ? width - holeLength - 40 : height - holeLength - 40;
    const start = 40 + ((i + 1) * 137) % Math.max(1, maxStart);
    holes.push({ edge, start, length: holeLength });
  }
  return holes;
}

function coinCountForMode(mode: PowerUpMode): number {
  if (mode === "off") return 4;
  if (mode === "chaos") return 10;
  return 6;
}

function powerUpCountForMode(mode: PowerUpMode): number {
  if (mode === "off") return 0;
  if (mode === "chaos") return 8;
  return 4;
}

function spawnCoins(count: number, width: number, height: number, seed: number): Coin[] {
  const coins: Coin[] = [];
  for (let i = 0; i < count; i++) {
    const x = 60 + ((seed + i * 97) % (width - 120));
    const y = 60 + ((seed + i * 53) % (height - 120));
    coins.push({ id: `coin-${i}`, x, y });
  }
  return coins;
}

const ALL_POWERUP_KINDS: PowerUpKind[] = ["speed", "gap", "shrink", "missile", "grenade"];

function spawnPowerUps(count: number, width: number, height: number, seed: number): PowerUpPickup[] {
  const pickups: PowerUpPickup[] = [];
  for (let i = 0; i < count; i++) {
    const x = 80 + ((seed + i * 71) % (width - 160));
    const y = 80 + ((seed + i * 43) % (height - 160));
    const kind = ALL_POWERUP_KINDS[(seed + i) % ALL_POWERUP_KINDS.length];
    pickups.push({ id: `pu-${i}`, kind, x, y });
  }
  return pickups;
}

export function createCurveState(
  playerIds: string[],
  botIds: string[],
  botNames: Record<string, string>,
  options: TrailDashOptions,
  round = 1,
): CurveState {
  const allIds = [...playerIds, ...botIds];
  const players = allIds.map((id, i) => createPlayer(id, i, botIds.includes(id)));
  const seed = round * 1000 + allIds.length;
  return {
    phase: "instructions",
    round,
    maxRounds: options.maxRounds,
    timerEndsAt: Date.now() + 5000,
    width: ARENA_W,
    height: ARENA_H,
    players,
    roundScores: {},
    botNames,
    coins: spawnCoins(coinCountForMode(options.powerUpMode), ARENA_W, ARENA_H, seed),
    powerUps:
      options.powerUpMode === "off"
        ? []
        : spawnPowerUps(powerUpCountForMode(options.powerUpMode), ARENA_W, ARENA_H, seed + 7),
    projectiles: [],
    explosions: [],
    wallHoles: generateWallHoles(options.wallHoles, ARENA_W, ARENA_H),
    deathOrder: [],
    options,
  };
}

function isInHole(
  x: number,
  y: number,
  holes: WallHole[],
  width: number,
  height: number,
): WallHole | null {
  for (const hole of holes) {
    if (hole.edge === "top" && y <= WALL_MARGIN && x >= hole.start && x <= hole.start + hole.length) {
      return hole;
    }
    if (hole.edge === "bottom" && y >= height - WALL_MARGIN && x >= hole.start && x <= hole.start + hole.length) {
      return hole;
    }
    if (hole.edge === "left" && x <= WALL_MARGIN && y >= hole.start && y <= hole.start + hole.length) {
      return hole;
    }
    if (hole.edge === "right" && x >= width - WALL_MARGIN && y >= hole.start && y <= hole.start + hole.length) {
      return hole;
    }
  }
  return null;
}

export function wrapThroughHole(
  x: number,
  y: number,
  hole: WallHole,
  width: number,
  height: number,
): { x: number; y: number } {
  switch (hole.edge) {
    case "top":
      return { x, y: height - WALL_MARGIN - 10 };
    case "bottom":
      return { x, y: WALL_MARGIN + 10 };
    case "left":
      return { x: width - WALL_MARGIN - 10, y };
    case "right":
      return { x: WALL_MARGIN + 10, y };
  }
}

function checkWallCollision(
  p: CurvePlayer,
  width: number,
  height: number,
  holes: WallHole[],
): boolean {
  if (isInHole(p.x, p.y, holes, width, height)) {
    const wrapped = wrapThroughHole(p.x, p.y, isInHole(p.x, p.y, holes, width, height)!, width, height);
    p.x = wrapped.x;
    p.y = wrapped.y;
    return false;
  }
  return p.x < WALL_MARGIN || p.x > width - WALL_MARGIN || p.y < WALL_MARGIN || p.y > height - WALL_MARGIN;
}

export function checkTrailCollisions(state: CurveState): void {
  for (const p of state.players) {
    if (!p.alive || p.jumpTicksRemaining > 0) continue;

    if (checkWallCollision(p, state.width, state.height, state.wallHoles)) {
      killPlayer(state, p);
      continue;
    }

    for (const other of state.players) {
      if (other.id === p.id) continue;
      const trail = other.trail;
      for (let i = 1; i < trail.length; i++) {
        if (segmentHit(p.x, p.y, trail[i - 1].x, trail[i - 1].y, trail[i].x, trail[i].y, p.hitRadius)) {
          killPlayer(state, p);
          break;
        }
      }
      if (!p.alive) break;
    }

    if (!p.alive) continue;

    // Own trail — skip last segment (head sits on endpoint)
    const ownTrail = p.trail;
    for (let i = 1; i < ownTrail.length - 1; i++) {
      if (segmentHit(p.x, p.y, ownTrail[i - 1].x, ownTrail[i - 1].y, ownTrail[i].x, ownTrail[i].y, p.hitRadius)) {
        killPlayer(state, p);
        break;
      }
    }
  }
}

function killPlayer(state: CurveState, p: CurvePlayer): void {
  if (!p.alive) return;
  p.alive = false;
  state.deathOrder.push(p.id);
  p.deathRank = state.players.filter((pl) => pl.alive).length + 1;
}

export function tickPlayerEffects(p: CurvePlayer): void {
  if (p.jumpTicksRemaining > 0) p.jumpTicksRemaining--;
  if (p.jumpCooldownTicks > 0) p.jumpCooldownTicks--;
  if (p.gapTicksRemaining > 0) p.gapTicksRemaining--;
  if (p.speedEffectTicks > 0) {
    p.speedEffectTicks--;
    if (p.speedEffectTicks === 0) p.speedMultiplier = 1;
  }
  if (p.shrinkEffectTicks > 0) {
    p.shrinkEffectTicks--;
    if (p.shrinkEffectTicks === 0) p.hitRadius = DEFAULT_HIT_RADIUS;
  }
}

export function movePlayer(p: CurvePlayer, turnSpeed: number): void {
  if (!p.alive) return;
  if (p.direction === "left") p.angle -= turnSpeed;
  if (p.direction === "right") p.angle += turnSpeed;
  const speed = BASE_SPEED * p.speedMultiplier;
  p.x += Math.cos(p.angle) * speed;
  p.y += Math.sin(p.angle) * speed;

  const shouldDrawTrail = p.jumpTicksRemaining <= 0 && p.gapTicksRemaining <= 0;
  if (shouldDrawTrail) {
    const last = p.trail[p.trail.length - 1];
    if (!last || dist(last.x, last.y, p.x, p.y) > TRAIL_POINT_DIST) {
      p.trail.push({ x: p.x, y: p.y });
    }
  }
}

export function collectPickups(state: CurveState): void {
  for (const p of state.players) {
    if (!p.alive) continue;
    state.coins = state.coins.filter((c) => {
      if (dist(p.x, p.y, c.x, c.y) < COIN_PICKUP_RADIUS) {
        p.coinsThisRound += state.options.coinValue;
        return false;
      }
      return true;
    });
    state.powerUps = state.powerUps.filter((pu) => {
      if (dist(p.x, p.y, pu.x, pu.y) < POWERUP_PICKUP_RADIUS) {
        applyPowerUp(p, pu.kind);
        return false;
      }
      return true;
    });
  }
}

export function applyPowerUp(p: CurvePlayer, kind: PowerUpKind): void {
  switch (kind) {
    case "speed":
      p.speedMultiplier = SPEED_MULTIPLIER;
      p.speedEffectTicks = SPEED_EFFECT_TICKS;
      break;
    case "gap":
      p.gapTicksRemaining = GAP_EFFECT_TICKS;
      break;
    case "shrink":
      p.hitRadius = SHRINK_HIT_RADIUS;
      p.shrinkEffectTicks = SHRINK_EFFECT_TICKS;
      break;
    case "missile":
    case "grenade":
      p.heldPowerUp = kind;
      break;
  }
}

export function tryJump(p: CurvePlayer): boolean {
  if (!p.alive || p.jumpTicksRemaining > 0 || p.jumpCooldownTicks > 0) return false;
  p.jumpTicksRemaining = JUMP_DURATION_TICKS;
  p.jumpCooldownTicks = JUMP_COOLDOWN_TICKS;
  return true;
}

export function fireWeapon(state: CurveState, p: CurvePlayer): boolean {
  if (!p.alive || !p.heldPowerUp) return false;
  const kind = p.heldPowerUp;
  p.heldPowerUp = null;

  if (kind === "missile") {
    state.projectiles.push({
      id: `proj-${Date.now()}-${p.id}`,
      ownerId: p.id,
      kind: "missile",
      x: p.x,
      y: p.y,
      vx: Math.cos(p.angle) * MISSILE_SPEED,
      vy: Math.sin(p.angle) * MISSILE_SPEED,
      fuseTicks: null,
    });
  } else {
    state.projectiles.push({
      id: `proj-${Date.now()}-${p.id}`,
      ownerId: p.id,
      kind: "grenade",
      x: p.x,
      y: p.y,
      vx: Math.cos(p.angle) * GRENADE_SPEED,
      vy: Math.sin(p.angle) * GRENADE_SPEED,
      fuseTicks: GRENADE_FUSE_TICKS,
    });
  }
  return true;
}

export function tickProjectiles(state: CurveState): void {
  const width = state.width;
  const height = state.height;
  const remaining: Projectile[] = [];

  for (const proj of state.projectiles) {
    proj.x += proj.vx;
    proj.y += proj.vy;

    if (proj.kind === "grenade" && proj.fuseTicks !== null) {
      proj.fuseTicks--;
      if (proj.fuseTicks <= 0) {
        detonateGrenade(state, proj.x, proj.y, proj.ownerId);
        continue;
      }
    }

    if (proj.x < 0 || proj.x > width || proj.y < 0 || proj.y > height) {
      if (proj.kind === "grenade") {
        detonateGrenade(state, proj.x, proj.y, proj.ownerId);
      }
      continue;
    }

    let hit = false;
    for (const p of state.players) {
      if (!p.alive || p.id === proj.ownerId) continue;
      if (dist(proj.x, proj.y, p.x, p.y) < p.hitRadius + 4) {
        killPlayer(state, p);
        hit = true;
        break;
      }
    }
    if (hit && proj.kind === "missile") continue;

    remaining.push(proj);
  }
  state.projectiles = remaining;
}

export function detonateGrenade(state: CurveState, x: number, y: number, ownerId: string): void {
  state.explosions.push({ x, y, radius: GRENADE_RADIUS, ticksRemaining: EXPLOSION_DISPLAY_TICKS });
  eraseTrailsInRadius(state, x, y, GRENADE_RADIUS);
  for (const p of state.players) {
    if (!p.alive) continue;
    if (dist(x, y, p.x, p.y) < GRENADE_RADIUS) {
      killPlayer(state, p);
    }
  }
}

export function eraseTrailsInRadius(state: CurveState, cx: number, cy: number, radius: number): void {
  for (const p of state.players) {
    const kept: TrailPoint[] = [];
    for (let i = 0; i < p.trail.length; i++) {
      const pt = p.trail[i];
      if (dist(cx, cy, pt.x, pt.y) >= radius) {
        kept.push(pt);
      } else if (kept.length === 0) {
        // Keep at least one point so trail isn't empty
        kept.push(pt);
      }
    }
    if (kept.length === 0 && p.trail.length > 0) {
      kept.push(p.trail[p.trail.length - 1]);
    }
    p.trail = kept;
  }
}

export function tickExplosions(state: CurveState): void {
  state.explosions = state.explosions
    .map((e) => ({ ...e, ticksRemaining: e.ticksRemaining - 1 }))
    .filter((e) => e.ticksRemaining > 0);
}

export function computeRoundScores(state: CurveState): Record<string, number> {
  const scores: Record<string, number> = {};
  const alive = state.players.filter((p) => p.alive);
  const totalPlayers = state.players.length;

  // Survivors get best ranks first
  let rank = 1;
  for (const p of alive) {
    const pts = rankPointsForPlace(rank, state.options.rankPointScale);
    scores[p.id] = (scores[p.id] ?? 0) + pts + p.coinsThisRound;
    rank++;
  }

  // Dead players by reverse death order (last to die = better rank)
  const deadReversed = [...state.deathOrder].reverse();
  for (const id of deadReversed) {
    const p = state.players.find((pl) => pl.id === id);
    if (!p) continue;
    const pts = rankPointsForPlace(rank, state.options.rankPointScale);
    scores[id] = (scores[id] ?? 0) + pts + p.coinsThisRound;
    rank++;
  }

  // Merge into roundScores
  for (const [id, pts] of Object.entries(scores)) {
    state.roundScores[id] = (state.roundScores[id] ?? 0) + pts;
  }

  return scores;
}

export function tickCurveState(state: CurveState): CurveState {
  if (state.phase !== "playing") return state;

  for (const p of state.players) {
    tickPlayerEffects(p);
    movePlayer(p, BASE_TURN_SPEED);
  }

  checkTrailCollisions(state);
  collectPickups(state);
  tickProjectiles(state);
  tickExplosions(state);

  const alive = state.players.filter((p) => p.alive);
  if (alive.length <= 1 || (state.timerEndsAt && Date.now() >= state.timerEndsAt)) {
    state.roundWinner = alive[0]?.id;
    computeRoundScores(state);
    state.phase = "round_end";
    state.timerEndsAt = Date.now() + 5000;
  }
  return state;
}

export function resetCurveRound(state: CurveState, playerIds: string[], botIds: string[]): CurveState {
  const fresh = createCurveState(
    playerIds.filter((id) => !botIds.includes(id)),
    botIds,
    state.botNames,
    state.options,
    state.round,
  );
  fresh.roundScores = { ...state.roundScores };
  return fresh;
}

/** Raycast ahead for bot AI — returns distance to nearest obstacle */
export function raycastAhead(
  x: number,
  y: number,
  angle: number,
  players: CurvePlayer[],
  selfId: string,
  maxDist: number,
  width: number,
  height: number,
): number {
  const steps = Math.floor(maxDist / 4);
  for (let i = 1; i <= steps; i++) {
    const px = x + Math.cos(angle) * i * 4;
    const py = y + Math.sin(angle) * i * 4;
    if (px < WALL_MARGIN || px > width - WALL_MARGIN || py < WALL_MARGIN || py > height - WALL_MARGIN) {
      return i * 4;
    }
    for (const other of players) {
      const trail = other.trail;
      const start = other.id === selfId ? 0 : 0;
      const end = other.id === selfId ? trail.length - 1 : trail.length;
      for (let j = 1; j < end; j++) {
        if (segmentHit(px, py, trail[j - 1].x, trail[j - 1].y, trail[j].x, trail[j].y, DEFAULT_HIT_RADIUS)) {
          return i * 4;
        }
      }
    }
  }
  return maxDist;
}
