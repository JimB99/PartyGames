import { pickRandom, shuffle, type GameAction, type RoomContext } from "@party-games/shared";
import type { PlayerDrawing } from "./drawing-engine.js";
import { clearPhaseTimer, startPhaseTimer } from "./phase-timer.js";

export type DrawImpostorPhase = "instructions" | "drawing" | "discussion" | "accuse" | "reveal" | "ended";

export interface DrawImpostorState {
  phase: DrawImpostorPhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  timerTotalMs: number | null;
  playerIds: string[];
  prompt: string;
  category: string;
  impostorId: string;
  drawings: Record<string, PlayerDrawing>;
  accusations: Record<string, string>;
  impostorGuess: number | null;
  roundScores: Record<string, number>;
  locationsPool: Array<{ name: string; category: string }>;
}

const DRAW_MS = 60000;
const DISCUSS_MS = 30000;
const ACCUSE_MS = 20000;
const REVEAL_MS = 10000;

export function createDrawImpostorState(
  locations: Array<{ name: string; category: string }>,
  playerIds: string[],
): DrawImpostorState {
  const loc = pickRandom(locations);
  const impostorId = pickRandom(playerIds);
  return {
    phase: "instructions",
    round: 1,
    maxRounds: 1,
    ...startPhaseTimer(5000),
    playerIds,
    prompt: loc.name,
    category: loc.category,
    impostorId,
    drawings: Object.fromEntries(
      playerIds.map((id) => [
        id,
        { playerId: id, word: id === impostorId ? loc.category : loc.name, strokes: [], tool: "pen" as const, width: 4 },
      ]),
    ),
    accusations: {},
    impostorGuess: null,
    roundScores: {},
    locationsPool: locations,
  };
}

function scoreDrawImpostor(state: DrawImpostorState): void {
  const accused = Object.values(state.accusations);
  const caught = accused.filter((id) => id === state.impostorId).length;
  const majorityCaught = caught > state.playerIds.length / 2;
  state.roundScores = {};
  if (majorityCaught) {
    for (const id of state.playerIds) {
      if (id !== state.impostorId) state.roundScores[id] = 600;
    }
    if (state.impostorGuess === 0) {
      state.roundScores[state.impostorId] = 400;
    }
  } else {
    state.roundScores[state.impostorId] = 1000;
  }
}

export function advanceDrawImpostor(state: DrawImpostorState): DrawImpostorState {
  if (state.phase === "instructions") {
    state.phase = "drawing";
    Object.assign(state, startPhaseTimer(DRAW_MS));
    return state;
  }
  if (state.phase === "drawing") {
    state.phase = "discussion";
    Object.assign(state, startPhaseTimer(DISCUSS_MS));
    return state;
  }
  if (state.phase === "discussion") {
    state.phase = "accuse";
    Object.assign(state, startPhaseTimer(ACCUSE_MS));
    return state;
  }
  if (state.phase === "accuse") {
    scoreDrawImpostor(state);
    state.phase = "reveal";
    Object.assign(state, startPhaseTimer(REVEAL_MS));
    return state;
  }
  if (state.phase === "reveal") {
    state.phase = "ended";
    Object.assign(state, clearPhaseTimer());
    return state;
  }
  return state;
}

export function onDrawImpostorAction(state: DrawImpostorState, playerId: string, action: GameAction, ctx: RoomContext): DrawImpostorState {
  state.playerIds = [...ctx.playerIds];
  if (action.kind === "draw_stroke" && state.phase === "drawing") {
    const d = state.drawings[playerId];
    if (!d) return state;
    const erase = d.tool === "eraser" || action.color === "erase";
    d.strokes.push({ points: action.points, color: erase ? "transparent" : action.color, width: action.width ?? d.width, erase });
  }
  if (action.kind === "impostor_accuse" && state.phase === "accuse" && playerId !== state.impostorId) {
    state.accusations[playerId] = action.targetId;
  }
  if (action.kind === "impostor_guess" && state.phase === "accuse" && playerId === state.impostorId) {
    state.impostorGuess = action.itemIndex;
  }
  if (action.kind === "advance" && state.phase === "instructions") {
    return advanceDrawImpostor(state);
  }
  if (Object.keys(state.accusations).length >= state.playerIds.length - 1 && state.phase === "accuse") {
    return advanceDrawImpostor(state);
  }
  return state;
}

export function onDrawImpostorTick(state: DrawImpostorState): DrawImpostorState {
  if (!state.timerEndsAt || Date.now() < state.timerEndsAt) return state;
  return advanceDrawImpostor(state);
}

export function drawImpostorHostView(state: DrawImpostorState) {
  const showAll = state.phase === "reveal" || state.phase === "ended";
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      category: showAll ? state.category : undefined,
      prompt: showAll ? state.prompt : undefined,
      impostorId: showAll ? state.impostorId : undefined,
      drawings: state.phase !== "instructions"
        ? shuffle(state.playerIds).map((id) => ({
            id: showAll ? id : `anon-${id}`,
            strokes: state.drawings[id]?.strokes ?? [],
          }))
        : undefined,
      roundScores: state.roundScores,
    },
  };
}

export function drawImpostorPlayerView(state: DrawImpostorState, playerId: string) {
  const isImpostor = playerId === state.impostorId;
  const showSecret = state.phase === "reveal" || state.phase === "ended";
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {},
    playerData: {
      isImpostor: showSecret ? isImpostor : undefined,
      word: state.phase === "drawing" ? state.drawings[playerId]?.word : showSecret ? state.prompt : undefined,
      category: isImpostor && state.phase === "drawing" ? state.category : undefined,
      strokes: state.drawings[playerId]?.strokes,
      accused: state.accusations[playerId],
    },
  };
}
