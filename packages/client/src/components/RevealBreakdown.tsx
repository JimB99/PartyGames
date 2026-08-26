import type { PlayerAnswerReveal, RevealEntry, RoomSnapshot } from "@party-games/shared";
import { playerColor } from "../hooks/usePartyRoom";

function nickname(room: RoomSnapshot, id: string) {
  return room.players.find((p) => p.id === id)?.nickname ?? id;
}

export function RevealBreakdown({
  room,
  reveal,
  playerAnswers,
  compact = false,
}: {
  room: RoomSnapshot;
  reveal?: RevealEntry[];
  playerAnswers?: PlayerAnswerReveal[];
  compact?: boolean;
}) {
  if (reveal && reveal.length > 0) {
    return (
      <div className="space-y-3">
        {reveal.map((entry) => (
          <div
            key={entry.id}
            className={`rounded-xl p-4 ${entry.isTruth ? "bg-green-600/20 border border-green-500/40" : "bg-zinc-800"}`}
          >
            <p className={`${compact ? "text-base" : "text-xl"}`}>{entry.text}</p>
            <p className="mt-1 text-sm text-zinc-400">
              {entry.isTruth || entry.authorLabel
                ? entry.authorLabel ?? "Real answer"
                : entry.authorId
                  ? `Written by ${nickname(room, entry.authorId)}`
                  : "The game"}
            </p>
            {entry.voterIds && entry.voterIds.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {entry.voterIds.map((vid) => {
                  const p = room.players.find((pl) => pl.id === vid);
                  return (
                    <span
                      key={vid}
                      className="rounded-full bg-zinc-700 px-2 py-0.5 text-xs"
                      style={{ borderLeft: `3px solid ${playerColor(p?.colorIndex ?? 0)}` }}
                    >
                      {nickname(room, vid)}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  if (playerAnswers && playerAnswers.length > 0) {
    return (
      <ul className="space-y-2">
        {playerAnswers.map((a) => {
          const p = room.players.find((pl) => pl.id === a.playerId);
          return (
            <li
              key={a.playerId}
              className={`flex items-center justify-between rounded-lg px-4 py-2 ${a.correct ? "bg-green-600/20" : "bg-zinc-800"}`}
            >
              <span className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: playerColor(p?.colorIndex ?? 0) }}
                />
                {nickname(room, a.playerId)}
              </span>
              <span className="text-sm text-zinc-300">
                {a.detail ?? String(a.answer)}
                {a.rankPlace !== undefined && (
                  <span className="ml-1 text-yellow-400">
                    {a.rankPlace === 1 ? "1st" : a.rankPlace === 2 ? "2nd" : a.rankPlace === 3 ? "3rd" : `${a.rankPlace}th`}
                  </span>
                )}
                {a.points !== undefined && <span className="ml-2 font-mono text-zinc-400">+{a.points}</span>}
                {a.correct === true && <span className="ml-1 text-green-400">✓</span>}
                {a.correct === false && <span className="ml-1 text-red-400">✗</span>}
              </span>
            </li>
          );
        })}
      </ul>
    );
  }

  return null;
}

export function ScoringRulesPanel({ rules }: { rules: string }) {
  return (
    <div className="rounded-2xl bg-violet-600/15 border border-violet-500/30 p-6 text-center">
      <p className="text-sm font-semibold uppercase tracking-wide text-violet-300 mb-2">Scoring</p>
      <p className="text-lg text-zinc-200">{rules}</p>
    </div>
  );
}
