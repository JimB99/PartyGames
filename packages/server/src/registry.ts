import type { GameModule } from "@party-games/shared";
import { factCheckGame } from "./games/fact-check.js";
import { witShowdownGame } from "./games/wit-showdown.js";
import { quickQuizGame } from "./games/quick-quiz.js";
import { wouldYouRatherGame } from "./games/would-you-rather.js";
import { drawGuessGame } from "./games/draw-guess.js";
import { bracketBattleGame } from "./games/bracket-battle.js";
import { roleSortGame } from "./games/role-sort.js";
import { timelineGame } from "./games/timeline.js";
import { impostorGame } from "./games/impostor.js";
import { trailDashGame } from "./games/trail-dash.js";
import { wordRushGame } from "./games/word-rush.js";
import { reverseFactGame } from "./games/reverse-fact.js";
import { teamCharadesGame } from "./games/team-charades.js";
import { hotSeatGame } from "./games/hot-seat.js";
import { lastOnTheDikeGame } from "./games/last-on-the-dike.js";
import { blockStackGame } from "./games/block-stack.js";
import { fleetDuelGame } from "./games/fleet-duel.js";
import { fourInARowGame } from "./games/four-in-a-row.js";
import { ticTacToeGame } from "./games/tic-tac-toe.js";
import { splitTheRoomGame } from "./games/split-the-room.js";
import { spectrumGame } from "./games/spectrum.js";
import { chainSketchGame } from "./games/chain-sketch.js";
import { crowdCallGame } from "./games/crowd-call.js";
import { starRateGame } from "./games/star-rate.js";
import { agentGridGame } from "./games/agent-grid.js";
import { forbiddenClueGame } from "./games/forbidden-clue.js";
import { hangmanRaceGame } from "./games/hangman-race.js";
import { paddleClashGame } from "./games/paddle-clash.js";
import { gridBlastGame } from "./games/grid-blast.js";
import { drawVoteGame } from "./games/draw-vote.js";
import { drawImpostorGame } from "./games/draw-impostor.js";
import { captionThisGame } from "./games/caption-this.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const games: GameModule<any>[] = [
  factCheckGame,
  witShowdownGame,
  quickQuizGame,
  wouldYouRatherGame,
  drawGuessGame,
  bracketBattleGame,
  roleSortGame,
  timelineGame,
  impostorGame,
  trailDashGame,
  wordRushGame,
  reverseFactGame,
  teamCharadesGame,
  hotSeatGame,
  lastOnTheDikeGame,
  blockStackGame,
  fleetDuelGame,
  fourInARowGame,
  ticTacToeGame,
  splitTheRoomGame,
  spectrumGame,
  chainSketchGame,
  crowdCallGame,
  starRateGame,
  agentGridGame,
  forbiddenClueGame,
  hangmanRaceGame,
  paddleClashGame,
  gridBlastGame,
  drawVoteGame,
  drawImpostorGame,
  captionThisGame,
];

export const gameRegistry = new Map(games.map((g) => [g.meta.id, g]));

export function getGame(id: string): GameModule | undefined {
  return gameRegistry.get(id as GameModule["meta"]["id"]);
}

export function listGames(): GameModule["meta"][] {
  return games.map((g) => g.meta);
}
