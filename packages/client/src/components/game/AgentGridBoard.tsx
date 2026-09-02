const TILE_COLORS = {
  a: "bg-blue-600",
  b: "bg-red-600",
  neutral: "bg-stone-500",
  assassin: "bg-black",
  hidden: "bg-zinc-700",
};

export function AgentGridBoard({
  words,
  revealed,
  keyTiles,
  activeTeam,
  currentClue,
  spymasterView = false,
}: {
  words: string[];
  revealed: boolean[];
  keyTiles?: Array<"a" | "b" | "neutral" | "assassin" | undefined>;
  activeTeam?: "a" | "b";
  currentClue?: { word: string; count: number } | null;
  spymasterView?: boolean;
}) {
  return (
    <div className="space-y-4">
      {currentClue && (
        <p className="text-center text-xl font-bold">
          Clue: {currentClue.word} · {currentClue.count}
          {activeTeam && <span className="text-zinc-400"> (Team {activeTeam.toUpperCase()})</span>}
        </p>
      )}
      <div className="grid grid-cols-5 gap-2">
        {words.map((word, i) => {
          const isRevealed = revealed[i];
          const tile = keyTiles?.[i];
          let bg = TILE_COLORS.hidden;
          if (isRevealed && tile) bg = TILE_COLORS[tile];
          else if (spymasterView && tile) bg = `${TILE_COLORS[tile]} opacity-80`;
          return (
            <div key={i} className={`rounded-xl p-3 text-center text-sm font-bold ${bg}`}>
              {word}
            </div>
          );
        })}
      </div>
    </div>
  );
}
