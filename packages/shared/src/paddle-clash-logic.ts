export const PADDLE_WIDTH = 0.02;
export const PADDLE_HEIGHT = 0.2;
export const BALL_RADIUS = 0.015;
export const WIN_SCORE = 7;

export interface PaddlePlayer {
  id: string;
  y: number;
  score: number;
}

export interface PaddleBall {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface PaddleState {
  players: PaddlePlayer[];
  ball: PaddleBall;
  mode: "pong" | "hockey";
  width: number;
  height: number;
}

export function createPaddleState(playerIds: string[], mode: "pong" | "hockey"): PaddleState {
  const speed = mode === "hockey" ? 0.014 : 0.01;
  return {
    players: playerIds.map((id, i) => ({
      id,
      y: 0.5,
      score: 0,
    })),
    ball: { x: 0.5, y: 0.5, vx: speed, vy: speed * 0.6 },
    mode,
    width: 1,
    height: 1,
  };
}

export function setPaddleY(state: PaddleState, playerId: string, y: number): PaddleState {
  const clamped = Math.max(PADDLE_HEIGHT / 2, Math.min(1 - PADDLE_HEIGHT / 2, y));
  return {
    ...state,
    players: state.players.map((p) => (p.id === playerId ? { ...p, y: clamped } : p)),
  };
}

function sideForPlayerIndex(index: number, total: number): "left" | "right" {
  if (total <= 2) return index === 0 ? "left" : "right";
  return index < 2 ? "left" : "right";
}

function paddleX(side: "left" | "right"): number {
  return side === "left" ? PADDLE_WIDTH / 2 + 0.02 : 1 - PADDLE_WIDTH / 2 - 0.02;
}

export function tickPaddleState(state: PaddleState): PaddleState {
  let { ball, players } = state;
  let { x, y, vx, vy } = ball;

  x += vx;
  y += vy;

  if (y - BALL_RADIUS <= 0) {
    y = BALL_RADIUS;
    vy = Math.abs(vy);
  }
  if (y + BALL_RADIUS >= 1) {
    y = 1 - BALL_RADIUS;
    vy = -Math.abs(vy);
  }

  for (let i = 0; i < players.length; i++) {
    const side = sideForPlayerIndex(i, players.length);
    const px = paddleX(side);
    const py = players[i].y;
    const halfH = PADDLE_HEIGHT / 2;
    const approaching =
      (side === "left" && vx < 0 && x - BALL_RADIUS <= px + PADDLE_WIDTH / 2) ||
      (side === "right" && vx > 0 && x + BALL_RADIUS >= px - PADDLE_WIDTH / 2);
    if (
      approaching &&
      y >= py - halfH - BALL_RADIUS &&
      y <= py + halfH + BALL_RADIUS
    ) {
      x = side === "left" ? px + PADDLE_WIDTH / 2 + BALL_RADIUS : px - PADDLE_WIDTH / 2 - BALL_RADIUS;
      vx = -vx * 1.02;
      const hitPos = (y - py) / halfH;
      vy += hitPos * 0.006;
      const maxV = state.mode === "hockey" ? 0.02 : 0.015;
      vy = Math.max(-maxV, Math.min(maxV, vy));
    }
  }

  let scored: "left" | "right" | null = null;
  if (x < 0) scored = "right";
  if (x > 1) scored = "left";

  if (scored) {
    players = players.map((p, i) => {
      const side = sideForPlayerIndex(i, players.length);
      const scores = scored === side;
      return scores ? { ...p, score: p.score + 1 } : p;
    });
    const speed = state.mode === "hockey" ? 0.014 : 0.01;
    ball = {
      x: 0.5,
      y: 0.5,
      vx: speed * (Math.random() < 0.5 ? 1 : -1),
      vy: speed * 0.5 * (Math.random() < 0.5 ? 1 : -1),
    };
    return { ...state, players, ball };
  }

  return { ...state, players, ball: { x, y, vx, vy } };
}

export function paddleGameOver(state: PaddleState): boolean {
  return state.players.some((p) => p.score >= WIN_SCORE);
}

export function paddleWinner(state: PaddleState): string | null {
  const top = [...state.players].sort((a, b) => b.score - a.score)[0];
  return top && top.score >= WIN_SCORE ? top.id : null;
}
