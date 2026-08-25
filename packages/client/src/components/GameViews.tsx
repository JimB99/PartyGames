import type { HostViewSnapshot, PlayerViewSnapshot, RoomSnapshot } from "@party-games/shared";
import { useState } from "react";
import { playerColor } from "../hooks/usePartyRoom";
import { TimerBar } from "./TimerBar";

function Btn({
  children,
  onClick,
  variant = "primary",
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  className?: string;
}) {
  const base = "rounded-xl px-6 py-4 text-lg font-bold transition active:scale-95";
  const styles =
    variant === "primary"
      ? "bg-violet-600 hover:bg-violet-500 text-white"
      : variant === "danger"
        ? "bg-red-600 hover:bg-red-500 text-white"
        : "bg-zinc-700 hover:bg-zinc-600 text-white";
  return (
    <button type="button" className={`${base} ${styles} ${className}`} onClick={onClick}>
      {children}
    </button>
  );
}

export function HostGameView({
  room,
  hostView,
}: {
  room: RoomSnapshot;
  hostView: HostViewSnapshot;
}) {
  const data = hostView.data;
  const phase = hostView.phase;

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black">{hostView.gameId.replace(/-/g, " ")}</h2>
          <p className="text-zinc-400">
            Round {hostView.round}/{hostView.maxRounds} · {phase}
          </p>
        </div>
        <TimerBar endsAt={hostView.timerEndsAt} />
      </header>

      {phase === "instructions" && (
        <div className="rounded-2xl bg-zinc-800/60 p-8 text-center">
          <p className="text-2xl">Get ready!</p>
          <p className="mt-2 text-zinc-400">Starting soon…</p>
        </div>
      )}

      {(phase === "submit" || phase === "question") && (
        <div className="rounded-2xl bg-zinc-800/60 p-8 text-center">
          <p className="text-3xl font-bold">{String(data.displayText ?? data.prompt ?? data.question ?? data.event ?? data.category ?? "")}</p>
          {data.choices && (
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {(data.choices as string[]).map((c, i) => (
                <div key={i} className="rounded-xl bg-zinc-700/80 px-4 py-3">{c}</div>
              ))}
            </div>
          )}
          {data.optionA && data.optionB && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-blue-600/30 p-6 text-xl">{data.optionA as string}</div>
              <div className="rounded-xl bg-orange-600/30 p-6 text-xl">{data.optionB as string}</div>
            </div>
          )}
          {data.letters && (
            <div className="mt-6 flex justify-center gap-2">
              {(data.letters as string[]).map((l) => (
                <span key={l} className="rounded-lg bg-violet-600 px-4 py-2 text-2xl font-black">{l}</span>
              ))}
            </div>
          )}
          <p className="mt-4 text-zinc-400">
            Waiting for players… ({String(data.playerCount ?? data.answerCount ?? data.submitCount ?? 0)})
          </p>
        </div>
      )}

      {(phase === "vote" || phase === "matchup") && data.options && (
        <div className="grid gap-3">
          {(data.options as Array<{ id: string; text: string; isTruth?: boolean }>).map((o) => (
            <div key={o.id} className="rounded-xl bg-zinc-800 p-4 text-xl">
              {o.text}
              {o.isTruth && <span className="ml-2 text-green-400">✓ TRUTH</span>}
            </div>
          ))}
        </div>
      )}

      {phase === "matchup" && data.matchup && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-pink-600/30 p-8 text-center text-2xl font-bold">
            {(data.matchup as { a: { text: string }; b: { text: string } }).a?.text}
          </div>
          <div className="rounded-2xl bg-cyan-600/30 p-8 text-center text-2xl font-bold">
            {(data.matchup as { a: { text: string }; b: { text: string } }).b?.text}
          </div>
        </div>
      )}

      {phase === "reveal" && (
        <div className="space-y-4">
          {data.options && (
            <div className="grid gap-2">
              {(data.options as Array<{ id: string; text: string; isTruth?: boolean }>).map((o) => (
                <div key={o.id} className={`rounded-xl p-4 text-xl ${o.isTruth ? "bg-green-600/30" : "bg-zinc-800"}`}>
                  {o.text}
                </div>
              ))}
            </div>
          )}
          {data.correctIndex !== undefined && data.choices && (
            <p className="text-2xl text-center">
              Correct: {(data.choices as string[])[data.correctIndex as number]}
            </p>
          )}
          {data.correctYear && <p className="text-2xl text-center">Year: {data.correctYear as number}</p>}
          {data.voteSplit && (
            <div className="flex h-16 overflow-hidden rounded-xl">
              <div className="flex items-center justify-center bg-blue-600" style={{ width: `${(data.voteSplit as { a: number }).a}%` }}>
                {(data.voteSplit as { a: number }).a}%
              </div>
              <div className="flex items-center justify-center bg-orange-600" style={{ width: `${(data.voteSplit as { b: number }).b}%` }}>
                {(data.voteSplit as { b: number }).b}%
              </div>
            </div>
          )}
          {data.submissions && (
            <ul className="space-y-2">
              {(data.submissions as Array<{ playerId: string; word: string; valid?: boolean }>).map((s) => {
                const player = room.players.find((p) => p.id === s.playerId);
                return (
                  <li key={s.playerId} className="flex justify-between rounded-lg bg-zinc-800 px-4 py-2">
                    <span>{player?.nickname ?? s.playerId}</span>
                    <span>{s.word} {s.valid ? "✓" : "✗"}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {phase === "playing" && hostView.gameId === "curve-fever" && data.players && (
        <CurveArena data={data} room={room} />
      )}

      {(phase === "drawing" || phase === "guessing") && data.strokes && (
        <DrawCanvas strokes={data.strokes as Array<{ points: number[]; color: string }>} readOnly />
      )}

      {(phase === "scoreboard" || phase === "round_end" || phase === "ended") && (
        <div className="rounded-2xl bg-zinc-800/60 p-6">
          <h3 className="text-xl font-bold mb-4">Round scores</h3>
          <ul className="space-y-2">
            {Object.entries((data.roundScores as Record<string, number>) ?? {}).map(([id, pts]) => {
              const p = room.players.find((pl) => pl.id === id);
              return (
                <li key={id} className="flex justify-between">
                  <span>{p?.nickname ?? id}</span>
                  <span className="font-mono">{pts}</span>
                </li>
              );
            })}
          </ul>
          {data.roundWinner && (
            <p className="mt-4 text-center text-2xl text-yellow-400">
              Winner: {room.players.find((p) => p.id === data.roundWinner)?.nickname}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function CurveArena({
  data,
  room,
}: {
  data: Record<string, unknown>;
  room: RoomSnapshot;
}) {
  const width = (data.width as number) ?? 800;
  const height = (data.height as number) ?? 600;
  const players = data.players as Array<{
    id: string;
    x: number;
    y: number;
    trail: Array<{ x: number; y: number }>;
    alive: boolean;
    colorIndex: number;
  }>;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full rounded-2xl bg-zinc-900">
      {players?.map((p) => {
        const color = playerColor(p.colorIndex);
        const pts = p.trail.map((t) => `${t.x},${t.y}`).join(" ");
        const nickname = room.players.find((pl) => pl.id === p.id)?.nickname ?? "";
        return (
          <g key={p.id}>
            {pts && <polyline points={pts} fill="none" stroke={color} strokeWidth="4" opacity={p.alive ? 1 : 0.3} />}
            <circle cx={p.x} cy={p.y} r="6" fill={color} />
            <text x={p.x + 8} y={p.y - 8} fill={color} fontSize="14">{nickname}</text>
          </g>
        );
      })}
    </svg>
  );
}

function DrawCanvas({
  strokes,
  readOnly,
  onStroke,
}: {
  strokes: Array<{ points: number[]; color: string }>;
  readOnly?: boolean;
  onStroke?: (points: number[], color: string) => void;
}) {
  const width = 400;
  const height = 300;

  const handlePointer = (e: React.PointerEvent<SVGSVGElement>) => {
    if (readOnly || !onStroke) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * width;
    const y = ((e.clientY - rect.top) / rect.height) * height;
    onStroke([x, y], "#fff");
  };

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full rounded-2xl bg-zinc-900 touch-none"
      onPointerDown={handlePointer}
      onPointerMove={(e) => e.buttons === 1 && handlePointer(e)}
    >
      {strokes.map((s, i) => {
        const pts = s.points.reduce<string[]>((acc, v, idx) => {
          if (idx % 2 === 0) acc.push(`${v},${s.points[idx + 1]}`);
          return acc;
        }, []);
        return <polyline key={i} points={pts.join(" ")} fill="none" stroke={s.color} strokeWidth="3" />;
      })}
    </svg>
  );
}

export function PlayerGameView({
  room,
  playerView,
  onAction,
}: {
  room: RoomSnapshot;
  playerView: PlayerViewSnapshot;
  onAction: (action: import("@party-games/shared").GameAction) => void;
}) {
  const phase = playerView.phase;
  const data = playerView.data;
  const playerData = playerView.playerData;
  const [text, setText] = useState("");
  const [year, setYear] = useState(2000);

  return (
    <div className="mx-auto max-w-md space-y-4 p-4 pb-8">
      <TimerBar endsAt={playerView.timerEndsAt} />
      <p className="text-center text-sm text-zinc-400">
        {playerView.gameId.replace(/-/g, " ")} · {phase}
      </p>

      {phase === "instructions" && (
        <div className="text-center py-8">
          <p className="text-xl">Look at the TV!</p>
        </div>
      )}

      {(phase === "submit" || phase === "guessing") && (
        <div className="space-y-3">
          {playerData.word && <p className="text-center text-2xl font-bold">{String(playerData.word)}</p>}
          <textarea
            className="w-full rounded-xl bg-zinc-800 p-4 text-lg"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your answer…"
          />
          <Btn onClick={() => { onAction({ kind: "submit_text", text }); setText(""); }} className="w-full">
            Submit
          </Btn>
        </div>
      )}

      {phase === "vote" && data.options && (
        <div className="grid gap-2">
          {(data.options as Array<{ id: string; text: string }>).map((o) => (
            <Btn key={o.id} variant="secondary" className="w-full text-base" onClick={() => onAction({ kind: "vote", optionId: o.id })}>
              {o.text}
            </Btn>
          ))}
        </div>
      )}

      {phase === "matchup" && data.matchup && (
        <div className="grid gap-3">
          <Btn className="w-full" onClick={() => onAction({ kind: "vote_pair", winnerId: (data.matchup as { a: { id: string } }).a.id })}>
            {(data.matchup as { a: { text: string } }).a.text}
          </Btn>
          <Btn className="w-full" variant="secondary" onClick={() => onAction({ kind: "vote_pair", winnerId: (data.matchup as { b: { id: string } }).b.id })}>
            {(data.matchup as { b: { text: string } }).b.text}
          </Btn>
        </div>
      )}

      {phase === "question" && data.mode === "quiz" && (
        <div className="grid grid-cols-2 gap-3">
          {["A", "B", "C", "D"].map((label, i) => (
            <Btn key={label} variant="secondary" onClick={() => onAction({ kind: "trivia_answer", choiceIndex: i })}>
              {label}
            </Btn>
          ))}
        </div>
      )}

      {phase === "question" && data.mode === "timeline" && (
        <div className="space-y-3">
          <input type="range" min={data.minYear as number} max={data.maxYear as number} value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full" />
          <p className="text-center text-2xl font-bold">{year}</p>
          <Btn className="w-full" onClick={() => onAction({ kind: "year_slider", year })}>Lock in</Btn>
        </div>
      )}

      {phase === "question" && data.mode === "would-you-rather" && (
        <div className="grid gap-3">
          <Btn onClick={() => onAction({ kind: "would_you_rather", choice: "a" })}>{data.optionA as string}</Btn>
          <Btn variant="secondary" onClick={() => onAction({ kind: "would_you_rather", choice: "b" })}>{data.optionB as string}</Btn>
        </div>
      )}

      {phase === "pick" && data.options && (
        <div className="grid gap-2">
          {(data.options as Array<{ id: string; text: string }>).map((o) => (
            <Btn key={o.id} variant="secondary" className="w-full" onClick={() => onAction({ kind: "hot_seat_pick", submissionId: o.id })}>
              {o.text}
            </Btn>
          ))}
        </div>
      )}

      {phase === "acting" && playerData.word && (
        <div className="space-y-4 text-center">
          <p className="text-3xl font-black">{String(playerData.word)}</p>
          <div className="grid grid-cols-2 gap-3">
            <Btn onClick={() => onAction({ kind: "charades_correct" })}>Correct</Btn>
            <Btn variant="secondary" onClick={() => onAction({ kind: "charades_skip" })}>Skip</Btn>
          </div>
        </div>
      )}

      {phase === "playing" && playerView.gameId === "curve-fever" && (
        <div className="grid grid-cols-2 gap-4">
          <Btn className="py-12 text-2xl" onClick={() => onAction({ kind: "curve_turn", direction: "left" })}>◀</Btn>
          <Btn className="py-12 text-2xl" onClick={() => onAction({ kind: "curve_turn", direction: "right" })}>▶</Btn>
        </div>
      )}

      {phase === "task" && (
        <div className="space-y-3 text-center">
          <p className="text-lg">Complete the task on screen!</p>
          <Btn onClick={() => onAction({ kind: "impostor_task", result: "success" })}>Done</Btn>
          <Btn variant="danger" onClick={() => onAction({ kind: "impostor_task", result: "fail" })}>Failed</Btn>
        </div>
      )}

      {phase === "eject" && data.alive && (
        <div className="grid gap-2">
          {(data.alive as string[]).map((id) => {
            const p = room.players.find((pl) => pl.id === id);
            return (
              <Btn key={id} variant="danger" onClick={() => onAction({ kind: "impostor_eject", targetId: id })}>
                Eject {p?.nickname ?? id}
              </Btn>
            );
          })}
        </div>
      )}

      {phase === "assign" && data.roles && data.players && (
        <RoleSortAssign
          roles={data.roles as string[]}
          targetIds={(data.players as string[])}
          room={room}
          onSubmit={(assignments) => onAction({ kind: "assign_role", assignments })}
        />
      )}

      {phase === "drawing" && playerData.word && (
        <div className="space-y-3">
          <p className="text-center text-xl font-bold">Draw: {String(playerData.word)}</p>
          <DrawCanvas
            strokes={(data.strokes as Array<{ points: number[]; color: string }>) ?? []}
            onStroke={(points, color) => onAction({ kind: "draw_stroke", points, color })}
          />
          <Btn variant="secondary" className="w-full" onClick={() => onAction({ kind: "draw_clear" })}>Clear</Btn>
        </div>
      )}
    </div>
  );
}

function RoleSortAssign({
  roles,
  targetIds,
  room,
  onSubmit,
}: {
  roles: string[];
  targetIds: string[];
  room: RoomSnapshot;
  onSubmit: (assignments: Record<string, string>) => void;
}) {
  const [assignments, setAssignments] = useState<Record<string, string>>({});

  return (
    <div className="space-y-3">
      {targetIds.map((targetId) => {
        const target = room.players.find((p) => p.id === targetId);
        return (
          <div key={targetId} className="rounded-xl bg-zinc-800 p-3">
            <p className="mb-2 font-medium">{target?.nickname ?? targetId}</p>
            <select
              className="w-full rounded-lg bg-zinc-700 p-3"
              value={assignments[targetId] ?? ""}
              onChange={(e) => setAssignments((prev) => ({ ...prev, [targetId]: e.target.value }))}
            >
              <option value="">Pick role…</option>
              {roles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        );
      })}
      <Btn
        className="w-full"
        onClick={() => onSubmit(assignments)}
        disabled={Object.keys(assignments).length < targetIds.length}
      >
        Submit assignments
      </Btn>
    </div>
  );
}
