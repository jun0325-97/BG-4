// src/App.tsx

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard/Dashboard";
import Library from "./pages/Library/Library";
import Archive from "./pages/Archive/Archive";
import MyPage from "./pages/MyPage/MyPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/library" element={<Library />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/mypage/:memberId" element={<MyPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
