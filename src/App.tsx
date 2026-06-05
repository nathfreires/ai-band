import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Landing } from "./routes/Landing";
import { Host } from "./routes/Host";
import { Join } from "./routes/Join";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/host" element={<Host />} />
        <Route path="/join/:roomId" element={<Join />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
