import type { DikeRevealEntry, HostViewSnapshot, PlayerAnswerReveal, RevealEntry, RoomSnapshot } from "@party-games/shared";
import { PhaseHeader, TvGameShell } from "./GameShell";
import { CurveArena } from "../CurveArena";
import { TrailDashInstructions } from "../TrailDashInstructions";
import { BlockStackArena } from "../BlockStackArena";
import { FleetDuelArena } from "../FleetDuelArena";
import { FourInARowBoard } from "../FourInARowBoard";
import { TicTacToeBoard } from "../TicTacToeBoard";
import { RevealBreakdown, ScoringRulesPanel } from "../RevealBreakdown";
import { ScoringPhase } from "../ScoringPhase";
import { TimerBar } from "../TimerBar";
import { PaddleClashArena } from "../PaddleClashArena";
import { GridBlastArena } from "../GridBlastArena";
import { SpectrumGauge } from "./SpectrumGauge";
import { ChainSketchHostPanel } from "./views/ChainSketchHostPanel";
import { DrawVoteHostPanel } from "./views/DrawVotePanels";
import { DrawImpostorHostPanel } from "./views/DrawImpostorPanels";
import { connectFourMarkColors, markColorsForPlayers } from "./markColors";
import { DrawingCanvas as DrawCanvas, type StrokeInput as DrawStroke } from "./DrawingCanvas";
import { AgentGridBoard } from "./AgentGridBoard";
import { DikePodium, DikeRevealTable } from "./views/DikePanels";
export function HostGameView({
  room,
  hostView,
}: {
  room: RoomSnapshot;
  hostView: HostViewSnapshot;
}) {
  const data = hostView.data as HostViewSnapshot["data"] & Record<string, any>;
  const phase = hostView.phase;
  const gameMeta = room.games.find((g) => g.id === hostView.gameId);
  const gameName = gameMeta?.name ?? hostView.gameId.replace(/-/g, " ");
  const scoringRules = gameMeta?.scoringRules;

  const isTrailDash = hostView.gameId === "trail-dash";
  const isTrailDashPlaying = isTrailDash && phase === "playing";

  return (
    <TvGameShell>
    <div
      data-testid="host-game-view"
      className={`mx-auto w-full max-w-full space-y-6 ${
        isTrailDashPlaying ? "max-w-6xl p-4" : "max-w-5xl p-6"
      }`}
    >
      <header className={`space-y-4 min-w-0 ${isTrailDashPlaying ? "px-2" : ""}`}>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-3xl font-black">{gameName}</h2>
            {room.activeGameOptions?.contentRating === "mature" && (
              <span className="rounded-full bg-red-600/90 px-3 py-1 text-sm font-bold uppercase tracking-wide">
                18+
              </span>
            )}
          </div>
          <PhaseHeader
            phase={phase}
            round={hostView.round}
            maxRounds={hostView.maxRounds}
            variant="host"
          />
        </div>
        {hostView.timerEndsAt && (
          <TimerBar
            endsAt={hostView.timerEndsAt}
            totalMs={hostView.timerTotalMs}
            size="host"
          />
        )}
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
            {hostView.gameId === "paddle-clash" && (
              <p className="mt-2 text-zinc-400">Drag your paddle on your phone — first to 7 points wins!</p>
            )}
            {hostView.gameId === "tic-tac-toe" && (
              <p className="mt-2 text-zinc-400">Get three in a row to win!</p>
            )}
            {hostView.gameId !== "last-on-the-dike" &&
              hostView.gameId !== "trail-dash" &&
              hostView.gameId !== "paddle-clash" &&
              hostView.gameId !== "tic-tac-toe" && (
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

      {phase === "assign" && hostView.gameId === "role-sort" && (
        <div className="rounded-2xl bg-zinc-800/60 p-8 text-center space-y-4">
          <p className="text-2xl font-bold">{String(data.category)}</p>
          <p className="text-zinc-400">Sort everyone into these roles on your phone:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {(data.roles as string[]).map((role) => (
              <span key={role} className="rounded-lg bg-violet-600/40 px-4 py-2 text-lg font-semibold">{role}</span>
            ))}
          </div>
          <p className="text-zinc-400">
            Submitted: {String(data.assignmentCount ?? 0)}/{String(data.playerCount ?? room.players.length)}
          </p>
          <ul className="mx-auto max-w-md space-y-2 text-left">
            {room.players.map((player) => {
              const submitted = ((data.submittedPlayerIds as string[] | undefined) ?? []).includes(player.id);
              return (
                <li key={player.id} className="flex items-center justify-between rounded-xl bg-zinc-700/80 px-4 py-2">
                  <span>{player.nickname}</span>
                  <span className={submitted ? "text-green-400" : "text-zinc-500"}>{submitted ? "✓" : "…"}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {(phase === "submit" || phase === "question" || phase === "pick") && (
        <div className="rounded-2xl bg-zinc-800/60 p-8 text-center">
          {data.targetName && (
            <p className="mb-4 text-xl font-bold text-amber-300">{String(data.targetName)} is in the hot seat</p>
          )}
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
            <>
              {data.wyrDilemma && (
                <p className="mt-4 text-2xl font-bold">{String(data.wyrDilemma)}</p>
              )}
              <p className="mt-6 text-xl text-zinc-400">Vote on your phone!</p>
            </>
          ) : (
            <>
              {data.optionA && data.optionB && (
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-blue-600/30 p-6 text-xl">{data.optionA as string}</div>
                  <div className="rounded-xl bg-orange-600/30 p-6 text-xl">{data.optionB as string}</div>
                </div>
              )}
              {data.discussing && (
                <p className="mt-6 text-2xl font-bold text-amber-300">Discuss with the room — vote on your phone when this ends.</p>
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
          {phase === "pick" && data.submissions && (
            <ul className="mt-6 space-y-2 text-left">
              {(data.submissions as Array<{ id: string; text: string }>).map((s) => (
                <li key={s.id} className="rounded-xl bg-zinc-700/80 px-4 py-3 text-lg">{s.text}</li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-zinc-400">
            {phase === "pick"
              ? "Waiting for the hot seat player to pick…"
              : `Waiting for players… (${String(data.submitCount ?? data.answerCount ?? 0)}/${String(data.playerCount ?? room.players.length)})`}
          </p>
        </div>
      )}

      {phase === "playing" && hostView.gameId === "word-rush" && data.letters && (
        <div className="rounded-2xl bg-zinc-800/60 p-8 text-center">
          <div className="flex justify-center gap-2">
            {(data.letters as string[]).map((l, i) => (
              <span key={`${l}-${i}`} className="rounded-lg bg-violet-600 px-4 py-2 text-2xl font-black">{l}</span>
            ))}
          </div>
          <p className="mt-4 text-zinc-400">
            Waiting for players… ({String(data.submitCount ?? 0)})
          </p>
        </div>
      )}

      {phase === "vote" && data.options && !data.submissions && (
        <div className="rounded-2xl bg-zinc-800/60 p-8 text-center space-y-4">
          {data.displayText && <p className="text-3xl font-bold">{String(data.displayText)}</p>}
          {data.discussing && (
            <p className="text-2xl font-bold text-amber-300">
              Read these aloud — then vote on your phones.
            </p>
          )}
          <ul className="mx-auto grid max-w-3xl gap-3 text-left sm:grid-cols-2">
            {(data.options as Array<{ id: string; text: string }>).map((o) => (
              <li key={o.id} className="rounded-xl bg-zinc-700/80 px-4 py-4 text-xl">
                {o.text}
              </li>
            ))}
          </ul>
          <p className="text-zinc-400">
            Waiting for players… ({String(data.voteCount ?? 0)}/{String(data.playerCount ?? room.players.length)})
          </p>
        </div>
      )}

      {phase === "vote" && data.submissions && !data.options && (
        <div className="rounded-2xl bg-zinc-800/60 p-8 text-center space-y-4">
          {data.prompt && <p className="text-2xl font-bold">{String(data.prompt)}</p>}
          {data.imageCaption && data.imageCaption !== data.prompt && (
            <p className="text-lg text-zinc-300">{String(data.imageCaption)}</p>
          )}
          <ul className="space-y-2 text-left">
            {(data.submissions as Array<{ id: string; text: string }>).map((s) => (
              <li key={s.id} className="rounded-xl bg-zinc-700/80 px-4 py-3 text-lg">{s.text}</li>
            ))}
          </ul>
          <p className="text-zinc-400">Vote on your phone!</p>
        </div>
      )}

      {phase === "vote" && data.options && (
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
        <div className="space-y-3">
          <p className="text-center text-sm text-zinc-400">
            Matchup {(data.matchup as { index?: number }).index !== undefined ? (data.matchup as { index: number }).index + 1 : ""}
            {(data.matchup as { total?: number }).total ? ` / ${(data.matchup as { total: number }).total}` : ""}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-pink-600/30 p-8 text-center text-2xl font-bold">
              {(data.matchup as { a: { text: string }; b: { text: string } }).a?.text}
            </div>
            <div className="rounded-2xl bg-cyan-600/30 p-8 text-center text-2xl font-bold">
              {(data.matchup as { a: { text: string }; b: { text: string } }).b?.text}
            </div>
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

      {(phase === "playing" || phase === "match_end" || phase === "ended") && hostView.gameId === "four-in-a-row" && data.board && (
        <div className="flex flex-col items-center gap-4">
          {phase === "ended" && data.winnerId && (
            <p className="text-center text-3xl font-bold text-yellow-400">
              {room.players.find((p) => p.id === data.winnerId)?.nickname ?? "Someone"} wins!
            </p>
          )}
          <FourInARowBoard
            board={data.board as import("@party-games/shared").CfCell[][]}
            markColors={connectFourMarkColors(room, data.players)}
            highlightedCells={data.winningCells as Array<{ row: number; col: number }> | undefined}
          />
          {phase !== "ended" && data.currentTurn && (
            <p className="text-xl">
              Turn: {room.players.find((p) => p.id === data.currentTurn)?.nickname}
            </p>
          )}
        </div>
      )}

      {(phase === "playing" || phase === "match_end" || phase === "ended") && hostView.gameId === "tic-tac-toe" && data.match && (
        <div className="flex flex-col items-center gap-4">
          {phase === "ended" && data.championId && (
            <p className="text-center text-3xl font-bold text-yellow-400">
              {room.players.find((p) => p.id === data.championId)?.nickname ?? "Someone"} wins!
            </p>
          )}
          <TicTacToeBoard
            board={(data.match as { board: import("@party-games/shared").Cell[] }).board}
            disabled
            winningCells={data.winningCells as number[] | undefined}
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
          {phase !== "ended" && (
            <p className="text-lg text-zinc-400">
              {(data.match as { xPlayer: string | null }).xPlayer &&
                `${room.players.find((p) => p.id === (data.match as { xPlayer: string }).xPlayer)?.nickname ?? "?"} (✕) vs ${room.players.find((p) => p.id === (data.match as { oPlayer: string }).oPlayer)?.nickname ?? "?"} (○)`}
            </p>
          )}
        </div>
      )}

      {(phase === "drawing" || phase === "guessing" || phase === "draw") && data.strokes && (
        <DrawCanvas strokes={data.strokes as DrawStroke[]} readOnly />
      )}

      {hostView.gameId === "team-charades" && phase === "acting" && data.actorId && (
        <div className="rounded-2xl bg-zinc-800/60 p-8 text-center space-y-4">
          <p className="text-3xl font-bold">
            {room.players.find((p) => p.id === data.actorId)?.nickname ?? "?"} is acting
          </p>
          <p className="text-xl text-zinc-300">Shout your guesses!</p>
          <p className="text-zinc-400">{String(data.correct ?? 0)} words guessed this round</p>
          {data.teamsMode && data.teamScores && (
            <div className="flex justify-center gap-6 text-lg">
              <span className="text-violet-300">Team A: {String((data.teamScores as { A?: number }).A ?? 0)}</span>
              <span className="text-cyan-300">Team B: {String((data.teamScores as { B?: number }).B ?? 0)}</span>
            </div>
          )}
        </div>
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
          <SpectrumGauge
            left={(data.pair as { left: string }).left}
            right={(data.pair as { right: string }).right}
            target={data.target as number | undefined}
            guesses={data.guesses as Record<string, number> | undefined}
            showTarget={data.target !== undefined}
          />
          {data.clue && <p className="text-center text-2xl">Clue: {String(data.clue)}</p>}
          {data.guesses && (
            <ul className="space-y-1 text-center text-zinc-300">
              {Object.entries(data.guesses as Record<string, number>).map(([pid]) => (
                <li key={pid}>
                  {room.players.find((p) => p.id === pid)?.nickname ?? pid}
                  {(data.lastRoundScores as Record<string, number> | undefined)?.[pid] !== undefined && (
                    <span className="text-emerald-400"> (+{(data.lastRoundScores as Record<string, number>)[pid]} pts)</span>
                  )}
                </li>
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

      {hostView.gameId === "star-rate" && data.prompt && phase !== "submit" && (
        <div className="rounded-2xl bg-zinc-800/60 p-8 text-center space-y-4">
          <p className="text-3xl font-bold">{String(data.prompt)}</p>
          {data.submissions && (
            <ul className="space-y-3 text-left">
              {(data.submissions as Array<{ id: string; text: string; average?: number; histogram?: number[] }>).map((s) => (
                <li key={s.id} className="rounded-xl bg-zinc-700/80 px-4 py-3 space-y-2">
                  <p>{s.text}</p>
                  {s.average !== undefined && phase !== "rate" && (
                    <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-300">
                      <span className="font-bold text-amber-300">{s.average.toFixed(1)} ★</span>
                      {s.histogram && (
                        <span className="flex gap-1" aria-label="Star histogram">
                          {s.histogram.map((count, i) => (
                            <span key={i} className="rounded bg-zinc-900/80 px-1.5 py-0.5 text-xs tabular-nums">
                              {i + 1}★ {count}
                            </span>
                          ))}
                        </span>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {hostView.gameId === "chain-sketch" && (
        <ChainSketchHostPanel room={room} phase={phase} data={data} DrawCanvas={DrawCanvas} />
      )}

      {hostView.gameId === "draw-vote" && (
        <DrawVoteHostPanel phase={phase} data={data} DrawCanvas={DrawCanvas} />
      )}

      {hostView.gameId === "draw-impostor" && (
        <DrawImpostorHostPanel phase={phase} data={data} DrawCanvas={DrawCanvas} />
      )}

      {hostView.gameId === "impostor" && (
        <div className="rounded-2xl bg-zinc-800/60 p-8 text-center space-y-4">
          <p className="text-3xl font-bold">{String(data.categoryLabel ?? "")}</p>
          {(phase === "questioning" || phase === "accusation") && (
            <p className="text-zinc-400">
              {phase === "questioning"
                ? "Discussion time — accusations open when the timer ends."
                : "Accusation time! Use phones to accuse or guess."}
            </p>
          )}
          {data.secretItem && <p className="text-2xl text-violet-300">Secret: {String(data.secretItem)}</p>}
          {data.roundOutcome && (
            <p className="text-xl text-emerald-400">
              {data.roundOutcome === "spy_guessed" && "Stranger guessed correctly!"}
              {data.roundOutcome === "spy_caught" && "Stranger was caught!"}
              {data.roundOutcome === "spy_escaped" && "Stranger escaped!"}
              {data.roundOutcome === "no_majority" && "No majority — stranger slips away."}
            </p>
          )}
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
          {(data.leaderboard as Array<{ playerId: string; mask: string; solved: boolean; strikes: number }>).map((e) => {
            const spotlight = data.spotlightPlayerId === e.playerId;
            return (
              <li
                key={e.playerId}
                className={`rounded-xl px-4 py-3 flex justify-between ${
                  spotlight ? "bg-violet-700/70 text-lg ring-2 ring-amber-300" : "bg-zinc-800"
                }`}
              >
                <span>
                  {spotlight ? "Leading · " : ""}
                  {room.players.find((p) => p.id === e.playerId)?.nickname}
                </span>
                <span className="font-mono">{e.mask} ({e.strikes} strikes){e.solved ? " ✓" : ""}</span>
              </li>
            );
          })}
          {data.word && <p className="text-center text-xl">Word: {String(data.word)}</p>}
        </ul>
      )}

      {hostView.gameId === "paddle-clash" && (phase === "playing" || phase === "ended") && (
        <div className="flex flex-col items-center gap-4">
          {phase === "ended" && data.winnerId && (
            <p className="text-center text-3xl font-bold text-yellow-400">
              {room.players.find((p) => p.id === data.winnerId)?.nickname ?? "Someone"} wins
              {(() => {
                const left = data.leftScore as number | undefined;
                const right = data.rightScore as number | undefined;
                if (left !== undefined && right !== undefined) {
                  return ` ${left}–${right}!`;
                }
                const players = data.players as Array<{ score: number }> | undefined;
                if (!players || players.length < 2) return "!";
                const mid = Math.ceil(players.length / 2);
                const leftSum = players.slice(0, mid).reduce((s, p) => s + p.score, 0);
                const rightSum = players.slice(mid).reduce((s, p) => s + p.score, 0);
                return ` ${leftSum}–${rightSum}!`;
              })()}
            </p>
          )}
          <PaddleClashArena data={data} room={room} />
        </div>
      )}

      {hostView.gameId === "grid-blast" && (phase === "playing" || phase === "round_end") && (
        <GridBlastArena data={data} room={room} />
      )}

      <ScoringPhase room={room} hostView={hostView} data={data} />
    </div>
    </TvGameShell>
  );
}
