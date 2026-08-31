import type { GameId } from "@party-games/shared";
import { useEffect, useState } from "react";

const STORAGE_KEY = "party-games-playlist-open";

function loadOpen(): boolean | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw !== null) return raw === "true";
  } catch {
    /* ignore */
  }
  return null;
}

function saveOpen(open: boolean) {
  try {
    sessionStorage.setItem(STORAGE_KEY, String(open));
  } catch {
    /* ignore */
  }
}

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
  const [open, setOpen] = useState(() => {
    const saved = loadOpen();
    if (saved !== null) return saved;
    return playlist.length > 0;
  });
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  useEffect(() => {
    if (playlist.length > 0 && loadOpen() === null) {
      setOpen(true);
    }
  }, [playlist.length]);

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

  const reorder = (from: number, to: number) => {
    if (from === to || from < 0 || to < 0 || from >= playlist.length || to >= playlist.length) return;
    const next = [...playlist];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  const handleToggle = () => {
    setOpen((prev) => {
      const next = !prev;
      saveOpen(next);
      return next;
    });
  };

  return (
    <section className="rounded-2xl border border-zinc-700 bg-zinc-900/50 overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <button
          type="button"
          onClick={handleToggle}
          className="flex flex-1 items-center justify-between gap-3 text-left hover:bg-zinc-800/50 transition rounded-lg -mx-1 px-1 py-0.5"
          aria-expanded={open}
        >
          <div>
            <h3 className="text-lg font-bold">Session playlist</h3>
            <p className="text-sm text-zinc-400">Queue multiple games — scores carry across the session.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-zinc-500">{playlist.length}</span>
            <span className={`text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden>
              ▼
            </span>
          </div>
        </button>
        {playlist.length > 0 && (
          <button type="button" onClick={onClear} className="text-sm text-zinc-400 hover:text-white shrink-0">
            Clear
          </button>
        )}
      </div>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="space-y-4 px-4 pb-4">
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {games.map((g) => {
                const selected = playlist.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggle(g.id)}
                    className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      selected
                        ? "bg-violet-600 text-white"
                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                    }`}
                  >
                    <span>{g.name}</span>
                    {selected && <span className="text-violet-200" aria-hidden>×</span>}
                  </button>
                );
              })}
            </div>

            {playlist.length > 0 && (
              <ol className="space-y-1 text-sm">
                {playlist.map((id, i) => {
                  const meta = games.find((g) => g.id === id);
                  return (
                    <li
                      key={`${id}-${i}`}
                      className={`flex items-center gap-2 rounded-lg bg-zinc-800/80 px-3 py-2 ${
                        dragIndex === i ? "opacity-50" : ""
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (disabled || dragIndex === null || dragIndex === i) return;
                        reorder(dragIndex, i);
                        setDragIndex(i);
                      }}
                    >
                      <button
                        type="button"
                        draggable={!disabled}
                        disabled={disabled}
                        onDragStart={() => setDragIndex(i)}
                        onDragEnd={() => setDragIndex(null)}
                        className="cursor-grab px-1 text-zinc-500 hover:text-zinc-300 disabled:opacity-30"
                        aria-label={`Drag to reorder ${meta?.name ?? id}`}
                      >
                        ⠿
                      </button>
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
        </div>
      </div>
    </section>
  );
}
