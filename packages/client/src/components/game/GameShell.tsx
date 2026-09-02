import type { ReactNode } from "react";
import { friendlyPhaseLabel } from "@party-games/shared";

export function TvGameShell({ children, header }: { children: ReactNode; header?: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-zinc-950 text-white">
      {header && <header className="shrink-0 border-b border-zinc-800 px-4 py-2">{header}</header>}
      <main className="min-h-0 flex-1 overflow-auto p-4">{children}</main>
    </div>
  );
}

export function PhoneGameShell({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-zinc-950 text-white safe-area-pb">
      <main className="min-h-0 flex-1 overflow-auto px-3 py-2">{children}</main>
      {footer && <footer className="shrink-0 border-t border-zinc-800 p-3">{footer}</footer>}
    </div>
  );
}

export function PhaseHeader({
  phase,
  round,
  maxRounds,
  variant = "player",
}: {
  phase: string;
  round: number;
  maxRounds: number;
  variant?: "host" | "player";
}) {
  const size = variant === "host" ? "text-xl text-zinc-300" : "text-sm text-zinc-400";
  return (
    <div className={`flex items-center justify-between gap-3 ${size}`}>
      <span>{friendlyPhaseLabel(phase)}</span>
      <span>
        Round {round}/{maxRounds}
      </span>
    </div>
  );
}

export function Countdown({ endsAt, totalMs }: { endsAt: number | null; totalMs?: number | null }) {
  if (!endsAt) return null;
  const remaining = Math.max(0, endsAt - Date.now());
  const total = totalMs ?? remaining;
  const pct = total > 0 ? (remaining / total) * 100 : 0;
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-zinc-800"
      role="timer"
      aria-label={`${Math.ceil(remaining / 1000)} seconds remaining`}
    >
      <div className="h-full bg-violet-500 transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function ActionGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{children}</div>;
}

export function ConnectionBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-amber-900/80 px-3 py-2 text-center text-sm text-amber-100" role="status">
      {message}
    </div>
  );
}
