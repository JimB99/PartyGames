import type { RoomSnapshot } from "@party-games/shared";
import { useEffect, useState } from "react";
import { ColorPicker, storeColorIndex } from "./ColorPicker";
import { playerColor } from "../hooks/usePartyRoom";

export function PlayerProfileBar({
  roomId,
  roomState,
  playerId,
  onUpdateProfile,
}: {
  roomId: string;
  roomState: RoomSnapshot | null;
  playerId: string | null;
  onUpdateProfile: (update: { nickname?: string; colorIndex?: number }) => void;
}) {
  const me = roomState?.players.find((p) => p.id === playerId);
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState(me?.nickname ?? "");
  const [colorIndex, setColorIndex] = useState(me?.colorIndex ?? 0);

  useEffect(() => {
    if (me) {
      setNickname(me.nickname);
      setColorIndex(me.colorIndex);
    }
  }, [me?.nickname, me?.colorIndex]);

  const takenColors =
    roomState?.players
      .filter((p) => p.connected && p.id !== playerId)
      .map((p) => p.colorIndex) ?? [];

  const save = () => {
    const trimmed = nickname.trim().slice(0, 24) || "Player";
    onUpdateProfile({ nickname: trimmed, colorIndex });
    sessionStorage.setItem(`pg-nickname-${roomId}`, trimmed);
    storeColorIndex(roomId, colorIndex);
    setEditing(false);
  };

  if (!me) {
    return <span className="font-bold">{nickname || "Player"}</span>;
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-zinc-800 transition"
        title="Edit profile"
      >
        <span
          className="h-3 w-3 shrink-0 rounded-full"
          style={{ backgroundColor: playerColor(me.colorIndex) }}
        />
        <span className="font-bold">{me.nickname}</span>
        <span className="text-xs text-zinc-500">edit</span>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-zinc-700 bg-zinc-900 p-3">
      <input
        className="rounded-lg bg-zinc-800 px-3 py-2 text-sm"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        maxLength={24}
        placeholder="Nickname"
      />
      <ColorPicker value={colorIndex} onChange={setColorIndex} takenColors={takenColors} />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={save}
          className="flex-1 rounded-lg bg-violet-600 py-2 text-sm font-bold"
        >
          Save
        </button>
        <button
          type="button"
          onClick={() => {
            setNickname(me.nickname);
            setColorIndex(me.colorIndex);
            setEditing(false);
          }}
          className="rounded-lg bg-zinc-700 px-4 py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
