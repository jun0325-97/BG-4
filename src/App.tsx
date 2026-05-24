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
import loginBg from "./assets/images/img-login.jpg";
import "./pages/Login/Login.scss"; // 로딩 텍스트 및 배경 스타일 재사용

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isInitialized } = useAuthStore();
  const { isLoading } = useStore();
  const isRootPath = window.location.pathname === '/';

  if (!isInitialized || (session && isLoading)) {
    if (isRootPath) {
      return (
        <div
          className="login-container"
          style={{ backgroundImage: `url(${loginBg})` }}
        >
          <div className="success-loading-text">
            LOADING...
          </div>
        </div>
      );
    } else {
      return (
        <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: "1.2rem", fontWeight: 400, fontFamily: "'Montserrat', sans-serif", letterSpacing: "0.6rem", color: "#aaa" }}>
            LOADING...
          </div>
        </div>
      );
    }
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const { setSession, setUser, setInitialized, isInitialized } = useAuthStore();
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

  // 전역 초기화 스플래시 화면 (이미 로그인된 유저가 로그인 페이지를 깜빡이는 것을 방지)
  if (!isInitialized) {
    const isRootOrLogin = window.location.pathname === '/' || window.location.pathname === '/login';
    if (isRootOrLogin) {
      return (
        <div
          className="login-container"
          style={{ backgroundImage: `url(${loginBg})` }}
        >
          <div className="success-loading-text">
            LOADING...
          </div>
        </div>
      );
    } else {
      return (
        <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ fontSize: "1.2rem", fontWeight: 400, fontFamily: "'Montserrat', sans-serif", letterSpacing: "0.6rem", color: "#aaa" }}>
            LOADING...
          </div>
        </div>
      );
    }
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
