import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function RoomCodeDisplay({ roomId, size = "large" }: { roomId: string; size?: "large" | "small" }) {
  const [qr, setQr] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const joinUrl = `${window.location.origin}/join?code=${roomId}`;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    QRCode.toDataURL(joinUrl, { margin: 1, width: size === "large" ? 200 : 120 })
      .then(setQr)
      .catch(() => setQr(""));
  }, [joinUrl, size]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-3">
        <div className={size === "large" ? "text-6xl font-black tracking-[0.3em]" : "text-3xl font-bold tracking-[0.2em]"}>
          {roomId}
        </div>
        <button
          type="button"
          onClick={copyCode}
          aria-label="Copy room code"
          className="rounded-lg bg-zinc-700 px-3 py-2 text-sm font-semibold hover:bg-zinc-600"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      {qr && (
        <img
          src={qr}
          alt="QR code to join this room"
          className="rounded-lg bg-white p-2"
        />
      )}
      <p className="text-sm text-zinc-400">{joinUrl}</p>
    </div>
  );
}
