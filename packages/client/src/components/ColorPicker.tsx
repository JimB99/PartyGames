import { PLAYER_COLORS } from "@party-games/shared";
import { playerColor } from "../hooks/usePartyRoom";

export function ColorPicker({
  value,
  onChange,
  takenColors = [],
  disabled = false,
}: {
  value: number;
  onChange: (index: number) => void;
  takenColors?: number[];
  disabled?: boolean;
}) {
  const taken = new Set(takenColors);

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {PLAYER_COLORS.map((_, index) => {
        const isTaken = taken.has(index) && index !== value;
        const selected = index === value;
        return (
          <button
            key={index}
            type="button"
            disabled={disabled || isTaken}
            title={isTaken ? "Color taken" : `Color ${index + 1}`}
            onClick={() => onChange(index)}
            className={`h-10 w-10 rounded-full border-2 transition ${
              selected ? "border-white scale-110" : "border-transparent"
            } ${isTaken ? "opacity-30 cursor-not-allowed" : "hover:scale-105"}`}
            style={{ backgroundColor: playerColor(index) }}
            aria-label={`Color ${index + 1}${isTaken ? " (taken)" : ""}`}
            aria-pressed={selected}
          />
        );
      })}
    </div>
  );
}

export function getStoredColorIndex(roomId: string): number | undefined {
  const raw = sessionStorage.getItem(`pg-color-${roomId}`);
  if (raw == null) return undefined;
  const n = Number(raw);
  return Number.isInteger(n) ? n : undefined;
}

export function storeColorIndex(roomId: string, colorIndex: number) {
  sessionStorage.setItem(`pg-color-${roomId}`, String(colorIndex));
}
