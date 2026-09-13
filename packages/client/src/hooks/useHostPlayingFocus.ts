import type { HostViewSnapshot } from "@party-games/shared";
import { useEffect, useRef } from "react";

export function useHostPlayingFocus(hostView: HostViewSnapshot | null | undefined) {
  const prevKey = useRef<string | null>(null);

  useEffect(() => {
    if (!hostView || hostView.phase !== "playing") return;
    const key = `${hostView.gameId}:${hostView.round}`;
    if (prevKey.current === key) return;
    prevKey.current = key;

    const el = document.querySelector('[data-testid="host-playing-stage"]');
    if (el instanceof HTMLElement) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [hostView?.gameId, hostView?.phase, hostView?.round]);
}
