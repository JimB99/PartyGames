import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export function JoinPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [code, setCode] = useState((searchParams.get("code") ?? "").toUpperCase().slice(0, 4));
  const [nickname, setNickname] = useState("");

  const submit = () => {
    const roomId = code.trim().toUpperCase();
    if (roomId.length !== 4) return;
    const name = nickname.trim() || "Player";
    sessionStorage.setItem(`pg-nickname-${roomId}`, name);
    navigate(`/play/${roomId}`);
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 p-6">
      <h1 className="text-3xl font-bold">Join game</h1>
      <input
        className="w-full max-w-xs rounded-xl bg-zinc-800 px-4 py-4 text-center text-2xl font-bold tracking-[0.3em] uppercase"
        placeholder="CODE"
        maxLength={4}
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, ""))}
      />
      <input
        className="w-full max-w-xs rounded-xl bg-zinc-800 px-4 py-4 text-lg"
        placeholder="Nickname"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
      />
      <button
        type="button"
        onClick={submit}
        disabled={code.length !== 4}
        className="w-full max-w-xs rounded-2xl bg-violet-600 py-4 text-xl font-bold disabled:opacity-40"
      >
        Join
      </button>
    </div>
  );
}
