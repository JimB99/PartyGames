export type DrawingTool = "pen" | "eraser";

export interface DrawingPoint {
  x: number;
  y: number;
}

export interface DrawingStroke {
  id: string;
  points: DrawingPoint[];
  color: string;
  width: number;
  tool: DrawingTool;
  authorId: string;
  revision: number;
}

export interface DrawingState {
  strokes: DrawingStroke[];
  revision: number;
}

export const DRAWING_COLORS = ["#ffffff", "#ff4d4d", "#4488ff", "#77dd22", "#ffcc22", "#9944ff"] as const;
export const BRUSH_WIDTHS = [2, 4, 8, 12] as const;
export const ERASER_WIDTH_MULTIPLIER = 3;
export const MAX_DRAW_STROKE_PAIRS = 64;

export function strokeLineWidth(brushWidth: number, canvasMinDimension: number, erase: boolean): number {
  const base = Math.max(2, (brushWidth / 400) * canvasMinDimension);
  return erase ? base * ERASER_WIDTH_MULTIPLIER : base;
}

export function normalizePoint(x: number, y: number, width: number, height: number): DrawingPoint {
  return {
    x: Math.max(0, Math.min(1, x / width)),
    y: Math.max(0, Math.min(1, y / height)),
  };
}

export function simplifyPoints(points: DrawingPoint[], tolerance = 0.005): DrawingPoint[] {
  if (points.length <= 2) return points;
  const out: DrawingPoint[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = out[out.length - 1];
    const cur = points[i];
    const dx = cur.x - prev.x;
    const dy = cur.y - prev.y;
    if (dx * dx + dy * dy >= tolerance * tolerance) out.push(cur);
  }
  out.push(points[points.length - 1]);
  return out;
}

export function simplifyStrokePoints(flat: number[], tolerance = 0.005): number[] {
  if (flat.length < 4) return flat;
  const points: DrawingPoint[] = [];
  for (let i = 0; i + 1 < flat.length; i += 2) {
    points.push({ x: flat[i], y: flat[i + 1] });
  }
  const simplified = simplifyPoints(points, tolerance);
  const out: number[] = [];
  for (const p of simplified) {
    out.push(p.x, p.y);
  }
  return out;
}

export function removeStrokeAt(strokes: DrawingStroke[], index: number): DrawingStroke[] {
  return strokes.filter((_, i) => i !== index);
}

export function isEraseStroke(stroke: { color: string; erase?: boolean; tool?: DrawingTool }): boolean {
  return (
    stroke.erase === true ||
    stroke.tool === "eraser" ||
    stroke.color === "erase" ||
    stroke.color === "transparent"
  );
}

/** Split a long stroke so each chunk has at most `maxPairs` points (2 coords each). */
export function chunkStrokePoints(points: number[], maxPairs = MAX_DRAW_STROKE_PAIRS): number[][] {
  const maxCoords = maxPairs * 2;
  if (points.length < 2) return [];
  if (points.length <= maxCoords) return [points];
  const chunks: number[][] = [];
  let offset = 0;
  while (offset < points.length) {
    if (chunks.length === 0) {
      chunks.push(points.slice(0, maxCoords));
      offset = maxCoords;
      continue;
    }
    const start = offset - 2;
    chunks.push(points.slice(start, start + maxCoords));
    offset = start + maxCoords;
  }
  return chunks.filter((chunk) => chunk.length >= 2);
}

export function ackPendingIds(
  pendingIds: Iterable<string>,
  serverStrokes: Array<{ id?: string }>,
): string[] {
  const present = new Set(
    serverStrokes.map((stroke) => stroke.id).filter((id): id is string => Boolean(id)),
  );
  return [...pendingIds].filter((id) => !present.has(id));
}

export function shouldAcceptStroke(strokeRevision: number | undefined, boardRevision: number): boolean {
  return (strokeRevision ?? boardRevision) >= boardRevision;
}

export function allDrawersReady(ready: Record<string, boolean>, drawerIds: string[]): boolean {
  if (drawerIds.length === 0) return false;
  return drawerIds.every((id) => ready[id] === true);
}
