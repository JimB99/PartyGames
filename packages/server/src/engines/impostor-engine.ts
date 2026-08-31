import { pickRandom, type GameAction, type RoomContext } from "@party-games/shared";
import type { ImpostorCategory } from "@party-games/shared";

export type ImpostorPhase =
  | "instructions"
  | "questioning"
  | "accusation"
  | "reveal"
  | "scoreboard"
  | "ended";

export interface ImpostorRound {
  categoryId: string;
  categoryLabel: string;
  secretItem: string;
  itemList: string[];
}

export interface ImpostorState {
  phase: ImpostorPhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  timerTotalMs: number | null;
  spyId: string;
  roundInfo: ImpostorRound;
  accusations: Record<string, string>;
  accusationStarter: string | null;
  spyGuessed: boolean;
  spyGuessIndex: number | null;
  roundOutcome: "spy_guessed" | "spy_caught" | "spy_escaped" | "no_majority" | null;
  roundScores: Record<string, number>;
  usedSecrets: string[];
  pool: ImpostorCategory[];
  playerIds: string[];
}

const QUESTION_MS = 360_000;
const ACCUSE_MS = 30_000;
const REVEAL_MS = 8000;
const SCOREBOARD_MS = 5000;

function pickRound(pool: ImpostorCategory[], used: string[]): ImpostorRound {
  const category = pickRandom(pool);
  const available = category.items.filter((item) => !used.includes(`${category.id}:${item}`));
  const secretItem = available.length > 0 ? pickRandom(available) : pickRandom(category.items);
  return {
    categoryId: category.id,
    categoryLabel: category.label,
    secretItem,
    itemList: category.items,
  };
}

function pickSpy(playerIds: string[], previousSpyId: string | null): string {
  const candidates = previousSpyId ? playerIds.filter((id) => id !== previousSpyId) : playerIds;
  return pickRandom(candidates.length > 0 ? candidates : playerIds);
}

export function createImpostorState(
  pool: ImpostorCategory[],
  playerIds: string[],
  maxRounds = 4,
): ImpostorState {
  const spyId = pickSpy(playerIds, null);
  const roundInfo = pickRound(pool, []);
  return {
    phase: "instructions",
    round: 1,
    maxRounds,
    timerEndsAt: Date.now() + 5000,
    timerTotalMs: 5000,
    spyId,
    roundInfo,
    accusations: {},
    accusationStarter: null,
    spyGuessed: false,
    spyGuessIndex: null,
    roundOutcome: null,
    roundScores: {},
    usedSecrets: [`${roundInfo.categoryId}:${roundInfo.secretItem}`],
    pool,
    playerIds,
  };
}

function scoreRound(state: ImpostorState): void {
  state.roundScores = {};
  state.roundOutcome = null;
  const accused = Object.entries(state.accusations).reduce<Record<string, number>>((acc, [, target]) => {
    acc[target] = (acc[target] ?? 0) + 1;
    return acc;
  }, {});
  let topTarget = "";
  let topVotes = 0;
  for (const [id, count] of Object.entries(accused)) {
    if (count > topVotes) {
      topVotes = count;
      topTarget = id;
    }
  }
  const majority = topVotes > state.playerIds.length / 2;
  const spyCaught = majority && topTarget === state.spyId;
  const spyCorrect =
    state.spyGuessed && state.spyGuessIndex !== null && state.roundInfo.itemList[state.spyGuessIndex] === state.roundInfo.secretItem;

  if (spyCorrect) {
    state.roundScores[state.spyId] = 400;
    state.roundOutcome = "spy_guessed";
  } else if (spyCaught) {
    state.roundOutcome = "spy_caught";
    for (const pid of state.playerIds) {
      if (pid !== state.spyId) state.roundScores[pid] = 200;
    }
  } else if (!majority) {
    state.roundScores[state.spyId] = 200;
    state.roundOutcome = "no_majority";
  } else {
    state.roundScores[state.spyId] = 200;
    state.roundOutcome = "spy_escaped";
  }
}

export function advanceImpostor(state: ImpostorState): ImpostorState {
  if (state.phase === "instructions") {
    state.phase = "questioning";
    state.timerEndsAt = Date.now() + QUESTION_MS;
    state.timerTotalMs = QUESTION_MS;
    return state;
  }
  if (state.phase === "questioning") {
    state.phase = "reveal";
    scoreRound(state);
    state.timerEndsAt = Date.now() + REVEAL_MS;
    state.timerTotalMs = REVEAL_MS;
    return state;
  }
  if (state.phase === "accusation") {
    state.phase = "reveal";
    scoreRound(state);
    state.timerEndsAt = Date.now() + REVEAL_MS;
    state.timerTotalMs = REVEAL_MS;
    return state;
  }
  if (state.phase === "reveal") {
    state.phase = "scoreboard";
    state.timerEndsAt = Date.now() + SCOREBOARD_MS;
    state.timerTotalMs = SCOREBOARD_MS;
    return state;
  }
  if (state.phase === "scoreboard") {
    if (state.round >= state.maxRounds) {
      state.phase = "ended";
      state.timerEndsAt = null;
      state.timerTotalMs = null;
      return state;
    }
    state.round += 1;
    const prevSpy = state.spyId;
    state.spyId = pickSpy(state.playerIds, prevSpy);
    state.roundInfo = pickRound(state.pool, state.usedSecrets);
    state.usedSecrets.push(`${state.roundInfo.categoryId}:${state.roundInfo.secretItem}`);
    state.accusations = {};
    state.accusationStarter = null;
    state.spyGuessed = false;
    state.spyGuessIndex = null;
    state.roundOutcome = null;
    state.roundScores = {};
    state.phase = "instructions";
    state.timerEndsAt = Date.now() + 5000;
    state.timerTotalMs = 5000;
    return state;
  }
  return state;
}

export function onImpostorAction(
  state: ImpostorState,
  playerId: string,
  action: GameAction,
  _ctx: RoomContext,
): ImpostorState {
  if (action.kind === "impostor_accuse" && (state.phase === "questioning" || state.phase === "accusation")) {
    if (!state.accusationStarter) {
      state.accusationStarter = playerId;
      state.phase = "accusation";
      state.timerEndsAt = Date.now() + ACCUSE_MS;
      state.timerTotalMs = ACCUSE_MS;
      state.accusations = {};
    }
    state.accusations[playerId] = action.targetId;
    const votes = Object.values(state.accusations);
    if (votes.length >= state.playerIds.length) {
      return advanceImpostor(state);
    }
  }
  if (action.kind === "impostor_guess" && state.phase === "questioning" && playerId === state.spyId) {
    state.spyGuessed = true;
    state.spyGuessIndex = action.itemIndex;
    return advanceImpostor(state);
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
  const showSecret = state.phase === "reveal" || state.phase === "scoreboard" || state.phase === "ended";
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      categoryLabel: state.roundInfo.categoryLabel,
      secretItem: showSecret ? state.roundInfo.secretItem : undefined,
      spyId: showSecret ? state.spyId : undefined,
      accusationStarter: state.accusationStarter,
      roundOutcome: showSecret ? state.roundOutcome : undefined,
      roundScores: state.roundScores,
    },
  };
}

export function impostorPlayerView(state: ImpostorState, playerId: string) {
  const isSpy = playerId === state.spyId;
  const showSecret = state.phase === "reveal" || state.phase === "scoreboard" || state.phase === "ended";
  const canAccuse =
    !isSpy && (state.phase === "questioning" || state.phase === "accusation");
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    timerTotalMs: state.timerTotalMs,
    data: {
      categoryLabel: state.roundInfo.categoryLabel,
      playerIds: canAccuse ? state.playerIds : state.phase === "accusation" ? state.playerIds : undefined,
    },
    playerData: {
      isSpy,
      secretItem: !isSpy && !showSecret ? state.roundInfo.secretItem : showSecret ? state.roundInfo.secretItem : undefined,
      itemList: isSpy && state.phase === "questioning" ? state.roundInfo.itemList : undefined,
      accused: state.accusations[playerId] !== undefined,
      spyGuessed: isSpy ? state.spyGuessed : undefined,
    },
  };
}
