import type { GameId } from "./constants.js";
import type { HostControls } from "./host-controls.js";
import type { DikeRevealEntry } from "./dike-logic.js";
import type { PlayerAnswerReveal, RevealEntry } from "./reveal.js";
import type { PowerUpMode } from "./trail-dash-options.js";

export interface ViewTimingFields {
  phase: string;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  timerTotalMs?: number | null;
}

export interface ScoredViewFields {
  roundScores?: Record<string, number>;
  cumulativeScores?: Record<string, number>;
  lastRoundScores?: Record<string, number>;
  results?: Record<string, number>;
}

export interface TriviaViewData extends ScoredViewFields {
  mode?: "quiz" | "timeline" | "would-you-rather";
  question?: string;
  choices?: string[];
  hideChoicesOnTv?: boolean;
  correctIndex?: number;
  event?: string;
  correctYear?: number;
  minYear?: number;
  maxYear?: number;
  optionA?: string;
  optionB?: string;
  wyrPromptOnly?: boolean;
  wyrDilemma?: string;
  voteSplit?: { a: number; b: number };
  discussing?: boolean;
  answerCount?: number;
  playerCount?: number;
  playerAnswers?: PlayerAnswerReveal[];
}

export interface BluffViewData extends ScoredViewFields {
  prompt?: string;
  displayText?: string;
  options?: Array<{ id: string; text: string; authorId?: string | null }>;
  reveal?: RevealEntry[];
  submitCount?: number;
  voteCount?: number;
  playerCount?: number;
  playerAnswers?: PlayerAnswerReveal[];
  discussing?: boolean;
}

export interface PromptVoteViewData extends BluffViewData {
  mode?: string;
  imageCaption?: string;
  targetName?: string;
  submissions?: Array<{ id: string; text: string; playerId?: string }>;
  matchup?: {
    a?: { id: string; text: string };
    b?: { id: string; text: string };
    index?: number;
    total?: number;
  };
}

export interface BracketViewData extends ScoredViewFields {
  prompt?: string;
  displayText?: string;
  entries?: Array<{ id: string; text: string; authorId?: string }>;
  bracket?: unknown;
  championId?: string;
  submitCount?: number;
  voteCount?: number;
  playerCount?: number;
  reveal?: RevealEntry[];
}

export interface RoleSortViewData extends Omit<ScoredViewFields, "results"> {
  category?: string;
  roles?: string[];
  assignmentCount?: number;
  submittedPlayerIds?: string[];
  playerCount?: number;
  results?: Record<string, { role: string; count: number }>;
  myResult?: { role: string };
}

export interface DrawingViewData extends ScoredViewFields {
  prompt?: string;
  strokes?: Array<{ points: number[]; color: string; width?: number; erase?: boolean }>;
  drawings?: Array<{ playerId?: string; id?: string; strokes: DrawingViewData["strokes"] }>;
  submitCount?: number;
  playerCount?: number;
}

export interface ImpostorViewData extends ScoredViewFields {
  category?: string;
  location?: string;
  phaseLabel?: string;
  accusationCount?: number;
  playerCount?: number;
}

export interface TrailDashViewData extends ScoredViewFields {
  players?: unknown[];
  coinValue?: number;
  powerUpMode?: PowerUpMode;
}

export interface WordRushViewData extends ScoredViewFields {
  letters?: string[];
  submitCount?: number;
}

export interface DikeViewData extends ScoredViewFields {
  walkerCount?: number;
  submitCount?: number;
  playerCount?: number;
  reveal?: DikeRevealEntry[];
  winnerId?: string;
  placement?: string[];
}

export interface BoardMatchViewData extends ScoredViewFields {
  board?: unknown;
  match?: unknown;
  players?: unknown;
  drawReplayCount?: number;
}

export interface SplitViewData extends ScoredViewFields {
  scenario?: { text: string; labelA: string; labelB: string };
  voteSplit?: { a: number; b: number };
}

export interface SpectrumViewData extends ScoredViewFields {
  pair?: { left: string; right: string };
  target?: number;
  guesses?: Record<string, number>;
  clue?: string;
}

export interface CrowdCallViewData extends ScoredViewFields {
  question?: string;
  choices?: string[];
  predictionResult?: { correct: boolean; majorityIndex: number };
}

export interface StarRateViewData extends ScoredViewFields {
  prompt?: string;
  submissions?: Array<{
    id: string;
    text: string;
    average?: number;
    histogram?: number[];
  }>;
  progress?: Record<string, number>;
  submitCount?: number;
  playerCount?: number;
}

export interface AgentGridViewData extends ScoredViewFields {
  words?: string[];
  revealed?: boolean[];
  key?: Array<"a" | "b" | "neutral" | "assassin" | undefined>;
  activeTeam?: "a" | "b";
  currentClue?: { word: string; count: number } | null;
  guessesRemaining?: number;
  winner?: "a" | "b" | null;
}

export interface CharadesViewData extends ScoredViewFields {
  actorId?: string;
  teamScores?: Record<string, number>;
}

export interface ArcadeViewData extends ScoredViewFields {
  players?: unknown[];
  leaderboard?: unknown[];
  spotlightPlayerId?: string;
  word?: string;
}

export type GameHostDataMap = {
  "quick-quiz": TriviaViewData;
  timeline: TriviaViewData;
  "would-you-rather": TriviaViewData;
  "fact-check": BluffViewData;
  "reverse-fact": BluffViewData;
  "wit-showdown": PromptVoteViewData;
  "caption-this": PromptVoteViewData;
  "hot-seat": PromptVoteViewData;
  "draw-guess": DrawingViewData;
  "draw-vote": DrawingViewData;
  "draw-impostor": DrawingViewData;
  "bracket-battle": BracketViewData;
  "role-sort": RoleSortViewData;
  impostor: ImpostorViewData;
  "trail-dash": TrailDashViewData;
  "word-rush": WordRushViewData;
  "team-charades": CharadesViewData;
  "last-on-the-dike": DikeViewData;
  "block-stack": ArcadeViewData;
  "fleet-duel": ArcadeViewData;
  "four-in-a-row": BoardMatchViewData;
  "tic-tac-toe": BoardMatchViewData;
  "split-the-room": SplitViewData;
  spectrum: SpectrumViewData;
  "chain-sketch": DrawingViewData;
  "crowd-call": CrowdCallViewData;
  "star-rate": StarRateViewData;
  "agent-grid": AgentGridViewData;
  "forbidden-clue": CharadesViewData;
  "hangman-race": ArcadeViewData;
  "paddle-clash": ArcadeViewData;
  "grid-blast": ArcadeViewData;
};

export type GamePlayerDataMap = {
  [K in GameId]: Record<string, unknown>;
};

export type HostViewById<G extends GameId = GameId> = ViewTimingFields & {
  gameId: G;
  hostControls: HostControls;
  data: GameHostDataMap[G];
};

export type PlayerViewById<G extends GameId = GameId> = ViewTimingFields & {
  gameId: G;
  data: GameHostDataMap[G];
  playerData: GamePlayerDataMap[G];
};

export type HostViewSnapshot = { [K in GameId]: HostViewById<K> }[GameId];
export type PlayerViewSnapshot = { [K in GameId]: PlayerViewById<K> }[GameId];

/** Correlate a runtime GameId with untyped engine view data at the room boundary. */
export function assembleHostView(
  gameId: GameId,
  view: ViewTimingFields & { data: Record<string, unknown> },
  hostControls: HostControls,
): HostViewSnapshot {
  return {
    gameId,
    phase: view.phase,
    round: view.round,
    maxRounds: view.maxRounds,
    timerEndsAt: view.timerEndsAt,
    timerTotalMs: view.timerTotalMs,
    hostControls,
    data: view.data,
  } as HostViewSnapshot;
}

export function assemblePlayerView(
  gameId: GameId,
  view: ViewTimingFields & { data: Record<string, unknown>; playerData: Record<string, unknown> },
): PlayerViewSnapshot {
  return {
    gameId,
    phase: view.phase,
    round: view.round,
    maxRounds: view.maxRounds,
    timerEndsAt: view.timerEndsAt,
    timerTotalMs: view.timerTotalMs,
    data: view.data,
    playerData: view.playerData,
  } as PlayerViewSnapshot;
}

export function hostDataFor<G extends GameId>(view: HostViewById<G>): GameHostDataMap[G] {
  return view.data;
}

export function playerDataFor<G extends GameId>(view: PlayerViewById<G>): GameHostDataMap[G] {
  return view.data;
}
