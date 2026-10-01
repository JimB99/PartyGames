export function activePlayerIds(
  players: Array<{ id: string; connected: boolean; waiting?: boolean }>,
): string[] {
  return players.filter((p) => p.connected && !p.waiting).map((p) => p.id);
}

export function submitProgress(
  connectedIds: string[],
  submittedIds: Iterable<string>,
  excludeIds: Iterable<string> = [],
): { current: number; expected: number } {
  const excluded = new Set(excludeIds);
  const requiredIds = connectedIds.filter((id) => !excluded.has(id));
  const submitted = new Set(submittedIds);
  const current = requiredIds.filter((id) => submitted.has(id)).length;
  return { current, expected: requiredIds.length };
}

export function pruneKeyed<T>(record: Record<string, T>, activeIds: string[]): Record<string, T> {
  const active = new Set(activeIds);
  const next: Record<string, T> = {};
  for (const [id, value] of Object.entries(record)) {
    if (active.has(id)) next[id] = value;
  }
  return next;
}

export function allRequiredSubmitted(requiredIds: string[], submittedIds: Iterable<string>): boolean {
  if (requiredIds.length === 0) return false;
  const submitted = new Set(submittedIds);
  return requiredIds.every((id) => submitted.has(id));
}

/** Mid-game waiters are new seats only — reconnects keep playing. */
export function shouldWaitOnJoin(opts: { playing: boolean; alreadyInRoom: boolean }): boolean {
  return opts.playing && !opts.alreadyInRoom;
}
