// src/components/layout/Layout.tsx
import { Outlet } from "react-router-dom";
import Header from "./Header";
import FAB from "../common/FAB"; // 방금 만든 FAB 불러오기

export default function Layout() {
  return (
    <div className="app-layout">
      <Header />
      <main className="main-content">
        <Outlet />
      </main>
      <FAB /> {/* 화면 우측 하단에 항상 렌더링 됨 */}
    </div>
  );
}
