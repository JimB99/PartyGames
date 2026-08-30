import type { GameAction, RoomContext } from "@party-games/shared";
import type { SimAction } from "../harness.js";
import { getPhase } from "../harness.js";

export function triviaActions(state: unknown, ctx: RoomContext): SimAction[] {
  const phase = getPhase(state);
  const s = state as {
    mode?: string;
    correctYear?: number;
    options?: Array<{ id: string }>;
  };
  const actions: SimAction[] = [];

  if (phase === "instructions") {
    actions.push({ role: "host", action: { kind: "advance" } });
    return actions;
  }

  if (phase === "question") {
    for (const playerId of ctx.playerIds) {
      if (s.mode === "quiz") {
        actions.push({ role: "player", playerId, action: { kind: "trivia_answer", choiceIndex: 0 } });
      } else if (s.mode === "timeline") {
        actions.push({
          role: "player",
          playerId,
          action: { kind: "year_slider", year: s.correctYear ?? 2000 },
        });
      } else {
        actions.push({ role: "player", playerId, action: { kind: "would_you_rather", choice: "a" } });
      }
    }
    return actions;
  }

  if (phase === "reveal" || phase === "scoreboard") {
    actions.push({ role: "host", action: { kind: "advance" } });
  }

  return actions;
}

export function bluffActions(state: unknown, ctx: RoomContext): SimAction[] {
  const phase = getPhase(state);
  const s = state as { options?: Array<{ id: string }> };
  const actions: SimAction[] = [];

  if (phase === "instructions") {
    actions.push({ role: "host", action: { kind: "advance" } });
    return actions;
  }

  if (phase === "submit") {
    for (const playerId of ctx.playerIds) {
      actions.push({ role: "player", playerId, action: { kind: "submit_text", text: `Lie from ${playerId}` } });
    }
    return actions;
  }

  if (phase === "vote" && s.options?.[0]) {
    const optionId = s.options[0].id;
    for (const playerId of ctx.playerIds) {
      actions.push({ role: "player", playerId, action: { kind: "vote", optionId } });
    }
    return actions;
  }

  if (phase === "reveal" || phase === "scoreboard") {
    actions.push({ role: "host", action: { kind: "advance" } });
  }

  return actions;
}

export function promptVoteActions(state: unknown, ctx: RoomContext): SimAction[] {
  const phase = getPhase(state);
  const s = state as {
    mode?: string;
    targetPlayerId?: string;
    submissions?: Array<{ id: string; playerId: string }>;
    matchups?: Array<{ a: string; b: string }>;
    matchupIndex?: number;
  };
  const actions: SimAction[] = [];

  if (phase === "instructions") {
    actions.push({ role: "host", action: { kind: "advance" } });
    return actions;
  }

  if (phase === "submit") {
    for (const playerId of ctx.playerIds) {
      if (s.mode === "hot-seat" && playerId === s.targetPlayerId) continue;
      actions.push({ role: "player", playerId, action: { kind: "submit_text", text: `Answer ${playerId}` } });
    }
    return actions;
  }

  if (phase === "matchup" && s.matchups?.[s.matchupIndex ?? 0]) {
    const matchup = s.matchups[s.matchupIndex ?? 0];
    for (const playerId of ctx.playerIds) {
      actions.push({ role: "player", playerId, action: { kind: "vote_pair", winnerId: matchup.a } });
    }
    return actions;
  }

  if (phase === "vote" && s.submissions?.[0]) {
    const optionId = s.submissions[0].id;
    for (const playerId of ctx.playerIds) {
      actions.push({ role: "player", playerId, action: { kind: "vote", optionId } });
    }
    return actions;
  }

  if (phase === "pick" && s.targetPlayerId && s.submissions?.[0]) {
    actions.push({
      role: "player",
      playerId: s.targetPlayerId,
      action: { kind: "hot_seat_pick", submissionId: s.submissions[0].id },
    });
    return actions;
  }

  if (phase === "reveal" || phase === "scoreboard") {
    actions.push({ role: "host", action: { kind: "advance" } });
  }

  return actions;
}

export function drawingActions(state: unknown, ctx: RoomContext): SimAction[] {
  const phase = getPhase(state);
  const s = state as { drawerIndex?: number; word?: string; playerIds?: string[] };
  const drawerId = ctx.playerIds[s.drawerIndex ?? 0];
  const actions: SimAction[] = [];

  if (phase === "instructions") {
    actions.push({ role: "host", action: { kind: "advance" } });
    return actions;
  }

  if (phase === "drawing") {
    actions.push({
      role: "player",
      playerId: drawerId,
      action: { kind: "draw_stroke", points: [10, 10, 20, 20], color: "#fff" },
    });
    return actions;
  }

  if (phase === "guessing") {
    for (const playerId of ctx.playerIds) {
      if (playerId === drawerId) continue;
      actions.push({ role: "player", playerId, action: { kind: "submit_text", text: s.word ?? "guess" } });
    }
    return actions;
  }

  if (phase === "reveal" || phase === "scoreboard") {
    actions.push({ role: "host", action: { kind: "advance" } });
  }

  return actions;
}

export function wordRushActions(state: unknown, ctx: RoomContext): SimAction[] {
  const phase = getPhase(state);
  const actions: SimAction[] = [];

  if (phase === "instructions") {
    actions.push({ role: "host", action: { kind: "advance" } });
    return actions;
  }

  if (phase === "playing") {
    for (const playerId of ctx.playerIds) {
      actions.push({ role: "player", playerId, action: { kind: "submit_text", text: "test" } });
    }
    return actions;
  }

  if (phase === "reveal" || phase === "scoreboard") {
    actions.push({ role: "host", action: { kind: "advance" } });
  }

  return actions;
}

export function bracketActions(state: unknown, ctx: RoomContext): SimAction[] {
  const phase = getPhase(state);
  const s = state as {
    bracket?: Array<{ a: string; b: string }>;
    matchIndex?: number;
    entries?: Array<{ id: string }>;
  };
  const actions: SimAction[] = [];

  if (phase === "instructions") {
    actions.push({ role: "host", action: { kind: "advance" } });
    return actions;
  }

  if (phase === "submit") {
    for (const playerId of ctx.playerIds) {
      actions.push({ role: "player", playerId, action: { kind: "submit_text", text: `Entry ${playerId}` } });
    }
    return actions;
  }

  if (phase === "vote") {
    const match = s.bracket?.[s.matchIndex ?? 0];
    const optionId = match?.a ?? s.entries?.[0]?.id ?? "x";
    for (const playerId of ctx.playerIds) {
      actions.push({ role: "player", playerId, action: { kind: "vote", optionId } });
    }
    return actions;
  }

  if (phase === "reveal") {
    actions.push({ role: "host", action: { kind: "advance" } });
  }

  return actions;
}

export function roleSortActions(state: unknown, ctx: RoomContext): SimAction[] {
  const phase = getPhase(state);
  const s = state as { roles?: string[] };
  const role = s.roles?.[0] ?? "Role A";
  const actions: SimAction[] = [];

  if (phase === "instructions") {
    actions.push({ role: "host", action: { kind: "advance" } });
    return actions;
  }

  if (phase === "assign") {
    for (const playerId of ctx.playerIds) {
      const assignments: Record<string, string> = {};
      for (const targetId of ctx.playerIds) {
        if (targetId !== playerId) assignments[targetId] = role;
      }
      actions.push({ role: "player", playerId, action: { kind: "assign_role", assignments } });
    }
    return actions;
  }

  if (phase === "reveal" || phase === "scoreboard") {
    actions.push({ role: "host", action: { kind: "advance" } });
  }

  return actions;
}

export function impostorActions(state: unknown, ctx: RoomContext): SimAction[] {
  const phase = getPhase(state);
  const s = state as { alive?: string[] };
  const actions: SimAction[] = [];

  if (phase === "instructions") {
    actions.push({ role: "host", action: { kind: "advance" } });
    return actions;
  }

  if (phase === "task") {
    for (const playerId of ctx.playerIds) {
      actions.push({ role: "player", playerId, action: { kind: "impostor_task", result: "success" } });
    }
    return actions;
  }

  if (phase === "eject") {
    const alive = s.alive ?? ctx.playerIds;
    const target = alive[alive.length - 1];
    for (const playerId of alive) {
      actions.push({ role: "player", playerId, action: { kind: "impostor_eject", targetId: target } });
    }
    return actions;
  }

  return actions;
}

export function dikeActions(state: unknown, ctx: RoomContext): SimAction[] {
  const phase = getPhase(state);
  const s = state as { alive?: string[] };
  const alive = s.alive ?? ctx.playerIds;
  const actions: SimAction[] = [];

  if (phase === "instructions") {
    actions.push({ role: "host", action: { kind: "advance" } });
    return actions;
  }

  if (phase === "bid") {
    alive.forEach((playerId, index) => {
      actions.push({
        role: "player",
        playerId,
        action: { kind: "dike_bid", amount: 15 + index * 10 },
      });
    });
    return actions;
  }

  if (phase === "reveal") {
    actions.push({ role: "host", action: { kind: "advance" } });
  }

  return actions;
}

export function charadesActions(state: unknown, ctx: RoomContext): SimAction[] {
  const phase = getPhase(state);
  const s = state as { actorIndex?: number };
  const actorId = ctx.playerIds[s.actorIndex ?? 0];
  const actions: SimAction[] = [];

  if (phase === "instructions") {
    actions.push({ role: "host", action: { kind: "advance" } });
    return actions;
  }

  if (phase === "acting") {
    actions.push({ role: "player", playerId: actorId, action: { kind: "charades_correct" } });
    actions.push({ role: "host", action: { kind: "advance" } });
    return actions;
  }

  if (phase === "reveal" || phase === "scoreboard") {
    actions.push({ role: "host", action: { kind: "advance" } });
  }

  return actions;
}

export function curveActions(state: unknown, ctx: RoomContext): SimAction[] {
  const phase = getPhase(state);
  const actions: SimAction[] = [];

  if (phase === "instructions" || phase === "round_end") {
    actions.push({ role: "host", action: { kind: "advance" } });
    return actions;
  }

  if (phase === "playing") {
    for (const playerId of ctx.playerIds) {
      actions.push({ role: "player", playerId, action: { kind: "trail_dash_turn", direction: "left" } });
    }
  }

  return actions;
}

export function blockStackActions(state: unknown, ctx: RoomContext): SimAction[] {
  const phase = getPhase(state);
  const actions: SimAction[] = [];

  if (phase === "instructions" || phase === "round_end") {
    actions.push({ role: "host", action: { kind: "advance" } });
    return actions;
  }

  if (phase === "playing") {
    for (const playerId of ctx.playerIds) {
      actions.push({ role: "player", playerId, action: { kind: "block_stack_input", input: "left" } });
    }
  }

  return actions;
}

export function fleetDuelActions(state: unknown, ctx: RoomContext): SimAction[] {
  const phase = getPhase(state);
  const s = state as {
    mode?: string;
    playerIds?: string[];
    currentTurn?: number;
    fleets?: Record<string, { shots: Array<{ x: number; y: number }> }>;
  };
  const actions: SimAction[] = [];

  if (phase === "instructions" || phase === "betting" || phase === "reveal") {
    actions.push({ role: "host", action: { kind: "advance" } });
    return actions;
  }

  if (phase === "placement") {
    for (const playerId of ctx.playerIds) {
      actions.push({ role: "player", playerId, action: { kind: "fleet_duel_random" } });
      actions.push({ role: "player", playerId, action: { kind: "fleet_duel_ready" } });
    }
    return actions;
  }

  if (phase === "fire") {
    for (const playerId of ctx.playerIds) {
      const targetId = ctx.playerIds.find((id) => id !== playerId);
      const shotCount = s.fleets?.[playerId]?.shots?.length ?? 0;
      actions.push({
        role: "player",
        playerId,
        action: {
          kind: "fleet_duel_fire",
          x: shotCount % 10,
          y: Math.floor(shotCount / 10) % 10,
          targetId,
        },
      });
    }
    return actions;
  }

  if (phase === "battle" && s.mode === "duel") {
    const turnId = s.playerIds?.[s.currentTurn ?? 0] ?? ctx.playerIds[0];
    const shotCount = s.fleets?.[turnId]?.shots?.length ?? 0;
    actions.push({
      role: "player",
      playerId: turnId,
      action: { kind: "fleet_duel_fire", x: shotCount % 10, y: Math.floor(shotCount / 10) % 10 },
    });
    return actions;
  }

  return actions;
}

export function connectFourActions(state: unknown, ctx: RoomContext): SimAction[] {
  const phase = getPhase(state);
  const actions: SimAction[] = [];

  if (phase === "instructions" || phase === "match_end") {
    actions.push({ role: "host", action: { kind: "advance" } });
    return actions;
  }

  if (phase === "playing") {
    const s = state as {
      currentPlayerIndex?: number;
      championId?: string;
      challengerId?: string;
      board?: (string | null)[][];
    };
    const pair =
      ctx.playerIds.length === 2
        ? ctx.playerIds
        : ([s.championId, s.challengerId].filter(Boolean) as string[]);
    const turnId = pair[s.currentPlayerIndex ?? 0];
    if (turnId) {
      const board = s.board ?? [];
      let col = 0;
      for (let c = 0; c < 7; c++) {
        if (board[0]?.[c] === null) {
          col = c;
          break;
        }
      }
      actions.push({ role: "player", playerId: turnId, action: { kind: "four_in_a_row_drop", column: col } });
    }
  }

  return actions;
}

export function ticTacToeActions(state: unknown, ctx: RoomContext): SimAction[] {
  const phase = getPhase(state);
  const actions: SimAction[] = [];

  if (phase === "instructions" || phase === "match_end") {
    actions.push({ role: "host", action: { kind: "advance" } });
    return actions;
  }

  if (phase === "playing") {
    const s = state as {
      bracket?: Array<{
        xPlayer: string | null;
        oPlayer: string | null;
        turn: "x" | "o";
        board: ("x" | "o" | null)[];
        winner: string | null;
      }>;
      matchIndex?: number;
    };
    const match = s.bracket?.[s.matchIndex ?? 0];
    if (!match) return actions;

    if (match.winner) {
      actions.push({ role: "host", action: { kind: "advance" } });
      return actions;
    }

    const mark = match.turn;
    const turnPlayer = mark === "x" ? match.xPlayer : match.oPlayer;
    if (!turnPlayer) {
      actions.push({ role: "host", action: { kind: "advance" } });
      return actions;
    }

    const winLines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    let cell = -1;
    for (const [a, b, c] of winLines) {
      const line = [match.board[a], match.board[b], match.board[c]];
      if (line.filter((v) => v === mark).length === 2 && line.includes(null)) {
        cell = [a, b, c][line.indexOf(null)]!;
        break;
      }
    }
    if (cell < 0) {
      const emptyCells = match.board
        .map((value, idx) => (value === null ? idx : -1))
        .filter((idx) => idx >= 0);
      cell = emptyCells[0] ?? 0;
    }
    actions.push({ role: "player", playerId: turnPlayer, action: { kind: "tic_tac_toe_move", cell } });
  }

  return actions;
}

export function splitRoomActions(state: unknown, ctx: RoomContext): SimAction[] {
  const phase = getPhase(state);
  const actions: SimAction[] = [];
  if (phase === "instructions") {
    actions.push({ role: "host", action: { kind: "advance" } });
    return actions;
  }
  if (phase === "submit") {
    for (const playerId of ctx.playerIds) {
      actions.push({ role: "player", playerId, action: { kind: "submit_text", text: `Take ${playerId}` } });
    }
    return actions;
  }
  if (phase === "vote") {
    for (const playerId of ctx.playerIds) {
      actions.push({ role: "player", playerId, action: { kind: "split_vote", side: "a" } });
    }
    return actions;
  }
  if (phase === "reveal" || phase === "scoreboard") {
    actions.push({ role: "host", action: { kind: "advance" } });
  }
  return actions;
}

export function spectrumActions(state: unknown, ctx: RoomContext): SimAction[] {
  const phase = getPhase(state);
  const s = state as { clueGiverId?: string };
  const actions: SimAction[] = [];
  if (phase === "instructions") {
    actions.push({ role: "host", action: { kind: "advance" } });
    return actions;
  }
  if (phase === "clue" && s.clueGiverId) {
    actions.push({ role: "player", playerId: s.clueGiverId, action: { kind: "submit_text", text: "clue" } });
    return actions;
  }
  if (phase === "guess") {
    for (const playerId of ctx.playerIds) {
      if (playerId === s.clueGiverId) continue;
      actions.push({ role: "player", playerId, action: { kind: "spectrum_guess", value: 50 } });
    }
    return actions;
  }
  if (phase === "reveal" || phase === "scoreboard") {
    actions.push({ role: "host", action: { kind: "advance" } });
  }
  return actions;
}

export function crowdCallActions(state: unknown, ctx: RoomContext): SimAction[] {
  const phase = getPhase(state);
  const actions: SimAction[] = [];
  if (phase === "instructions") {
    actions.push({ role: "host", action: { kind: "advance" } });
    return actions;
  }
  if (phase === "predict") {
    for (const playerId of ctx.playerIds) {
      actions.push({ role: "player", playerId, action: { kind: "crowd_predict", choiceIndex: 0 } });
    }
    return actions;
  }
  if (phase === "answer") {
    for (const playerId of ctx.playerIds) {
      actions.push({ role: "player", playerId, action: { kind: "crowd_answer", choiceIndex: 0 } });
    }
    return actions;
  }
  if (phase === "reveal" || phase === "scoreboard") {
    actions.push({ role: "host", action: { kind: "advance" } });
  }
  return actions;
}

export function starRateActions(state: unknown, ctx: RoomContext): SimAction[] {
  const phase = getPhase(state);
  const s = state as { submissions?: Array<{ id: string; playerId: string }> };
  const actions: SimAction[] = [];
  if (phase === "instructions") {
    actions.push({ role: "host", action: { kind: "advance" } });
    return actions;
  }
  if (phase === "submit") {
    for (const playerId of ctx.playerIds) {
      actions.push({ role: "player", playerId, action: { kind: "submit_text", text: `Stars ${playerId}` } });
    }
    return actions;
  }
  if (phase === "rate" && s.submissions?.[0]) {
    for (const playerId of ctx.playerIds) {
      const sub = s.submissions.find((x) => x.playerId !== playerId);
      if (sub) {
        actions.push({ role: "player", playerId, action: { kind: "star_rate", submissionId: sub.id, stars: 4 } });
      }
    }
    return actions;
  }
  if (phase === "reveal" || phase === "scoreboard") {
    actions.push({ role: "host", action: { kind: "advance" } });
  }
  return actions;
}

export function chainSketchActions(state: unknown, ctx: RoomContext): SimAction[] {
  const phase = getPhase(state);
  const s = state as { linkIndex?: number };
  const active = ctx.playerIds[(s.linkIndex ?? 0) % ctx.playerIds.length];
  const actions: SimAction[] = [];
  if (phase === "instructions") {
    actions.push({ role: "host", action: { kind: "advance" } });
    return actions;
  }
  if (phase === "draw") {
    actions.push({
      role: "player",
      playerId: active,
      action: { kind: "draw_stroke", points: [10, 10, 30, 30], color: "#fff" },
    });
    actions.push({ role: "player", playerId: active, action: { kind: "advance" } });
    return actions;
  }
  if (phase === "guess") {
    actions.push({ role: "player", playerId: active, action: { kind: "submit_text", text: "guess" } });
    return actions;
  }
  if (phase === "reveal" || phase === "scoreboard") {
    actions.push({ role: "host", action: { kind: "advance" } });
  }
  return actions;
}

export function outOfPlaceActions(state: unknown, ctx: RoomContext): SimAction[] {
  const phase = getPhase(state);
  const s = state as { spyId?: string };
  const actions: SimAction[] = [];
  if (phase === "instructions") {
    actions.push({ role: "host", action: { kind: "advance" } });
    return actions;
  }
  if (phase === "questioning" && s.spyId) {
    actions.push({ role: "player", playerId: s.spyId, action: { kind: "stranger_guess", itemIndex: 0 } });
    return actions;
  }
  if (phase === "accusation") {
    for (const pid of ctx.playerIds) {
      actions.push({ role: "player", playerId: pid, action: { kind: "stranger_accuse", targetId: s.spyId ?? ctx.playerIds[0] } });
    }
    return actions;
  }
  if (phase === "reveal" || phase === "scoreboard") {
    actions.push({ role: "host", action: { kind: "advance" } });
  }
  return actions;
}

export function forbiddenClueActions(state: unknown, ctx: RoomContext): SimAction[] {
  const phase = getPhase(state);
  const s = state as { clueGiverId?: string };
  const actions: SimAction[] = [];
  if (phase === "instructions") {
    actions.push({ role: "host", action: { kind: "advance" } });
    return actions;
  }
  if (phase === "clue" && s.clueGiverId) {
    actions.push({ role: "player", playerId: s.clueGiverId, action: { kind: "forbidden_correct" } });
    actions.push({ role: "player", playerId: s.clueGiverId, action: { kind: "advance" } });
    return actions;
  }
  if (phase === "reveal" || phase === "scoreboard") {
    actions.push({ role: "host", action: { kind: "advance" } });
  }
  return actions;
}

export function agentGridActions(state: unknown, ctx: RoomContext): SimAction[] {
  const phase = getPhase(state);
  const s = state as {
    spymasterA?: string;
    spymasterB?: string;
    activeTeam?: "a" | "b";
    teamA?: string[];
    teamB?: string[];
    revealed?: boolean[];
    guessesRemaining?: number;
    key?: Array<"a" | "b" | "neutral" | "assassin">;
  };
  const actions: SimAction[] = [];
  if (phase === "instructions") {
    actions.push({ role: "host", action: { kind: "advance" } });
    return actions;
  }
  const spy = s.activeTeam === "a" ? s.spymasterA : s.spymasterB;
  const teamIds = s.activeTeam === "a" ? s.teamA : s.teamB;
  const operative = teamIds?.find((id) => id !== spy);
  if (phase === "clue" && spy) {
    actions.push({ role: "player", playerId: spy, action: { kind: "agent_clue", word: "test", count: 8 } });
    return actions;
  }
  if (phase === "guess" && operative) {
    const ownIndices =
      s.key
        ?.map((tile, i) => (tile === s.activeTeam && !s.revealed?.[i] ? i : -1))
        .filter((i) => i >= 0) ?? [];
    let sent = 0;
    const budget = s.guessesRemaining ?? 0;
    for (const idx of ownIndices) {
      if (sent >= budget) break;
      actions.push({ role: "player", playerId: operative, action: { kind: "agent_guess", index: idx } });
      sent += 1;
    }
    if (sent === 0 && budget > 0) {
      const assassinIdx = s.key?.indexOf("assassin") ?? 0;
      actions.push({ role: "player", playerId: operative, action: { kind: "agent_guess", index: assassinIdx } });
    } else if (sent < budget) {
      actions.push({ role: "player", playerId: operative, action: { kind: "agent_pass" } });
    }
    return actions;
  }
  if (phase === "reveal") {
    actions.push({ role: "host", action: { kind: "advance" } });
  }
  return actions;
}

export function hangmanRaceActions(state: unknown, ctx: RoomContext): SimAction[] {
  const phase = getPhase(state);
  const s = state as { word?: string };
  const actions: SimAction[] = [];
  if (phase === "instructions") {
    actions.push({ role: "host", action: { kind: "advance" } });
    return actions;
  }
  if (phase === "playing" && s.word) {
    const letters = [...new Set(s.word.replace(/[^a-z]/gi, "").toLowerCase())];
    for (const pid of ctx.playerIds) {
      for (const letter of letters) {
        actions.push({ role: "player", playerId: pid, action: { kind: "hangman_letter", letter } });
      }
    }
    return actions;
  }
  if (phase === "reveal" || phase === "scoreboard") {
    actions.push({ role: "host", action: { kind: "advance" } });
  }
  return actions;
}

export function paddleClashActions(state: unknown, ctx: RoomContext): SimAction[] {
  const phase = getPhase(state);
  const actions: SimAction[] = [];
  if (phase === "instructions") {
    actions.push({ role: "host", action: { kind: "advance" } });
    return actions;
  }
  if (phase === "playing") {
    for (const pid of ctx.playerIds) {
      actions.push({ role: "player", playerId: pid, action: { kind: "paddle_move", y: 0.5 } });
    }
  }
  return actions;
}

export function gridBlastActions(state: unknown, ctx: RoomContext): SimAction[] {
  const phase = getPhase(state);
  const actions: SimAction[] = [];
  if (phase === "instructions" || phase === "round_end") {
    actions.push({ role: "host", action: { kind: "advance" } });
    return actions;
  }
  if (phase === "playing") {
    for (const pid of ctx.playerIds) {
      actions.push({ role: "player", playerId: pid, action: { kind: "grid_blast_input", input: "bomb" } });
      actions.push({ role: "player", playerId: pid, action: { kind: "grid_blast_input", input: "left" } });
    }
  }
  return actions;
}
