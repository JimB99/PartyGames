import { pickRandom, type GameAction, type RoomContext } from "@party-games/shared";
import type { Stroke } from "./drawing-engine.js";

export type ChainPhase = "instructions" | "draw" | "guess" | "reveal" | "scoreboard" | "ended";

export interface ChainLink {
  playerId: string;
  kind: "draw" | "guess";
  prompt: string;
  strokes?: Stroke[];
  guess?: string;
}

export interface ChainSketchState {
  phase: ChainPhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  playerIds: string[];
  linkIndex: number;
  chain: ChainLink[];
  currentPrompt: string;
  strokes: Stroke[];
  drawerTool: "pen" | "eraser";
  drawerWidth: number;
  guesses: Record<string, string>;
  roundScores: Record<string, number>;
  wordsPool: string[];
}

const DRAW_MS = 45000;
const GUESS_MS = 30000;
const REVEAL_MS = 10000;
const SCOREBOARD_MS = 5000;

export function createChainSketchState(words: string[], playerIds: string[]): ChainSketchState {
  const word = pickRandom(words);
  return {
    phase: "instructions",
    round: 1,
    maxRounds: playerIds.length,
    timerEndsAt: Date.now() + 5000,
    playerIds,
    linkIndex: 0,
    chain: [],
    currentPrompt: word,
    strokes: [],
    drawerTool: "pen",
    drawerWidth: 4,
    guesses: {},
    roundScores: {},
    wordsPool: words,
  };
}

function currentPlayer(state: ChainSketchState): string {
  return state.playerIds[state.linkIndex % state.playerIds.length];
}

function isDrawTurn(state: ChainSketchState): boolean {
  return state.linkIndex % 2 === 0;
}

export function advanceChain(state: ChainSketchState): ChainSketchState {
  if (state.phase === "instructions") {
    state.phase = isDrawTurn(state) ? "draw" : "guess";
    state.timerEndsAt = Date.now() + (isDrawTurn(state) ? DRAW_MS : GUESS_MS);
    state.strokes = [];
    state.guesses = {};
    return state;
  }
  if (state.phase === "draw") {
    state.chain.push({
      playerId: currentPlayer(state),
      kind: "draw",
      prompt: state.currentPrompt,
      strokes: [...state.strokes],
    });
    state.linkIndex += 1;
    state.phase = "guess";
    state.timerEndsAt = Date.now() + GUESS_MS;
    state.guesses = {};
    return state;
  }
  if (state.phase === "guess") {
    const guess = Object.values(state.guesses)[0] ?? "?";
    state.chain.push({
      playerId: currentPlayer(state),
      kind: "guess",
      prompt: state.currentPrompt,
      guess,
    });
    state.currentPrompt = guess;
    state.linkIndex += 1;
    if (state.linkIndex >= state.playerIds.length * 2) {
      state.phase = "reveal";
      state.timerEndsAt = Date.now() + REVEAL_MS;
      state.roundScores = { [state.playerIds[0]]: 500 };
      return state;
    }
    state.phase = isDrawTurn(state) ? "draw" : "guess";
    state.timerEndsAt = Date.now() + (isDrawTurn(state) ? DRAW_MS : GUESS_MS);
    state.strokes = [];
    state.guesses = {};
    return state;
  }
  if (state.phase === "reveal") {
    state.phase = "scoreboard";
    state.timerEndsAt = Date.now() + SCOREBOARD_MS;
    return state;
  }
  if (state.phase === "scoreboard") {
    state.phase = "ended";
    state.timerEndsAt = null;
    return state;
  }
  return state;
}

export function onChainAction(state: ChainSketchState, playerId: string, action: GameAction, ctx: RoomContext): ChainSketchState {
  const active = currentPlayer(state);
  if (playerId !== active) return state;

  if (action.kind === "draw_tool" && state.phase === "draw") {
    state.drawerTool = action.tool;
    if (action.width !== undefined) state.drawerWidth = Math.max(2, Math.min(16, action.width));
  }
  if (action.kind === "draw_stroke" && state.phase === "draw") {
    const erase = state.drawerTool === "eraser";
    state.strokes.push({
      points: action.points,
      color: erase ? "#000" : action.color,
      width: action.width ?? state.drawerWidth,
      erase,
    });
  }
  if (action.kind === "draw_undo" && state.phase === "draw") {
    state.strokes.pop();
  }
  if (action.kind === "submit_text" && state.phase === "guess") {
    state.guesses[playerId] = action.text.slice(0, 60);
    return advanceChain(state);
  }
  if (action.kind === "advance" && state.phase === "instructions") {
    return advanceChain(state);
  }
  if (action.kind === "advance" && state.phase === "draw") {
    return advanceChain(state);
  }
  void ctx;
  return state;
}

export function onChainTick(state: ChainSketchState): ChainSketchState {
  if (!state.timerEndsAt || Date.now() < state.timerEndsAt) return state;
  return advanceChain(state);
}

export function chainHostView(state: ChainSketchState) {
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    data: {
      chain: state.phase === "reveal" || state.phase === "scoreboard" || state.phase === "ended" ? state.chain : undefined,
      strokes: state.phase === "draw" ? state.strokes : state.chain[state.chain.length - 1]?.strokes,
      currentPrompt: state.phase !== "reveal" ? state.currentPrompt : undefined,
      activePlayerId: state.phase === "draw" || state.phase === "guess" ? currentPlayer(state) : undefined,
      roundScores: state.roundScores,
    },
  };
}

export function chainPlayerView(state: ChainSketchState, playerId: string) {
  const active = currentPlayer(state);
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    data: {
      strokes: state.phase === "draw" && playerId === active ? state.strokes : undefined,
      isDrawTurn: state.phase === "draw",
    },
    playerData: {
      isActive: playerId === active,
      prompt: playerId === active ? state.currentPrompt : undefined,
      showChain: state.phase === "reveal" || state.phase === "scoreboard",
    },
  };
}
