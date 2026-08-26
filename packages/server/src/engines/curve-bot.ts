import {
  fireWeapon,
  isFireablePowerUp,
  raycastAhead,
  tryJump,
  WALL_MARGIN,
  type CurveState,
  type TurnDirection,
} from "@party-games/shared";

const LOOK_ANGLES = [-0.8, -0.4, 0, 0.4, 0.8] as const;

export function tickBots(state: CurveState): void {
  if (state.phase !== "playing") return;

  for (const p of state.players) {
    if (!p.isBot || !p.alive) continue;
    const difficulty = state.options.botDifficulty;

    if (isFireablePowerUp(p.heldPowerUp)) {
      if (p.heldPowerUp === "burst") {
        fireWeapon(state, p);
        continue;
      }
      const target = findFireTarget(state, p.id);
      if (target) {
        p.angle = Math.atan2(target.y - p.y, target.x - p.x);
        fireWeapon(state, p);
        continue;
      }
    }

    const lookDist = difficulty === "easy" ? 70 : difficulty === "hard" ? 120 : 90;
    const turnThreshold = difficulty === "easy" ? 35 : difficulty === "hard" ? 55 : 45;

    const ahead = raycastAhead(
      p.x,
      p.y,
      p.angle,
      state.players,
      p.id,
      lookDist,
      state.width,
      state.height,
    );

    if (ahead < turnThreshold) {
      if (p.jumpCooldownTicks <= 0 && Math.random() < (difficulty === "easy" ? 0.35 : 0.75)) {
        tryJump(p);
      }
      p.direction = pickBestDirection(state, p.id, p.angle, lookDist, difficulty);
      continue;
    }

    if (difficulty === "easy" && Math.random() < 0.04) {
      p.direction = Math.random() < 0.5 ? "left" : "right";
      continue;
    }

    const coin = nearestCoin(state, p);
    const powerUp = difficulty === "hard" ? nearestPowerUp(state, p) : null;
    const target = powerUp ?? coin;
    if (target && dist(p.x, p.y, target.x, target.y) < 140) {
      const targetAngle = Math.atan2(target.y - p.y, target.x - p.x);
      p.direction = angleDiff(p.angle, targetAngle) > 0 ? "right" : "left";
      continue;
    }

    const wallBias = wallAvoidanceDirection(p, state.width, state.height);
    if (wallBias) {
      p.direction = wallBias;
      continue;
    }

    p.direction = pickBestDirection(state, p.id, p.angle, lookDist, difficulty);
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
): TurnDirection {
  const bot = state.players.find((pl) => pl.id === selfId);
  if (!bot) return "none";

  let bestAngle = angle;
  let bestClear = -1;

  for (const offset of LOOK_ANGLES) {
    const testAngle = angle + offset;
    const clear = raycastAhead(
      bot.x,
      bot.y,
      testAngle,
      state.players,
      selfId,
      lookDist,
      state.width,
      state.height,
    );
    const wallPenalty =
      wallProximityPenalty(bot.x, bot.y, testAngle, state.width, state.height) *
      (difficulty === "hard" ? 1.5 : 1);
    const score = clear - wallPenalty;
    if (score > bestClear) {
      bestClear = score;
      bestAngle = testAngle;
    }
  }

  const diff = angleDiff(angle, bestAngle);
  if (Math.abs(diff) < 0.05) return "none";
  return diff > 0 ? "right" : "left";
}

function wallProximityPenalty(
  x: number,
  y: number,
  angle: number,
  width: number,
  height: number,
): number {
  const margin = WALL_MARGIN + 30;
  let penalty = 0;
  if (x < margin && Math.cos(angle) < 0) penalty += (margin - x) * 0.15;
  if (x > width - margin && Math.cos(angle) > 0) penalty += (x - (width - margin)) * 0.15;
  if (y < margin && Math.sin(angle) < 0) penalty += (margin - y) * 0.15;
  if (y > height - margin && Math.sin(angle) > 0) penalty += (y - (height - margin)) * 0.15;
  return penalty;
}

function wallAvoidanceDirection(
  p: { x: number; y: number },
  width: number,
  height: number,
): TurnDirection | null {
  const margin = WALL_MARGIN + 50;
  const nearLeft = p.x < margin;
  const nearRight = p.x > width - margin;
  const nearTop = p.y < margin;
  const nearBottom = p.y > height - margin;
  if (!nearLeft && !nearRight && !nearTop && !nearBottom) return null;
  if (nearLeft && nearTop) return "right";
  if (nearRight && nearTop) return "left";
  if (nearLeft && nearBottom) return "right";
  if (nearRight && nearBottom) return "left";
  if (nearLeft) return "right";
  if (nearRight) return "left";
  if (nearTop) return "right";
  if (nearBottom) return "left";
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
