export interface ElimBracketMatch {
  a: string | null;
  b: string | null;
  winner: string | null;
}

/** Pad player list to next power of two and seed first-round matches with byes. */
export function buildSingleEliminationBracket(playerIds: string[]): ElimBracketMatch[] {
  const ids: (string | null)[] = [...playerIds];
  while (ids.length & (ids.length - 1)) ids.push(null);
  const matches: ElimBracketMatch[] = [];
  for (let i = 0; i < ids.length; i += 2) {
    const a = ids[i];
    const b = ids[i + 1];
    if (!a && b) matches.push({ a: b, b: null, winner: b });
    else if (a && !b) matches.push({ a, b: null, winner: a });
    else matches.push({ a, b, winner: null });
  }
  return matches;
}

export function bracketMatchCount(playerIds: string[]): number {
  if (playerIds.length <= 2) return 1;
  let n = 1;
  while (n < playerIds.length) n *= 2;
  return n - 1;
}

export function currentBracketMatch(
  bracket: ElimBracketMatch[],
  matchIndex: number,
  twoPlayerIds: [string, string],
): ElimBracketMatch | null {
  if (twoPlayerIds.length === 2 && bracket.length === 0) {
    return { a: twoPlayerIds[0], b: twoPlayerIds[1], winner: null };
  }
  return bracket[matchIndex] ?? null;
}

export function activeBracketPlayers(match: ElimBracketMatch | null): [string, string] | null {
  if (!match?.a || !match?.b) return null;
  return [match.a, match.b];
}

/** Advance to next playable match, auto-skipping bye matches that already have a winner. */
export function nextPlayableMatchIndex(bracket: ElimBracketMatch[], fromIndex: number): number | null {
  for (let i = fromIndex; i < bracket.length; i++) {
    const match = bracket[i];
    if (match.a && match.b) return i;
    if (match.winner && !match.b) continue;
    if (match.a && !match.b) continue;
  }
  return null;
}

export function advanceBracketWinners(bracket: ElimBracketMatch[]): ElimBracketMatch[] {
  const winners: (string | null)[] = bracket.map((m) => m.winner);
  if (winners.length === 1) return [{ a: winners[0], b: null, winner: winners[0] }];
  const nextMatches: ElimBracketMatch[] = [];
  for (let i = 0; i < winners.length; i += 2) {
    const a = winners[i];
    const b = winners[i + 1] ?? null;
    if (!a && b) nextMatches.push({ a: b, b: null, winner: b });
    else if (a && !b) nextMatches.push({ a, b: null, winner: a });
    else nextMatches.push({ a, b, winner: null });
  }
  return nextMatches;
}

export function isBracketComplete(bracket: ElimBracketMatch[]): boolean {
  return bracket.length === 1 && bracket[0].winner !== null;
}
