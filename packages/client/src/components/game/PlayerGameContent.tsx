import type { DikeRevealEntry, GameAction, PlayerAnswerReveal, PlayerViewSnapshot, RevealEntry, RoomSnapshot } from "@party-games/shared";
import { ActionGrid, PhaseHeader } from "./GameShell";
import { useEffect, useState } from "react";
import { TrailDashInstructions } from "../TrailDashInstructions";
import { CurvePlayerControls } from "../CurvePlayerControls";
import { BlockStackBoard } from "../BlockStackBoard";
import { FleetDuelFleetStatus } from "../FleetDuelFleetStatus";
import { FleetDuelGrid } from "../FleetDuelGrid";
import { FleetDuelPlacement } from "../FleetDuelPlacement";
import { FourInARowBoard } from "../FourInARowBoard";
import { TicTacToeBoard } from "../TicTacToeBoard";
import { RevealBreakdown, ScoringRulesPanel } from "../RevealBreakdown";
import { TimerBar } from "../TimerBar";
import { LiveScoreBar } from "../LiveScoreBar";
import { PauseOverlay } from "../PauseOverlay";
import { SpectrumGauge } from "./SpectrumGauge";
import { ChainSketchPlayerPanel } from "./views/ChainSketchPlayerPanel";
import { DrawVotePlayerPanel } from "./views/DrawVotePanels";
import { DrawImpostorPlayerPanel } from "./views/DrawImpostorPanels";
import { connectFourMarkColors, markColorsForPlayers } from "./markColors";
import { GameButton as Btn } from "./GameButton";
import { DrawingCanvas as DrawCanvas, type StrokeInput as DrawStroke } from "./DrawingCanvas";
import { AgentGridBoard } from "./AgentGridBoard";
import { DikeBidPanel, DikeRevealTable } from "./views/DikePanels";
import { RoleSortAssign } from "./views/RoleSortAssign";
export function PlayerGameView({
  room,
  playerView,
  onAction,
}: {
  room: RoomSnapshot;
  playerView: PlayerViewSnapshot;
  onAction: (action: GameAction) => void;
}) {
  const phase = playerView.phase;
  const data = playerView.data as PlayerViewSnapshot["data"] & Record<string, any>;
  const playerData = playerView.playerData as Record<string, any>;
  const gameMeta = room.games.find((g) => g.id === playerView.gameId);
  const gameName = gameMeta?.name ?? playerView.gameId.replace(/-/g, " ");
  const scoringRules = gameMeta?.scoringRules;
  const [text, setText] = useState("");
  const [year, setYear] = useState(2000);
  const [spectrumGuess, setSpectrumGuess] = useState(50);
  const [fleetTargetId, setFleetTargetId] = useState<string | null>(null);
  const [drawTool, setDrawTool] = useState<"pen" | "eraser">("pen");
  const [drawWidth, setDrawWidth] = useState(4);

  useEffect(() => {
    setText("");
  }, [playerView.round, playerView.phase, playerView.gameId]);

  useEffect(() => {
    if (playerData.submitted) setText("");
  }, [playerData.submitted]);

  const royaleTargets = data.royaleTargets as
    | Record<string, { shots: Array<{ x: number; y: number; hit: boolean }>; sunkCells: Array<{ x: number; y: number }> }>
    | undefined;
  const targetOpponents = (data.targetOpponents as string[] | undefined) ?? [];
  const activeFleetTarget =
    fleetTargetId && targetOpponents.includes(fleetTargetId)
      ? fleetTargetId
      : (data.opponentId as string | undefined) ?? targetOpponents[0] ?? null;
  const activeTargetGrid = activeFleetTarget && royaleTargets ? royaleTargets[activeFleetTarget] : null;

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
      <div className="text-center">
        <p className="text-sm font-semibold text-zinc-300">{gameName}</p>
        <PhaseHeader phase={phase} round={playerView.round} maxRounds={playerView.maxRounds} />
      </div>

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

      {(phase === "submit" || (phase === "guessing" && !playerData.isDrawer)) && (
        <div className="space-y-3">
          {data.targetName && data.isTarget && (
            <div className="rounded-xl bg-amber-900/30 border border-amber-500/40 p-4 text-center">
              <p className="text-lg font-bold text-amber-200">You&apos;re in the hot seat!</p>
              <p className="mt-1 text-sm text-zinc-300">Everyone else is answering about you.</p>
            </div>
          )}
          {data.targetName && !data.isTarget && (
            <p className="text-center text-lg font-bold text-amber-300">{String(data.targetName)} is in the hot seat</p>
          )}
          {data.displayText && <p className="text-center text-xl font-bold">{String(data.displayText)}</p>}
          {data.prompt && data.prompt !== data.displayText && data.prompt !== data.imageCaption && (
            <p className="text-center text-xl font-bold">{String(data.prompt)}</p>
          )}
          {data.imageCaption && data.imageCaption !== data.displayText && (
            <p className="text-center text-lg text-zinc-300">{String(data.imageCaption)}</p>
          )}
          {data.category && <p className="text-center text-xl font-bold">{String(data.category)}</p>}
          {playerData.word && <p className="text-center text-2xl font-bold">{String(playerData.word)}</p>}
          {phase === "guessing" && !playerData.word && (
            <p className="text-center text-zinc-400">Watch the TV and guess the drawing!</p>
          )}
          {playerView.gameId === "fact-check" && !playerData.submitted && (
            <p className="text-center text-sm text-zinc-400">
              Write a convincing lie. Next you’ll read every answer aloud from the TV.
            </p>
          )}
          {playerView.gameId === "reverse-fact" && !playerData.submitted && (
            <p className="text-center text-sm text-zinc-400">
              Shout a question this fact answers, then type the best one.
            </p>
          )}
          {playerData.submitted ? (
            <div className="rounded-xl bg-green-900/40 border border-green-500/40 p-6 text-center">
              <p className="text-xl font-bold text-green-300">Submitted!</p>
              {playerData.mySubmission && (
                <p className="mt-2 text-zinc-300">&ldquo;{String(playerData.mySubmission)}&rdquo;</p>
              )}
              <p className="mt-2 text-sm text-zinc-400">Waiting for other players…</p>
            </div>
          ) : data.isTarget ? (
            <div className="space-y-3">
              <div className="rounded-xl bg-zinc-800/60 p-6 text-center text-zinc-300">
                <p className="text-lg">Sit tight — pick your favorite answer soon.</p>
              </div>
              <Btn variant="secondary" className="w-full" onClick={() => onAction({ kind: "hot_seat_skip" })}>
                Skip this prompt
              </Btn>
            </div>
          ) : (
            <>
              <textarea
                data-testid="player-text-input"
                className="w-full rounded-xl bg-zinc-800 p-4 text-lg"
                rows={3}
                maxLength={120}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={
                  playerView.gameId === "reverse-fact"
                    ? "Type a question this fact answers…"
                    : playerView.gameId === "fact-check"
                      ? "Type a convincing lie…"
                      : "Type your answer…"
                }
              />
              <p className="text-right text-xs text-zinc-500">{text.length}/120</p>
              <Btn testId="player-submit" onClick={() => onAction({ kind: "submit_text", text })} className="w-full">
                Submit
              </Btn>
            </>
          )}
        </div>
      )}

      {phase === "vote" && data.options && (
        <div className="grid gap-2">
          {data.discussing && !playerData.voted && (
            <p className="rounded-xl bg-amber-900/40 border border-amber-500/40 p-4 text-center text-sm text-amber-100">
              Read the answers on the TV first — you can vote whenever you’re ready.
            </p>
          )}
          {playerData.voted ? (
            <div className="rounded-xl bg-green-900/40 border border-green-500/40 p-6 text-center">
              <p className="text-xl font-bold text-green-300">Vote recorded</p>
              <p className="mt-2 text-sm text-zinc-400">Waiting for other players…</p>
            </div>
          ) : (
            (data.options as Array<{ id: string; text: string; authorId?: string | null }>).map((o) => {
              const isOwn = o.authorId === room.playerId;
              return (
                <Btn
                  key={o.id}
                  variant="secondary"
                  className={`w-full text-base text-left break-words ${isOwn ? "opacity-50" : ""}`}
                  disabled={isOwn}
                  onClick={() => onAction({ kind: "vote", optionId: o.id })}
                >
                  {o.text}{isOwn ? " (yours)" : ""}
                </Btn>
              );
            })
          )}
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
          {playerData.canVoteInMatchup === false ? (
            <div className="rounded-xl bg-zinc-800/60 p-6 text-center text-zinc-300">
              <p className="text-lg font-bold">You&apos;re in this matchup</p>
              <p className="mt-2 text-sm">Wait while others vote…</p>
            </div>
          ) : playerData.voted ? (
            <div className="rounded-xl bg-green-900/40 border border-green-500/40 p-6 text-center">
              <p className="text-xl font-bold text-green-300">Vote recorded</p>
              <p className="mt-2 text-sm text-zinc-400">Waiting for other players…</p>
            </div>
          ) : (
            <>
              {(() => {
                const a = (data.matchup as { a: { id: string; text: string; playerId?: string } }).a;
                const b = (data.matchup as { b: { id: string; text: string; playerId?: string } }).b;
                const ownId = playerData.ownSubmissionId as string | undefined;
                return (
                  <>
                    <Btn
                      className="w-full text-left break-words"
                      disabled={a?.id === ownId}
                      onClick={() => onAction({ kind: "vote_pair", winnerId: a.id })}
                    >
                      {a?.text}{a?.id === ownId ? " (your answer)" : ""}
                    </Btn>
                    <Btn
                      className="w-full text-left break-words"
                      variant="secondary"
                      disabled={b?.id === ownId}
                      onClick={() => onAction({ kind: "vote_pair", winnerId: b.id })}
                    >
                      {b?.text}{b?.id === ownId ? " (your answer)" : ""}
                    </Btn>
                  </>
                );
              })()}
            </>
          )}
        </div>
      )}

      {phase === "question" && data.mode === "quiz" && (
        <div className="space-y-3">
          {data.question && <p className="text-center text-lg font-bold">{String(data.question)}</p>}
          {playerData.answered ? (
            <div className="rounded-xl bg-green-900/40 border border-green-500/40 p-6 text-center">
              <p className="text-xl font-bold text-green-300">Answer locked in</p>
              <p className="mt-2 text-sm text-zinc-400">Waiting for other players…</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {(data.choices as string[] | undefined)?.map((c, i) => (
                <Btn key={i} testId={`player-answer-${i}`} variant="secondary" className="w-full text-base text-left" onClick={() => onAction({ kind: "trivia_answer", choiceIndex: i })}>
                  {c}
                </Btn>
              ))}
            </div>
          )}
        </div>
      )}

      {phase === "question" && data.mode === "timeline" && (
        <div className="space-y-3">
          {data.event && <p className="text-center text-xl font-bold">{String(data.event)}</p>}
          {playerData.answered ? (
            <div className="rounded-xl bg-green-900/40 border border-green-500/40 p-6 text-center">
              <p className="text-xl font-bold text-green-300">Year locked in</p>
              <p className="mt-2 text-2xl font-bold">{String(playerData.myAnswer)}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Btn variant="secondary" className="min-h-11 min-w-11 px-3" onClick={() => setYear((y) => Math.max(Number(data.minYear) || 0, y - 10))}>−10</Btn>
                <input type="range" min={data.minYear as number} max={data.maxYear as number} value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-full min-h-11" />
                <Btn variant="secondary" className="min-h-11 min-w-11 px-3" onClick={() => setYear((y) => Math.min(Number(data.maxYear) || 3000, y + 10))}>+10</Btn>
              </div>
              <p className="text-center text-4xl font-black tabular-nums">{year}</p>
              <Btn className="w-full" onClick={() => onAction({ kind: "year_slider", year })}>Lock in</Btn>
            </>
          )}
        </div>
      )}

      {phase === "question" && data.mode === "would-you-rather" && (
        <div className="grid gap-3">
          {playerData.discussing && !playerData.answered ? (
            <div className="rounded-xl bg-amber-900/40 border border-amber-500/40 p-6 text-center space-y-3">
              <p className="text-xl font-bold text-amber-200">Talk it out!</p>
              <p className="text-lg">{String(data.optionA)}</p>
              <p className="text-zinc-500">or</p>
              <p className="text-lg">{String(data.optionB)}</p>
              <p className="text-sm text-zinc-400">Voting unlocks when discussion ends.</p>
            </div>
          ) : playerData.answered ? (
            <div className="rounded-xl bg-green-900/40 border border-green-500/40 p-6 text-center">
              <p className="text-xl font-bold text-green-300">Choice locked in</p>
              <p className="mt-2 text-lg text-zinc-300">
                {playerData.myAnswer === "a" ? String(data.optionA) : String(data.optionB)}
              </p>
            </div>
          ) : (
            <ActionGrid>
              <Btn
                variant={playerData.myAnswer === "a" ? "primary" : "secondary"}
                onClick={() => onAction({ kind: "would_you_rather", choice: "a" })}
              >
                {data.optionA as string}
              </Btn>
              <Btn
                variant={playerData.myAnswer === "b" ? "primary" : "secondary"}
                onClick={() => onAction({ kind: "would_you_rather", choice: "b" })}
              >
                {data.optionB as string}
              </Btn>
            </ActionGrid>
          )}
        </div>
      )}

      {phase === "pick" && data.options && (
        <div className="grid gap-2">
          {(data.options as Array<{ id: string; text: string }>).map((o) => (
            <Btn key={o.id} variant="secondary" className="w-full" onClick={() => onAction({ kind: "hot_seat_pick", submissionId: o.id })}>
              {o.text}
            </Btn>
          ))}
          {data.isTarget && (
            <Btn variant="secondary" className="w-full" onClick={() => onAction({ kind: "hot_seat_skip" })}>
              Skip this prompt
            </Btn>
          )}
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
          powerUpMode={(playerView.data.powerUpMode as import("@party-games/shared").PowerUpMode) ?? "normal"}
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
          {data.mode === "royale" && targetOpponents.length > 1 && (
            <div className="flex flex-wrap justify-center gap-2">
              {targetOpponents.map((id) => {
                const nick = room.players.find((p) => p.id === id)?.nickname ?? id;
                const selected = activeFleetTarget === id;
                return (
                  <button
                    key={id}
                    type="button"
                    className={`rounded-lg px-3 py-1 text-sm font-semibold ${selected ? "bg-violet-600 text-white" : "bg-zinc-800 text-zinc-300"}`}
                    onClick={() => setFleetTargetId(id)}
                  >
                    {nick}
                  </button>
                );
              })}
            </div>
          )}
          <p className="text-center text-sm text-zinc-400">
            {phase === "fire" ? "Pick a target cell" : playerData.myTurn ? "Your turn — fire!" : "Waiting for opponent…"}
          </p>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-center text-sm font-semibold text-zinc-300">Your waters</p>
              <div className="flex justify-center">
                <FleetDuelGrid
                  size={(data.gridSize as number) ?? 10}
                  ships={(playerData.fleet as import("@party-games/shared").Ship[]) ?? []}
                  shots={(playerData.incomingShots as Array<{ x: number; y: number; hit: boolean }>) ?? []}
                  showShips
                  disabled
                />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-center text-sm font-semibold text-zinc-300">
                Enemy waters
                {activeFleetTarget && (
                  <span className="text-zinc-500">
                    {" "}
                    — {room.players.find((p) => p.id === activeFleetTarget)?.nickname ?? "?"}
                  </span>
                )}
              </p>
              <div className="flex justify-center">
                <FleetDuelGrid
                  size={(data.gridSize as number) ?? 10}
                  shots={
                    activeTargetGrid?.shots ??
                    (playerData.opponentShots as Array<{ x: number; y: number; hit: boolean }>) ??
                    []
                  }
                  sunkCells={
                    activeTargetGrid?.sunkCells ??
                    (playerData.opponentSunkCells as Array<{ x: number; y: number }>) ??
                    []
                  }
                  disabled={phase === "battle" ? !playerData.myTurn : !activeFleetTarget}
                  onCellClick={(x, y) => {
                    if (!activeFleetTarget) return;
                    onAction({
                      kind: "fleet_duel_fire",
                      x,
                      y,
                      targetId: activeFleetTarget,
                    });
                  }}
                />
              </div>
            </div>
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

      {(phase === "playing" || phase === "match_end" || phase === "ended") && playerView.gameId === "four-in-a-row" && (
        <div className="space-y-4">
          {phase === "ended" && data.winnerId && (
            <p className="text-center text-2xl font-bold text-yellow-400">
              {data.winnerId === room.playerId
                ? "You win!"
                : `${room.players.find((p) => p.id === data.winnerId)?.nickname ?? "Opponent"} wins!`}
            </p>
          )}
          {playerData.inMatch || phase === "ended" ? (
            <>
              <FourInARowBoard
                board={(data.board as import("@party-games/shared").CfCell[][]) ?? []}
                disabled={phase !== "playing" && phase !== "match_end" ? true : !playerData.myTurn}
                markColors={connectFourMarkColors(room, data.players)}
                highlightedCells={data.winningCells as Array<{ row: number; col: number }> | undefined}
                onColumnClick={(column) => onAction({ kind: "four_in_a_row_drop", column })}
              />
              {phase !== "ended" && (
                <p className="text-center text-sm text-zinc-400">
                  {playerData.myTurn ? "Your turn" : "Waiting…"}
                </p>
              )}
            </>
          ) : (
            <p className="text-center text-lg">Watch the TV!</p>
          )}
        </div>
      )}

      {(phase === "playing" || phase === "match_end" || phase === "ended") && playerView.gameId === "tic-tac-toe" && (
        <div className="space-y-4">
          {phase === "ended" && data.championId && (
            <p className="text-center text-2xl font-bold text-yellow-400">
              {data.championId === room.playerId
                ? "You win!"
                : `${room.players.find((p) => p.id === data.championId)?.nickname ?? "Opponent"} wins!`}
            </p>
          )}
          {data.inMatch || phase === "ended" ? (
            <>
              <TicTacToeBoard
                board={((data.match as { board: import("@party-games/shared").Cell[] })?.board) ?? []}
                disabled={phase !== "playing" && phase !== "match_end" ? true : !playerData.myTurn}
                myMark={(playerData.mark as "x" | "o") ?? null}
                winningCells={data.winningCells as number[] | undefined}
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
              {phase !== "ended" && (
                <p className="text-center text-sm text-zinc-400">
                  {playerData.myTurn ? "Your turn" : "Waiting…"}
                </p>
              )}
            </>
          ) : (
            <p className="text-center text-lg">Watch the TV — your match is coming up!</p>
          )}
        </div>
      )}

      {phase === "playing" && data.letters && !playerView.gameId.includes("curve") && (
        <div className="space-y-3">
          <div className="flex justify-center gap-2">
            {(data.letters as string[]).map((l, i) => (
              <span key={`${l}-${i}`} className="rounded-lg bg-violet-600 px-4 py-2 text-2xl font-black">{l}</span>
            ))}
          </div>
          {playerData.submitted ? (
            <div className="rounded-xl bg-green-900/40 border border-green-500/40 p-6 text-center">
              <p className="text-xl font-bold text-green-300">Submitted!</p>
              {playerData.myWord && (
                <p className="mt-2 text-2xl font-bold">&ldquo;{String(playerData.myWord)}&rdquo;</p>
              )}
              <p className="mt-2 text-sm text-zinc-400">Waiting for other players…</p>
            </div>
          ) : (
            <>
              <textarea
                data-testid="player-text-input"
                className="w-full rounded-xl bg-zinc-800 p-4 text-lg"
                rows={2}
                maxLength={120}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type a word…"
              />
              <p className="text-right text-xs text-zinc-500">{text.length}/120</p>
              <Btn testId="player-submit" onClick={() => onAction({ kind: "submit_text", text })} className="w-full">
                Submit
              </Btn>
            </>
          )}
        </div>
      )}

      {phase === "assign" && data.roles && data.players && (
        playerData.assigned ? (
          <div className="rounded-xl bg-green-900/40 border border-green-500/40 p-6 text-center">
            <p className="text-xl font-bold text-green-300">Assignments submitted!</p>
            <p className="mt-2 text-sm text-zinc-400">Waiting for other players…</p>
          </div>
        ) : (
          <RoleSortAssign
            roles={data.roles as string[]}
            targetIds={(data.players as string[])}
            room={room}
            onSubmit={(assignments) => onAction({ kind: "assign_role", assignments })}
          />
        )
      )}

      {phase === "drawing" && !playerData.word && (
        <div className="rounded-xl bg-zinc-800/60 p-6 text-center text-zinc-300">
          <p className="text-lg">
            {room.players.find((p) => p.id === (playerData.drawerId as string | undefined))?.nickname ?? "Someone"} is drawing…
          </p>
          <p className="mt-2 text-sm">Look at the TV!</p>
        </div>
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
          <Btn variant="secondary" className="w-full" onClick={() => onAction({ kind: "advance" })}>Done drawing</Btn>
        </div>
      )}

      {phase === "draw" && playerView.gameId === "chain-sketch" && (
        <ChainSketchPlayerPanel
          room={room}
          phase={phase}
          playerData={playerData}
          text={text}
          setText={setText}
          drawTool={drawTool}
          setDrawTool={setDrawTool}
          drawWidth={drawWidth}
          setDrawWidth={setDrawWidth}
          onAction={onAction}
          DrawCanvas={DrawCanvas}
          Btn={Btn}
        />
      )}

      {phase === "guess" && playerView.gameId === "chain-sketch" && (
        <ChainSketchPlayerPanel
          room={room}
          phase={phase}
          playerData={playerData}
          text={text}
          setText={setText}
          drawTool={drawTool}
          setDrawTool={setDrawTool}
          drawWidth={drawWidth}
          setDrawWidth={setDrawWidth}
          onAction={onAction}
          DrawCanvas={DrawCanvas}
          Btn={Btn}
        />
      )}

      {phase === "vote" && playerView.gameId === "chain-sketch" && (
        <ChainSketchPlayerPanel
          room={room}
          phase={phase}
          playerData={playerData}
          text={text}
          setText={setText}
          drawTool={drawTool}
          setDrawTool={setDrawTool}
          drawWidth={drawWidth}
          setDrawWidth={setDrawWidth}
          onAction={onAction}
          DrawCanvas={DrawCanvas}
          Btn={Btn}
        />
      )}

      {(phase === "drawing" || phase === "vote") && playerView.gameId === "draw-vote" && (
        <DrawVotePlayerPanel
          phase={phase}
          data={data}
          playerData={playerData}
          drawTool={drawTool}
          setDrawTool={setDrawTool}
          drawWidth={drawWidth}
          setDrawWidth={setDrawWidth}
          onAction={onAction}
          DrawCanvas={DrawCanvas}
          Btn={Btn}
        />
      )}

      {phase === "drawing" && playerView.gameId === "draw-impostor" && (
        <DrawImpostorPlayerPanel
          phase={phase}
          playerData={playerData}
          drawTool={drawTool}
          setDrawTool={setDrawTool}
          drawWidth={drawWidth}
          setDrawWidth={setDrawWidth}
          onAction={onAction}
          DrawCanvas={DrawCanvas}
          Btn={Btn}
        />
      )}

      {phase === "draw" && playerView.gameId !== "chain-sketch" && playerData.isActive && playerData.prompt && (
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

      {phase === "guess" && playerView.gameId !== "chain-sketch" && playerData.isActive && playerData.prompt && (
        <div className="space-y-3">
          <p className="text-center text-lg text-zinc-400">What is this?</p>
          <textarea className="w-full rounded-xl bg-zinc-800 p-4 text-lg" rows={2} value={text} onChange={(e) => setText(e.target.value)} />
          <Btn className="w-full" onClick={() => { onAction({ kind: "submit_text", text }); setText(""); }}>Submit guess</Btn>
        </div>
      )}

      {phase === "vote" && data.scenario && playerView.gameId === "split-the-room" && (
        <div className="space-y-3">
          <p className="text-center text-xl font-bold">{(data.scenario as { text: string }).text}</p>
          {playerData.voted ? (
            <div className="rounded-xl bg-green-900/40 border border-green-500/40 p-6 text-center">
              <p className="text-xl font-bold text-green-300">Vote recorded</p>
              <p className="mt-2 text-sm text-zinc-400">Waiting for other players…</p>
            </div>
          ) : (
            <>
              <Btn testId="split-vote-a" className="w-full" onClick={() => onAction({ kind: "split_vote", side: "a" })}>
                {(data.scenario as { labelA: string }).labelA}
              </Btn>
              <Btn testId="split-vote-b" className="w-full" variant="secondary" onClick={() => onAction({ kind: "split_vote", side: "b" })}>
                {(data.scenario as { labelB: string }).labelB}
              </Btn>
            </>
          )}
        </div>
      )}

      {(phase === "reveal" || phase === "scoreboard") && playerView.gameId === "split-the-room" && data.scenario && (
        <div className="rounded-xl bg-zinc-800/60 p-6 text-center space-y-2">
          {data.voteCounts && (
            <p className="text-lg">
              A: {(data.voteCounts as { a: number }).a} · B: {(data.voteCounts as { b: number }).b}
            </p>
          )}
          {playerData.wonRound ? (
            <p className="text-xl font-bold text-green-300">+{String(data.myPoints ?? 1000)} minority bonus!</p>
          ) : playerData.voted ? (
            <p className="text-zinc-400">You were with the majority this round.</p>
          ) : null}
        </div>
      )}

      {playerView.gameId === "team-charades" && phase === "acting" && !playerData.word && (
        <div className="rounded-xl bg-zinc-800/60 p-6 text-center text-zinc-300">
          <p className="text-lg font-bold">
            {room.players.find((p) => p.id === (data.actorId as string | undefined))?.nickname ?? "Someone"} is acting
          </p>
          {playerData.team && (
            <p className="mt-1 text-sm text-violet-300">You&apos;re on Team {String(playerData.team)}</p>
          )}
          <p className="mt-2 text-sm">Shout your guesses!</p>
        </div>
      )}
      {phase === "clue" && playerView.gameId === "spectrum" && playerData.isClueGiver && (
        <div className="space-y-3">
          <SpectrumGauge
            left={(data.pair as { left: string; right: string })?.left}
            right={(data.pair as { left: string; right: string })?.right}
            target={playerData.target as number | undefined}
            showTarget={playerData.target !== undefined}
          />
          {playerData.clueSubmitted ? (
            <div className="rounded-xl bg-green-900/40 border border-green-500/40 p-6 text-center">
              <p className="text-xl font-bold text-green-300">Clue submitted!</p>
              <p className="mt-2 text-sm text-zinc-400">Waiting for guesses…</p>
            </div>
          ) : (
            <>
              <textarea className="w-full rounded-xl bg-zinc-800 p-4 text-lg" rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Your clue…" />
              <Btn className="w-full" onClick={() => { onAction({ kind: "submit_text", text }); setText(""); }}>Submit clue</Btn>
            </>
          )}
        </div>
      )}

      {phase === "clue" && playerView.gameId === "spectrum" && !playerData.isClueGiver && (
        <div className="rounded-xl bg-zinc-800/60 p-6 text-center text-zinc-300">
          <p className="text-lg">Waiting for the clue giver…</p>
        </div>
      )}

      {phase === "guess" && playerView.gameId === "spectrum" && !playerData.isClueGiver && (
        <div className="space-y-4">
          <SpectrumGauge
            left={(data.pair as { left: string; right: string })?.left}
            right={(data.pair as { left: string; right: string })?.right}
            interactive={!playerData.guessed}
            value={spectrumGuess}
            onChange={setSpectrumGuess}
          />
          <p className="text-center text-lg font-bold">{String(data.clue ?? "")}</p>
          {playerData.guessed ? (
            <div className="rounded-xl bg-green-900/40 border border-green-500/40 p-6 text-center">
              <p className="text-xl font-bold text-green-300">Locked in!</p>
            </div>
          ) : (
            <Btn testId="spectrum-lock-in" className="w-full" onClick={() => onAction({ kind: "spectrum_guess", value: spectrumGuess })}>Lock in</Btn>
          )}
        </div>
      )}

      {(phase === "reveal" || phase === "scoreboard") && playerView.gameId === "crowd-call" && (
        <div className="rounded-xl bg-zinc-800/60 p-6 text-center space-y-2">
          {playerData.predictedCorrect && (
            <p className="text-xl font-bold text-emerald-400">You read the room! +1000</p>
          )}
          {playerData.predictedTieBonus && !playerData.predictedCorrect && (
            <p className="text-xl font-bold text-amber-400">Split crowd — shared prediction bonus</p>
          )}
          {playerData.roundPoints !== undefined && (
            <p className="text-lg text-zinc-300">Round total: {String(playerData.roundPoints)} pts</p>
          )}
        </div>
      )}

      {phase === "predict" && data.question && (
        <div className="grid gap-2">
          <p className="text-center text-sm font-semibold text-violet-300">Predict what the crowd will pick</p>
          {playerData.predicted ? (
            <div className="rounded-xl bg-green-900/40 border border-green-500/40 p-6 text-center">
              <p className="text-xl font-bold text-green-300">Prediction locked in</p>
              <p className="mt-2 text-zinc-300">
                {((data.question as { choices: string[] }).choices ?? [])[Number(playerData.myPrediction)]}
              </p>
            </div>
          ) : (
            ((data.question as { choices: string[] }).choices ?? []).map((c, i) => (
              <Btn key={i} testId={`crowd-call-option-${i}`} variant="secondary" className="w-full text-base" onClick={() => onAction({ kind: "crowd_predict", choiceIndex: i })}>
                {c}
              </Btn>
            ))
          )}
        </div>
      )}

      {phase === "answer" && data.question && (
        <div className="grid gap-2">
          <p className="text-center text-sm font-semibold text-emerald-300">Now pick your own answer</p>
          {playerData.answered ? (
            <div className="rounded-xl bg-green-900/40 border border-green-500/40 p-6 text-center">
              <p className="text-xl font-bold text-green-300">Answer locked in</p>
              <p className="mt-2 text-zinc-300">
                {((data.question as { choices: string[] }).choices ?? [])[Number(playerData.myAnswer)]}
              </p>
            </div>
          ) : (
            ((data.question as { choices: string[] }).choices ?? []).map((c, i) => (
              <Btn key={i} testId={`crowd-call-option-${i}`} variant="secondary" className="w-full text-base" onClick={() => onAction({ kind: "crowd_answer", choiceIndex: i })}>
                {c}
              </Btn>
            ))
          )}
        </div>
      )}

      {phase === "guessing" && playerData.isDrawer && (
        <div className="rounded-xl bg-zinc-800/60 p-6 text-center text-zinc-300">
          <p className="text-lg font-bold">You&apos;re the drawer</p>
          <p className="mt-2 text-sm">Others are guessing your drawing…</p>
        </div>
      )}

      {phase === "rate" && playerData.noAnswers && (
        <p className="text-center text-zinc-400">No answers this round.</p>
      )}

      {phase === "rate" && playerData.toRate && (
        <div className="space-y-4">
          {(playerData.toRate as Array<{ id: string; text: string }>).map((sub) => (
            <div key={sub.id} className="rounded-xl bg-zinc-800 p-4 space-y-2">
              <p>{sub.text}</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((stars) => {
                  const selected = Number((playerData.myRatings as Record<string, number> | undefined)?.[sub.id] ?? 0) >= stars;
                  return (
                    <button
                      key={stars}
                      type="button"
                      data-testid={`star-rate-${stars}`}
                      className={`text-2xl ${selected ? "text-amber-400" : "text-zinc-600"}`}
                      onClick={() => onAction({ kind: "star_rate", submissionId: sub.id, stars })}
                    >
                      ★
                    </button>
                  );
                })}
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
          {phase === "questioning" && (
            <p className="text-center text-zinc-400">Discuss and ask questions out loud. Accusations open when the timer ends.</p>
          )}
          {phase === "accusation" && playerData.isSpy && playerData.itemList && (
            <div className="grid gap-2">
              {(playerData.itemList as string[]).map((item, i) => (
                <Btn key={item} className="w-full text-base" onClick={() => onAction({ kind: "impostor_guess", itemIndex: i })}>
                  Guess: {item}
                </Btn>
              ))}
            </div>
          )}
          {phase === "accusation" && data.playerIds && !playerData.isSpy && (
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

      {phase === "ended" && (playerView.gameId === "forbidden-clue" || playerView.gameId === "team-charades") && (
        <div className="rounded-xl bg-zinc-800/60 p-6 text-center">
          <p className="text-lg font-bold">Game over</p>
          <p className="mt-2 text-violet-300 font-mono">
            {room.gameScores[room.playerId ?? ""] ?? 0} points this game
          </p>
        </div>
      )}

      {playerView.gameId === "agent-grid" && (playerData.teamLabel || playerData.roleLabel) && (
        <p className="text-center text-lg font-bold text-violet-300">
          {String(playerData.teamLabel ?? "")}{playerData.roleLabel ? ` · ${String(playerData.roleLabel)}` : ""}
        </p>
      )}

      {playerView.gameId === "agent-grid" && playerData.waitingForClue && (
        <div className="rounded-xl bg-zinc-800/60 p-6 text-center text-zinc-300 space-y-2">
          <p className="text-lg">Waiting for your spymaster&apos;s clue…</p>
          <AgentGridBoard
            words={data.words as string[]}
            revealed={data.revealed as boolean[]}
            keyTiles={playerData.tileKey as Array<"a" | "b" | "neutral" | "assassin" | undefined>}
          />
        </div>
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
        <div className="space-y-3">
          {data.currentClue && (
            <p className="text-center text-lg font-bold">
              Clue: {(data.currentClue as { word: string; count: number }).word} · {(data.currentClue as { word: string; count: number }).count}
              <span className="block text-sm font-normal text-zinc-400">
                {String(data.guessesRemaining ?? 0)} guesses left
              </span>
            </p>
          )}
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
        </div>
      )}

      {playerView.gameId === "hangman-race" && phase === "playing" && (
        <div className="space-y-4">
          <p className="text-center text-3xl font-mono tracking-widest">{String(playerData.mask ?? "")}</p>
          <p className="text-center text-zinc-400">Strikes: {String(playerData.strikes ?? 0)}/6</p>
          {!(playerData.solved || playerData.lost) && (
            <>
              <div className="grid grid-cols-6 gap-2">
                {"abcdefghijklmnopqrstuvwxyz".split("").map((l) => {
                  const used = ((playerData.guessedLetters as string[]) ?? []).includes(l);
                  return (
                  <button key={l} type="button" data-testid={`hangman-key-${l}`} disabled={used} className={`rounded-lg py-2 font-bold uppercase ${used ? "bg-zinc-900 text-zinc-600" : "bg-zinc-700"}`} onClick={() => onAction({ kind: "hangman_letter", letter: l })}>
                    {l}
                  </button>
                  );
                })}
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

      {playerView.gameId === "paddle-clash" && phase === "ended" && (
        <div className="rounded-2xl bg-zinc-800/60 p-8 text-center space-y-3">
          {playerData.won && <p className="text-2xl font-bold text-yellow-400">You won!</p>}
          {playerData.lost && <p className="text-2xl font-bold text-zinc-300">You lost</p>}
          <p className="text-lg text-zinc-400">
            Final score: {String(playerData.myScore ?? 0)}–{String(playerData.opponentScore ?? 0)}
          </p>
        </div>
      )}

      {playerView.gameId === "grid-blast" && phase === "playing" && playerData.alive && (
        <div className="space-y-3">
          <p className="text-center text-sm text-zinc-400">
            💣 {String(playerData.maxBombs ?? 1)} · 🔥 range {String(playerData.blastRange ?? 2)}
            {playerData.canKick ? " · kick enabled" : ""}
          </p>
          <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
            <span />
            <Btn testId="grid-blast-up" className="min-h-11" onClick={() => onAction({ kind: "grid_blast_input", input: "up" })}>↑</Btn>
            <span />
            <Btn testId="grid-blast-left" className="min-h-11" onClick={() => onAction({ kind: "grid_blast_input", input: "left" })}>←</Btn>
            <Btn testId="grid-blast-bomb" className="min-h-11 text-xl" onClick={() => onAction({ kind: "grid_blast_input", input: "bomb" })}>💣</Btn>
            <Btn testId="grid-blast-right" className="min-h-11" onClick={() => onAction({ kind: "grid_blast_input", input: "right" })}>→</Btn>
            <span />
            <Btn testId="grid-blast-down" className="min-h-11" onClick={() => onAction({ kind: "grid_blast_input", input: "down" })}>↓</Btn>
            <span />
          </div>
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
        <>
          {(data.playerAnswers as PlayerAnswerReveal[] | undefined)?.length ? (
            <RevealBreakdown
              room={room}
              reveal={data.reveal as RevealEntry[] | undefined}
              playerAnswers={data.playerAnswers as PlayerAnswerReveal[] | undefined}
              compact
            />
          ) : phase === "reveal" && data.mode === "quiz" && data.correctIndex !== undefined ? (
            <div className="rounded-xl bg-zinc-800/60 p-6 text-center space-y-2">
              <p className="text-lg text-zinc-400">You didn&apos;t answer</p>
              <p className="text-xl font-bold">
                Correct: {(data.choices as string[] | undefined)?.[data.correctIndex as number] ?? "—"}
              </p>
            </div>
          ) : phase === "reveal" && data.mode === "would-you-rather" && data.wyrDilemma ? (
            <div className="rounded-xl bg-zinc-800/60 p-6 text-center space-y-2">
              <p className="text-lg text-zinc-400">No votes this round</p>
              <p className="text-xl font-bold">{String(data.wyrDilemma)}</p>
            </div>
          ) : null}
        </>
      )}

      {phase === "reveal" && (data.myResult as { role: string } | undefined) && (
        <p className="text-center text-lg">
          Your role: {(data.myResult as { role: string }).role}
        </p>
      )}
    </div>
  );
}

