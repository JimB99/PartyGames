import type { GameId, RoomContext } from "@party-games/shared";
import type { SimAction } from "../harness.js";
import {
  fleetDuelActions,
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
  blockStackActions,
  chainSketchActions,
  crowdCallActions,
  splitRoomActions,
  spectrumActions,
  starRateActions,
  forbiddenClueActions,
  agentGridActions,
  hangmanRaceActions,
  paddleClashActions,
  gridBlastActions,
  ticTacToeActions,
  triviaActions,
  wordRushActions,
} from "./simulators/index.js";

type SimulatorFn = (state: unknown, ctx: RoomContext) => SimAction[];

const SIMULATORS: Record<GameId, SimulatorFn> = {
  "quick-quiz": triviaActions,
  timeline: triviaActions,
  "would-you-rather": triviaActions,
  "fact-check": bluffActions,
  "reverse-fact": bluffActions,
  "wit-showdown": promptVoteActions,
  "hot-seat": promptVoteActions,
  "draw-guess": drawingActions,
  "word-rush": wordRushActions,
  "bracket-battle": bracketActions,
  "role-sort": roleSortActions,
  impostor: impostorActions,
  "last-on-the-dike": dikeActions,
  "team-charades": charadesActions,
  "trail-dash": curveActions,
  "block-stack": blockStackActions,
  "fleet-duel": fleetDuelActions,
  "four-in-a-row": connectFourActions,
  "tic-tac-toe": ticTacToeActions,
  "split-the-room": splitRoomActions,
  spectrum: spectrumActions,
  "crowd-call": crowdCallActions,
  "star-rate": starRateActions,
  "chain-sketch": chainSketchActions,
  "agent-grid": agentGridActions,
  "forbidden-clue": forbiddenClueActions,
  "hangman-race": hangmanRaceActions,
  "paddle-clash": paddleClashActions,
  "grid-blast": gridBlastActions,
};

export function getSimulatorActions(gameId: GameId, state: unknown, ctx: RoomContext): SimAction[] {
  const sim = SIMULATORS[gameId];
  if (!sim) return [];
  return sim(state, ctx);
}
