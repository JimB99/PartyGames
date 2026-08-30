import type { GameId } from "@party-games/shared";

export function SessionPlaylistPanel({
  games,
  playlist,
  onChange,
  onStartSession,
  onClear,
  disabled,
}: {
  games: Array<{ id: GameId; name: string }>;
  playlist: GameId[];
  onChange: (ids: GameId[]) => void;
  onStartSession: () => void;
  onClear: () => void;
  disabled?: boolean;
}) {
  const toggle = (id: GameId) => {
    if (playlist.includes(id)) {
      onChange(playlist.filter((g) => g !== id));
    } else {
      onChange([...playlist, id]);
    }
  };

  const move = (index: number, dir: -1 | 1) => {
    const next = [...playlist];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-4 rounded-2xl border border-zinc-700 bg-zinc-900/50 p-4">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-bold">Session playlist</h3>
        {playlist.length > 0 && (
          <button type="button" onClick={onClear} className="text-sm text-zinc-400 hover:text-white">
            Clear
          </button>
        )}
      </div>
      <p className="text-sm text-zinc-400">Queue multiple games — scores carry across the session.</p>

      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
        {games.map((g) => (
          <button
            key={g.id}
            type="button"
            disabled={disabled}
            onClick={() => toggle(g.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              playlist.includes(g.id)
                ? "bg-violet-600 text-white"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>

      {playlist.length > 0 && (
        <ol className="space-y-1 text-sm">
          {playlist.map((id, i) => {
            const meta = games.find((g) => g.id === id);
            return (
              <li key={`${id}-${i}`} className="flex items-center gap-2 rounded-lg bg-zinc-800/80 px-3 py-2">
                <span className="w-5 text-zinc-500">{i + 1}.</span>
                <span className="flex-1">{meta?.name ?? id}</span>
                <button type="button" disabled={disabled || i === 0} onClick={() => move(i, -1)} className="px-2 text-zinc-400 hover:text-white disabled:opacity-30">↑</button>
                <button type="button" disabled={disabled || i === playlist.length - 1} onClick={() => move(i, 1)} className="px-2 text-zinc-400 hover:text-white disabled:opacity-30">↓</button>
              </li>
            );
          })}
        </ol>
      )}

      <button
        type="button"
        data-testid="start-session"
        disabled={disabled || playlist.length === 0}
        onClick={onStartSession}
        className="w-full rounded-xl bg-emerald-600 py-3 font-bold hover:bg-emerald-500 disabled:opacity-40"
      >
        Start session ({playlist.length} game{playlist.length === 1 ? "" : "s"})
      </button>
    </div>
  );
}
