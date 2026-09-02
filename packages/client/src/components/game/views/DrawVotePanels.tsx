type DrawStroke = { points: number[]; color: string; width: number };

export function DrawVoteHostPanel({
  phase,
  data,
  DrawCanvas,
}: {
  phase: string;
  data: Record<string, unknown>;
  DrawCanvas: React.ComponentType<{ strokes: DrawStroke[]; readOnly?: boolean }>;
}) {
  const drawings = data.drawings as Array<{ playerId?: string; id?: string; strokes: DrawStroke[] }> | undefined;
  return (
    <div className="space-y-4 rounded-2xl bg-zinc-800/60 p-6">
      {data.prompt != null && <p className="text-center text-2xl font-bold">{String(data.prompt)}</p>}
      {phase === "vote" && <p className="text-center text-zinc-400">Players are voting on the drawings…</p>}
      {drawings && (
        <div className="grid gap-4 sm:grid-cols-2">
          {drawings.map((d, i) => (
            <div key={d.playerId ?? d.id ?? i} className="rounded-xl bg-zinc-900/60 p-3">
              <DrawCanvas strokes={d.strokes} readOnly />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function DrawVotePlayerPanel({
  phase,
  data,
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
  data: Record<string, unknown>;
  playerData: Record<string, unknown>;
  drawTool: "pen" | "eraser";
  setDrawTool: (t: "pen" | "eraser") => void;
  drawWidth: number;
  setDrawWidth: (w: number) => void;
  onAction: (action: import("@party-games/shared").GameAction) => void;
  DrawCanvas: React.ComponentType<{
    strokes: DrawStroke[];
    readOnly?: boolean;
    tool?: "pen" | "eraser";
    brushWidth?: number;
    onToolChange?: (t: "pen" | "eraser", w?: number) => void;
    onStroke?: (points: number[], color: string, width: number) => void;
    onUndo?: () => void;
    onClear?: () => void;
  }>;
  Btn: React.ComponentType<{ children: React.ReactNode; onClick?: () => void; className?: string; variant?: "primary" | "secondary" | "danger" }>;
}) {
  if (phase === "drawing" && data.prompt) {
    return (
      <div className="space-y-3">
        <p className="text-center text-xl font-bold">Draw: {String(data.prompt)}</p>
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
  if (phase === "vote" && playerData.toVote) {
    const options = playerData.toVote as Array<{ id: string; strokes: DrawStroke[] }>;
    return (
      <div className="space-y-3">
        <p className="text-center text-lg font-bold">Vote for your favorite!</p>
        {playerData.voted ? (
          <p className="text-center text-green-400">Vote recorded</p>
        ) : (
          options.map((opt) => (
            <button
              key={opt.id}
              type="button"
              className="w-full rounded-xl bg-zinc-800 p-3 hover:bg-zinc-700"
              onClick={() => onAction({ kind: "vote", optionId: opt.id })}
            >
              <DrawCanvas strokes={opt.strokes} readOnly />
            </button>
          ))
        )}
      </div>
    );
  }
  return null;
}
