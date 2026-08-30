import { pickRandom, type GameAction, type RoomContext } from "@party-games/shared";
import type { OutOfPlaceCategory } from "@party-games/shared";

export type OutOfPlacePhase =
  | "instructions"
  | "questioning"
  | "accusation"
  | "reveal"
  | "scoreboard"
  | "ended";

export interface OutOfPlaceRound {
  categoryId: string;
  categoryLabel: string;
  secretItem: string;
  itemList: string[];
}

export interface OutOfPlaceState {
  phase: OutOfPlacePhase;
  round: number;
  maxRounds: number;
  timerEndsAt: number | null;
  spyId: string;
  roundInfo: OutOfPlaceRound;
  accusations: Record<string, string>;
  accusationStarter: string | null;
  spyGuessed: boolean;
  spyGuessIndex: number | null;
  roundScores: Record<string, number>;
  usedSecrets: string[];
  pool: OutOfPlaceCategory[];
  playerIds: string[];
}

const QUESTION_MS = 360_000;
const ACCUSE_MS = 30_000;
const REVEAL_MS = 8000;
const SCOREBOARD_MS = 5000;

function pickRound(pool: OutOfPlaceCategory[], used: string[]): OutOfPlaceRound {
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

export function createOutOfPlaceState(
  pool: OutOfPlaceCategory[],
  playerIds: string[],
  maxRounds = 4,
): OutOfPlaceState {
  const spyId = pickRandom(playerIds);
  const roundInfo = pickRound(pool, []);
  return {
    phase: "instructions",
    round: 1,
    maxRounds,
    timerEndsAt: Date.now() + 5000,
    spyId,
    roundInfo,
    accusations: {},
    accusationStarter: null,
    spyGuessed: false,
    spyGuessIndex: null,
    roundScores: {},
    usedSecrets: [`${roundInfo.categoryId}:${roundInfo.secretItem}`],
    pool,
    playerIds,
  };
}

function scoreRound(state: OutOfPlaceState): void {
  state.roundScores = {};
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

  if (spyCorrect) state.roundScores[state.spyId] = 400;
  else if (!spyCaught && !majority) state.roundScores[state.spyId] = 200;

  if (spyCaught) {
    for (const pid of state.playerIds) {
      if (pid !== state.spyId) state.roundScores[pid] = 200;
    }
  }
}

export function advanceOutOfPlace(state: OutOfPlaceState): OutOfPlaceState {
  if (state.phase === "instructions") {
    state.phase = "questioning";
    state.timerEndsAt = Date.now() + QUESTION_MS;
    return state;
  }
  if (state.phase === "questioning") {
    state.phase = "reveal";
    scoreRound(state);
    state.timerEndsAt = Date.now() + REVEAL_MS;
    return state;
  }
  if (state.phase === "accusation") {
    state.phase = "reveal";
    scoreRound(state);
    state.timerEndsAt = Date.now() + REVEAL_MS;
    return state;
  }
  if (state.phase === "reveal") {
    state.phase = "scoreboard";
    state.timerEndsAt = Date.now() + SCOREBOARD_MS;
    return state;
  }
  if (state.phase === "scoreboard") {
    if (state.round >= state.maxRounds) {
      state.phase = "ended";
      state.timerEndsAt = null;
      return state;
    }
    state.round += 1;
    state.spyId = pickRandom(state.playerIds);
    state.roundInfo = pickRound(state.pool, state.usedSecrets);
    state.usedSecrets.push(`${state.roundInfo.categoryId}:${state.roundInfo.secretItem}`);
    state.accusations = {};
    state.accusationStarter = null;
    state.spyGuessed = false;
    state.spyGuessIndex = null;
    state.roundScores = {};
    state.phase = "instructions";
    state.timerEndsAt = Date.now() + 5000;
    return state;
  }
  return state;
}

export function onOutOfPlaceAction(
  state: OutOfPlaceState,
  playerId: string,
  action: GameAction,
  _ctx: RoomContext,
): OutOfPlaceState {
  if (action.kind === "stranger_accuse" && (state.phase === "questioning" || state.phase === "accusation")) {
    if (!state.accusationStarter) {
      state.accusationStarter = playerId;
      state.phase = "accusation";
      state.timerEndsAt = Date.now() + ACCUSE_MS;
      state.accusations = {};
    }
    state.accusations[playerId] = action.targetId;
    const votes = Object.values(state.accusations);
    if (votes.length >= state.playerIds.length) {
      return advanceOutOfPlace(state);
    }
  }
  if (action.kind === "stranger_guess" && state.phase === "questioning" && playerId === state.spyId) {
    state.spyGuessed = true;
    state.spyGuessIndex = action.itemIndex;
    return advanceOutOfPlace(state);
  }
  if (action.kind === "advance" && state.phase === "instructions") {
    return advanceOutOfPlace(state);
  }
  return state;
}

export function onOutOfPlaceTick(state: OutOfPlaceState): OutOfPlaceState {
  if (!state.timerEndsAt || Date.now() < state.timerEndsAt) return state;
  return advanceOutOfPlace(state);
}

export function outOfPlaceHostView(state: OutOfPlaceState) {
  const showSecret = state.phase === "reveal" || state.phase === "scoreboard" || state.phase === "ended";
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    data: {
      categoryLabel: state.roundInfo.categoryLabel,
      secretItem: showSecret ? state.roundInfo.secretItem : undefined,
      spyId: showSecret ? state.spyId : undefined,
      accusationStarter: state.accusationStarter,
      roundScores: state.roundScores,
    },
  };
}

export function outOfPlacePlayerView(state: OutOfPlaceState, playerId: string) {
  const isSpy = playerId === state.spyId;
  const showSecret = state.phase === "reveal" || state.phase === "scoreboard" || state.phase === "ended";
  return {
    phase: state.phase,
    round: state.round,
    maxRounds: state.maxRounds,
    timerEndsAt: state.timerEndsAt,
    data: {
      categoryLabel: state.roundInfo.categoryLabel,
      playerIds: state.phase === "accusation" ? state.playerIds : undefined,
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
