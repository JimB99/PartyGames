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
