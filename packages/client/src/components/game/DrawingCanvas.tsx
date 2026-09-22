import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  BRUSH_WIDTHS,
  DRAWING_COLORS,
  isEraseStroke,
  simplifyStrokePoints,
  strokeLineWidth,
  type DrawingTool,
} from "@party-games/shared";

export interface StrokeInput {
  points: number[];
  color: string;
  width: number;
  erase?: boolean;
}

interface DrawingCanvasProps {
  strokes?: StrokeInput[];
  readOnly?: boolean;
  onStroke?: (points: number[], color: string, width: number) => void;
  onUndo?: () => void;
  onClear?: () => void;
  tool?: DrawingTool;
  brushWidth?: number;
  color?: string;
  onToolChange?: (tool: DrawingTool, width?: number) => void;
  onColorChange?: (color: string) => void;
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
  const [draftPoints, setDraftPoints] = useState<number[]>([]);
  const [pendingStrokes, setPendingStrokes] = useState<StrokeInput[]>([]);
  const syncedStrokeCount = useRef(strokes.length);
  const [localTool, setLocalTool] = useState(tool);
  const [localWidth, setLocalWidth] = useState(brushWidth);
  const [localColor, setLocalColor] = useState(color);

  const activeTool = onToolChange ? tool : localTool;
  const activeWidth = onToolChange ? brushWidth : localWidth;
  const activeColor = onColorChange ? color : localColor;

  useEffect(() => {
    if (strokes.length >= syncedStrokeCount.current) {
      setPendingStrokes((prev) => {
        const acked = strokes.length - syncedStrokeCount.current;
        if (acked <= 0) return prev;
        return prev.slice(Math.min(acked, prev.length));
      });
      syncedStrokeCount.current = strokes.length;
    } else {
      syncedStrokeCount.current = strokes.length;
      setPendingStrokes([]);
    }
  }, [strokes]);

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
    const pending: StrokeInput = {
      points: flat,
      color: strokeColor,
      width: activeWidth,
      erase,
    };
    setPendingStrokes((prev) => [...prev, pending]);
    onStroke(flat, strokeColor, activeWidth);
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
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`min-h-11 min-w-11 rounded-lg px-3 py-2 text-sm font-bold ${activeTool === "pen" ? "bg-violet-600" : "bg-zinc-700"}`}
            onClick={() => (onToolChange ? onToolChange("pen", activeWidth) : setLocalTool("pen"))}
          >
            Pen
          </button>
          <button
            type="button"
            className={`min-h-11 min-w-11 rounded-lg px-3 py-2 text-sm font-bold ${activeTool === "eraser" ? "bg-violet-600" : "bg-zinc-700"}`}
            onClick={() => (onToolChange ? onToolChange("eraser", activeWidth) : setLocalTool("eraser"))}
          >
            Eraser
          </button>
          {DRAWING_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Color ${c}`}
              className={`h-11 w-11 rounded-full border-2 ${activeColor === c ? "border-white" : "border-transparent"}`}
              style={{ backgroundColor: c }}
              onClick={() => (onColorChange ? onColorChange(c) : setLocalColor(c))}
            />
          ))}
          {BRUSH_WIDTHS.map((w) => (
            <button
              key={w}
              type="button"
              className={`min-h-11 rounded-lg px-2 text-xs ${activeWidth === w ? "bg-violet-600" : "bg-zinc-700"}`}
              onClick={() => (onToolChange ? onToolChange(activeTool, w) : setLocalWidth(w))}
            >
              {w}px
            </button>
          ))}
          {onUndo && (
            <button type="button" className="min-h-11 rounded-lg bg-zinc-700 px-3 py-2 text-sm" onClick={onUndo}>
              Undo
            </button>
          )}
          {onClear && (
            <button type="button" className="min-h-11 rounded-lg bg-zinc-700 px-3 py-2 text-sm" onClick={onClear}>
              Clear
            </button>
          )}
        </div>
      )}
      <canvas
        ref={canvasRef}
        data-testid="draw-canvas"
        className="aspect-[4/3] w-full max-h-[70dvh] touch-none rounded-xl bg-zinc-800"
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerLeave={pointerUp}
        role="img"
        aria-label="Drawing canvas"
      />
    </div>
  );
}
