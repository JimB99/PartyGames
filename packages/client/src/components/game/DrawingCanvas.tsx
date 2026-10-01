import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  BRUSH_WIDTHS,
  DRAWING_COLORS,
  ackPendingIds,
  chunkStrokePoints,
  isEraseStroke,
  simplifyStrokePoints,
  strokeLineWidth,
  type DrawingTool,
} from "@party-games/shared";

export interface StrokeInput {
  id?: string;
  points: number[];
  color: string;
  width: number;
  erase?: boolean;
  revision?: number;
}

interface DrawingCanvasProps {
  strokes?: StrokeInput[];
  readOnly?: boolean;
  drawingRevision?: number;
  onStroke?: (points: number[], color: string, width: number, meta: { id: string; revision: number }) => void;
  onUndo?: () => void;
  onClear?: () => void;
  tool?: DrawingTool;
  brushWidth?: number;
  color?: string;
  onToolChange?: (tool: DrawingTool, width?: number) => void;
  onColorChange?: (color: string) => void;
}

function newStrokeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `stroke-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function paintStrokes(ctx: CanvasRenderingContext2D, strokes: StrokeInput[], width: number, height: number) {
  ctx.clearRect(0, 0, width, height);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  for (const s of strokes) {
    const pts = s.points;
    if (pts.length < 2) continue;
    const erase = isEraseStroke(s);
    ctx.globalCompositeOperation = erase ? "destination-out" : "source-over";
    ctx.strokeStyle = erase ? "rgba(0,0,0,1)" : s.color;
    ctx.lineWidth = strokeLineWidth(s.width, Math.min(width, height), erase);
    ctx.beginPath();
    ctx.moveTo(pts[0] * width, pts[1] * height);
    for (let i = 2; i + 1 < pts.length; i += 2) {
      ctx.lineTo(pts[i] * width, pts[i + 1] * height);
    }
    if (pts.length === 2) {
      ctx.lineTo(pts[0] * width + 0.01, pts[1] * height);
    }
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "source-over";
}

export function DrawingCanvas({
  strokes = [],
  readOnly = false,
  drawingRevision = 0,
  onStroke,
  onUndo,
  onClear,
  tool = "pen",
  brushWidth = 4,
  color = "#ffffff",
  onToolChange,
  onColorChange,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const draftRef = useRef<number[]>([]);
  const localRevision = useRef(drawingRevision);
  const [draftPoints, setDraftPoints] = useState<number[]>([]);
  const [pendingStrokes, setPendingStrokes] = useState<StrokeInput[]>([]);
  const [localTool, setLocalTool] = useState(tool);
  const [localWidth, setLocalWidth] = useState(brushWidth);
  const [localColor, setLocalColor] = useState(color);

  const activeTool = onToolChange ? tool : localTool;
  const activeWidth = onToolChange ? brushWidth : localWidth;
  const activeColor = onColorChange ? color : localColor;

  useEffect(() => {
    localRevision.current = Math.max(localRevision.current, drawingRevision);
    setPendingStrokes((prev) => prev.filter((stroke) => (stroke.revision ?? 0) >= drawingRevision));
  }, [drawingRevision]);

  useEffect(() => {
    const remaining = new Set(
      ackPendingIds(
        pendingStrokes.map((stroke) => stroke.id).filter((id): id is string => Boolean(id)),
        strokes,
      ),
    );
    setPendingStrokes((prev) => {
      const next = prev.filter((stroke) => !stroke.id || remaining.has(stroke.id));
      return next.length === prev.length ? prev : next;
    });
  }, [strokes, pendingStrokes]);

  const toNorm = useCallback((clientX: number, clientY: number): [number, number] | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;
    return [
      Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)),
      Math.max(0, Math.min(1, (clientY - rect.top) / rect.height)),
    ];
  }, []);

  const finishStroke = useCallback(() => {
    if (!onStroke || draftRef.current.length < 2) {
      draftRef.current = [];
      setDraftPoints([]);
      return;
    }
    const erase = activeTool === "eraser";
    const strokeColor = erase ? "erase" : activeColor;
    const flat = simplifyStrokePoints(draftRef.current);
    draftRef.current = [];
    setDraftPoints([]);
    if (flat.length < 2) return;
    const revision = localRevision.current;
    const chunks = chunkStrokePoints(flat);
    const pending: StrokeInput[] = [];
    for (const chunk of chunks) {
      const id = newStrokeId();
      pending.push({ id, points: chunk, color: strokeColor, width: activeWidth, erase, revision });
      onStroke(chunk, strokeColor, activeWidth, { id, revision });
    }
    setPendingStrokes((prev) => [...prev, ...pending]);
  }, [onStroke, activeTool, activeColor, activeWidth]);

  const pointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (readOnly || !onStroke) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    const pt = toNorm(e.clientX, e.clientY);
    if (!pt) return;
    setDraftPoints([pt[0], pt[1]]);
    draftRef.current = [pt[0], pt[1]];
  };

  const pointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || readOnly) return;
    const pt = toNorm(e.clientX, e.clientY);
    if (!pt) return;
    draftRef.current = [...draftRef.current, pt[0], pt[1]];
    setDraftPoints(draftRef.current);
  };

  const pointerUp = () => {
    if (!drawing.current) return;
    drawing.current = false;
    finishStroke();
  };

  const pointerLeave = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (e.currentTarget.hasPointerCapture(e.pointerId)) return;
    pointerUp();
  };

  const handleUndo = () => {
    setPendingStrokes((prev) => prev.slice(0, -1));
    localRevision.current += 1;
    onUndo?.();
  };

  const handleClear = () => {
    setPendingStrokes([]);
    localRevision.current += 1;
    onClear?.();
  };

  const draftStroke: StrokeInput | null = useMemo(
    () =>
      draftPoints.length >= 2
        ? {
            points: draftPoints,
            color: activeTool === "eraser" ? "erase" : activeColor,
            width: activeWidth,
            erase: activeTool === "eraser",
          }
        : null,
    [draftPoints, activeTool, activeColor, activeWidth],
  );

  const displayStrokes = useMemo(
    () => [...strokes, ...pendingStrokes, ...(draftStroke ? [draftStroke] : [])],
    [strokes, pendingStrokes, draftStroke],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    const cssW = parent?.clientWidth || canvas.clientWidth || 640;
    const cssH = Math.round(cssW * 0.75);
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(cssW * dpr));
    canvas.height = Math.max(1, Math.round(cssH * dpr));
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    paintStrokes(ctx, displayStrokes, cssW, cssH);
  }, [displayStrokes]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      {!readOnly && (
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex shrink-0 overflow-hidden rounded-xl ring-1 ring-zinc-600">
            <button
              type="button"
              data-testid="draw-tool-pen"
              aria-pressed={activeTool === "pen"}
              className={`min-h-11 min-w-11 px-3 text-sm font-bold ${
                activeTool === "pen" ? "bg-violet-600 ring-2 ring-white ring-inset" : "bg-zinc-800"
              }`}
              onClick={() => (onToolChange ? onToolChange("pen", activeWidth) : setLocalTool("pen"))}
            >
              Pen
            </button>
            <button
              type="button"
              data-testid="draw-tool-eraser"
              aria-pressed={activeTool === "eraser"}
              className={`min-h-11 min-w-11 px-3 text-sm font-bold ${
                activeTool === "eraser" ? "bg-violet-600 ring-2 ring-white ring-inset" : "bg-zinc-800"
              }`}
              onClick={() => (onToolChange ? onToolChange("eraser", activeWidth) : setLocalTool("eraser"))}
            >
              Eraser
            </button>
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto">
            {DRAWING_COLORS.map((c) => {
              const selected = activeColor === c;
              return (
                <button
                  key={c}
                  type="button"
                  data-testid={`draw-color-${c.slice(1)}`}
                  aria-label={`Color ${c}`}
                  aria-pressed={selected}
                  className={`relative h-9 w-9 shrink-0 rounded-full ${
                    selected ? "ring-2 ring-white ring-offset-2 ring-offset-zinc-900" : ""
                  }`}
                  style={{ backgroundColor: c }}
                  onClick={() => (onColorChange ? onColorChange(c) : setLocalColor(c))}
                >
                  {selected && (
                    <span
                      className={`absolute inset-0 flex items-center justify-center text-xs font-black ${
                        c === "#ffffff" ? "text-zinc-900" : "text-white"
                      }`}
                    >
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
            {BRUSH_WIDTHS.map((w, i) => {
              const selected = activeWidth === w;
              const size = 6 + i * 4;
              return (
                <button
                  key={w}
                  type="button"
                  data-testid={`draw-width-${w}`}
                  aria-label={`Brush size ${w}`}
                  aria-pressed={selected}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${
                    selected ? "bg-violet-600" : "bg-zinc-800"
                  }`}
                  onClick={() => (onToolChange ? onToolChange(activeTool, w) : setLocalWidth(w))}
                >
                  <span
                    className="rounded-full bg-white"
                    style={{ width: size, height: size }}
                  />
                </button>
              );
            })}
          </div>
          <div className="ml-auto flex shrink-0 gap-2">
            {onUndo && (
              <button
                type="button"
                data-testid="draw-undo"
                className="min-h-11 rounded-lg bg-zinc-700 px-3 py-2 text-sm font-bold"
                onClick={handleUndo}
              >
                Undo
              </button>
            )}
            {onClear && (
              <button
                type="button"
                data-testid="draw-clear"
                className="min-h-11 rounded-lg bg-zinc-700 px-3 py-2 text-sm font-bold"
                onClick={handleClear}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        data-testid="draw-canvas"
        className="aspect-[4/3] w-full max-h-[70dvh] touch-none rounded-xl bg-zinc-800"
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={pointerUp}
        onPointerLeave={pointerLeave}
        role="img"
        aria-label="Drawing canvas"
      />
    </div>
  );
}
