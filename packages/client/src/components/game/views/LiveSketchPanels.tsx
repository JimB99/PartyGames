import type { GameAction, RoomSnapshot } from "@party-games/shared";
import { LIVE_SKETCH_CUSTOM_WORD_MAX } from "@party-games/shared";
import { DrawingCanvas as DrawCanvas, type StrokeInput as DrawStroke } from "../DrawingCanvas";
import { GameButton as Btn } from "../GameButton";

const PLAY_PHASES = new Set(["drawing", "letter-count", "hangman"]);

export function isLiveSketchPlayPhase(phase: string): boolean {
  return PLAY_PHASES.has(phase);
}

export function LiveSketchHostPanel({
  room,
  phase,
  data,
}: {
  room: RoomSnapshot;
  phase: string;
  data: Record<string, unknown>;
}) {
  const drawerName =
    room.players.find((p) => p.id === data.drawerId)?.nickname ?? "Someone";
  const correctIds = (data.correctIds as string[] | undefined) ?? [];
  const correctNames = correctIds.map(
    (id) => room.players.find((p) => p.id === id)?.nickname ?? id,
  );

  return (
    <div className="space-y-4">
      {phase === "pick" && (
        <p className="text-center text-2xl font-bold">{drawerName} is picking a word…</p>
      )}
      {isLiveSketchPlayPhase(phase) && (
        <>
          <p className="text-center text-2xl font-bold">{drawerName} is drawing</p>
          {phase === "letter-count" && data.letterCount !== undefined && (
            <p className="text-center text-xl text-zinc-300" data-testid="live-sketch-letter-count">
              {String(data.letterCount)} letters
              {Number(data.wordCount) > 1 ? ` · ${String(data.wordCount)} words` : ""}
            </p>
          )}
          {phase === "hangman" && data.mask !== undefined && (
            <div className="text-center space-y-2">
              <p className="text-4xl font-mono tracking-widest" data-testid="live-sketch-mask">
                {String(data.mask)}
              </p>
              {Array.isArray(data.missedLetters) && (data.missedLetters as string[]).length > 0 && (
                <p className="text-zinc-400">Missed: {(data.missedLetters as string[]).join(" ").toUpperCase()}</p>
              )}
            </div>
          )}
          {correctNames.length > 0 && (
            <p className="text-center text-emerald-400">{correctNames.join(", ")} got it!</p>
          )}
        </>
      )}
      {(isLiveSketchPlayPhase(phase) || phase === "reveal" || phase === "scoreboard") &&
        Array.isArray(data.strokes) && (
        <DrawCanvas strokes={data.strokes as DrawStroke[]} readOnly />
      )}
      {phase === "reveal" && typeof data.word === "string" && (
        <p className="text-center text-3xl font-bold">{data.word}</p>
      )}
    </div>
  );
}

export function LiveSketchPlayerPanel({
  phase,
  data,
  playerData,
  text,
  setText,
  drawTool,
  setDrawTool,
  drawWidth,
  setDrawWidth,
  onAction,
}: {
  phase: string;
  data: Record<string, unknown>;
  playerData: Record<string, unknown>;
  text: string;
  setText: (value: string) => void;
  drawTool: "pen" | "eraser";
  setDrawTool: (tool: "pen" | "eraser") => void;
  drawWidth: number;
  setDrawWidth: (width: number) => void;
  onAction: (action: GameAction) => void;
}) {
  const isDrawer = Boolean(playerData.isDrawer);
  const guessed = Boolean(playerData.guessed);
  const choiceWords = (playerData.choiceWords as string[] | undefined) ?? [];

  if (phase === "pick" && isDrawer) {
    return (
      <div className="space-y-3">
        <p className="text-center text-lg font-bold">Pick a word</p>
        <div className="grid gap-2">
          {choiceWords.map((word) => (
            <Btn
              key={word}
              testId={`live-sketch-choice-${word.slice(0, 12)}`}
              variant="secondary"
              className="w-full"
              onClick={() => onAction({ kind: "vote", optionId: word })}
            >
              {word}
            </Btn>
          ))}
        </div>
        <textarea
          data-testid="player-text-input"
          className="w-full rounded-xl bg-zinc-800 p-4 text-lg"
          rows={2}
          maxLength={LIVE_SKETCH_CUSTOM_WORD_MAX}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Or type your own…"
        />
        <p className="text-right text-xs text-zinc-500">
          {text.trim().length}/{LIVE_SKETCH_CUSTOM_WORD_MAX}
        </p>
        <Btn
          testId="player-submit"
          className="w-full"
          onClick={() => {
            onAction({ kind: "submit_text", text });
            setText("");
          }}
        >
          Use custom word
        </Btn>
      </div>
    );
  }

  if (phase === "pick" && !isDrawer) {
    return <p className="text-center text-zinc-400">The drawer is picking a word…</p>;
  }

  if (isDrawer && isLiveSketchPlayPhase(phase)) {
    const gotIt = ((data.correctIds as string[] | undefined) ?? []).length;
    return (
      <div className="space-y-3">
        <p className="text-center text-xl font-bold">Draw: {String(playerData.word)}</p>
        {gotIt > 0 && <p className="text-center text-emerald-400">{gotIt} guessed it!</p>}
        <DrawCanvas
          strokes={(data.strokes as DrawStroke[]) ?? []}
          tool={drawTool}
          brushWidth={drawWidth}
          onToolChange={(t, w) => {
            setDrawTool(t);
            if (w !== undefined) setDrawWidth(w);
            onAction({ kind: "draw_tool", tool: t, width: w ?? drawWidth });
          }}
          onStroke={(points, color, width, meta) =>
            onAction({
              kind: "draw_stroke",
              points,
              color,
              width: width ?? drawWidth,
              id: meta.id,
              revision: meta.revision,
            })
          }
          drawingRevision={(playerData.drawingRevision as number | undefined) ?? 0}
          onUndo={() => onAction({ kind: "draw_undo" })}
          onClear={() => onAction({ kind: "draw_clear" })}
        />
      </div>
    );
  }

  if (!isDrawer && isLiveSketchPlayPhase(phase)) {
    return (
      <div className="space-y-3">
        <DrawCanvas strokes={(data.strokes as DrawStroke[]) ?? []} readOnly />
        {guessed ? (
          <p className="text-center text-2xl font-bold text-emerald-400">You got it!</p>
        ) : (
          <>
            {playerData.lastWrong ? <p className="text-center text-zinc-400">Not quite</p> : null}
            <textarea
              data-testid="player-text-input"
              className="w-full rounded-xl bg-zinc-800 p-4 text-lg"
              rows={2}
              maxLength={120}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Guess the word…"
            />
            <Btn
              testId="player-submit"
              className="w-full"
              onClick={() => {
                onAction({ kind: "submit_text", text });
                setText("");
              }}
            >
              Guess
            </Btn>
            {playerData.canGuessLetters ? (
              <div className="grid grid-cols-6 gap-2">
                {"abcdefghijklmnopqrstuvwxyz".split("").map((l) => {
                  const used = [
                    ...((data.guessedLetters as string[]) ?? []),
                    ...((data.missedLetters as string[]) ?? []),
                  ].includes(l);
                  return (
                    <button
                      key={l}
                      type="button"
                      data-testid={`hangman-key-${l}`}
                      disabled={used}
                      className={`rounded-lg py-2 font-bold uppercase ${used ? "bg-zinc-900 text-zinc-600" : "bg-zinc-700"}`}
                      onClick={() => onAction({ kind: "hangman_letter", letter: l })}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </>
        )}
      </div>
    );
  }

  return null;
}
