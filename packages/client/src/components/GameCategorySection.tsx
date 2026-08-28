import type { GameCategoryMeta } from "@party-games/shared";
import type { ReactNode } from "react";

export function GameCategorySection({
  category,
  gameCount,
  open,
  onToggle,
  children,
}: {
  category: GameCategoryMeta;
  gameCount: number;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/40 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-zinc-800/50 transition"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl shrink-0" aria-hidden>
            {category.icon}
          </span>
          <div className="min-w-0">
            <h3 className="font-bold text-lg leading-tight">{category.label}</h3>
            <p className="text-xs text-zinc-500 truncate">{category.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-zinc-500">{gameCount}</span>
          <span
            className={`text-zinc-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            aria-hidden
          >
            ▼
          </span>
        </div>
      </button>
      <div
        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-1">{children}</div>
        </div>
      </div>
    </section>
  );
}
