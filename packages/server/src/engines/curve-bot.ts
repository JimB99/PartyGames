import {
  fireWeapon,
  raycastAhead,
  tryJump,
  type CurveState,
  type TurnDirection,
} from "@party-games/shared";

export function tickBots(state: CurveState): void {
  if (state.phase !== "playing") return;

  for (const p of state.players) {
    if (!p.isBot || !p.alive) continue;
    const difficulty = state.options.botDifficulty;

    if (p.heldPowerUp === "missile" || p.heldPowerUp === "grenade") {
      const target = findFireTarget(state, p.id);
      if (target) {
        p.angle = Math.atan2(target.y - p.y, target.x - p.x);
        fireWeapon(state, p);
        continue;
      }
    }

    const ahead = raycastAhead(
      p.x,
      p.y,
      p.angle,
      state.players,
      p.id,
      50,
      state.width,
      state.height,
    );

    if (ahead < 25) {
      if (p.jumpCooldownTicks <= 0 && Math.random() < (difficulty === "easy" ? 0.3 : 0.7)) {
        tryJump(p);
      }
      p.direction = pickAvoidDirection(state, p.id, p.angle, difficulty);
    } else if (difficulty === "easy") {
      if (Math.random() < 0.05) {
        p.direction = Math.random() < 0.5 ? "left" : "right";
      } else if (Math.random() < 0.03) {
        p.direction = "none";
      }
    } else {
      const coin = nearestCoin(state, p);
      const powerUp = difficulty === "hard" ? nearestPowerUp(state, p) : null;
      const target = powerUp ?? coin;
      if (target && dist(p.x, p.y, target.x, target.y) < 120) {
        const targetAngle = Math.atan2(target.y - p.y, target.x - p.x);
        p.direction = angleDiff(p.angle, targetAngle) > 0 ? "right" : "left";
      } else {
        const leftClear = raycastAhead(p.x, p.y, p.angle - 0.5, state.players, p.id, 40, state.width, state.height);
        const rightClear = raycastAhead(p.x, p.y, p.angle + 0.5, state.players, p.id, 40, state.width, state.height);
        if (leftClear > rightClear + 5) p.direction = "left";
        else if (rightClear > leftClear + 5) p.direction = "right";
        else p.direction = "none";
      }
    }
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

function pickAvoidDirection(
  state: CurveState,
  selfId: string,
  angle: number,
  difficulty: string,
): TurnDirection {
  const leftClear = raycastAhead(
    state.players.find((p) => p.id === selfId)!.x,
    state.players.find((p) => p.id === selfId)!.y,
    angle - 0.6,
    state.players,
    selfId,
    40,
    state.width,
    state.height,
  );
  const rightClear = raycastAhead(
    state.players.find((p) => p.id === selfId)!.x,
    state.players.find((p) => p.id === selfId)!.y,
    angle + 0.6,
    state.players,
    selfId,
    40,
    state.width,
    state.height,
  );
  if (difficulty === "hard") {
    if (leftClear > rightClear) return "left";
    if (rightClear > leftClear) return "right";
  }
  return leftClear >= rightClear ? "left" : "right";
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
  let best: { x: number; y: number } | null = null;
  let bestDist = Infinity;
  for (const other of state.players) {
    if (!other.alive || other.id === selfId) continue;
    const d = dist(
      state.players.find((p) => p.id === selfId)!.x,
      state.players.find((p) => p.id === selfId)!.y,
      other.x,
      other.y,
    );
    if (d < bestDist) {
      bestDist = d;
      best = other;
    }
  }
  return best;
}
