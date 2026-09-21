import type { GameId, RoomContext } from "@party-games/shared";
import type { SimAction } from "./harness.js";
import {
  fleetDuelActions,
  bluffActions,
  bracketActions,
  charadesActions,
  connectFourActions,
  curveActions,
  dikeActions,
  drawingActions as pictionarySimActions,
  impostorActions,
  promptVoteActions,
  blockStackActions,
  chainSketchActions,
  crowdCallActions,
  drawImpostorActions,
  splitRoomActions,
  spectrumActions,
  forbiddenClueActions,
  agentGridActions,
  hangmanRaceActions,
  paddleClashActions,
  gridBlastActions,
  ticTacToeActions,
  triviaActions,
  wordRushActions,
} from "./simulators/index.js";
import type { OpinionsState } from "../engines/opinions-engine.js";
import type { DrawingGameState } from "../engines/drawing-game-engine.js";
import type { ImpostorGameState } from "../engines/impostor-game-engine.js";

type SimulatorFn = (state: unknown, ctx: RoomContext) => SimAction[];

function opinionsActions(state: unknown, ctx: RoomContext): SimAction[] {
  const s = state as OpinionsState;
  if (s.scoring === "majority") return triviaActions(s.inner, ctx);
  if (s.scoring === "minority") return splitRoomActions(s.inner, ctx);
  return crowdCallActions(s.inner, ctx);
}

function drawingGameActions(state: unknown, ctx: RoomContext): SimAction[] {
  const s = state as DrawingGameState;
  if (s.style === "telephone") return chainSketchActions(s.inner, ctx);
  return pictionarySimActions(s.inner, ctx);
}

function impostorGameActions(state: unknown, ctx: RoomContext): SimAction[] {
  const s = state as ImpostorGameState;
  if (s.style === "draw") return drawImpostorActions(s.inner, ctx);
  return impostorActions(s.inner, ctx);
}

const SIMULATORS: Record<GameId, SimulatorFn> = {
  bluff: bluffActions,
  "prompt-vote": promptVoteActions,
  opinions: opinionsActions,
  spectrum: spectrumActions,
  impostor: impostorGameActions,
  "agent-grid": agentGridActions,
  "bracket-battle": bracketActions,
  "forbidden-clue": forbiddenClueActions,
  "team-charades": charadesActions,
  "last-on-the-dike": dikeActions,
  trivia: triviaActions,
  drawing: drawingGameActions,
  "trail-dash": curveActions,
  "word-rush": wordRushActions,
  "block-stack": blockStackActions,
  "grid-blast": gridBlastActions,
  "paddle-clash": paddleClashActions,
  "hangman-race": hangmanRaceActions,
  "fleet-duel": fleetDuelActions,
  "four-in-a-row": connectFourActions,
  "tic-tac-toe": ticTacToeActions,
};

export function getSimulatorActions(gameId: GameId, state: unknown, ctx: RoomContext): SimAction[] {
  const sim = SIMULATORS[gameId];
  if (!sim) return [];
  return sim(state, ctx);
}
