import type { GameMeta, GameOptions } from "@party-games/shared";
import { buildScoringPreview } from "@party-games/shared";

export function ScoringPreviewPanel({
  game,
  options,
  playerCount,
}: {
  game: GameMeta;
  options: GameOptions;
  playerCount: number;
}) {
  const preview = buildScoringPreview(game, options, playerCount);

  return (
    <div
      className="rounded-2xl border border-violet-500/30 bg-violet-600/10 p-4 space-y-3"
      data-testid="scoring-preview-panel"
    >
      <div>
        <h4 className="text-sm font-semibold uppercase tracking-wide text-violet-300">{preview.title}</h4>
        <p className="mt-1 text-sm text-zinc-300">{preview.summary}</p>
      </div>

      {preview.rows && preview.rows.length > 0 && (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-zinc-500">
              <th className="pb-1 font-medium">Place</th>
              <th className="pb-1 font-medium text-right">Points</th>
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((row) => (
              <tr key={row.place} data-testid={`scoring-place-${row.place}`}>
                <td className="py-0.5 text-zinc-200">{row.label}</td>
                <td className="py-0.5 text-right font-mono text-violet-200">{row.points}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {preview.notes && preview.notes.length > 0 && (
        <ul className="space-y-1 text-xs text-zinc-400">
          {preview.notes.map((note) => (
            <li key={note}>• {note}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
