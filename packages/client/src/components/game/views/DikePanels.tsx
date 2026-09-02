import type { DikeRevealEntry, RoomSnapshot } from "@party-games/shared";
import { useState } from "react";
import { GameButton } from "../GameButton";

export function DikeRevealTable({
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

export function DikePodium({
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

export function DikeBidPanel({
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
          <GameButton key={value} variant="secondary" className="text-base" onClick={() => setAmount(value)}>
            {value}
          </GameButton>
        ))}
      </div>
      <GameButton className="w-full" onClick={() => onBid(amount)}>
        Bid {amount}
      </GameButton>
    </div>
  );
}
