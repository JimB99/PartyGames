import type { RoomSnapshot } from "@party-games/shared";

type DrawStroke = { points: number[]; color: string; width: number };

export function ChainSketchHostPanel({
  room,
  phase,
  data,
  DrawCanvas,
}: {
  room: RoomSnapshot;
  phase: string;
  data: Record<string, unknown>;
  DrawCanvas: React.ComponentType<{ strokes: DrawStroke[]; readOnly?: boolean }>;
}) {
  const simultaneous = Boolean(data.simultaneous);
  const chains = data.chains as Array<{ ownerId: string; startWord: string; links: Array<{ kind: string; prompt: string; guess?: string; strokes?: DrawStroke[] }> }> | undefined;

  return (
    <div className="space-y-4">
      {simultaneous && (
        <p className="text-center text-zinc-400">
          Stage {(data.stage as number) + 1}/{data.stagesTotal as number} ·{" "}
          {data.submittedCount as number}/{data.playerCount as number} finished
        </p>
      )}
      {phase === "vote" && (
        <p className="text-center text-xl font-bold">Everyone is voting for the best chain!</p>
      )}
      {chains && (
        <div className="grid gap-4 md:grid-cols-2">
          {chains.map((chain) => (
            <div key={chain.ownerId} className="rounded-xl bg-zinc-800 p-4 space-y-2">
              <p className="font-bold">
                {room.players.find((p) => p.id === chain.ownerId)?.nickname ?? chain.ownerId}&apos;s chain
              </p>
              <p className="text-sm text-zinc-400">Started: {chain.startWord}</p>
              <ol className="space-y-2 text-sm">
                {chain.links.map((link, i) => (
                  <li key={i} className="rounded-lg bg-zinc-900/60 p-2">
                    {link.kind === "draw" && link.strokes?.length ? (
                      <DrawCanvas strokes={link.strokes} readOnly />
                    ) : (
                      <span>{link.guess ?? link.prompt}</span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
