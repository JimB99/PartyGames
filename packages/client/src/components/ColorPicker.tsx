import { playerColorName, playerColorSwatchStyle } from "./PlayerColorSwatch";
import { PLAYER_COLORS } from "@party-games/shared";

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
    <div className="flex flex-wrap justify-center gap-2" role="listbox" aria-label="Player color">
      {PLAYER_COLORS.map((_, index) => {
        const isTaken = taken.has(index) && index !== value;
        const selected = index === value;
        const name = playerColorName(index);
        return (
          <button
            key={index}
            type="button"
            role="option"
            aria-selected={selected}
            disabled={disabled || isTaken}
            title={isTaken ? `${name} taken` : name}
            onClick={() => onChange(index)}
            className={`h-11 w-11 min-h-11 min-w-11 rounded-full border-2 transition ${
              selected ? "border-white scale-110" : "border-transparent"
            } ${isTaken ? "opacity-30 cursor-not-allowed" : "hover:scale-105"}`}
            style={playerColorSwatchStyle(index)}
            aria-label={`${name}${isTaken ? " (taken)" : ""}`}
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
