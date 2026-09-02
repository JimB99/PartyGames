import { pickRandom, shuffle, type GameAction, type RoomContext } from "@party-games/shared";
import type { PlayerDrawing, Stroke } from "./drawing-engine.js";
import { clearPhaseTimer, startPhaseTimer } from "./phase-timer.js";

export type DrawVoteMode = "artistGuess" | "bestDrawing";
export type DrawVotePhase = "instructions" | "drawing" | "vote" | "reveal" | "scoreboard" | "ended";

export interface DrawVoteState {
  phase: DrawVotePhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  timerTotalMs: number | null;
  playerIds: string[];
  prompt: string;
  mode: DrawVoteMode;
  drawings: Record<string, PlayerDrawing>;
  displayOrder: string[];
  displayIndex: number;
  votes: Record<string, string>;
  roundScores: Record<string, number>;
  cumulativeScores: Record<string, number>;
  wordsPool: string[];
  usedWords: string[];
}

const DRAW_MS = 60000;
const VOTE_MS = 45000;
const REVEAL_MS = 8000;
const SCOREBOARD_MS = 5000;

export function createDrawVoteState(
  words: string[],
  playerIds: string[],
  mode: DrawVoteMode = "bestDrawing",
  maxRounds = 3,
): DrawVoteState {
  const prompt = pickRandom(words);
  return {
    phase: "instructions",
    round: 1,
    maxRounds,
    ...startPhaseTimer(5000),
    playerIds,
    prompt,
    mode,
    drawings: Object.fromEntries(
      playerIds.map((id) => [id, { playerId: id, word: prompt, strokes: [], tool: "pen" as const, width: 4 }]),
    ),
    displayOrder: [],
    displayIndex: 0,
    votes: {},
    roundScores: {},
    cumulativeScores: {},
    wordsPool: words,
    usedWords: [prompt],
  };
}

function currentDisplayId(state: DrawVoteState): string | null {
  return state.displayOrder[state.displayIndex] ?? null;
}

function scoreRound(state: DrawVoteState): void {
  state.roundScores = {};
  if (state.mode === "artistGuess") {
    for (const [voterId, artistId] of Object.entries(state.votes)) {
      if (voterId !== artistId) {
        state.roundScores[voterId] = (state.roundScores[voterId] ?? 0) + (artistId === voterId ? 0 : 500);
      }
    }
    for (const [voterId, pick] of Object.entries(state.votes)) {
      if (pick && state.drawings[pick]) {
        state.roundScores[pick] = (state.roundScores[pick] ?? 0) + 250;
      }
      void voterId;
    }
  } else {
    const tally: Record<string, number> = {};
    for (const pick of Object.values(state.votes)) {
      tally[pick] = (tally[pick] ?? 0) + 1;
    }
    let best = 0;
    let winner: string | null = null;
    for (const [id, count] of Object.entries(tally)) {
      if (count > best) {
        best = count;
        winner = id;
      }
    }
    if (winner) state.roundScores[winner] = 800;
    for (const id of state.playerIds) {
      if (state.votes[id]) state.roundScores[id] = (state.roundScores[id] ?? 0) + 100;
    }
  }
}

export function advanceDrawVote(state: DrawVoteState, words: string[], playerIds: string[]): DrawVoteState {
  if (state.phase === "instructions") {
    state.phase = "drawing";
    Object.assign(state, startPhaseTimer(DRAW_MS));
    return state;
  }
  if (state.phase === "drawing") {
    state.phase = "vote";
    state.displayOrder = shuffle([...playerIds]);
    state.displayIndex = 0;
    state.votes = {};
    Object.assign(state, startPhaseTimer(VOTE_MS));
    return state;
  }
  if (state.phase === "vote") {
    scoreRound(state);
    state.phase = "reveal";
    Object.assign(state, startPhaseTimer(REVEAL_MS));
    return state;
  }
  if (state.phase === "reveal") {
    state.phase = "scoreboard";
    Object.assign(state, startPhaseTimer(SCOREBOARD_MS));
    return state;
  }
  if (state.phase === "scoreboard") {
    for (const [id, pts] of Object.entries(state.roundScores)) {
      state.cumulativeScores[id] = (state.cumulativeScores[id] ?? 0) + pts;
    }
    if (state.round >= state.maxRounds) {
      state.phase = "ended";
      state.roundScores = { ...state.cumulativeScores };
      Object.assign(state, clearPhaseTimer());
      return state;
    }
    state.round += 1;
    const available = words.filter((w) => !state.usedWords.includes(w));
    const prompt = available.length > 0 ? pickRandom(available) : pickRandom(words);
    state.prompt = prompt;
    state.usedWords.push(prompt);
    state.drawings = Object.fromEntries(
      playerIds.map((id) => [id, { playerId: id, word: prompt, strokes: [], tool: "pen" as const, width: 4 }]),
    );
    state.roundScores = {};
    state.votes = {};
    state.phase = "instructions";
    Object.assign(state, startPhaseTimer(5000));
    return state;
  }
  return state;
}

export function onDrawVoteAction(state: DrawVoteState, playerId: string, action: GameAction, ctx: RoomContext): DrawVoteState {
  state.playerIds = [...ctx.playerIds];
  if (action.kind === "draw_stroke" && state.phase === "drawing") {
    const d = state.drawings[playerId];
    if (!d) return state;
    const erase = d.tool === "eraser" || action.color === "erase";
    d.strokes.push({ points: action.points, color: erase ? "transparent" : action.color, width: action.width ?? d.width, erase });
  }
  if (action.kind === "draw_undo" && state.phase === "drawing") {
    state.drawings[playerId]?.strokes.pop();
  }
  if (action.kind === "draw_clear" && state.phase === "drawing") {
    const d = state.drawings[playerId];
    if (d) d.strokes = [];
  }
  if (action.kind === "vote" && state.phase === "vote" && action.optionId !== playerId) {
    state.votes[playerId] = action.optionId;
    if (Object.keys(state.votes).length >= ctx.playerIds.length) {
      return advanceDrawVote(state, state.wordsPool, ctx.playerIds);
    }
  }
  if (action.kind === "advance" && state.phase === "instructions") {
    return advanceDrawVote(state, state.wordsPool, ctx.playerIds);
  }
  return state;
}

export function onDrawVoteTick(state: DrawVoteState, words: string[], playerIds: string[]): DrawVoteState {
  if (!state.timerEndsAt || Date.now() < state.timerEndsAt) return state;
  return advanceDrawVote(state, words, playerIds);
}

export function drawVoteHostView(state: DrawVoteState) {
  const showArtists = state.phase === "reveal" || state.phase === "scoreboard";
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      prompt: state.prompt,
      mode: state.mode,
      displayId: currentDisplayId(state),
      drawings: showArtists
        ? state.displayOrder.map((id) => ({ playerId: id, strokes: state.drawings[id]?.strokes ?? [] }))
        : state.phase === "vote"
          ? state.displayOrder.map((id) => ({ id, strokes: state.drawings[id]?.strokes ?? [] }))
          : undefined,
      roundScores: state.phase === "ended" ? state.cumulativeScores : state.roundScores,
    },
  };
}

export function drawVotePlayerView(state: DrawVoteState, playerId: string) {
  const d = state.drawings[playerId];
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: { prompt: state.phase !== "instructions" ? state.prompt : undefined, mode: state.mode },
    playerData: {
      strokes: d?.strokes,
      voted: state.votes[playerId] !== undefined,
      myVote: state.votes[playerId],
      toVote: state.phase === "vote"
        ? state.displayOrder.map((id) => ({ id, strokes: state.drawings[id]?.strokes ?? [] }))
        : undefined,
    },
  };
}
