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
        {/* 모든 페이지는 Layout(헤더 포함)으로 감싸지게 돼 */}
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/library" element={<Library />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/mypage" element={<MyPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
