import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function RoomCodeDisplay({ roomId, size = "large" }: { roomId: string; size?: "large" | "small" }) {
  const [qr, setQr] = useState<string>("");
  const joinUrl = `${window.location.origin}/join?code=${roomId}`;

  useEffect(() => {
    QRCode.toDataURL(joinUrl, { margin: 1, width: size === "large" ? 200 : 120 })
      .then(setQr)
      .catch(() => setQr(""));
  }, [joinUrl, size]);

  return (
    <div className="flex flex-col items-center gap-3">
      <div className={size === "large" ? "text-6xl font-black tracking-[0.3em]" : "text-3xl font-bold tracking-[0.2em]"}>
        {roomId}
      </div>
      {qr && <img src={qr} alt="Join QR code" className="rounded-lg bg-white p-2" />}
      <p className="text-sm text-zinc-400">{joinUrl}</p>
    </div>
  );
}
