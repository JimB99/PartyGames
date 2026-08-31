/** Sixteen hues ~22.5° apart, saturated for contrast on dark UI backgrounds. */
export const PLAYER_COLORS = [
  "#FF4D4D", // red
  "#FF7733", // orange-red
  "#FFAA22", // orange
  "#FFCC22", // gold
  "#BBDD22", // yellow-green
  "#77DD22", // lime
  "#22DD66", // green
  "#22DDAA", // spring green
  "#22CCCC", // cyan
  "#33BBEE", // sky blue
  "#4488FF", // blue
  "#6666FF", // indigo
  "#9944FF", // purple
  "#CC44FF", // violet
  "#FF44DD", // magenta
  "#FF4477", // pink
] as const;

export const MAX_PLAYERS = 16;
export const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
export const DISCONNECT_GRACE_MS = 120_000;
export const HOST_DISCONNECT_GRACE_MS = 60_000;
export const DEFAULT_TICK_MS = 40;

export type PlayerColor = (typeof PLAYER_COLORS)[number];

export type GameCategory = "social" | "party" | "trivia" | "creative" | "arcade" | "strategy";

export interface GameCategoryMeta {
  id: GameCategory;
  label: string;
  description: string;
  icon: string;
}

export const GAME_CATEGORIES: GameCategoryMeta[] = [
  { id: "social", label: "Social & Voting", description: "Bluff, vote, and laugh together", icon: "💬" },
  { id: "party", label: "Party & Teams", description: "Teams, roles, and group challenges", icon: "🎉" },
  { id: "trivia", label: "Trivia", description: "Test your knowledge", icon: "🧠" },
  { id: "creative", label: "Creative", description: "Draw and imagine", icon: "🎨" },
  { id: "arcade", label: "Arcade", description: "Fast reflexes and survival", icon: "🕹️" },
  { id: "strategy", label: "Strategy", description: "Classic board games", icon: "♟️" },
];

export interface GameMeta {
  id: GameId;
  name: string;
  description: string;
  scoringRules: string;
  minPlayers: number;
  maxPlayers: number;
  category: GameCategory;
  supportsDifficulty?: boolean;
  supportsMatureContent?: boolean;
  supportsTrailDashOptions?: boolean;
  supportsSpeedScoring?: boolean;
  supportsQuestionDisplay?: boolean;
  supportsTimelinePtsPerYear?: boolean;
  supportsPaddleMode?: boolean;
  /** When true, `getRoundScores` is already cumulative for the whole game (arcade/board). */
  roundScoresAreCumulative?: boolean;
}

export const ALL_GAME_IDS = [
  "fact-check",
  "wit-showdown",
  "quick-quiz",
  "would-you-rather",
  "draw-guess",
  "bracket-battle",
  "role-sort",
  "timeline",
  "impostor",
  "trail-dash",
  "word-rush",
  "reverse-fact",
  "team-charades",
  "hot-seat",
  "last-on-the-dike",
  "block-stack",
  "fleet-duel",
  "four-in-a-row",
  "tic-tac-toe",
  "split-the-room",
  "spectrum",
  "chain-sketch",
  "crowd-call",
  "star-rate",
  "agent-grid",
  "forbidden-clue",
  "hangman-race",
  "paddle-clash",
  "grid-blast",
] as const;

export type GameId = (typeof ALL_GAME_IDS)[number];
