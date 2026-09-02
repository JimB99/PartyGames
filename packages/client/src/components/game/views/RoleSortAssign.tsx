import type { RoomSnapshot } from "@party-games/shared";
import { useState } from "react";
import { GameButton } from "../GameButton";

export function RoleSortAssign({
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
      <GameButton
        testId="role-sort-submit"
        className="w-full"
        onClick={() => onSubmit(assignments)}
        disabled={Object.keys(assignments).length < targetIds.length}
      >
        Submit assignments
      </GameButton>
    </div>
  );
}
