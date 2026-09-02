import type { CSSProperties } from "react";
import { PLAYER_COLOR_NAMES } from "@party-games/shared";
import { playerColor } from "../hooks/usePartyRoom";

/** Distinct overlays so nearby hues stay distinguishable without color vision. */
const COLOR_PATTERNS: Array<{ overlay: string; size?: string }> = [
  { overlay: "none" },
  { overlay: "repeating-linear-gradient(45deg, rgba(0,0,0,.4) 0 5px, transparent 5px 10px)" },
  { overlay: "repeating-linear-gradient(-45deg, rgba(255,255,255,.4) 0 5px, transparent 5px 10px)" },
  { overlay: "repeating-linear-gradient(90deg, rgba(0,0,0,.4) 0 4px, transparent 4px 8px)" },
  { overlay: "repeating-linear-gradient(0deg, rgba(255,255,255,.35) 0 4px, transparent 4px 8px)" },
  { overlay: "repeating-radial-gradient(circle at center, rgba(0,0,0,.45) 0 2px, transparent 2px 7px)" },
  { overlay: "repeating-linear-gradient(45deg, rgba(255,255,255,.45) 0 3px, transparent 3px 9px)" },
  { overlay: "repeating-linear-gradient(0deg, rgba(0,0,0,.5) 0 3px, transparent 3px 9px)" },
  {
    overlay: "linear-gradient(90deg, rgba(0,0,0,.35) 50%, transparent 50%)",
    size: "8px 8px",
  },
  {
    overlay: "linear-gradient(0deg, rgba(255,255,255,.3) 50%, transparent 50%)",
    size: "8px 8px",
  },
  { overlay: "repeating-linear-gradient(135deg, rgba(0,0,0,.4) 0 8px, transparent 8px 16px)" },
  { overlay: "radial-gradient(circle at 30% 30%, rgba(255,255,255,.55) 0 28%, transparent 30%)" },
  { overlay: "repeating-linear-gradient(90deg, rgba(255,255,255,.4) 0 2px, transparent 2px 6px)" },
  { overlay: "repeating-linear-gradient(30deg, rgba(0,0,0,.4) 0 6px, transparent 6px 12px)" },
  {
    overlay:
      "conic-gradient(from 45deg, rgba(0,0,0,.35) 0 25%, transparent 0 50%, rgba(0,0,0,.35) 0 75%, transparent 0)",
  },
  { overlay: "repeating-radial-gradient(circle, rgba(255,255,255,.45) 0 1px, transparent 1px 6px)" },
];

export function playerColorName(index: number): string {
  return PLAYER_COLOR_NAMES[index % PLAYER_COLOR_NAMES.length];
}

export function playerColorSwatchStyle(index: number): CSSProperties {
  const color = playerColor(index);
  const pattern = COLOR_PATTERNS[index % COLOR_PATTERNS.length];
  if (!pattern || pattern.overlay === "none") {
    return { backgroundColor: color };
  }
  return {
    backgroundColor: color,
    backgroundImage: pattern.overlay,
    backgroundSize: pattern.size,
  };
}

export function PlayerColorSwatch({
  index,
  className = "h-3 w-3 rounded-full",
  title,
}: {
  index: number;
  className?: string;
  title?: string;
}) {
  return (
    <span
      className={`inline-block shrink-0 ${className}`}
      style={playerColorSwatchStyle(index)}
      title={title ?? playerColorName(index)}
      aria-hidden
    />
  );
}
