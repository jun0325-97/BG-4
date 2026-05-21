import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Layout from "./components/layout/Layout";
import Dashboard from "./pages/Dashboard/Dashboard";
import Library from "./pages/Library/Library";
import Archive from "./pages/Archive/Archive";
import MyPage from "./pages/MyPage/MyPage";
import Login from "./pages/Login/Login";
import AlertModal from "./components/common/AlertModal";
import { useAuthStore } from "./store/useAuthStore";
import { useStore } from "./store/useStore";
import { supabase } from "./utils/supabase";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session } = useAuthStore();
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const { setSession, setUser, isInitialized, setInitialized } = useAuthStore();
  const { fetchAll } = useStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setInitialized(true);
      // 로그인 상태이면 바로 데이터 로드
      if (session) {
        fetchAll();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      // 로그인 이벤트 발생 시 데이터 로드
      if (session) {
        fetchAll();
      }
    });

    return () => subscription.unsubscribe();
  }, [setSession, setUser, setInitialized, fetchAll]);

  if (!isInitialized) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        로그인 정보 확인 중...
      </div>
    );
  }

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/library" element={<Library />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/mypage/:memberId" element={<MyPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <AlertModal />
    </>
  );
}
