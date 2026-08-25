import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { generateRoomCode } from "../hooks/usePartyRoom";

export function HostRedirectPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const code = generateRoomCode();
    navigate(`/host/${code}`, { replace: true });
  }, [navigate]);

  return <div className="p-8 text-center text-zinc-400">Creating room…</div>;
}
