export const DIKE_STARTING_BALANCE = 200;
export const DIKE_BONUS_AMOUNT = 5;

export const DIKE_SESSION_SCORES = {
  first: 3000,
  second: 1500,
  third: 750,
  survivor: 250,
} as const;

export interface DikeRevealEntry {
  playerId: string;
  bid: number;
  balanceAfter: number;
  eliminated: boolean;
  gotBonus: boolean;
}

export interface DikeRoundConfig {
  bonusAmount: number;
}

export interface DikeRoundResult {
  balances: Record<string, number>;
  alive: string[];
  eliminated: string[];
  bonusRecipientId: string | null;
  reveal: DikeRevealEntry[];
}

export function eliminationSlots(aliveCount: number): number {
  if (aliveCount > 20) return 3;
  if (aliveCount >= 11) return 2;
  return 1;
}

export function lowestBidEliminees(
  bids: Record<string, number>,
  alive: string[],
  slots: number,
): string[] {
  if (alive.length === 0 || slots <= 0) return [];

  const sortedBids = alive
    .map((id) => bids[id] ?? 0)
    .sort((a, b) => a - b);

  const cutoffIndex = Math.min(slots, sortedBids.length) - 1;
  const cutoff = sortedBids[cutoffIndex];

  return alive.filter((id) => (bids[id] ?? 0) <= cutoff);
}

export function resolveBonus(
  bids: Record<string, number>,
  alive: string[],
  bonusAmount: number,
): { recipientId: string | null; amount: number } {
  if (alive.length === 0) {
    return { recipientId: null, amount: 0 };
  }

  let maxBid = -1;
  for (const id of alive) {
    const bid = bids[id] ?? 0;
    if (bid > maxBid) maxBid = bid;
  }

  const topBidders = alive.filter((id) => (bids[id] ?? 0) === maxBid);
  if (topBidders.length !== 1 || maxBid <= 0) {
    return { recipientId: null, amount: 0 };
  }

  return { recipientId: topBidders[0], amount: bonusAmount };
}

export function applyRound(
  bids: Record<string, number>,
  balances: Record<string, number>,
  alive: string[],
  config: DikeRoundConfig,
): DikeRoundResult {
  const nextBalances = { ...balances };
  const eliminated = new Set<string>();
  const reveal: DikeRevealEntry[] = [];

  for (const id of alive) {
    const bid = bids[id] ?? 0;
    nextBalances[id] = Math.max(0, (nextBalances[id] ?? 0) - bid);
  }

  for (const id of alive) {
    if ((nextBalances[id] ?? 0) <= 0) {
      eliminated.add(id);
    }
  }

  const biddingAlive = alive.filter((id) => !eliminated.has(id));
  const bidEliminees = lowestBidEliminees(
    bids,
    biddingAlive,
    eliminationSlots(biddingAlive.length),
  );
  for (const id of bidEliminees) {
    eliminated.add(id);
  }

  const survivors = alive.filter((id) => !eliminated.has(id));
  const bonus = resolveBonus(bids, biddingAlive, config.bonusAmount);
  if (bonus.recipientId && survivors.includes(bonus.recipientId)) {
    nextBalances[bonus.recipientId] = (nextBalances[bonus.recipientId] ?? 0) + bonus.amount;
  }

  for (const id of alive) {
    reveal.push({
      playerId: id,
      bid: bids[id] ?? 0,
      balanceAfter: nextBalances[id] ?? 0,
      eliminated: eliminated.has(id),
      gotBonus: id === bonus.recipientId && survivors.includes(id),
    });
  }

  reveal.sort((a, b) => a.bid - b.bid || a.playerId.localeCompare(b.playerId));

  return {
    balances: nextBalances,
    alive: survivors,
    eliminated: [...eliminated],
    bonusRecipientId: bonus.recipientId && survivors.includes(bonus.recipientId)
      ? bonus.recipientId
      : null,
    reveal,
  };
}

export function resolveWinner(
  alive: string[],
  balances: Record<string, number>,
): string | null {
  if (alive.length === 1) return alive[0];
  if (alive.length === 2) {
    const [a, b] = alive;
    const balanceA = balances[a] ?? 0;
    const balanceB = balances[b] ?? 0;
    if (balanceA === balanceB) return a;
    return balanceA > balanceB ? a : b;
  }
  return null;
}

export function placementScores(
  winnerId: string,
  placement: string[],
  eliminationRound: Record<string, number>,
): Record<string, number> {
  const scores: Record<string, number> = {
    [winnerId]: DIKE_SESSION_SCORES.first,
  };

  if (placement[0]) scores[placement[0]] = DIKE_SESSION_SCORES.second;
  if (placement[1]) scores[placement[1]] = DIKE_SESSION_SCORES.third;

  const podium = new Set([winnerId, placement[0], placement[1]].filter(Boolean));

  for (const playerId of placement.slice(2)) {
    if ((eliminationRound[playerId] ?? 1) > 1) {
      scores[playerId] = DIKE_SESSION_SCORES.survivor;
    }
  }

  for (const [playerId, round] of Object.entries(eliminationRound)) {
    if (podium.has(playerId) || scores[playerId] !== undefined) continue;
    if (round > 1) {
      scores[playerId] = DIKE_SESSION_SCORES.survivor;
    }
  }

  return scores;
}
