import type { PowerUpMode, TrailDashOptions } from "./trail-dash-options.js";
import { rankPointsByPercentile } from "./speed-scoring.js";

export type CurvePhase = "instructions" | "playing" | "round_end" | "ended";
export type TurnDirection = "left" | "right" | "none";
export type PowerUpKind = "speed" | "gap" | "double_jump" | "missile" | "grenade" | "burst";
export type WallEdge = "top" | "bottom" | "left" | "right";

export const ARENA_W = 1200;
export const ARENA_H = 900;
export const BASE_SPEED = 3;
export const BASE_TURN_SPEED = 0.08;
export const DEFAULT_HIT_RADIUS = 4;
export const TRAIL_POINT_DIST = 3;
/** Recent own-trail length (px) that cannot cause self-collision — allows steering without instant death. */
export const OWN_TRAIL_IMMUNE_DIST = 12;
export const WALL_MARGIN = 5;
export const WALL_THICKNESS = 24;
export const JUMP_DURATION_TICKS = 15;
export const JUMP_COOLDOWN_TICKS = 75;
/** @deprecated Jump phasing is tied to jumpTicksRemaining, not a separate timer. */
export const JUMP_PHASE_TICKS = 40;
/** Ticks of trail immunity after using a warp portal. */
export const WARP_PHASE_TICKS = 35;
export const SPEED_MULTIPLIER = 1.6;
export const SPEED_EFFECT_TICKS = 125;
/** ~⅓ arena width at base speed (1200 / 3 = 400px → 135 ticks × 3px). */
export const GAP_EFFECT_TICKS = 135;
export const COIN_PICKUP_RADIUS = 12;
export const POWERUP_PICKUP_RADIUS = 14;
export const GRENADE_FUSE_TICKS = 55;
export const GRENADE_RADIUS = 60;
export const MISSILE_SPEED = 8;
export const GRENADE_SPEED = 9;
export const MISSILE_HOMING_TURN_RATE = 0.045;
export const MISSILE_EXPLOSION_RADIUS = 35;
export const BURST_VOLLEYS = 3;
export const BURST_BULLETS_PER_VOLLEY = 10;
export const WARP_PAIR_COUNT = 2;
export const WARP_PORTAL_LENGTH = 90;
export const PORTAL_EDGE_MARGIN = 80;
export const PORTAL_MIN_GAP = 28;
export const WARP_PAIR_COLORS = ["#00E5FF", "#FF6B00"] as const;
/** Interior playable margin — matches visible wall thickness. */
export const PLAYABLE_MARGIN = WALL_THICKNESS + 4;
export const BURST_VOLLEY_GAP_TICKS = 30;
export const COIN_SPAWN_INTERVAL_MIN = 45;
export const COIN_SPAWN_INTERVAL_MAX = 110;
export const POWERUP_SPAWN_INTERVAL_MIN = 90;
export const POWERUP_SPAWN_INTERVAL_MAX = 220;
export const PICKUP_CLEAR_RADIUS = 36;
export const EXPLOSION_DISPLAY_TICKS = 10;

export interface TrailPoint {
  x: number;
  y: number;
  /** When true, the next trail segment must not connect to the previous one. */
  break?: boolean;
}

export interface WallHole {
  id: string;
  pairId: string;
  pairColor: string;
  pairLabel: string;
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
  /** Pass through trails while > 0 (jump, warp landing). */
  phasingTicks: number;
  extraJumps: number;
  gapTicksRemaining: number;
  speedMultiplier: number;
  speedEffectTicks: number;
  hitRadius: number;
  heldPowerUp: PowerUpKind | null;
  burstVolleysRemaining: number;
  burstVolleyCooldown: number;
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
  /** Heat-seeking missiles track the nearest enemy with a limited turn rate. */
  homing?: boolean;
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
  timerTotalMs: number | null;
  width: number;
  height: number;
  players: CurvePlayer[];
  roundScores: Record<string, number>;
  lastRoundScores: Record<string, number>;
  roundWinner?: string;
  botNames: Record<string, string>;
  coins: Coin[];
  powerUps: PowerUpPickup[];
  projectiles: Projectile[];
  explosions: Explosion[];
  wallHoles: WallHole[];
  deathOrder: string[];
  options: TrailDashOptions;
  pickupTick: number;
  nextCoinSpawnIn: number;
  nextPowerUpSpawnIn: number;
}

const SPAWN_MARGIN = 120;

const SPAWN_POSITIONS = [
  { x: SPAWN_MARGIN, y: SPAWN_MARGIN, angle: 0 },
  { x: ARENA_W - SPAWN_MARGIN, y: SPAWN_MARGIN, angle: Math.PI },
  { x: SPAWN_MARGIN, y: ARENA_H - SPAWN_MARGIN, angle: 0 },
  { x: ARENA_W - SPAWN_MARGIN, y: ARENA_H - SPAWN_MARGIN, angle: Math.PI },
  { x: ARENA_W / 2, y: SPAWN_MARGIN, angle: Math.PI / 2 },
  { x: ARENA_W / 2, y: ARENA_H - SPAWN_MARGIN, angle: -Math.PI / 2 },
  { x: SPAWN_MARGIN, y: ARENA_H / 2, angle: 0 },
  { x: ARENA_W - SPAWN_MARGIN, y: ARENA_H / 2, angle: Math.PI },
];

export function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

/** How many trailing segments at the tail are immune to self-collision. */
export function ownTrailImmuneSegmentCount(trail: TrailPoint[], immuneDist = OWN_TRAIL_IMMUNE_DIST): number {
  if (trail.length < 2) return trail.length - 1;
  let accumulated = 0;
  let segments = 0;
  for (let i = trail.length - 1; i >= 1; i--) {
    if (trail[i].break) break;
    accumulated += dist(trail[i].x, trail[i].y, trail[i - 1].x, trail[i - 1].y);
    segments++;
    if (accumulated >= immuneDist) break;
  }
  return segments;
}

/** Split a trail into drawable / collidable line segments (skips breaks). */
export function trailLineSegments(trail: TrailPoint[]): Array<[TrailPoint, TrailPoint]> {
  const segments: Array<[TrailPoint, TrailPoint]> = [];
  for (let i = 1; i < trail.length; i++) {
    if (trail[i].break || trail[i - 1].break) continue;
    segments.push([trail[i - 1], trail[i]]);
  }
  return segments;
}

export function appendTrailBreak(p: CurvePlayer): void {
  const last = p.trail[p.trail.length - 1];
  if (last?.break) return;
  p.trail.push({ x: p.x, y: p.y, break: true });
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
  if (dist(px, py, ax, ay) < threshold || dist(px, py, bx, by) < threshold) return true;
  if (len < 0.5) return dist(px, py, ax, ay) < threshold;
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
    phasingTicks: 0,
    extraJumps: 0,
    gapTicksRemaining: 0,
    speedMultiplier: 1,
    speedEffectTicks: 0,
    hitRadius: DEFAULT_HIT_RADIUS,
    heldPowerUp: null,
    burstVolleysRemaining: 0,
    burstVolleyCooldown: 0,
    coinsThisRound: 0,
    deathRank: null,
    isBot,
  };
}

export function generateWarpPairs(width: number, height: number, seed: number): WallHole[] {
  const portals: WallHole[] = [];
  const allEdges: WallEdge[] = ["top", "bottom", "left", "right"];

  for (let pair = 0; pair < WARP_PAIR_COUNT; pair++) {
    const pairId = `pair-${pair}`;
    const pairColor = WARP_PAIR_COLORS[pair % WARP_PAIR_COLORS.length];
    const pairLabel = pair === 0 ? "A" : "B";
    const shuffled = [...allEdges].sort(
      (a, b) => seededUnit(seed + pair * 97 + a.charCodeAt(0)) - seededUnit(seed + pair * 97 + b.charCodeAt(0)),
    );
    const usedEdges: WallEdge[] = [];

    for (let side = 0; side < 2; side++) {
      let placed = false;
      for (let attempt = 0; attempt < 80 && !placed; attempt++) {
        const edge = shuffled[(side + attempt) % shuffled.length];
        if (usedEdges.includes(edge)) continue;

        const axisLength = edge === "top" || edge === "bottom" ? width : height;
        const maxStart = axisLength - WARP_PORTAL_LENGTH - PORTAL_EDGE_MARGIN;
        const range = Math.max(1, maxStart - PORTAL_EDGE_MARGIN);
        const start =
          PORTAL_EDGE_MARGIN +
          Math.floor(seededUnit(seed + pair * 137 + side * 211 + attempt * 43) * range);

        if (!isPortalPlacementValid(edge, start, portals, width, height)) continue;

        portals.push({
          id: `portal-${pair}-${side}`,
          pairId,
          pairColor,
          pairLabel,
          edge,
          start,
          length: WARP_PORTAL_LENGTH,
        });
        usedEdges.push(edge);
        placed = true;
      }
    }
  }
  return portals;
}

function portalSpan(hole: WallHole): [number, number] {
  return [hole.start, hole.start + hole.length];
}

function spansOverlap(a: [number, number], b: [number, number], gap: number): boolean {
  return a[0] < b[1] + gap && b[0] < a[1] + gap;
}

function isPortalPlacementValid(
  edge: WallEdge,
  start: number,
  existing: WallHole[],
  width: number,
  height: number,
): boolean {
  const axisLength = edge === "top" || edge === "bottom" ? width : height;
  if (start < PORTAL_EDGE_MARGIN || start + WARP_PORTAL_LENGTH > axisLength - PORTAL_EDGE_MARGIN) {
    return false;
  }
  const candidate: [number, number] = [start, start + WARP_PORTAL_LENGTH];
  for (const portal of existing) {
    if (portal.edge !== edge) continue;
    if (spansOverlap(candidate, portalSpan(portal), PORTAL_MIN_GAP)) return false;
  }
  return true;
}

function seededUnit(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function maxConcurrentCoins(mode: PowerUpMode): number {
  if (mode === "chaos") return 8;
  if (mode === "off") return 5;
  return 4;
}

function maxConcurrentPowerUps(mode: PowerUpMode): number {
  if (mode === "off") return 0;
  if (mode === "chaos") return 4;
  return 2;
}

function spawnInterval(min: number, max: number, seed: number): number {
  return min + Math.floor(seededUnit(seed) * (max - min + 1));
}

function isPositionClear(state: CurveState, x: number, y: number, radius: number): boolean {
  for (const p of state.players) {
    if (dist(x, y, p.x, p.y) < radius + 24) return false;
    for (const pt of p.trail) {
      if (!pt.break && dist(x, y, pt.x, pt.y) < radius) return false;
    }
  }
  for (const c of state.coins) {
    if (dist(x, y, c.x, c.y) < radius) return false;
  }
  for (const pu of state.powerUps) {
    if (dist(x, y, pu.x, pu.y) < radius) return false;
  }
  return true;
}

function findEmptySpawnPosition(state: CurveState, salt: number): { x: number; y: number } | null {
  const pad = PLAYABLE_MARGIN + 24;
  const maxX = state.width - pad;
  const maxY = state.height - pad;
  for (let attempt = 0; attempt < 48; attempt++) {
    const seed = state.pickupTick * 31 + salt * 17 + attempt * 113;
    const x = pad + seededUnit(seed) * (maxX - pad);
    const y = pad + seededUnit(seed + 59) * (maxY - pad);
    if (isPositionClear(state, x, y, PICKUP_CLEAR_RADIUS)) {
      return { x, y };
    }
  }
  return null;
}

function tickPickupSpawns(state: CurveState): void {
  state.pickupTick++;

  if (state.pickupTick >= state.nextCoinSpawnIn) {
    state.nextCoinSpawnIn =
      state.pickupTick + spawnInterval(COIN_SPAWN_INTERVAL_MIN, COIN_SPAWN_INTERVAL_MAX, state.pickupTick);
    if (state.coins.length < maxConcurrentCoins(state.options.powerUpMode)) {
      const pos = findEmptySpawnPosition(state, 1);
      if (pos) state.coins.push({ id: `coin-${state.pickupTick}`, ...pos });
    }
  }

  if (
    state.options.powerUpMode !== "off" &&
    state.pickupTick >= state.nextPowerUpSpawnIn
  ) {
    state.nextPowerUpSpawnIn =
      state.pickupTick +
      spawnInterval(POWERUP_SPAWN_INTERVAL_MIN, POWERUP_SPAWN_INTERVAL_MAX, state.pickupTick + 7);
    if (state.powerUps.length < maxConcurrentPowerUps(state.options.powerUpMode)) {
      const pos = findEmptySpawnPosition(state, 2);
      if (pos) {
        const kind = ALL_POWERUP_KINDS[(state.pickupTick + state.round) % ALL_POWERUP_KINDS.length];
        state.powerUps.push({ id: `pu-${state.pickupTick}`, kind, ...pos });
      }
    }
  }
}

/** @deprecated Use generateWarpPairs */
export function generateWallHoles(count: number, width: number, height: number, seed = 1): WallHole[] {
  if (count <= 0) return [];
  return generateWarpPairs(width, height, seed).slice(0, count * 2);
}

const ALL_POWERUP_KINDS: PowerUpKind[] = ["speed", "gap", "double_jump", "missile", "grenade", "burst"];

export function createCurveState(
  playerIds: string[],
  botIds: string[],
  botNames: Record<string, string>,
  options: TrailDashOptions,
  round = 1,
  colorIndexByPlayer: Record<string, number> = {},
): CurveState {
  const allIds = [...playerIds, ...botIds];
  const players = allIds.map((id, i) =>
    createPlayer(id, colorIndexByPlayer[id] ?? i, botIds.includes(id)),
  );
  const seed = round * 1000 + allIds.length;
  return {
    phase: "instructions",
    round,
    maxRounds: options.maxRounds,
    timerEndsAt: Date.now() + 5000,
    timerTotalMs: 5000,
    width: ARENA_W,
    height: ARENA_H,
    players,
    roundScores: {},
    lastRoundScores: {},
    botNames,
    coins: [],
    powerUps: [],
    projectiles: [],
    explosions: [],
    wallHoles: generateWarpPairs(ARENA_W, ARENA_H, seed),
    deathOrder: [],
    options,
    pickupTick: 0,
    nextCoinSpawnIn: 25,
    nextPowerUpSpawnIn: 70,
  };
}

function isInHole(
  x: number,
  y: number,
  holes: WallHole[],
  width: number,
  height: number,
): WallHole | null {
  const margin = PLAYABLE_MARGIN;
  for (const hole of holes) {
    if (hole.edge === "top" && y <= margin && x >= hole.start && x <= hole.start + hole.length) {
      return hole;
    }
    if (
      hole.edge === "bottom" &&
      y >= height - margin &&
      x >= hole.start &&
      x <= hole.start + hole.length
    ) {
      return hole;
    }
    if (hole.edge === "left" && x <= margin && y >= hole.start && y <= hole.start + hole.length) {
      return hole;
    }
    if (
      hole.edge === "right" &&
      x >= width - margin &&
      y >= hole.start &&
      y <= hole.start + hole.length
    ) {
      return hole;
    }
  }
  return null;
}

export function portalOutwardAngle(edge: WallEdge): number {
  switch (edge) {
    case "top":
      return Math.PI / 2;
    case "bottom":
      return -Math.PI / 2;
    case "left":
      return 0;
    case "right":
      return Math.PI;
  }
}

export function portalInwardAngle(edge: WallEdge): number {
  let angle = portalOutwardAngle(edge) + Math.PI;
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

export function transformAngleThroughPortal(entry: WallHole, exit: WallHole, angle: number): number {
  let newAngle = angle + (portalOutwardAngle(exit.edge) - portalInwardAngle(entry.edge));
  while (newAngle > Math.PI) newAngle -= 2 * Math.PI;
  while (newAngle < -Math.PI) newAngle += 2 * Math.PI;
  return newAngle;
}

export function portalCenter(portal: WallHole, width: number, height: number): { x: number; y: number } {
  const mid = portal.start + portal.length / 2;
  const inset = PLAYABLE_MARGIN + 10;
  switch (portal.edge) {
    case "top":
      return { x: mid, y: inset };
    case "bottom":
      return { x: mid, y: height - inset };
    case "left":
      return { x: inset, y: mid };
    case "right":
      return { x: width - inset, y: mid };
  }
}

export function warpToPairedPortal(
  entry: WallHole,
  portals: WallHole[],
  width: number,
  height: number,
): { x: number; y: number } {
  const exit = portals.find((p) => p.pairId === entry.pairId && p.id !== entry.id);
  if (!exit) return portalCenter(entry, width, height);
  return portalCenter(exit, width, height);
}

/** @deprecated Use warpToPairedPortal */
export function wrapThroughHole(
  x: number,
  y: number,
  hole: WallHole,
  width: number,
  height: number,
): { x: number; y: number } {
  return warpToPairedPortal(hole, [hole], width, height);
}

function isOutOfBounds(
  p: CurvePlayer,
  width: number,
  height: number,
  portals: WallHole[],
): boolean {
  if (isInHole(p.x, p.y, portals, width, height)) return false;
  return (
    p.x < PLAYABLE_MARGIN ||
    p.x > width - PLAYABLE_MARGIN ||
    p.y < PLAYABLE_MARGIN ||
    p.y > height - PLAYABLE_MARGIN
  );
}

function tryWarpPortal(
  p: CurvePlayer,
  portals: WallHole[],
  width: number,
  height: number,
): boolean {
  const entry = isInHole(p.x, p.y, portals, width, height);
  if (!entry) return false;
  const exit = portals.find((portal) => portal.pairId === entry.pairId && portal.id !== entry.id);
  if (!exit) return false;
  appendTrailBreak(p);
  const dest = portalCenter(exit, width, height);
  p.x = dest.x;
  p.y = dest.y;
  p.angle = transformAngleThroughPortal(entry, exit, p.angle);
  return true;
}

export function checkTrailCollisions(state: CurveState): void {
  for (const p of state.players) {
    if (!p.alive) continue;

    tryWarpPortal(p, state.wallHoles, state.width, state.height);

    if (isOutOfBounds(p, state.width, state.height, state.wallHoles)) {
      killPlayer(state, p);
      continue;
    }

    if (p.gapTicksRemaining > 0 || p.jumpTicksRemaining > 0) continue;

    for (const other of state.players) {
      if (other.id === p.id) continue;
      for (const [a, b] of trailLineSegments(other.trail)) {
        const combined = Math.max(p.hitRadius, DEFAULT_HIT_RADIUS);
        if (segmentHit(p.x, p.y, a.x, a.y, b.x, b.y, combined)) {
          killPlayer(state, p);
          break;
        }
      }
      if (!p.alive) break;
    }

    if (!p.alive) continue;

    const ownSegments = trailLineSegments(p.trail);
    const skipCount = ownTrailImmuneSegmentCount(p.trail);
    const checkSegments = ownSegments.slice(0, Math.max(0, ownSegments.length - skipCount));
    for (const [a, b] of checkSegments) {
      if (segmentHit(p.x, p.y, a.x, a.y, b.x, b.y, p.hitRadius)) {
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
  if (p.phasingTicks > 0) p.phasingTicks--;
  if (p.burstVolleyCooldown > 0) p.burstVolleyCooldown--;
  if (p.speedEffectTicks > 0) {
    p.speedEffectTicks--;
    if (p.speedEffectTicks === 0) p.speedMultiplier = 1;
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
      appendTrailBreak(p);
      p.gapTicksRemaining = GAP_EFFECT_TICKS;
      break;
    case "double_jump":
      p.extraJumps += 1;
      break;
    case "missile":
    case "grenade":
    case "burst":
      p.heldPowerUp = kind;
      break;
  }
}

export function tryJump(p: CurvePlayer): boolean {
  if (!p.alive) return false;

  if (p.jumpTicksRemaining > 0) {
    if (p.extraJumps <= 0) return false;
    p.extraJumps--;
    appendTrailBreak(p);
    p.jumpTicksRemaining = JUMP_DURATION_TICKS;
    return true;
  }

  if (p.jumpCooldownTicks > 0) {
    if (p.extraJumps <= 0) return false;
    p.extraJumps--;
    appendTrailBreak(p);
    p.jumpTicksRemaining = JUMP_DURATION_TICKS;
    return true;
  }

  appendTrailBreak(p);
  p.jumpTicksRemaining = JUMP_DURATION_TICKS;
  p.jumpCooldownTicks = JUMP_COOLDOWN_TICKS;
  return true;
}

function spawnBurstVolley(state: CurveState, p: CurvePlayer): void {
  for (let i = 0; i < BURST_BULLETS_PER_VOLLEY; i++) {
    const angle = p.angle + (i * 2 * Math.PI) / BURST_BULLETS_PER_VOLLEY;
    state.projectiles.push({
      id: `proj-${Date.now()}-${p.id}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      ownerId: p.id,
      kind: "missile",
      x: p.x,
      y: p.y,
      vx: Math.cos(angle) * MISSILE_SPEED,
      vy: Math.sin(angle) * MISSILE_SPEED,
      fuseTicks: null,
      homing: false,
    });
  }
}

function tickBurstVolleys(state: CurveState): void {
  for (const p of state.players) {
    if (!p.alive || p.burstVolleysRemaining <= 0 || p.burstVolleyCooldown > 0) continue;
    spawnBurstVolley(state, p);
    p.burstVolleysRemaining--;
    if (p.burstVolleysRemaining > 0) {
      p.burstVolleyCooldown = BURST_VOLLEY_GAP_TICKS;
    }
  }
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
      homing: true,
    });
  } else if (kind === "burst") {
    spawnBurstVolley(state, p);
    p.burstVolleysRemaining = BURST_VOLLEYS - 1;
    p.burstVolleyCooldown = BURST_VOLLEY_GAP_TICKS;
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

function missileHitsWall(
  x: number,
  y: number,
  width: number,
  height: number,
  portals: WallHole[],
): boolean {
  if (isInHole(x, y, portals, width, height)) return false;
  return (
    x < PLAYABLE_MARGIN ||
    x > width - PLAYABLE_MARGIN ||
    y < PLAYABLE_MARGIN ||
    y > height - PLAYABLE_MARGIN
  );
}

function steerHomingMissile(proj: Projectile, players: CurvePlayer[]): void {
  let nearest: CurvePlayer | null = null;
  let nearestDist = Infinity;
  for (const p of players) {
    if (!p.alive || p.id === proj.ownerId) continue;
    const d = dist(proj.x, proj.y, p.x, p.y);
    if (d < nearestDist) {
      nearestDist = d;
      nearest = p;
    }
  }
  if (!nearest) return;

  const targetAngle = Math.atan2(nearest.y - proj.y, nearest.x - proj.x);
  const currentAngle = Math.atan2(proj.vy, proj.vx);
  let delta = targetAngle - currentAngle;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;
  const turn = Math.max(-MISSILE_HOMING_TURN_RATE, Math.min(MISSILE_HOMING_TURN_RATE, delta));
  const speed = Math.hypot(proj.vx, proj.vy);
  const newAngle = currentAngle + turn;
  proj.vx = Math.cos(newAngle) * speed;
  proj.vy = Math.sin(newAngle) * speed;
}

export function tickProjectiles(state: CurveState): void {
  const width = state.width;
  const height = state.height;
  const remaining: Projectile[] = [];

  for (const proj of state.projectiles) {
    if (proj.kind === "missile" && proj.homing) {
      steerHomingMissile(proj, state.players);
    }

    proj.x += proj.vx;
    proj.y += proj.vy;

    if (proj.kind === "grenade" && proj.fuseTicks !== null) {
      proj.fuseTicks--;
      if (proj.fuseTicks <= 0) {
        detonateGrenade(state, proj.x, proj.y, proj.ownerId);
        continue;
      }
    }

    if (proj.kind === "missile" && missileHitsWall(proj.x, proj.y, width, height, state.wallHoles)) {
      detonateMissile(state, proj.x, proj.y, proj.ownerId);
      continue;
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
      if (dist(proj.x, proj.y, p.x, p.y) < p.hitRadius + 6) {
        killPlayer(state, p);
        hit = true;
        break;
      }
    }
    if (hit && proj.kind === "missile") {
      detonateMissile(state, proj.x, proj.y, proj.ownerId);
      continue;
    }

    remaining.push(proj);
  }
  state.projectiles = remaining;
}

export function detonateMissile(state: CurveState, x: number, y: number, ownerId: string): void {
  state.explosions.push({
    x,
    y,
    radius: MISSILE_EXPLOSION_RADIUS,
    ticksRemaining: EXPLOSION_DISPLAY_TICKS,
  });
  for (const p of state.players) {
    if (!p.alive) continue;
    if (dist(x, y, p.x, p.y) < MISSILE_EXPLOSION_RADIUS) {
      killPlayer(state, p);
    }
  }
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
    if (p.trail.length === 0) continue;
    const inRadius = (pt: TrailPoint) => dist(cx, cy, pt.x, pt.y) < radius;
    const rebuilt: TrailPoint[] = [];
    let gapOpen = false;

    for (const pt of p.trail) {
      if (pt.break) {
        if (rebuilt.length > 0) rebuilt.push({ ...pt });
        gapOpen = true;
        continue;
      }
      if (inRadius(pt)) {
        gapOpen = true;
        continue;
      }
      if (gapOpen) {
        rebuilt.push({ x: pt.x, y: pt.y, break: true });
        rebuilt.push({ x: pt.x, y: pt.y });
        gapOpen = false;
      } else {
        rebuilt.push({ x: pt.x, y: pt.y });
      }
    }

    if (rebuilt.length === 0) {
      const last = p.trail[p.trail.length - 1];
      rebuilt.push({ x: last.x, y: last.y });
    }
    p.trail = rebuilt;
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
    const pts = rankPointsByPercentile(rank, totalPlayers, state.options.rankPointScale);
    scores[p.id] = (scores[p.id] ?? 0) + pts + p.coinsThisRound;
    rank++;
  }

  // Dead players by reverse death order (last to die = better rank)
  const deadReversed = [...state.deathOrder].reverse();
  for (const id of deadReversed) {
    const p = state.players.find((pl) => pl.id === id);
    if (!p) continue;
    const pts = rankPointsByPercentile(rank, totalPlayers, state.options.rankPointScale);
    scores[id] = (scores[id] ?? 0) + pts + p.coinsThisRound;
    rank++;
  }

  // Merge into roundScores
  state.lastRoundScores = scores;
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

  tickBurstVolleys(state);
  tickPickupSpawns(state);
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
    state.timerTotalMs = 5000;
  }
  return state;
}

export function resetCurveRound(state: CurveState, playerIds: string[], botIds: string[]): CurveState {
  const colorIndexByPlayer = Object.fromEntries(
    state.players.map((p) => [p.id, p.colorIndex]),
  );
  const fresh = createCurveState(
    playerIds.filter((id) => !botIds.includes(id)),
    botIds,
    state.botNames,
    state.options,
    state.round,
    colorIndexByPlayer,
  );
  fresh.roundScores = { ...state.roundScores };
  return fresh;
}

/** Raycast ahead for bot AI — returns distance to nearest obstacle */
export function distanceToWallAlongAngle(
  x: number,
  y: number,
  angle: number,
  width: number,
  height: number,
  wallHoles: WallHole[] = [],
): number {
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  let best = Infinity;

  const consider = (dist: number) => {
    if (dist > 0 && dist < best) best = dist;
  };

  if (dx < -1e-4) consider((x - PLAYABLE_MARGIN) / -dx);
  if (dx > 1e-4) consider((width - PLAYABLE_MARGIN - x) / dx);
  if (dy < -1e-4) consider((y - PLAYABLE_MARGIN) / -dy);
  if (dy > 1e-4) consider((height - PLAYABLE_MARGIN - y) / dy);

  if (best === Infinity) return 9999;

  const hitX = x + dx * best;
  const hitY = y + dy * best;
  if (wallHoles.length > 0 && isInPortalZone(hitX, hitY, wallHoles, width, height)) {
    return best + 80;
  }
  return best;
}

function isInPortalZone(
  x: number,
  y: number,
  holes: WallHole[],
  width: number,
  height: number,
): boolean {
  return isInHole(x, y, holes, width, height) !== null;
}

export function raycastAhead(
  x: number,
  y: number,
  angle: number,
  players: CurvePlayer[],
  selfId: string,
  maxDist: number,
  width: number,
  height: number,
  wallHoles: WallHole[] = [],
): number {
  const wallDist = distanceToWallAlongAngle(x, y, angle, width, height, wallHoles);
  const steps = Math.floor(maxDist / 4);
  let trailDist = maxDist;
  for (let i = 1; i <= steps; i++) {
    const px = x + Math.cos(angle) * i * 4;
    const py = y + Math.sin(angle) * i * 4;
    if (px < PLAYABLE_MARGIN || px > width - PLAYABLE_MARGIN || py < PLAYABLE_MARGIN || py > height - PLAYABLE_MARGIN) {
      if (!isInPortalZone(px, py, wallHoles, width, height)) {
        trailDist = Math.min(trailDist, i * 4);
        break;
      }
    }
    for (const other of players) {
      const segments = trailLineSegments(other.trail);
      const end =
        other.id === selfId
          ? Math.max(0, segments.length - ownTrailImmuneSegmentCount(other.trail))
          : segments.length;
      for (let j = 0; j < end; j++) {
        const [a, b] = segments[j];
        if (segmentHit(px, py, a.x, a.y, b.x, b.y, DEFAULT_HIT_RADIUS)) {
          trailDist = Math.min(trailDist, i * 4);
          break;
        }
      }
      if (trailDist < maxDist) break;
    }
    if (trailDist < maxDist) break;
  }
  return Math.min(wallDist, trailDist);
}
