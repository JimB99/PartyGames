import type { RoomSnapshot } from "@party-games/shared";

type DrawStroke = { points: number[]; color: string; width: number };

interface BtnProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  className?: string;
  disabled?: boolean;
  testId?: string;
}

export function ChainSketchPlayerPanel({
  room,
  phase,
  playerData,
  text,
  setText,
  drawTool,
  setDrawTool,
  drawWidth,
  setDrawWidth,
  onAction,
  DrawCanvas,
  Btn,
}: {
  room: RoomSnapshot;
  phase: string;
  playerData: Record<string, unknown>;
  text: string;
  setText: (t: string) => void;
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
  Btn: React.ComponentType<BtnProps>;
}) {
  if (phase === "draw" && playerData.prompt) {
    return (
      <div className="space-y-3">
        <p className="text-center text-xl font-bold">Draw: {String(playerData.prompt)}</p>
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
        {playerData.submitted ? (
          <p className="text-center text-green-400">Submitted — waiting for others…</p>
        ) : (
          <Btn variant="secondary" className="w-full" onClick={() => onAction({ kind: "advance" })}>
            Done drawing
          </Btn>
        )}
      </div>
    );
  }

  if (phase === "guess") {
    return (
      <div className="space-y-3">
        {Array.isArray(playerData.strokes) && <DrawCanvas strokes={playerData.strokes as DrawStroke[]} readOnly />}
        <p className="text-center text-lg text-zinc-400">What is this?</p>
        {playerData.submitted ? (
          <div className="rounded-xl border border-green-500/40 bg-green-900/40 p-6 text-center">
            <p className="text-xl font-bold text-green-300">Guess submitted!</p>
          </div>
        ) : (
          <>
            <textarea
              className="w-full rounded-xl bg-zinc-800 p-4 text-lg"
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <Btn
              className="w-full"
              onClick={() => {
                onAction({ kind: "submit_text", text });
                setText("");
              }}
            >
              Submit guess
            </Btn>
          </>
        )}
      </div>
    );
  }

  if (phase === "vote" && playerData.voteOptions) {
    const options = playerData.voteOptions as Array<{ id: string; ownerName: string }>;
    return (
      <div className="space-y-3">
        <p className="text-center text-lg font-bold">Vote for the best chain!</p>
        {playerData.voted ? (
          <p className="text-center text-green-400">Vote recorded</p>
        ) : (
          options.map((opt) => (
            <Btn key={opt.id} className="w-full" onClick={() => onAction({ kind: "vote", optionId: opt.id })}>
              {room.players.find((p) => p.id === opt.id)?.nickname ?? opt.id}
            </Btn>
          ))
        )}
      </div>
    );
  }

  return null;
}
