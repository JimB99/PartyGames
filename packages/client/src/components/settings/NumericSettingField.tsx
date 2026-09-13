import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";

function clampValue(value: number, min?: number, max?: number): number {
  let n = value;
  if (min !== undefined) n = Math.max(min, n);
  if (max !== undefined) n = Math.min(max, n);
  return n;
}

function snapStep(value: number, step?: number): number {
  if (!step || step <= 0) return value;
  const decimals = String(step).includes(".") ? String(step).split(".")[1]!.length : 0;
  const snapped = Math.round(value / step) * step;
  return decimals > 0 ? Number(snapped.toFixed(decimals)) : snapped;
}

const HOLD_DELAY_MS = 300;
const HOLD_INTERVAL_MS = 75;

export function NumericSettingField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  testId,
  className = "w-20 rounded-lg border border-zinc-600 bg-zinc-900 px-2 py-1 text-sm",
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  testId?: string;
  className?: string;
}) {
  const [draft, setDraft] = useState(String(value));
  const [focused, setFocused] = useState(false);
  const valueRef = useRef(value);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdDeltaRef = useRef(0);

  useEffect(() => {
    if (!focused) {
      valueRef.current = value;
      setDraft(String(value));
    }
  }, [value, focused]);

  const clearHold = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    holdDeltaRef.current = 0;
  }, []);

  useEffect(() => () => clearHold(), [clearHold]);

  const commit = (raw: string) => {
    const trimmed = raw.trim();
    if (trimmed === "" || trimmed === "-" || trimmed === ".") return;
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed)) return;
    const next = clampValue(snapStep(parsed, step), min, max);
    valueRef.current = next;
    onChange(next);
  };

  const stepBy = useCallback(
    (delta: number) => {
      const base = Number.isFinite(valueRef.current) ? valueRef.current : min ?? 0;
      const next = clampValue(snapStep(base + delta * (step ?? 1), step), min, max);
      if (next === valueRef.current) return;
      valueRef.current = next;
      onChange(next);
      setDraft(String(next));
    },
    [min, max, step, onChange],
  );

  const startHold = useCallback(
    (delta: number, el: HTMLButtonElement, pointerId: number) => {
      clearHold();
      holdDeltaRef.current = delta;
      el.setPointerCapture(pointerId);
      stepBy(delta);
      holdTimerRef.current = setTimeout(() => {
        holdIntervalRef.current = setInterval(() => stepBy(delta), HOLD_INTERVAL_MS);
      }, HOLD_DELAY_MS);
    },
    [clearHold, stepBy],
  );

  const bindStepper = (delta: number) => ({
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      startHold(delta, e.currentTarget, e.pointerId);
    },
    onPointerUp: (e: PointerEvent<HTMLButtonElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      clearHold();
    },
    onPointerCancel: (e: PointerEvent<HTMLButtonElement>) => {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      clearHold();
    },
    onLostPointerCapture: () => clearHold(),
  });

  const decrement = bindStepper(-1);
  const increment = bindStepper(1);

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-zinc-300">{label}</span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          data-testid={testId ? `${testId}-decrement` : undefined}
          {...decrement}
          className="rounded-lg border border-zinc-600 bg-zinc-800 px-2 py-1 text-sm hover:bg-zinc-700 touch-none select-none"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <input
          type="text"
          inputMode="decimal"
          data-testid={testId}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            commit(draft);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit(draft);
              (e.target as HTMLInputElement).blur();
            }
          }}
          className={className}
          aria-label={label}
        />
        <button
          type="button"
          data-testid={testId ? `${testId}-increment` : undefined}
          {...increment}
          className="rounded-lg border border-zinc-600 bg-zinc-800 px-2 py-1 text-sm hover:bg-zinc-700 touch-none select-none"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}
