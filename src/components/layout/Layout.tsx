import { Outlet } from "react-router-dom";
import Header from "./Header";

export default function Layout() {
  return (
    <div className="app-layout">
      <Header />
      {/* Outlet은 '액자의 빈 공간' 같은 거야. 
        주소(URL)에 따라 이 자리에 Dashboard, Library 등의 페이지가 쏙쏙 들어오게 돼! 
      */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
