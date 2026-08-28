export const PLAYER_COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#FFE66D",
  "#95E1D3",
  "#F38181",
  "#AA96DA",
  "#FCBAD3",
  "#A8D8EA",
] as const;

export const MAX_PLAYERS = 16;
export const ROOM_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
export const DISCONNECT_GRACE_MS = 120_000;
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
}

export const ALL_GAME_IDS = [
  "fibbage",
  "quiplash",
  "quick-quiz",
  "would-you-rather",
  "caption-this",
  "draw-guess",
  "bracket-battle",
  "role-sort",
  "timeline",
  "impostor",
  "curve-fever",
  "word-rush",
  "fibbage-reverse",
  "team-charades",
  "hot-seat",
  "last-on-the-dike",
  "tetris-battle",
  "battleships",
  "connect-four",
  "tic-tac-toe",
] as const;

export type GameId = (typeof ALL_GAME_IDS)[number];
