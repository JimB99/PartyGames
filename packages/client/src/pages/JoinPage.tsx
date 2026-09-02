import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ColorPicker, getStoredColorIndex, storeColorIndex } from "../components/ColorPicker";
import { probeRoomAvailable } from "../hooks/probeRoom";

export function JoinPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialCode = (searchParams.get("code") ?? "").toUpperCase().slice(0, 4);
  const [code, setCode] = useState(initialCode);
  const [nickname, setNickname] = useState("");
  const [colorIndex, setColorIndex] = useState(() => getStoredColorIndex(initialCode) ?? 0);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const roomId = code.trim().toUpperCase();
    if (roomId.length !== 4) return;
    setError(null);
    setChecking(true);
    const result = await probeRoomAvailable(roomId);
    setChecking(false);
    if (!result.ok) {
      setError(result.message ?? "Room not found.");
      return;
    }
    const name = nickname.trim() || "Player";
    sessionStorage.setItem(`pg-nickname-${roomId}`, name);
    storeColorIndex(roomId, colorIndex);
    navigate(`/play/${roomId}`);
  };

  return (
    <form
      className="pg-page flex min-h-dvh flex-col items-center justify-center gap-6 p-6"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <h1 className="text-3xl font-bold">Join game</h1>
      <div className="w-full max-w-xs space-y-2">
        <label htmlFor="join-code" className="block text-center text-sm text-zinc-400">
          Room code
        </label>
        <input
          id="join-code"
          name="roomCode"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          className="w-full rounded-xl bg-zinc-800 px-4 py-4 text-center text-2xl font-bold tracking-[0.3em] uppercase"
          placeholder="CODE"
          maxLength={4}
          value={code}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "join-error" : undefined}
          onChange={(e) => {
            const next = e.target.value.toUpperCase().replace(/[^A-Z]/g, "");
            setCode(next);
            const stored = getStoredColorIndex(next);
            if (stored !== undefined) setColorIndex(stored);
          }}
        />
      </div>
      <div className="w-full max-w-xs space-y-2">
        <label htmlFor="join-nickname" className="block text-center text-sm text-zinc-400">
          Nickname
        </label>
        <input
          id="join-nickname"
          name="nickname"
          autoComplete="nickname"
          className="w-full rounded-xl bg-zinc-800 px-4 py-4 text-lg"
          placeholder="Nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
      </div>
      <div className="w-full max-w-xs space-y-2">
        <p id="join-color-label" className="text-center text-sm text-zinc-400">
          Pick your color
        </p>
        <ColorPicker value={colorIndex} onChange={setColorIndex} />
      </div>
      <button
        type="submit"
        disabled={code.length !== 4 || checking}
        className="w-full max-w-xs min-h-11 rounded-2xl bg-violet-600 py-4 text-xl font-bold disabled:opacity-40"
      >
        {checking ? "Checking…" : "Join"}
      </button>
      {error && (
        <p id="join-error" role="alert" className="max-w-xs text-center text-sm text-red-300">
          {error}
        </p>
      )}
    </form>
  );
}
