type DrawStroke = { points: number[]; color: string; width: number };

export function DrawImpostorHostPanel({
  phase,
  data,
  DrawCanvas,
}: {
  phase: string;
  data: Record<string, unknown>;
  DrawCanvas: React.ComponentType<{ strokes: DrawStroke[]; readOnly?: boolean }>;
}) {
  const drawings = data.drawings as Array<{ id: string; strokes: DrawStroke[] }> | undefined;
  return (
    <div className="space-y-4 rounded-2xl bg-zinc-800/60 p-6 text-center">
      {data.category != null && <p className="text-xl text-zinc-400">Category: {String(data.category)}</p>}
      {data.prompt != null && <p className="text-2xl font-bold">{String(data.prompt)}</p>}
      {phase === "accuse" && <p className="text-zinc-400">Who drew like an impostor?</p>}
      {drawings && (
        <div className="grid gap-4 sm:grid-cols-2">
          {drawings.map((d) => (
            <div key={d.id} className="rounded-xl bg-zinc-900/60 p-3">
              <DrawCanvas strokes={d.strokes} readOnly />
            </div>
          ))}
        </div>
      )}
      {data.impostorId != null && (
        <p className="text-amber-400">Impostor revealed!</p>
      )}
    </div>
  );
}

export function DrawImpostorPlayerPanel({
  phase,
  playerData,
  drawTool,
  setDrawTool,
  drawWidth,
  setDrawWidth,
  onAction,
  DrawCanvas,
  Btn,
}: {
  phase: string;
  playerData: Record<string, unknown>;
  drawTool: "pen" | "eraser";
  setDrawTool: (t: "pen" | "eraser") => void;
  drawWidth: number;
  setDrawWidth: (w: number) => void;
  onAction: (action: import("@party-games/shared").GameAction) => void;
  DrawCanvas: React.ComponentType<{
    strokes: DrawStroke[];
    tool?: "pen" | "eraser";
    brushWidth?: number;
    onToolChange?: (t: "pen" | "eraser", w?: number) => void;
    onStroke?: (points: number[], color: string, width: number) => void;
    onUndo?: () => void;
    onClear?: () => void;
  }>;
  Btn: React.ComponentType<{ children: React.ReactNode; onClick?: () => void; className?: string; variant?: "primary" | "secondary" | "danger" }>;
}) {
  if (phase === "drawing") {
    return (
      <div className="space-y-3">
        {playerData.category != null && (
          <p className="text-center text-sm text-amber-400">Category: {String(playerData.category)}</p>
        )}
        <p className="text-center text-xl font-bold">Draw: {String(playerData.word ?? "???")}</p>
        <DrawCanvas
          strokes={(playerData.strokes as DrawStroke[]) ?? []}
          tool={drawTool}
          brushWidth={drawWidth}
          onToolChange={(t, w) => {
            setDrawTool(t);
            if (w !== undefined) setDrawWidth(w);
            onAction({ kind: "draw_tool", tool: t, width: w ?? drawWidth });
          }}
          onStroke={(points, color, width) =>
            onAction({ kind: "draw_stroke", points, color, width: width ?? drawWidth })
          }
          onUndo={() => onAction({ kind: "draw_undo" })}
          onClear={() => onAction({ kind: "draw_clear" })}
        />
        <Btn variant="secondary" className="w-full" onClick={() => onAction({ kind: "advance" })}>
          Done drawing
        </Btn>
      </div>
    );
  }
  return null;
}
