import type { RoomSnapshot } from "@party-games/shared";
import { playerColor } from "../../../hooks/usePartyRoom";

type DrawStroke = { points: number[]; color: string; width: number };

function nickname(room: RoomSnapshot, id: string) {
  return room.players.find((p) => p.id === id)?.nickname ?? id;
}

function VoteBreakdownList({
  room,
  voteBreakdown,
}: {
  room: RoomSnapshot;
  voteBreakdown: Array<{ voterId: string; pickId: string }>;
}) {
  if (voteBreakdown.length === 0) return null;
  return (
    <ul className="space-y-2 text-sm">
      {voteBreakdown.map(({ voterId, pickId }) => (
        <li key={voterId} className="flex flex-wrap items-center gap-2 rounded-lg bg-zinc-900/60 px-3 py-2">
          <span
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: playerColor(room.players.find((p) => p.id === voterId)?.colorIndex ?? 0) }}
          />
          <span>{nickname(room, voterId)}</span>
          <span className="text-zinc-500">→</span>
          <span className="font-semibold">{nickname(room, pickId)}</span>
        </li>
      ))}
    </ul>
  );
}

export function DrawVoteHostPanel({
  phase,
  data,
  room,
  DrawCanvas,
}: {
  phase: string;
  data: Record<string, unknown>;
  room: RoomSnapshot;
  DrawCanvas: React.ComponentType<{ strokes: DrawStroke[]; readOnly?: boolean }>;
}) {
  const drawings = data.drawings as
    | Array<{ playerId?: string; id?: string; strokes: DrawStroke[]; voteCount?: number }>
    | undefined;
  const voteBreakdown = data.voteBreakdown as Array<{ voterId: string; pickId: string }> | undefined;
  const roundWinner = data.roundWinner as string | undefined;
  const showReveal = phase === "reveal" || phase === "scoreboard" || phase === "ended";

  return (
    <div className="space-y-4 rounded-2xl bg-zinc-800/60 p-6">
      {data.prompt != null && <p className="text-center text-2xl font-bold">{String(data.prompt)}</p>}
      {phase === "vote" && <p className="text-center text-zinc-400">Players are voting on the drawings…</p>}
      {showReveal && roundWinner && (
        <p className="text-center text-2xl font-bold text-yellow-400">
          Winner: {nickname(room, roundWinner)}
        </p>
      )}
      {drawings && (
        <div className="grid gap-4 sm:grid-cols-2">
          {drawings.map((d, i) => {
            const id = d.playerId ?? d.id ?? String(i);
            return (
              <div key={id} className="rounded-xl bg-zinc-900/60 p-3">
                <p className="mb-2 text-center text-sm font-bold">
                  {nickname(room, id)}
                  {showReveal && d.voteCount !== undefined ? ` · ${d.voteCount} vote${d.voteCount === 1 ? "" : "s"}` : ""}
                </p>
                <DrawCanvas strokes={d.strokes} readOnly />
              </div>
            );
          })}
        </div>
      )}
      {showReveal && voteBreakdown && (
        <div className="space-y-2">
          <h3 className="text-lg font-bold">Votes</h3>
          <VoteBreakdownList room={room} voteBreakdown={voteBreakdown} />
        </div>
      )}
    </div>
  );
}

export function DrawVotePlayerPanel({
  phase,
  data,
  room,
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
  room: RoomSnapshot;
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
  Btn: React.ComponentType<{ children: React.ReactNode; onClick?: () => void; className?: string; variant?: "primary" | "secondary" | "danger"; testId?: string }>;
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
      <div className="flex max-h-[calc(100dvh-10rem)] min-h-0 flex-col gap-3">
        <p className="shrink-0 text-center text-lg font-bold">Vote for your favorite!</p>
        {playerData.voted ? (
          <p className="text-center text-green-400">Vote recorded</p>
        ) : (
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pb-4">
            {options.map((opt) => (
              <div key={opt.id} className="rounded-xl bg-zinc-800 p-3">
                <DrawCanvas strokes={opt.strokes} readOnly />
                <Btn
                  testId={`draw-vote-option-${opt.id}`}
                  variant="secondary"
                  className="mt-3 w-full"
                  onClick={() => onAction({ kind: "vote", optionId: opt.id })}
                >
                  Vote for this
                </Btn>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if ((phase === "reveal" || phase === "scoreboard" || phase === "ended") && data.drawings) {
    const drawings = data.drawings as Array<{ playerId: string; strokes: DrawStroke[]; voteCount?: number }>;
    const voteBreakdown = data.voteBreakdown as Array<{ voterId: string; pickId: string }> | undefined;
    const roundWinner = data.roundWinner as string | undefined;
    return (
      <div className="space-y-3">
        {roundWinner && (
          <p className="text-center text-xl font-bold text-yellow-400">
            Winner: {nickname(room, roundWinner)}
          </p>
        )}
        {drawings.map((d) => (
          <div key={d.playerId} className="rounded-xl bg-zinc-800/60 p-3">
            <p className="mb-2 text-center text-sm font-bold">
              {nickname(room, d.playerId)}
              {d.voteCount !== undefined ? ` · ${d.voteCount} votes` : ""}
            </p>
            <DrawCanvas strokes={d.strokes} readOnly />
          </div>
        ))}
        {voteBreakdown && <VoteBreakdownList room={room} voteBreakdown={voteBreakdown} />}
      </div>
    );
  }

  return null;
}
