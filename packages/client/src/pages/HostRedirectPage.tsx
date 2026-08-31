import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { generateRoomCode, HOST_ROOM_STORAGE_KEY } from "../hooks/usePartyRoom";

export function HostRedirectPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const stored = sessionStorage.getItem(HOST_ROOM_STORAGE_KEY);
    const code = stored && /^[A-Z0-9]{4}$/.test(stored) ? stored : generateRoomCode();
    navigate(`/host/${code}`, { replace: true });
  }, [navigate]);

  return <div className="p-8 text-center text-zinc-400">Opening your room…</div>;
}
