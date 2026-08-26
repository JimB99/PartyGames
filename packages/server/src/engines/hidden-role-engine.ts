import { pickRandom, shuffle, type GameAction, type RoomContext } from "@party-games/shared";

export type ImpostorPhase =
  | "instructions"
  | "task"
  | "eject"
  | "reveal"
  | "ended";

export type TaskType = "sync-tap" | "pattern" | "code";

export interface ImpostorState {
  phase: ImpostorPhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  aliens: string[];
  alive: string[];
  taskType: TaskType;
  taskData: Record<string, unknown>;
  taskResults: Record<string, "success" | "fail">;
  ejectVotes: Record<string, string>;
  ejected?: string;
  crewWon: boolean;
  roundScores: Record<string, number>;
}

const TASK_MS = 30000;
const EJECT_MS = 25000;

export function createImpostorState(playerIds: string[]): ImpostorState {
  const alienCount = playerIds.length >= 6 ? 2 : 1;
  const aliens = shuffle(playerIds).slice(0, alienCount);
  return {
    phase: "instructions",
    round: 1,
    maxRounds: 5,
    timerEndsAt: Date.now() + 5000,
    aliens,
    alive: [...playerIds],
    taskType: pickRandom(["sync-tap", "pattern", "code"] as TaskType[]),
    taskData: generateTask("sync-tap"),
    taskResults: {},
    ejectVotes: {},
    crewWon: false,
    roundScores: {},
  };
}

function generateTask(type: TaskType): Record<string, unknown> {
  if (type === "sync-tap") {
    return { targetTime: Date.now() + 5000 + Math.random() * 5000 };
  }
  if (type === "pattern") {
    const colors = ["red", "blue", "green", "yellow"];
    return { sequence: shuffle(colors).slice(0, 3) };
  }
  return { code: String(Math.floor(1000 + Math.random() * 9000)) };
}

export function advanceImpostor(state: ImpostorState): ImpostorState {
  if (state.phase === "instructions") {
    state.phase = "task";
    state.taskType = pickRandom(["sync-tap", "pattern", "code"] as TaskType[]);
    state.taskData = generateTask(state.taskType);
    state.taskResults = {};
    state.timerEndsAt = Date.now() + TASK_MS;
    return state;
  }
  if (state.phase === "task") {
    state.phase = "eject";
    state.ejectVotes = {};
    state.timerEndsAt = Date.now() + EJECT_MS;
    return state;
  }
  if (state.phase === "eject") {
    tallyEject(state);
    checkWin(state);
    if (["ended", "reveal"].includes(state.phase)) {
      return state;
    }
    state.round += 1;
    state.phase = "task";
    state.taskType = pickRandom(["sync-tap", "pattern", "code"] as TaskType[]);
    state.taskData = generateTask(state.taskType);
    state.taskResults = {};
    state.timerEndsAt = Date.now() + TASK_MS;
    return state;
  }
  return state;
}

function tallyEject(state: ImpostorState) {
  const counts: Record<string, number> = {};
  for (const target of Object.values(state.ejectVotes)) {
    counts[target] = (counts[target] ?? 0) + 1;
  }
  let max = 0;
  let ejected = "";
  for (const [id, count] of Object.entries(counts)) {
    if (count > max) {
      max = count;
      ejected = id;
    }
  }
  if (ejected) {
    state.ejected = ejected;
    state.alive = state.alive.filter((id) => id !== ejected);
  }
}

function checkWin(state: ImpostorState) {
  const aliveAliens = state.alive.filter((id) => state.aliens.includes(id));
  const aliveCrew = state.alive.filter((id) => !state.aliens.includes(id));
  if (aliveAliens.length === 0) {
    state.crewWon = true;
    state.phase = "reveal";
    state.timerEndsAt = Date.now() + 8000;
    for (const id of state.alive) {
      if (!state.aliens.includes(id)) state.roundScores[id] = 1500;
    }
    state.phase = "ended";
  } else if (aliveAliens.length >= aliveCrew.length) {
    state.phase = "reveal";
    for (const id of aliveAliens) state.roundScores[id] = 1500;
    state.phase = "ended";
  } else if (state.round >= state.maxRounds) {
    state.phase = "ended";
  }
}

export function onImpostorAction(
  state: ImpostorState,
  playerId: string,
  action: GameAction,
  ctx: RoomContext,
): ImpostorState {
  if (action.kind === "impostor_task" && state.phase === "task") {
    state.taskResults[playerId] = action.result;
    if (Object.keys(state.taskResults).length >= ctx.playerIds.length) {
      return advanceImpostor(state);
    }
  }
  if (action.kind === "impostor_eject" && state.phase === "eject") {
    state.ejectVotes[playerId] = action.targetId;
    if (Object.keys(state.ejectVotes).length >= state.alive.length) {
      return advanceImpostor(state);
    }
  }
  if (action.kind === "advance" && state.phase === "instructions") {
    return advanceImpostor(state);
  }
  return state;
}

export function onImpostorTick(state: ImpostorState): ImpostorState {
  if (!state.timerEndsAt || Date.now() < state.timerEndsAt) return state;
  return advanceImpostor(state);
}

export function impostorHostView(state: ImpostorState) {
  const taskFailures = Object.entries(state.taskResults)
    .filter(([, r]) => r === "fail")
    .map(([id]) => id);
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    data: {
      alive: state.alive,
      aliens: state.phase === "ended" || state.phase === "reveal" ? state.aliens : undefined,
      taskType: state.taskType,
      taskData: state.phase === "task" ? { type: state.taskType } : undefined,
      ejected: state.ejected,
      crewWon: state.crewWon,
      taskFailures: state.phase === "eject" || state.phase === "ended" ? taskFailures : undefined,
      ejectVotes: state.phase === "ended" ? state.ejectVotes : undefined,
      roundScores: state.roundScores,
      taskComplete: Object.keys(state.taskResults).length,
    },
  };
}

export function impostorPlayerView(state: ImpostorState, playerId: string) {
  const isAlien = state.aliens.includes(playerId);
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    data: {
      alive: state.phase === "eject" ? state.alive : undefined,
      taskType: state.taskType,
      taskData: state.phase === "task" ? state.taskData : undefined,
    },
    playerData: {
      isAlien: state.phase === "ended" ? isAlien : undefined,
      role: state.phase !== "instructions" && state.phase !== "ended" ? (isAlien ? "alien" : "crew") : undefined,
      taskDone: state.taskResults[playerId] !== undefined,
      voted: state.ejectVotes[playerId] !== undefined,
    },
  };
}
