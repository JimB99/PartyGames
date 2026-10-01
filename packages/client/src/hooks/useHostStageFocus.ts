import type { HostViewSnapshot } from "@party-games/shared";
import { useEffect, useRef } from "react";

export function useHostStageFocus(hostView: HostViewSnapshot | null | undefined) {
  const prevKey = useRef<string | null>(null);

  useEffect(() => {
    if (!hostView) return;
    const key = `${hostView.gameId}:${hostView.phase}:${hostView.round}`;
    if (prevKey.current === key) return;
    prevKey.current = key;

    const scoring =
      hostView.phase === "scoreboard" || hostView.phase === "round_end" || hostView.phase === "ended";
    const el = document.querySelector(
      scoring ? '[data-testid="round-score-panel"]' : '[data-testid="host-stage"]',
    );
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [hostView?.gameId, hostView?.phase, hostView?.round]);
}
