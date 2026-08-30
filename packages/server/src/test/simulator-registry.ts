import type { GameId, RoomContext } from "@party-games/shared";
import type { SimAction } from "../harness.js";
import {
  battleshipActions,
  bluffActions,
  bracketActions,
  charadesActions,
  connectFourActions,
  curveActions,
  dikeActions,
  drawingActions,
  impostorActions,
  promptVoteActions,
  roleSortActions,
  tetrisActions,
  ticTacToeActions,
  triviaActions,
  wordRushActions,
} from "./simulators/index.js";

type SimulatorFn = (state: unknown, ctx: RoomContext) => SimAction[];

const SIMULATORS: Record<GameId, SimulatorFn> = {
  "quick-quiz": triviaActions,
  timeline: triviaActions,
  "would-you-rather": triviaActions,
  fibbage: bluffActions,
  "fibbage-reverse": bluffActions,
  quiplash: promptVoteActions,
  "caption-this": promptVoteActions,
  "hot-seat": promptVoteActions,
  "draw-guess": drawingActions,
  "word-rush": wordRushActions,
  "bracket-battle": bracketActions,
  "role-sort": roleSortActions,
  impostor: impostorActions,
  "last-on-the-dike": dikeActions,
  "team-charades": charadesActions,
  "curve-fever": curveActions,
  "tetris-battle": tetrisActions,
  battleships: battleshipActions,
  "connect-four": connectFourActions,
  "tic-tac-toe": ticTacToeActions,
};

export function getSimulatorActions(gameId: GameId, state: unknown, ctx: RoomContext): SimAction[] {
  const sim = SIMULATORS[gameId];
  if (!sim) return [];
  return sim(state, ctx);
}
