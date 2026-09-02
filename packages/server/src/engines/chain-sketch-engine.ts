import { shuffle, type GameAction, type RoomContext } from "@party-games/shared";
import { clearPhaseTimer, startPhaseTimer } from "./phase-timer.js";
import type { Stroke } from "./drawing-engine.js";

export type ChainPhase = "instructions" | "draw" | "guess" | "vote" | "reveal" | "scoreboard" | "ended";

export interface ChainLink {
  playerId: string;
  kind: "draw" | "guess";
  prompt: string;
  strokes?: Stroke[];
  guess?: string;
}

export interface PlayerChain {
  ownerId: string;
  startWord: string;
  links: ChainLink[];
}

export interface ChainWorkspace {
  chainOwnerId: string;
  strokes: Stroke[];
  drawerTool: "pen" | "eraser";
  drawerWidth: number;
  guess?: string;
  submitted: boolean;
}

export interface ChainSketchState {
  phase: ChainPhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  timerTotalMs: number | null;
  playerIds: string[];
  stage: number;
  stagesTotal: number;
  chains: Record<string, PlayerChain>;
  workspaces: Record<string, ChainWorkspace>;
  votes: Record<string, string>;
  roundScores: Record<string, number>;
  wordsPool: string[];
}

const DRAW_MS = 45000;
const GUESS_MS = 30000;
const VOTE_MS = 30000;
const REVEAL_MS = 10000;
const SCOREBOARD_MS = 5000;

function assignedChainOwner(playerIds: string[], playerId: string, stage: number): string {
  const idx = playerIds.indexOf(playerId);
  if (idx < 0) return playerIds[0];
  return playerIds[(idx + stage) % playerIds.length];
}

function isDrawStage(stage: number): boolean {
  return stage % 2 === 0;
}

function promptForChain(chain: PlayerChain): string {
  for (let i = chain.links.length - 1; i >= 0; i--) {
    const link = chain.links[i];
    if (link.kind === "guess" && link.guess) return link.guess;
  }
  return chain.startWord;
}

function lastDrawStrokes(chain: PlayerChain): Stroke[] | undefined {
  for (let i = chain.links.length - 1; i >= 0; i--) {
    const link = chain.links[i];
    if (link.kind === "draw" && link.strokes?.length) return link.strokes;
  }
  return undefined;
}

function initWorkspaces(state: ChainSketchState): void {
  state.workspaces = {};
  for (const pid of state.playerIds) {
    const ownerId = assignedChainOwner(state.playerIds, pid, state.stage);
    state.workspaces[pid] = {
      chainOwnerId: ownerId,
      strokes: [],
      drawerTool: "pen",
      drawerWidth: 4,
      submitted: false,
    };
  }
}

function allSubmitted(state: ChainSketchState): boolean {
  return state.playerIds.every((pid) => state.workspaces[pid]?.submitted);
}

function commitDrawStage(state: ChainSketchState): void {
  for (const pid of state.playerIds) {
    const ws = state.workspaces[pid];
    if (!ws) continue;
    const chain = state.chains[ws.chainOwnerId];
    if (!chain) continue;
    chain.links.push({
      playerId: pid,
      kind: "draw",
      prompt: promptForChain(chain),
      strokes: [...ws.strokes],
    });
  }
}

function commitGuessStage(state: ChainSketchState): void {
  for (const pid of state.playerIds) {
    const ws = state.workspaces[pid];
    if (!ws) continue;
    const chain = state.chains[ws.chainOwnerId];
    if (!chain) continue;
    const guess = ws.guess?.trim() || "?";
    chain.links.push({
      playerId: pid,
      kind: "guess",
      prompt: promptForChain(chain),
      guess,
    });
  }
}

function scoreChains(state: ChainSketchState): void {
  state.roundScores = {};
  for (const pid of state.playerIds) {
    state.roundScores[pid] = 100;
  }
  for (const chain of Object.values(state.chains)) {
    const original = chain.startWord.toLowerCase().trim();
    const lastGuess = [...chain.links].reverse().find((l) => l.kind === "guess")?.guess?.toLowerCase().trim();
    if (original && lastGuess === original) {
      state.roundScores[chain.ownerId] = (state.roundScores[chain.ownerId] ?? 0) + 400;
    }
  }
  const tally: Record<string, number> = {};
  for (const vote of Object.values(state.votes)) {
    tally[vote] = (tally[vote] ?? 0) + 1;
  }
  let best = 0;
  let winner: string | null = null;
  for (const [id, count] of Object.entries(tally)) {
    if (count > best) {
      best = count;
      winner = id;
    }
  }
  if (winner) state.roundScores[winner] = (state.roundScores[winner] ?? 0) + 300;
}

export function createChainSketchState(words: string[], playerIds: string[]): ChainSketchState {
  const wordPool = shuffle([...words]);
  const chains: Record<string, PlayerChain> = {};
  for (let i = 0; i < playerIds.length; i++) {
    const id = playerIds[i];
    chains[id] = { ownerId: id, startWord: wordPool[i % wordPool.length], links: [] };
  }
  const state: ChainSketchState = {
    phase: "instructions",
    round: 1,
    maxRounds: 1,
    ...startPhaseTimer(5000),
    playerIds: [...playerIds],
    stage: 0,
    stagesTotal: playerIds.length * 2,
    chains,
    workspaces: {},
    votes: {},
    roundScores: {},
    wordsPool: words,
  };
  initWorkspaces(state);
  return state;
}

export function advanceChain(state: ChainSketchState): ChainSketchState {
  if (state.phase === "instructions") {
    state.phase = "draw";
    state.stage = 0;
    initWorkspaces(state);
    Object.assign(state, startPhaseTimer(DRAW_MS));
    return state;
  }
  if (state.phase === "draw") {
    commitDrawStage(state);
    state.stage += 1;
    if (state.stage >= state.stagesTotal) {
      state.phase = "vote";
      state.votes = {};
      Object.assign(state, startPhaseTimer(VOTE_MS));
      return state;
    }
    state.phase = "guess";
    initWorkspaces(state);
    Object.assign(state, startPhaseTimer(GUESS_MS));
    return state;
  }
  if (state.phase === "guess") {
    commitGuessStage(state);
    state.stage += 1;
    if (state.stage >= state.stagesTotal) {
      state.phase = "vote";
      state.votes = {};
      Object.assign(state, startPhaseTimer(VOTE_MS));
      return state;
    }
    state.phase = "draw";
    initWorkspaces(state);
    Object.assign(state, startPhaseTimer(DRAW_MS));
    return state;
  }
  if (state.phase === "vote") {
    scoreChains(state);
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
    state.phase = "ended";
    Object.assign(state, clearPhaseTimer());
    return state;
  }
  return state;
}

export function onChainAction(state: ChainSketchState, playerId: string, action: GameAction, ctx: RoomContext): ChainSketchState {
  state.playerIds = [...ctx.playerIds];

  if (action.kind === "advance" && state.phase === "instructions") {
    return advanceChain(state);
  }
  if (action.kind === "vote" && state.phase === "vote") {
    if (state.chains[action.optionId]) {
      state.votes[playerId] = action.optionId;
    }
    if (Object.keys(state.votes).length >= ctx.playerIds.length) {
      return advanceChain(state);
    }
    return state;
  }

  const ws = state.workspaces[playerId];
  if (!ws) return state;

  if (action.kind === "draw_tool" && state.phase === "draw") {
    ws.drawerTool = action.tool;
    if (action.width !== undefined) ws.drawerWidth = Math.max(2, Math.min(16, action.width));
  }
  if (action.kind === "draw_stroke" && state.phase === "draw") {
    const erase = ws.drawerTool === "eraser" || action.color === "erase";
    ws.strokes.push({
      points: action.points,
      color: erase ? "transparent" : action.color,
      width: action.width ?? ws.drawerWidth,
      erase,
    });
  }
  if (action.kind === "draw_undo" && state.phase === "draw") {
    ws.strokes.pop();
  }
  if (action.kind === "submit_text" && state.phase === "guess") {
    ws.guess = action.text.slice(0, 60);
    ws.submitted = true;
    if (allSubmitted(state)) return advanceChain(state);
  }
  if (action.kind === "advance" && state.phase === "draw") {
    ws.submitted = true;
    if (allSubmitted(state)) return advanceChain(state);
  }
  if (action.kind === "advance" && state.phase === "draw") {
    ws.submitted = true;
    if (allSubmitted(state)) return advanceChain(state);
  }
  return state;
}

export function onChainTick(state: ChainSketchState): ChainSketchState {
  if (!state.timerEndsAt || Date.now() < state.timerEndsAt) return state;
  if (state.phase === "draw" || state.phase === "guess") {
    for (const pid of state.playerIds) {
      const ws = state.workspaces[pid];
      if (ws) ws.submitted = true;
    }
  }
  return advanceChain(state);
}

export function chainHostView(state: ChainSketchState) {
  const showAll = state.phase === "reveal" || state.phase === "scoreboard" || state.phase === "ended";
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      simultaneous: state.phase === "draw" || state.phase === "guess",
      stage: state.stage,
      stagesTotal: state.stagesTotal,
      chains: showAll ? Object.values(state.chains) : undefined,
      submittedCount:
        state.phase === "draw" || state.phase === "guess"
          ? state.playerIds.filter((id) => state.workspaces[id]?.submitted).length
          : undefined,
      playerCount: state.playerIds.length,
      roundScores: state.roundScores,
      voteCounts: state.phase === "reveal" || state.phase === "scoreboard"
        ? Object.values(state.votes).reduce<Record<string, number>>((acc, id) => {
            acc[id] = (acc[id] ?? 0) + 1;
            return acc;
          }, {})
        : undefined,
    },
  };
}

export function chainPlayerView(state: ChainSketchState, playerId: string) {
  const ws = state.workspaces[playerId];
  const chain = ws ? state.chains[ws.chainOwnerId] : undefined;
  const showAll = state.phase === "reveal" || state.phase === "scoreboard";
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      simultaneous: state.phase === "draw" || state.phase === "guess",
      chains: showAll ? Object.values(state.chains) : undefined,
    },
    playerData: {
      chainOwnerId: ws?.chainOwnerId,
      prompt: state.phase === "draw" && chain ? promptForChain(chain) : undefined,
      strokes: state.phase === "draw" ? ws?.strokes : state.phase === "guess" && chain ? lastDrawStrokes(chain) : undefined,
      submitted: ws?.submitted ?? false,
      myGuess: ws?.guess,
      voteOptions:
        state.phase === "vote"
          ? state.playerIds.map((id) => ({ id, ownerName: id }))
          : undefined,
      voted: state.votes[playerId] !== undefined,
      myVote: state.votes[playerId],
      ownChain: state.chains[playerId],
    },
  };
}
