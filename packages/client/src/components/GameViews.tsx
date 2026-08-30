import type { DikeRevealEntry, HostViewSnapshot, PlayerAnswerReveal, PlayerViewSnapshot, RevealEntry, RoomSnapshot } from "@party-games/shared";
import { useState } from "react";
import { CurveArena } from "./CurveArena";
import { TrailDashInstructions } from "./TrailDashInstructions";
import { CurvePlayerControls } from "./CurvePlayerControls";
import { BlockStackArena } from "./BlockStackArena";
import { BlockStackBoard } from "./BlockStackBoard";
import { FleetDuelArena } from "./FleetDuelArena";
import { FleetDuelFleetStatus } from "./FleetDuelFleetStatus";
import { FleetDuelGrid } from "./FleetDuelGrid";
import { FleetDuelPlacement } from "./FleetDuelPlacement";
import { FourInARowBoard } from "./FourInARowBoard";
import { TicTacToeBoard } from "./TicTacToeBoard";
import { RevealBreakdown, ScoringRulesPanel } from "./RevealBreakdown";
import { RoundScorePanel } from "./RoundScorePanel";
import { TimerBar } from "./TimerBar";
import { LiveScoreBar } from "./LiveScoreBar";
import { PauseOverlay } from "./PauseOverlay";
import { PaddleClashArena } from "./PaddleClashArena";
import { GridBlastArena } from "./GridBlastArena";
import { playerColor } from "../hooks/usePartyRoom";

function markColorsForPlayers(room: RoomSnapshot, xPlayerId: string, oPlayerId: string) {
  const xPl = room.players.find((p) => p.id === xPlayerId);
  const oPl = room.players.find((p) => p.id === oPlayerId);
  return {
    x: playerColor(xPl?.colorIndex ?? 0),
    o: playerColor(oPl?.colorIndex ?? 1),
  };
}

function connectFourMarkColors(room: RoomSnapshot, pair: unknown) {
  if (!Array.isArray(pair) || pair.length < 2) return undefined;
  return markColorsForPlayers(room, String(pair[0]), String(pair[1]));
}

function Btn({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled = false,
  testId,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "danger";
  className?: string;
  disabled?: boolean;
  testId?: string;
}) {
  const base = "rounded-xl px-6 py-4 text-lg font-bold transition active:scale-95";
  const styles =
    variant === "primary"
      ? "bg-violet-600 hover:bg-violet-500 text-white"
      : variant === "danger"
        ? "bg-red-600 hover:bg-red-500 text-white"
        : "bg-zinc-700 hover:bg-zinc-600 text-white";
  return (
    <button type="button" data-testid={testId} className={`${base} ${styles} ${className} disabled:opacity-40`} onClick={onClick} disabled={disabled}>
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
  const gameMeta = room.games.find((g) => g.id === hostView.gameId);
  const gameName = gameMeta?.name ?? hostView.gameId.replace(/-/g, " ");
  const scoringRules = gameMeta?.scoringRules;

  const isTrailDash = hostView.gameId === "trail-dash";
  const isTrailDashPlaying = isTrailDash && phase === "playing";

  return (
    <div
      data-testid="host-game-view"
      className={`mx-auto w-full max-w-full space-y-6 ${
        isTrailDashPlaying ? "max-w-6xl p-4" : "max-w-5xl p-6"
      }`}
    >
      <header className={`flex flex-wrap items-start justify-between gap-4 min-w-0 ${isTrailDashPlaying ? "px-2" : ""}`}>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-black">{gameName}</h2>
            {room.activeGameOptions?.contentRating === "mature" && (
              <span className="rounded-full bg-red-600/90 px-3 py-1 text-sm font-bold uppercase tracking-wide">
                18+
              </span>
            )}
          </div>
          <p className="text-zinc-400">
            Round {hostView.round}/{hostView.maxRounds} · {phase}
          </p>
        </div>
        <div className="w-full sm:w-auto sm:shrink-0 min-w-0">
          <TimerBar endsAt={hostView.timerEndsAt} totalMs={hostView.timerTotalMs} />
        </div>
      </header>

      {phase === "instructions" && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-zinc-800/60 p-8 text-center">
            <p className="text-2xl">Get ready!</p>
            {hostView.gameId === "last-on-the-dike" && (
              <p className="mt-2 text-zinc-400">Bid just enough to survive.</p>
            )}
            {hostView.gameId === "trail-dash" && (
              <p className="mt-2 text-zinc-400">Last rider standing wins — collect coins and power-ups!</p>
            )}
            {hostView.gameId !== "last-on-the-dike" && hostView.gameId !== "trail-dash" && (
              <p className="mt-2 text-zinc-400">Starting soon…</p>
            )}
          </div>
          {hostView.gameId === "trail-dash" && (
            <TrailDashInstructions
              coinValue={(data.coinValue as number) ?? 50}
              powerUpMode={(data.powerUpMode as import("@party-games/shared").PowerUpMode) ?? "normal"}
            />
          )}
          {scoringRules && hostView.gameId !== "trail-dash" && <ScoringRulesPanel rules={scoringRules} />}
        </div>
      )}

      {phase === "bid" && hostView.gameId === "last-on-the-dike" && (
        <div className="rounded-2xl bg-zinc-800/60 p-8 text-center space-y-4">
          <p className="text-3xl font-bold">{data.walkerCount as number} walkers on the dike</p>
          <p className="text-zinc-400">
            Waiting for bids… ({String(data.submitCount ?? 0)}/{String(data.playerCount ?? 0)})
          </p>
        </div>
      )}

      {(phase === "submit" || phase === "question") && (
        <div className="rounded-2xl bg-zinc-800/60 p-8 text-center">
          <p className="text-3xl font-bold">{String(data.displayText ?? data.prompt ?? data.question ?? data.event ?? data.category ?? "")}</p>
          {data.choices && !data.hideChoicesOnTv && (
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {(data.choices as string[]).map((c, i) => (
                <div key={i} className="rounded-xl bg-zinc-700/80 px-4 py-3">{c}</div>
              ))}
            </div>
          )}
          {data.hideChoicesOnTv && phase === "question" && data.mode === "quiz" && (
            <p className="mt-4 text-zinc-400">Answer on your phone!</p>
          )}
          {data.wyrPromptOnly ? (
            <p className="mt-6 text-xl text-zinc-400">Vote on your phone!</p>
          ) : (
            <>
              {data.optionA && data.optionB && (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-blue-600/30 p-6 text-xl">{data.optionA as string}</div>
                  <div className="rounded-xl bg-orange-600/30 p-6 text-xl">{data.optionB as string}</div>
                </div>
              )}
            </>
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

      {phase === "vote" && data.match && !data.options && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-pink-600/30 p-8 text-center text-2xl font-bold">
            {(data.match as { a: { text: string } }).a?.text}
          </div>
          <div className="rounded-2xl bg-cyan-600/30 p-8 text-center text-2xl font-bold">
            {(data.match as { b: { text: string } }).b?.text}
          </div>
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

      {phase === "reveal" && hostView.gameId === "last-on-the-dike" && (
        <DikeRevealTable
          room={room}
          reveal={data.reveal as DikeRevealEntry[] | undefined}
          winnerId={data.winnerId as string | undefined}
        />
      )}

      {phase === "reveal" && hostView.gameId !== "last-on-the-dike" && (
        <div className="space-y-4">
          <RevealBreakdown
            room={room}
            reveal={data.reveal as RevealEntry[] | undefined}
            playerAnswers={data.playerAnswers as PlayerAnswerReveal[] | undefined}
          />
          {data.correctIndex !== undefined && data.choices && (
            <p className="text-2xl text-center">
              Correct: {(data.choices as string[])[data.correctIndex as number]}
            </p>
          )}
          {data.correctYear && <p className="text-2xl text-center">Year: {data.correctYear as number}</p>}
          {data.word && (
            <p className="text-2xl text-center">
              Word: {data.word as string}
              {data.drawerId && (
                <span className="text-zinc-400 text-lg block mt-1">
                  Drawn by {room.players.find((p) => p.id === data.drawerId)?.nickname}
                </span>
              )}
            </p>
          )}
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
          {data.actorId && (
            <p className="text-center text-xl">
              Actor: {room.players.find((p) => p.id === data.actorId)?.nickname}
              {data.correct !== undefined && ` · ${data.correct} correct, ${data.skipped} skipped`}
            </p>
          )}
          {data.taskFailures && (data.taskFailures as string[]).length > 0 && (
            <p className="text-center text-red-400">
              Task failures: {(data.taskFailures as string[]).map((id) => room.players.find((p) => p.id === id)?.nickname).join(", ")}
            </p>
          )}
          {data.results && !data.playerAnswers && (
            <ul className="space-y-2">
              {Object.entries(data.results as Record<string, { role: string; count: number }>).map(([pid, r]) => (
                <li key={pid} className="rounded-lg bg-zinc-800 px-4 py-2 flex justify-between">
                  <span>{room.players.find((p) => p.id === pid)?.nickname}</span>
                  <span>{r.role} ({r.count} votes)</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {phase === "ended" && hostView.gameId === "last-on-the-dike" && (
        <div className="space-y-4 rounded-2xl bg-zinc-800/60 p-6 text-center">
          <p className="text-3xl font-bold text-yellow-400">
            Winner: {room.players.find((p) => p.id === data.winnerId)?.nickname ?? "—"}
          </p>
          <DikePodium
            room={room}
            winnerId={data.winnerId as string | undefined}
            placement={data.placement as string[] | undefined}
          />
        </div>
      )}


      {phase === "playing" && hostView.gameId === "trail-dash" && data.players && (
        <CurveArena data={data} room={room} />
      )}

      {phase === "playing" && hostView.gameId === "block-stack" && data.players && (
        <BlockStackArena data={data} room={room} />
      )}

      {(phase === "placement" || phase === "battle" || phase === "betting" || phase === "fire" || phase === "reveal") &&
        hostView.gameId === "fleet-duel" && (
        <FleetDuelArena data={data} room={room} />
      )}

      {(phase === "playing" || phase === "match_end") && hostView.gameId === "four-in-a-row" && data.board && (
        <div className="flex flex-col items-center gap-4">
          <FourInARowBoard
            board={data.board as import("@party-games/shared").CfCell[][]}
            markColors={connectFourMarkColors(room, data.players)}
          />
          {data.currentTurn && (
            <p className="text-xl">
              Turn: {room.players.find((p) => p.id === data.currentTurn)?.nickname}
            </p>
          )}
        </div>
      )}

      {(phase === "playing" || phase === "match_end") && hostView.gameId === "tic-tac-toe" && data.match && (
        <div className="flex flex-col items-center gap-4">
          <TicTacToeBoard
            board={(data.match as { board: import("@party-games/shared").Cell[] }).board}
            disabled
            markColors={
              (data.match as { xPlayer: string; oPlayer: string }).xPlayer
                ? markColorsForPlayers(
                    room,
                    (data.match as { xPlayer: string }).xPlayer,
                    (data.match as { oPlayer: string }).oPlayer,
                  )
                : undefined
            }
          />
          <p className="text-lg text-zinc-400">
            {(data.match as { xPlayer: string | null }).xPlayer &&
              `${room.players.find((p) => p.id === (data.match as { xPlayer: string }).xPlayer)?.nickname ?? "?"} (✕) vs ${room.players.find((p) => p.id === (data.match as { oPlayer: string }).oPlayer)?.nickname ?? "?"} (○)`}
          </p>
        </div>
      )}

      {(phase === "drawing" || phase === "guessing" || phase === "draw") && data.strokes && (
        <DrawCanvas strokes={data.strokes as DrawStroke[]} readOnly />
      )}

      {hostView.gameId === "split-the-room" && data.scenario && (
        <div className="rounded-2xl bg-zinc-800/60 p-8 text-center space-y-4">
          <p className="text-3xl font-bold">{(data.scenario as { text: string }).text}</p>
          {(phase === "vote" || phase === "reveal" || phase === "scoreboard") && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-blue-600/30 p-6 text-xl">{(data.scenario as { labelA: string }).labelA}</div>
              <div className="rounded-xl bg-orange-600/30 p-6 text-xl">{(data.scenario as { labelB: string }).labelB}</div>
            </div>
          )}
          {data.voteCounts && (
            <p className="text-xl text-zinc-300">
              A: {(data.voteCounts as { a: number }).a} · B: {(data.voteCounts as { b: number }).b}
            </p>
          )}
        </div>
      )}

      {hostView.gameId === "spectrum" && data.pair && (
        <div className="space-y-4 rounded-2xl bg-zinc-800/60 p-8">
          <div className="flex justify-between text-xl font-bold">
            <span>{(data.pair as { left: string }).left}</span>
            <span>{(data.pair as { right: string }).right}</span>
          </div>
          {data.clue && <p className="text-center text-2xl">Clue: {String(data.clue)}</p>}
          {data.target !== undefined && (
            <p className="text-center text-3xl text-violet-300">Target: {String(data.target)}</p>
          )}
          {data.guesses && (
            <ul className="space-y-1 text-center text-zinc-300">
              {Object.entries(data.guesses as Record<string, number>).map(([pid, val]) => (
                <li key={pid}>{room.players.find((p) => p.id === pid)?.nickname ?? pid}: {val}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {hostView.gameId === "crowd-call" && data.question && (
        <div className="rounded-2xl bg-zinc-800/60 p-8 text-center space-y-4">
          <p className="text-3xl font-bold">{(data.question as { text: string }).text}</p>
          <div className="grid gap-2">
            {((data.question as { choices: string[] }).choices ?? []).map((c, i) => (
              <div key={i} className="rounded-xl bg-zinc-700/80 px-4 py-3">{c}</div>
            ))}
          </div>
          {data.majority !== undefined && (
            <p className="text-xl text-emerald-400">
              Majority: {((data.question as { choices: string[] }).choices ?? [])[data.majority as number]}
            </p>
          )}
        </div>
      )}

      {hostView.gameId === "star-rate" && data.prompt && (
        <div className="rounded-2xl bg-zinc-800/60 p-8 text-center space-y-4">
          <p className="text-3xl font-bold">{String(data.prompt)}</p>
          {data.submissions && (
            <ul className="space-y-2 text-left">
              {(data.submissions as Array<{ id: string; text: string }>).map((s) => (
                <li key={s.id} className="rounded-xl bg-zinc-700/80 px-4 py-3">{s.text}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {hostView.gameId === "chain-sketch" && (
        <div className="space-y-4">
          {data.currentPrompt && phase !== "reveal" && (
            <p className="text-center text-2xl font-bold">Prompt: {String(data.currentPrompt)}</p>
          )}
          {data.activePlayerId && (
            <p className="text-center text-zinc-400">
              {room.players.find((p) => p.id === data.activePlayerId)?.nickname ?? "?"}&apos;s turn
            </p>
          )}
          {data.strokes && <DrawCanvas strokes={data.strokes as DrawStroke[]} readOnly />}
          {data.chain && (
            <ol className="space-y-3">
              {(data.chain as Array<{ kind: string; prompt: string; guess?: string }>).map((link, i) => (
                <li key={i} className="rounded-xl bg-zinc-800 p-4">
                  <span className="text-zinc-500">{link.kind === "draw" ? "🎨" : "💬"}</span> {link.prompt}
                  {link.guess && <span className="text-zinc-400"> → {link.guess}</span>}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {hostView.gameId === "impostor" && (
        <div className="rounded-2xl bg-zinc-800/60 p-8 text-center space-y-4">
          <p className="text-3xl font-bold">{String(data.categoryLabel ?? "")}</p>
          {(phase === "questioning" || phase === "accusation") && (
            <p className="text-zinc-400">Ask questions out loud! Use phones to accuse or guess.</p>
          )}
          {data.secretItem && <p className="text-2xl text-violet-300">Secret: {String(data.secretItem)}</p>}
          {data.spyId && (
            <p className="text-zinc-400">Stranger was {room.players.find((p) => p.id === data.spyId)?.nickname}</p>
          )}
        </div>
      )}

      {hostView.gameId === "forbidden-clue" && (
        <div className="rounded-2xl bg-zinc-800/60 p-8 text-center space-y-4">
          <p className="text-xl">Team {String(data.activeTeam ?? "").toUpperCase()}&apos;s turn</p>
          <p className="text-zinc-400">
            Clue giver: {room.players.find((p) => p.id === data.clueGiverId)?.nickname ?? "?"}
          </p>
          <p>Correct: {String(data.correct ?? 0)} · Fouls: {String(data.fouls ?? 0)}</p>
          {data.word && <p className="text-2xl font-bold">{String(data.word)}</p>}
        </div>
      )}

      {hostView.gameId === "agent-grid" && data.words && (
        <AgentGridBoard
          words={data.words as string[]}
          revealed={data.revealed as boolean[]}
          keyTiles={data.key as Array<"a" | "b" | "neutral" | "assassin"> | undefined}
          activeTeam={data.activeTeam as "a" | "b" | undefined}
          currentClue={data.currentClue as { word: string; count: number } | null}
        />
      )}

      {hostView.gameId === "hangman-race" && data.leaderboard && (
        <ul className="space-y-2">
          {(data.leaderboard as Array<{ playerId: string; mask: string; solved: boolean; strikes: number }>).map((e) => (
            <li key={e.playerId} className="rounded-xl bg-zinc-800 px-4 py-3 flex justify-between">
              <span>{room.players.find((p) => p.id === e.playerId)?.nickname}</span>
              <span className="font-mono">{e.mask} ({e.strikes} strikes){e.solved ? " ✓" : ""}</span>
            </li>
          ))}
          {data.word && <p className="text-center text-xl">Word: {String(data.word)}</p>}
        </ul>
      )}

      {hostView.gameId === "paddle-clash" && phase === "playing" && (
        <PaddleClashArena data={data} room={room} />
      )}

      {hostView.gameId === "grid-blast" && (phase === "playing" || phase === "round_end") && (
        <GridBlastArena data={data} room={room} />
      )}

      {(phase === "scoreboard" || phase === "round_end" || phase === "ended") && (
        <>
          <RoundScorePanel
            room={room}
            roundScores={(data.roundScores as Record<string, number>) ?? {}}
            extraNames={(data.botNames as Record<string, string>) ?? undefined}
          />
          {data.roundWinner && (
            <p className="text-center text-2xl text-yellow-400">
              Winner:{" "}
              {room.players.find((p) => p.id === data.roundWinner)?.nickname ??
                (data.botNames as Record<string, string> | undefined)?.[data.roundWinner as string] ??
                "—"}
            </p>
          )}
        </>
      )}
    </div>
  );
}

type DrawStroke = { points: number[]; color: string; width?: number; erase?: boolean };

const TILE_COLORS = {
  a: "bg-blue-600",
  b: "bg-red-600",
  neutral: "bg-stone-500",
  assassin: "bg-black",
  hidden: "bg-zinc-700",
};

function AgentGridBoard({
  words,
  revealed,
  keyTiles,
  activeTeam,
  currentClue,
  spymasterView = false,
}: {
  words: string[];
  revealed: boolean[];
  keyTiles?: Array<"a" | "b" | "neutral" | "assassin">;
  activeTeam?: "a" | "b";
  currentClue?: { word: string; count: number } | null;
  spymasterView?: boolean;
}) {
  return (
    <div className="space-y-4">
      {currentClue && (
        <p className="text-center text-xl font-bold">
          Clue: {currentClue.word} · {currentClue.count}
          {activeTeam && <span className="text-zinc-400"> (Team {activeTeam.toUpperCase()})</span>}
        </p>
      )}
      <div className="grid grid-cols-5 gap-2">
        {words.map((word, i) => {
          const isRevealed = revealed[i];
          const tile = keyTiles?.[i];
          let bg = TILE_COLORS.hidden;
          if (isRevealed && tile) bg = TILE_COLORS[tile];
          else if (spymasterView && tile) bg = `${TILE_COLORS[tile]} opacity-80`;
          return (
            <div key={i} className={`rounded-xl p-3 text-center text-sm font-bold ${bg}`}>
              {word}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DrawCanvas({
  strokes,
  readOnly,
  tool = "pen",
  brushWidth = 4,
  onToolChange,
  onStroke,
  onUndo,
  onClear,
}: {
  strokes: DrawStroke[];
  readOnly?: boolean;
  tool?: "pen" | "eraser";
  brushWidth?: number;
  onToolChange?: (tool: "pen" | "eraser", width?: number) => void;
  onStroke?: (points: number[], color: string, width?: number) => void;
  onUndo?: () => void;
  onClear?: () => void;
}) {
  const width = 400;
  const height = 300;
  const [drawing, setDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<[number, number] | null>(null);

  const toLocal = (e: React.PointerEvent<SVGSVGElement>): [number, number] => {
    const rect = e.currentTarget.getBoundingClientRect();
    return [((e.clientX - rect.left) / rect.width) * width, ((e.clientY - rect.top) / rect.height) * height];
  };

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (readOnly || !onStroke) return;
    setDrawing(true);
    const pt = toLocal(e);
    setLastPoint(pt);
    onStroke(pt, tool === "eraser" ? "erase" : "#fff", brushWidth);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!drawing || readOnly || !onStroke || !lastPoint) return;
    const pt = toLocal(e);
    onStroke([lastPoint[0], lastPoint[1], pt[0], pt[1]], tool === "eraser" ? "erase" : "#fff", brushWidth);
    setLastPoint(pt);
  };

  const handlePointerUp = () => {
    setDrawing(false);
    setLastPoint(null);
  };

  return (
    <div className="space-y-2">
      {!readOnly && onToolChange && (
        <div className="flex flex-wrap gap-2">
          <button type="button" className={`rounded-lg px-3 py-2 text-sm font-bold ${tool === "pen" ? "bg-violet-600" : "bg-zinc-700"}`} onClick={() => onToolChange("pen")}>Pen</button>
          <button type="button" className={`rounded-lg px-3 py-2 text-sm font-bold ${tool === "eraser" ? "bg-violet-600" : "bg-zinc-700"}`} onClick={() => onToolChange("eraser")}>Eraser</button>
          {[3, 6, 10].map((w) => (
            <button key={w} type="button" className={`rounded-lg px-3 py-2 text-sm ${brushWidth === w ? "bg-zinc-500" : "bg-zinc-800"}`} onClick={() => onToolChange(tool, w)}>{w}px</button>
          ))}
          {onUndo && <button type="button" className="rounded-lg bg-zinc-700 px-3 py-2 text-sm" onClick={onUndo}>Undo</button>}
          {onClear && <button type="button" className="rounded-lg bg-zinc-700 px-3 py-2 text-sm" onClick={onClear}>Clear</button>}
        </div>
      )}
      <svg
        data-testid="draw-canvas"
        viewBox={`0 0 ${width} ${height}`}
        className="w-full rounded-2xl bg-zinc-900 touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {strokes.map((s, i) => {
          const pts = s.points.reduce<string[]>((acc, v, idx) => {
            if (idx % 2 === 0) acc.push(`${v},${s.points[idx + 1]}`);
            return acc;
          }, []);
          return (
            <polyline
              key={i}
              points={pts.join(" ")}
              fill="none"
              stroke={s.erase ? "#0f1117" : s.color}
              strokeWidth={s.width ?? 3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}
      </svg>
    </div>
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
  const gameMeta = room.games.find((g) => g.id === playerView.gameId);
  const gameName = gameMeta?.name ?? playerView.gameId.replace(/-/g, " ");
  const scoringRules = gameMeta?.scoringRules;
  const [text, setText] = useState("");
  const [year, setYear] = useState(2000);
  const [spectrumGuess, setSpectrumGuess] = useState(50);
  const [drawTool, setDrawTool] = useState<"pen" | "eraser">("pen");
  const [drawWidth, setDrawWidth] = useState(4);

  return (
    <div
      className={`mx-auto w-full max-w-md space-y-4 p-4 relative min-w-0 landscape:pb-4 ${
        phase === "playing" && playerView.gameId === "trail-dash"
          ? "pb-[calc(11rem+env(safe-area-inset-bottom))] landscape:pb-[calc(34vh+env(safe-area-inset-bottom))]"
          : "pb-8"
      }`}
    >
      <PauseOverlay paused={room.paused} phase={phase} variant="player" />
      <LiveScoreBar
        room={room}
        gameScores={room.gameScores}
        compact
      />
      <TimerBar endsAt={playerView.timerEndsAt} totalMs={playerView.timerTotalMs} />
      <p className="text-center text-sm text-zinc-400">
        {gameName} · {phase}
      </p>

      {phase === "instructions" && (
        <div className="space-y-4 py-4">
          {playerView.gameId === "trail-dash" ? (
            <TrailDashInstructions
              coinValue={(playerView.data.coinValue as number) ?? 50}
              powerUpMode={(playerView.data.powerUpMode as import("@party-games/shared").PowerUpMode) ?? "normal"}
            />
          ) : (
            <>
              <p className="text-center text-xl">Look at the TV!</p>
              {scoringRules && <ScoringRulesPanel rules={scoringRules} />}
            </>
          )}
        </div>
      )}

      {(phase === "submit" || phase === "guessing") && (
        <div className="space-y-3">
          {data.displayText && <p className="text-center text-xl font-bold">{String(data.displayText)}</p>}
          {data.prompt && <p className="text-center text-xl font-bold">{String(data.prompt)}</p>}
          {data.imageCaption && <p className="text-center text-lg text-zinc-300">{String(data.imageCaption)}</p>}
          {data.category && <p className="text-center text-xl font-bold">{String(data.category)}</p>}
          {playerData.word && <p className="text-center text-2xl font-bold">{String(playerData.word)}</p>}
          {phase === "guessing" && !playerData.word && (
            <p className="text-center text-zinc-400">Watch the TV and guess the drawing!</p>
          )}
          <textarea
            data-testid="player-text-input"
            className="w-full rounded-xl bg-zinc-800 p-4 text-lg"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your answer…"
          />
          <Btn testId="player-submit" onClick={() => { onAction({ kind: "submit_text", text }); setText(""); }} className="w-full">
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

      {phase === "vote" && data.match && !data.options && (
        <div className="grid gap-3">
          <Btn className="w-full" onClick={() => onAction({ kind: "vote", optionId: (data.match as { a: { id: string } }).a.id })}>
            {(data.match as { a: { text: string } }).a.text}
          </Btn>
          <Btn className="w-full" variant="secondary" onClick={() => onAction({ kind: "vote", optionId: (data.match as { b: { id: string } }).b.id })}>
            {(data.match as { b: { text: string } }).b.text}
          </Btn>
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
        <div className="space-y-3">
          {data.question && <p className="text-center text-lg font-bold">{String(data.question)}</p>}
          <div className="grid gap-2">
            {(data.choices as string[] | undefined)?.map((c, i) => (
              <Btn key={i} testId={i === 0 ? "player-answer-0" : undefined} variant="secondary" className="w-full text-base text-left" onClick={() => onAction({ kind: "trivia_answer", choiceIndex: i })}>
                {c}
              </Btn>
            ))}
          </div>
        </div>
      )}

      {phase === "question" && data.mode === "timeline" && (
        <div className="space-y-3">
          {data.event && <p className="text-center text-xl font-bold">{String(data.event)}</p>}
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

      {phase === "playing" && playerView.gameId === "trail-dash" && (
        <CurvePlayerControls
          onAction={onAction}
          jumpCooldown={(playerData.jumpCooldown as number) ?? 0}
          canFire={(playerData.canFire as boolean) ?? false}
          heldPowerUp={(playerData.heldPowerUp as string | null) ?? null}
          extraJumps={(playerData.extraJumps as number) ?? 0}
        />
      )}

      {phase === "playing" && playerView.gameId === "block-stack" && (
        <div className="flex h-[calc(100dvh-9rem)] min-h-0 flex-col gap-2">
          <div className="relative min-h-0 flex-1">
            <BlockStackBoard
              board={(playerData.board as number[][]) ?? []}
              alive={(playerData.alive as boolean) ?? true}
              interactive
              className="h-full"
              onInput={(input) => onAction({ kind: "block_stack_input", input })}
            />
          </div>
          <p className="shrink-0 text-center text-sm text-zinc-400">
            Score: {String(playerData.score ?? 0)} · Swipe to move/drop · Tap to rotate
          </p>
        </div>
      )}

      {playerView.gameId === "fleet-duel" && phase === "placement" && (
        <FleetDuelPlacement
          gridSize={(data.gridSize as number) ?? 10}
          fleet={(playerData.fleet as import("@party-games/shared").Ship[]) ?? []}
          fleetLengths={(playerData.fleetLengths as number[]) ?? []}
          onAction={onAction}
        />
      )}

      {playerView.gameId === "fleet-duel" && (phase === "battle" || phase === "fire") && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <FleetDuelFleetStatus
              label="Your fleet"
              fleetLengths={(playerData.fleetLengths as number[]) ?? []}
              sunkLengths={(playerData.ownSunkLengths as number[]) ?? []}
              placedLengths={(playerData.fleet as import("@party-games/shared").Ship[] | undefined)
                ?.filter((s) => s.cells.length === s.length)
                .map((s) => s.length)}
            />
            <FleetDuelFleetStatus
              label="Enemy fleet"
              fleetLengths={(playerData.fleetLengths as number[]) ?? []}
              sunkLengths={(playerData.opponentSunkLengths as number[]) ?? []}
            />
          </div>
          <p className="text-center text-sm text-zinc-400">
            {phase === "fire" ? "Pick a target cell" : playerData.myTurn ? "Your turn — fire!" : "Waiting for opponent…"}
          </p>
          <div className="flex justify-center">
            <FleetDuelGrid
              size={(data.gridSize as number) ?? 10}
              shots={(playerData.opponentShots as Array<{ x: number; y: number; hit: boolean }>) ?? []}
              sunkCells={(playerData.opponentSunkCells as Array<{ x: number; y: number }>) ?? []}
              disabled={phase === "battle" ? !playerData.myTurn : false}
              onCellClick={(x, y) =>
                onAction({
                  kind: "fleet_duel_fire",
                  x,
                  y,
                  targetId: (data.mode as string) === "royale" ? (data.opponentId as string) : (data.opponentId as string),
                })
              }
            />
          </div>
        </div>
      )}

      {playerView.gameId === "fleet-duel" && phase === "betting" && (
        <div className="space-y-3">
          <p className="text-center">Place a bet (optional)</p>
          {(data.playerIds as string[] | undefined)?.map((id) => {
            const nick = room.players.find((p) => p.id === id)?.nickname ?? id;
            return (
              <Btn
                key={id}
                variant="secondary"
                className="w-full text-base"
                onClick={() => onAction({ kind: "fleet_duel_bet", market: "next_elimination", pick: id, amount: 100 })}
              >
                Bet 100 on {nick} eliminated
              </Btn>
            );
          })}
        </div>
      )}

      {(phase === "playing" || phase === "match_end") && playerView.gameId === "four-in-a-row" && (
        <div className="space-y-4">
          {playerData.inMatch ? (
            <>
              <FourInARowBoard
                board={(data.board as import("@party-games/shared").CfCell[][]) ?? []}
                disabled={!playerData.myTurn}
                markColors={connectFourMarkColors(room, data.players)}
                onColumnClick={(column) => onAction({ kind: "four_in_a_row_drop", column })}
              />
              <p className="text-center text-sm text-zinc-400">
                {playerData.myTurn ? "Your turn" : "Waiting…"}
              </p>
            </>
          ) : (
            <p className="text-center text-lg">Watch the TV!</p>
          )}
        </div>
      )}

      {(phase === "playing" || phase === "match_end") && playerView.gameId === "tic-tac-toe" && (
        <div className="space-y-4">
          {data.inMatch ? (
            <>
              <TicTacToeBoard
                board={((data.match as { board: import("@party-games/shared").Cell[] })?.board) ?? []}
                disabled={!playerData.myTurn}
                myMark={(playerData.mark as "x" | "o") ?? null}
                markColors={
                  (data.match as { xPlayer: string; oPlayer: string } | undefined)?.xPlayer
                    ? markColorsForPlayers(
                        room,
                        (data.match as { xPlayer: string }).xPlayer,
                        (data.match as { oPlayer: string }).oPlayer,
                      )
                    : undefined
                }
                onCellClick={(cell) => onAction({ kind: "tic_tac_toe_move", cell })}
              />
              <p className="text-center text-sm text-zinc-400">
                {playerData.myTurn ? "Your turn" : "Waiting…"}
              </p>
            </>
          ) : (
            <p className="text-center text-lg">Watch the TV — your match is coming up!</p>
          )}
        </div>
      )}

      {phase === "playing" && data.letters && !playerView.gameId.includes("curve") && (
        <div className="space-y-3">
          <div className="flex justify-center gap-2">
            {(data.letters as string[]).map((l) => (
              <span key={l} className="rounded-lg bg-violet-600 px-4 py-2 text-2xl font-black">{l}</span>
            ))}
          </div>
          <textarea
            data-testid="player-text-input"
            className="w-full rounded-xl bg-zinc-800 p-4 text-lg"
            rows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a word…"
          />
          <Btn testId="player-submit" onClick={() => { onAction({ kind: "submit_text", text }); setText(""); }} className="w-full">
            Submit
          </Btn>
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
            strokes={(data.strokes as DrawStroke[]) ?? []}
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
        </div>
      )}

      {phase === "draw" && playerData.isActive && playerData.prompt && (
        <div className="space-y-3">
          <p className="text-center text-xl font-bold">Draw: {String(playerData.prompt)}</p>
          <DrawCanvas
            strokes={(data.strokes as DrawStroke[]) ?? []}
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
          <Btn variant="secondary" className="w-full" onClick={() => onAction({ kind: "advance" })}>Done drawing</Btn>
        </div>
      )}

      {phase === "guess" && playerData.isActive && playerData.prompt && (
        <div className="space-y-3">
          <p className="text-center text-lg text-zinc-400">What is this?</p>
          <textarea className="w-full rounded-xl bg-zinc-800 p-4 text-lg" rows={2} value={text} onChange={(e) => setText(e.target.value)} />
          <Btn className="w-full" onClick={() => { onAction({ kind: "submit_text", text }); setText(""); }}>Submit guess</Btn>
        </div>
      )}

      {phase === "vote" && data.scenario && playerView.gameId === "split-the-room" && (
        <div className="grid gap-3">
          <Btn testId="split-vote-a" className="w-full" disabled={Boolean(playerData.voted)} onClick={() => onAction({ kind: "split_vote", side: "a" })}>
            {(data.scenario as { labelA: string }).labelA}
          </Btn>
          <Btn testId="split-vote-b" className="w-full" variant="secondary" disabled={Boolean(playerData.voted)} onClick={() => onAction({ kind: "split_vote", side: "b" })}>
            {(data.scenario as { labelB: string }).labelB}
          </Btn>
        </div>
      )}

      {phase === "clue" && playerData.isClueGiver && (
        <div className="space-y-3">
          <p className="text-center text-sm text-zinc-400">
            {(data.pair as { left: string; right: string })?.left} ↔ {(data.pair as { left: string; right: string })?.right}
          </p>
          {playerData.target !== undefined && (
            <p className="text-center text-2xl font-bold">Target: {String(playerData.target)}</p>
          )}
          <textarea className="w-full rounded-xl bg-zinc-800 p-4 text-lg" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Your clue…" />
          <Btn className="w-full" onClick={() => { onAction({ kind: "submit_text", text }); setText(""); }}>Submit clue</Btn>
        </div>
      )}

      {phase === "guess" && playerView.gameId === "spectrum" && !playerData.isClueGiver && (
        <div className="space-y-4">
          <p className="text-center text-lg">{String(data.clue ?? "")}</p>
          <input type="range" min={0} max={100} value={spectrumGuess} onChange={(e) => setSpectrumGuess(Number(e.target.value))} className="w-full" data-testid="spectrum-slider" />
          <p className="text-center text-2xl font-bold">{spectrumGuess}</p>
          <Btn testId="spectrum-lock-in" className="w-full" disabled={Boolean(playerData.guessed)} onClick={() => onAction({ kind: "spectrum_guess", value: spectrumGuess })}>Lock in</Btn>
        </div>
      )}

      {phase === "predict" && data.question && (
        <div className="grid gap-2">
          {((data.question as { choices: string[] }).choices ?? []).map((c, i) => (
            <Btn key={i} testId={`crowd-call-option-${i}`} variant="secondary" className="w-full text-base" disabled={Boolean(playerData.predicted)} onClick={() => onAction({ kind: "crowd_predict", choiceIndex: i })}>
              {c}
            </Btn>
          ))}
        </div>
      )}

      {phase === "answer" && data.question && (
        <div className="grid gap-2">
          {((data.question as { choices: string[] }).choices ?? []).map((c, i) => (
            <Btn key={i} testId={`crowd-call-option-${i}`} variant="secondary" className="w-full text-base" disabled={Boolean(playerData.answered)} onClick={() => onAction({ kind: "crowd_answer", choiceIndex: i })}>
              {c}
            </Btn>
          ))}
        </div>
      )}

      {phase === "rate" && playerData.toRate && (
        <div className="space-y-4">
          {(playerData.toRate as Array<{ id: string; text: string }>).map((sub) => (
            <div key={sub.id} className="rounded-xl bg-zinc-800 p-4 space-y-2">
              <p>{sub.text}</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((stars) => (
                  <button key={stars} type="button" data-testid={`star-rate-${stars}`} className="text-2xl" onClick={() => onAction({ kind: "star_rate", submissionId: sub.id, stars })}>★</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {playerView.gameId === "impostor" && (
        <div className="space-y-4">
          {playerData.isSpy ? (
            <p className="text-center text-xl font-bold text-amber-400">You are the stranger!</p>
          ) : playerData.secretItem ? (
            <p className="text-center text-2xl font-bold">{String(playerData.secretItem)}</p>
          ) : null}
          {phase === "questioning" && playerData.isSpy && playerData.itemList && (
            <div className="grid gap-2">
              {(playerData.itemList as string[]).map((item, i) => (
                <Btn key={item} className="w-full text-base" onClick={() => onAction({ kind: "impostor_guess", itemIndex: i })}>
                  Guess: {item}
                </Btn>
              ))}
            </div>
          )}
          {(phase === "questioning" || phase === "accusation") && data.playerIds && (
            <div className="grid gap-2">
              <p className="text-center text-sm text-zinc-400">Accuse someone:</p>
              {(data.playerIds as string[]).filter((id) => id !== room.playerId).map((id) => (
                <Btn key={id} variant="danger" className="w-full" disabled={Boolean(playerData.accused)} onClick={() => onAction({ kind: "impostor_accuse", targetId: id })}>
                  {room.players.find((p) => p.id === id)?.nickname ?? id}
                </Btn>
              ))}
            </div>
          )}
        </div>
      )}

      {playerView.gameId === "forbidden-clue" && playerData.isClueGiver && playerData.card && phase === "clue" && (
        <div className="space-y-4">
          <p className="text-center text-3xl font-black">{(playerData.card as { word: string }).word}</p>
          <p className="text-center text-red-400">Forbidden: {(playerData.card as { forbidden: string[] }).forbidden.join(", ")}</p>
          <div className="grid grid-cols-3 gap-2">
            <Btn testId="forbidden-got-it" onClick={() => onAction({ kind: "forbidden_correct" })}>Got it!</Btn>
            <Btn variant="secondary" onClick={() => onAction({ kind: "forbidden_skip" })}>Skip</Btn>
            <Btn variant="danger" onClick={() => onAction({ kind: "forbidden_foul" })}>Foul</Btn>
          </div>
        </div>
      )}

      {playerView.gameId === "forbidden-clue" && !playerData.isClueGiver && phase === "clue" && (
        <p className="text-center text-lg text-zinc-400">Listen and shout guesses!</p>
      )}

      {playerView.gameId === "agent-grid" && playerData.isSpymaster && playerData.key && (
        <AgentGridBoard
          words={data.words as string[]}
          revealed={data.revealed as boolean[]}
          keyTiles={playerData.key as Array<"a" | "b" | "neutral" | "assassin">}
          spymasterView
        />
      )}

      {playerView.gameId === "agent-grid" && playerData.isSpymaster && phase === "clue" && (
        <div className="space-y-3">
          <input className="w-full rounded-xl bg-zinc-800 p-3" placeholder="Clue word" value={text} onChange={(e) => setText(e.target.value)} />
          <Btn className="w-full" onClick={() => { onAction({ kind: "agent_clue", word: text, count: 2 }); setText(""); }}>Give clue (2)</Btn>
        </div>
      )}

      {playerView.gameId === "agent-grid" && playerData.canGuess && (
        <div className="grid gap-2">
          {(data.words as string[]).map((word, i) => (
            !(data.revealed as boolean[])?.[i] && (
              <Btn key={i} testId={`agent-grid-tile-${i}`} variant="secondary" className="w-full text-base" onClick={() => onAction({ kind: "agent_guess", index: i })}>
                {word}
              </Btn>
            )
          ))}
          <Btn variant="secondary" className="w-full" onClick={() => onAction({ kind: "agent_pass" })}>End turn</Btn>
        </div>
      )}

      {playerView.gameId === "hangman-race" && phase === "playing" && (
        <div className="space-y-4">
          <p className="text-center text-3xl font-mono tracking-widest">{String(playerData.mask ?? "")}</p>
          <p className="text-center text-zinc-400">Strikes: {String(playerData.strikes ?? 0)}/6</p>
          {!(playerData.solved || playerData.lost) && (
            <>
              <div className="grid grid-cols-6 gap-2">
                {"abcdefghijklmnopqrstuvwxyz".split("").map((l) => (
                  <button key={l} type="button" data-testid={`hangman-key-${l}`} className="rounded-lg bg-zinc-700 py-2 font-bold uppercase" onClick={() => onAction({ kind: "hangman_letter", letter: l })}>
                    {l}
                  </button>
                ))}
              </div>
              <textarea className="w-full rounded-xl bg-zinc-800 p-3" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Solve whole word…" />
              <Btn className="w-full" onClick={() => { onAction({ kind: "submit_text", text }); setText(""); }}>Solve</Btn>
            </>
          )}
        </div>
      )}

      {playerView.gameId === "paddle-clash" && phase === "playing" && (
        <div className="space-y-4">
          <p className="text-center">Drag to move your paddle</p>
          <input
            type="range"
            min={0}
            max={100}
            defaultValue={50}
            className="w-full"
            data-testid="paddle-move"
            onChange={(e) => onAction({ kind: "paddle_move", y: Number(e.target.value) / 100 })}
          />
          <div className="grid grid-cols-2 gap-2">
            <Btn onClick={() => onAction({ kind: "paddle_move", y: 0.2 })}>Up</Btn>
            <Btn onClick={() => onAction({ kind: "paddle_move", y: 0.8 })}>Down</Btn>
          </div>
        </div>
      )}

      {playerView.gameId === "grid-blast" && phase === "playing" && playerData.alive && (
        <div className="grid grid-cols-3 gap-2">
          <Btn testId="grid-blast-up" onClick={() => onAction({ kind: "grid_blast_input", input: "up" })}>↑</Btn>
          <Btn testId="grid-blast-bomb" onClick={() => onAction({ kind: "grid_blast_input", input: "bomb" })}>💣</Btn>
          <Btn testId="grid-blast-down" onClick={() => onAction({ kind: "grid_blast_input", input: "down" })}>↓</Btn>
          <Btn testId="grid-blast-left" onClick={() => onAction({ kind: "grid_blast_input", input: "left" })}>←</Btn>
          <span />
          <Btn testId="grid-blast-right" onClick={() => onAction({ kind: "grid_blast_input", input: "right" })}>→</Btn>
        </div>
      )}

      {(phase === "reveal" || phase === "ended") && playerView.gameId === "last-on-the-dike" && (
        <DikeRevealTable
          room={room}
          reveal={data.reveal as DikeRevealEntry[] | undefined}
          winnerId={data.winnerId as string | undefined}
          compact
        />
      )}

      {phase === "bid" && playerView.gameId === "last-on-the-dike" && (
        <DikeBidPanel
          balance={(playerData.balance as number) ?? 0}
          eliminated={Boolean(playerData.eliminated)}
          bidSubmitted={Boolean(playerData.bidSubmitted)}
          onBid={(amount) => onAction({ kind: "dike_bid", amount })}
        />
      )}

      {(phase === "reveal" || phase === "scoreboard") && playerView.gameId !== "last-on-the-dike" && (
        <RevealBreakdown
          room={room}
          reveal={data.reveal as RevealEntry[] | undefined}
          playerAnswers={data.playerAnswers as PlayerAnswerReveal[] | undefined}
          compact
        />
      )}

      {phase === "reveal" && (data.myResult as { role: string } | undefined) && (
        <p className="text-center text-lg">
          Your role: {(data.myResult as { role: string }).role}
        </p>
      )}
    </div>
  );
}

function DikeRevealTable({
  room,
  reveal,
  winnerId,
  compact = false,
}: {
  room: RoomSnapshot;
  reveal?: DikeRevealEntry[];
  winnerId?: string;
  compact?: boolean;
}) {
  if (!reveal?.length) return null;

  return (
    <div className={`space-y-2 ${compact ? "" : "rounded-2xl bg-zinc-800/60 p-6"}`}>
      {!compact && <p className="text-center text-2xl font-bold mb-4">Round results</p>}
      <ul className="space-y-2">
        {reveal.map((entry) => {
          const player = room.players.find((p) => p.id === entry.playerId);
          return (
            <li
              key={entry.playerId}
              className={`rounded-xl px-4 py-3 flex items-center justify-between gap-3 ${
                entry.eliminated ? "bg-red-900/40" : "bg-zinc-800"
              }`}
            >
              <div>
                <span className="font-semibold">{player?.nickname ?? entry.playerId}</span>
                {entry.gotBonus && <span className="ml-2 text-yellow-400 text-sm">+bonus</span>}
                {entry.eliminated && <span className="ml-2 text-red-400 text-sm">off the dike</span>}
                {winnerId === entry.playerId && <span className="ml-2 text-yellow-400 text-sm">winner</span>}
              </div>
              <div className="text-right text-sm text-zinc-300">
                <div>Bid {entry.bid}</div>
                <div>Left {entry.balanceAfter}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DikePodium({
  room,
  winnerId,
  placement,
}: {
  room: RoomSnapshot;
  winnerId?: string;
  placement?: string[];
}) {
  const podium = [
    { label: "1st", playerId: winnerId },
    { label: "2nd", playerId: placement?.[0] },
    { label: "3rd", playerId: placement?.[1] },
  ].filter((slot) => slot.playerId);

  if (!podium.length) return null;

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {podium.map((slot) => (
        <div key={slot.label} className="rounded-xl bg-zinc-900/80 px-4 py-3">
          <p className="text-sm text-zinc-400">{slot.label}</p>
          <p className="text-lg font-bold">
            {room.players.find((p) => p.id === slot.playerId)?.nickname ?? slot.playerId}
          </p>
        </div>
      ))}
    </div>
  );
}

function DikeBidPanel({
  balance,
  eliminated,
  bidSubmitted,
  onBid,
}: {
  balance: number;
  eliminated: boolean;
  bidSubmitted: boolean;
  onBid: (amount: number) => void;
}) {
  const [amount, setAmount] = useState(0);

  if (eliminated) {
    return (
      <div className="rounded-2xl bg-red-900/30 p-6 text-center">
        <p className="text-xl font-bold">You fell off the dike</p>
        <p className="mt-2 text-zinc-400">Watch the TV for the results.</p>
      </div>
    );
  }

  if (bidSubmitted) {
    return (
      <div className="rounded-2xl bg-zinc-800/60 p-6 text-center">
        <p className="text-xl font-bold">Bid locked in</p>
        <p className="mt-2 text-zinc-400">Waiting for other walkers…</p>
      </div>
    );
  }

  const quickBids = [0, Math.floor(balance / 2), balance].filter((value, index, arr) => arr.indexOf(value) === index);

  return (
    <div className="space-y-4">
      <p className="text-center text-xl font-bold">Balance: {balance}</p>
      <input
        type="number"
        min={0}
        max={balance}
        value={amount}
        onChange={(e) => setAmount(Math.max(0, Math.min(balance, Number(e.target.value) || 0)))}
        className="w-full rounded-xl bg-zinc-800 p-4 text-2xl text-center font-bold"
      />
      <div className="grid grid-cols-3 gap-2">
        {quickBids.map((value) => (
          <Btn key={value} variant="secondary" className="text-base" onClick={() => setAmount(value)}>
            {value}
          </Btn>
        ))}
      </div>
      <Btn className="w-full" onClick={() => onBid(amount)}>
        Bid {amount}
      </Btn>
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
              data-testid={`role-sort-assign-${targetId}`}
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
        testId="role-sort-submit"
        className="w-full"
        onClick={() => onSubmit(assignments)}
        disabled={Object.keys(assignments).length < targetIds.length}
      >
        Submit assignments
      </Btn>
    </div>
  );
}
