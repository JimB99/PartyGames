export interface RevealEntry {
  id: string;
  text: string;
  authorId?: string | null;
  authorLabel?: string;
  isTruth?: boolean;
  voterIds?: string[];
}

export interface PlayerAnswerReveal {
  playerId: string;
  answer: string | number;
  detail?: string;
  correct?: boolean;
  points?: number;
}

export function votersByOption(votes: Record<string, string>): Record<string, string[]> {
  const byOption: Record<string, string[]> = {};
  for (const [voterId, optionId] of Object.entries(votes)) {
    if (!byOption[optionId]) byOption[optionId] = [];
    byOption[optionId].push(voterId);
  }
  return byOption;
}

export function buildBluffReveal(
  options: Array<{ id: string; text: string; authorId: string | null; isTruth: boolean }>,
  votes: Record<string, string>,
): RevealEntry[] {
  const byOption = votersByOption(votes);
  return options.map((o) => ({
    id: o.id,
    text: o.text,
    authorId: o.authorId,
    authorLabel: o.isTruth ? "Real answer" : undefined,
    isTruth: o.isTruth,
    voterIds: byOption[o.id] ?? [],
  }));
}
