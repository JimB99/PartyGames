import {
  activateHeldPowerUp,
  canActivateHeldPowerUp,
  distanceToWallAlongAngle,
  PLAYABLE_MARGIN,
  raycastAhead,
  TrailSpatialGrid,
  tryJump,
  type CurvePlayer,
  type CurveState,
  type TurnDirection,
} from "@party-games/shared";

const LOOK_ANGLES = [-1.2, -0.6, -0.25, 0, 0.25, 0.6, 1.2] as const;

const botSteerTick = new Map<string, number>();

/** Clear throttle state when a new round/game starts (playingTick resets to 0). */
export function resetBotSteerState(): void {
  botSteerTick.clear();
}

function lookDistance(difficulty: string): number {
  if (difficulty === "easy") return 100;
  if (difficulty === "hard") return 200;
  return 140;
}

function turnThreshold(difficulty: string): number {
  if (difficulty === "easy") return 45;
  if (difficulty === "hard") return 75;
  return 58;
}

function shouldThrottleSteerRaycast(tick: number, botId: string): boolean {
  const lastSteer = botSteerTick.get(botId);
  if (lastSteer === undefined) return false;
  if (tick <= lastSteer) return false;
  return tick - lastSteer < 2;
}

function obstacleDistance(
  state: CurveState,
  bot: { x: number; y: number; angle: number },
  selfId: string,
  angle: number,
  lookDist: number,
  trailGrid: TrailSpatialGrid,
): number {
  const trailDist = raycastAhead(
    bot.x,
    bot.y,
    angle,
    state.players,
    selfId,
    lookDist,
    state.width,
    state.height,
    state.wallHoles,
    trailGrid,
  );
  const wallDist = distanceToWallAlongAngle(
    bot.x,
    bot.y,
    angle,
    state.width,
    state.height,
    state.wallHoles,
  );
  return Math.min(trailDist, wallDist);
}

function handleBotPowerUps(
  state: CurveState,
  p: CurvePlayer,
  lookDist: number,
  threshold: number,
  trailGrid: TrailSpatialGrid,
): void {
  if (p.heldPowerUp === "double_jump") {
    const ahead = obstacleDistance(state, p, p.id, p.angle, lookDist, trailGrid);
    if (ahead < threshold && p.jumpCooldownTicks <= 0) {
      tryJump(p);
    }
    return;
  }

  if (!canActivateHeldPowerUp(p.heldPowerUp)) return;

  if (p.heldPowerUp === "burst") {
    activateHeldPowerUp(state, p);
    return;
  }

  if (p.heldPowerUp === "speed" || p.heldPowerUp === "gap") {
    const ahead = obstacleDistance(state, p, p.id, p.angle, lookDist, trailGrid);
    if (ahead < threshold + 20) {
      activateHeldPowerUp(state, p);
    }
    return;
  }

  const target = findFireTarget(state, p.id);
  if (target) {
    p.angle = Math.atan2(target.y - p.y, target.x - p.x);
    activateHeldPowerUp(state, p);
  }
}

function updateBotSteering(
  state: CurveState,
  p: CurvePlayer,
  tick: number,
  lookDist: number,
  threshold: number,
  difficulty: string,
  trailGrid: TrailSpatialGrid,
): void {
  const wallBias = wallAvoidanceDirection(p, state.width, state.height, p.angle);
  if (wallBias) {
    p.direction = wallBias;
    return;
  }

  if (shouldThrottleSteerRaycast(tick, p.id)) return;

  botSteerTick.set(p.id, tick);

  const ahead = obstacleDistance(state, p, p.id, p.angle, lookDist, trailGrid);

  if (ahead < threshold) {
    if (
      p.heldPowerUp !== "double_jump" &&
      p.jumpCooldownTicks <= 0 &&
      Math.random() < (difficulty === "easy" ? 0.4 : 0.85)
    ) {
      tryJump(p);
    }
    p.direction = pickBestDirection(state, p.id, p.angle, lookDist, difficulty, trailGrid);
    return;
  }

  if (difficulty === "easy" && Math.random() < 0.03) {
    p.direction = Math.random() < 0.5 ? "left" : "right";
    return;
  }

  const coin = nearestCoin(state, p);
  const powerUp = difficulty === "hard" ? nearestPowerUp(state, p) : null;
  const target = powerUp ?? coin;
  if (target && dist(p.x, p.y, target.x, target.y) < 120) {
    const targetAngle = Math.atan2(target.y - p.y, target.x - p.x);
    const pathClear = obstacleDistance(state, p, p.id, targetAngle, lookDist, trailGrid);
    if (pathClear > 70) {
      p.direction = angleDiff(p.angle, targetAngle) > 0 ? "right" : "left";
      return;
    }
  }

  p.direction = pickBestDirection(state, p.id, p.angle, lookDist, difficulty, trailGrid);
}

export function tickBots(state: CurveState): void {
  if (state.phase !== "playing") return;

  const trailGrid = TrailSpatialGrid.fromPlayers(state.players);
  const tick = state.playingTick;

  for (const p of state.players) {
    if (!p.isBot || !p.alive) continue;
    const difficulty = state.options.botDifficulty;
    const lookDist = lookDistance(difficulty);
    const threshold = turnThreshold(difficulty);

    handleBotPowerUps(state, p, lookDist, threshold, trailGrid);
    updateBotSteering(state, p, tick, lookDist, threshold, difficulty, trailGrid);
  }
}

function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

function angleDiff(a: number, b: number): number {
  let d = b - a;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return d;
}

function pickBestDirection(
  state: CurveState,
  selfId: string,
  angle: number,
  lookDist: number,
  difficulty: string,
  trailGrid: TrailSpatialGrid,
): TurnDirection {
  const bot = state.players.find((pl) => pl.id === selfId);
  if (!bot) return "none";

  let bestAngle = angle;
  let bestClear = -Infinity;

  for (const offset of LOOK_ANGLES) {
    const testAngle = angle + offset;
    const clear = obstacleDistance(state, bot, selfId, testAngle, lookDist, trailGrid);
    const wallPenalty = wallProximityPenalty(bot.x, bot.y, testAngle, state.width, state.height);
    const turnPenalty = Math.abs(offset) * 8 * (difficulty === "hard" ? 0.7 : 1);
    const score = clear - wallPenalty - turnPenalty;
    if (score > bestClear) {
      bestClear = score;
      bestAngle = testAngle;
    }
  }

  const diff = angleDiff(angle, bestAngle);
  if (Math.abs(diff) < 0.04) return "none";
  return diff > 0 ? "right" : "left";
}

function wallProximityPenalty(
  x: number,
  y: number,
  angle: number,
  width: number,
  height: number,
): number {
  const buffer = PLAYABLE_MARGIN + 60;
  let penalty = 0;
  const distLeft = x - PLAYABLE_MARGIN;
  const distRight = width - PLAYABLE_MARGIN - x;
  const distTop = y - PLAYABLE_MARGIN;
  const distBottom = height - PLAYABLE_MARGIN - y;
  const minDist = Math.min(distLeft, distRight, distTop, distBottom);

  if (minDist < buffer) {
    penalty += (buffer - minDist) * 0.35;
  }
  if (distLeft < buffer && Math.cos(angle) < 0) penalty += (buffer - distLeft) * 0.25;
  if (distRight < buffer && Math.cos(angle) > 0) penalty += (buffer - distRight) * 0.25;
  if (distTop < buffer && Math.sin(angle) < 0) penalty += (buffer - distTop) * 0.25;
  if (distBottom < buffer && Math.sin(angle) > 0) penalty += (buffer - distBottom) * 0.25;
  return penalty;
}

function wallAvoidanceDirection(
  p: { x: number; y: number; angle: number },
  width: number,
  height: number,
  angle: number,
): TurnDirection | null {
  const buffer = PLAYABLE_MARGIN + 70;
  const nearLeft = p.x < buffer;
  const nearRight = p.x > width - buffer;
  const nearTop = p.y < buffer;
  const nearBottom = p.y > height - buffer;
  if (!nearLeft && !nearRight && !nearTop && !nearBottom) return null;

  const headingLeft = Math.cos(angle) < -0.15;
  const headingRight = Math.cos(angle) > 0.15;
  const headingUp = Math.sin(angle) < -0.15;
  const headingDown = Math.sin(angle) > 0.15;

  if (nearLeft && headingLeft) return "right";
  if (nearRight && headingRight) return "left";
  if (nearTop && headingUp) return "right";
  if (nearBottom && headingDown) return "left";

  if (nearLeft && nearTop) return "right";
  if (nearRight && nearTop) return "left";
  if (nearLeft && nearBottom) return "right";
  if (nearRight && nearBottom) return "left";
  return null;
}

function nearestCoin(state: CurveState, p: { x: number; y: number }) {
  let best: { x: number; y: number } | null = null;
  let bestDist = Infinity;
  for (const c of state.coins) {
    const d = dist(p.x, p.y, c.x, c.y);
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  return best;
}

function nearestPowerUp(state: CurveState, p: { x: number; y: number }) {
  let best: { x: number; y: number } | null = null;
  let bestDist = Infinity;
  for (const pu of state.powerUps) {
    const d = dist(p.x, p.y, pu.x, pu.y);
    if (d < bestDist) {
      bestDist = d;
      best = pu;
    }
  }
  return best;
}

function findFireTarget(state: CurveState, selfId: string) {
  const self = state.players.find((p) => p.id === selfId);
  if (!self) return null;
  let best: { x: number; y: number } | null = null;
  let bestDist = Infinity;
  for (const other of state.players) {
    if (!other.alive || other.id === selfId) continue;
    const d = dist(self.x, self.y, other.x, other.y);
    if (d < bestDist) {
      bestDist = d;
      best = other;
    }
  }
  return best;
}
