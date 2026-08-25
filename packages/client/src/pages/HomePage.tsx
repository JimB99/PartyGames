import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="text-5xl font-black tracking-tight">Party Games</h1>
        <p className="mt-2 text-zinc-400">One big screen. Phones as controllers.</p>
      </div>
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Link
          to="/host"
          className="rounded-2xl bg-violet-600 px-8 py-5 text-center text-xl font-bold hover:bg-violet-500"
        >
          Host a game
        </Link>
        <Link
          to="/join"
          className="rounded-2xl bg-zinc-700 px-8 py-5 text-center text-xl font-bold hover:bg-zinc-600"
        >
          Join with code
        </Link>
      </div>
    </div>
  );
}
