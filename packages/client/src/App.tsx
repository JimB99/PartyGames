import { Route, Routes } from "react-router-dom";
import { HomePage } from "./pages/HomePage";
import { HostPage } from "./pages/HostPage";
import { HostRedirectPage } from "./pages/HostRedirectPage";
import { JoinPage } from "./pages/JoinPage";
import { PlayPage } from "./pages/PlayPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/host" element={<HostRedirectPage />} />
      <Route path="/host/:roomId" element={<HostPage />} />
      <Route path="/join" element={<JoinPage />} />
      <Route path="/play/:roomId" element={<PlayPage />} />
    </Routes>
  );
}
