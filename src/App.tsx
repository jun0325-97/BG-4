import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React, { useEffect, Suspense } from "react";
import Layout from "./components/layout/Layout";
import AlertModal from "./components/common/AlertModal";
import { useAuthStore } from "./store/useAuthStore";
import { useStore } from "./store/useStore";
import { supabase } from "./utils/supabase";
import loginBg from "./assets/images/img-login.jpg";
import "./pages/Login/Login.scss";

// --- Code Splitting (React.lazy) ---
const Dashboard = React.lazy(() => import("./pages/Dashboard/Dashboard"));
const Library = React.lazy(() => import("./pages/Library/Library"));
const Archive = React.lazy(() => import("./pages/Archive/Archive"));
const MyPage = React.lazy(() => import("./pages/MyPage/MyPage"));
const Login = React.lazy(() => import("./pages/Login/Login"));

// --- Reusable Loading Component ---
function SplashScreen({ fullScreen = false }: { fullScreen?: boolean }) {
  if (fullScreen) {
    return (
      <div className="login-container login-container--loading" style={{ backgroundImage: `url(${loginBg})` }}>
        <div className="success-loading-text">LOADING...</div>
      </div>
    );
  }
  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontSize: "1.2rem", fontWeight: 400, fontFamily: "'Montserrat', sans-serif", letterSpacing: "0.6rem", color: "#aaa" }}>
        LOADING...
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isInitialized } = useAuthStore();
  const { isLoading } = useStore();
  const isRootPath = window.location.pathname === '/';

  if (!isInitialized || (session && isLoading)) {
    return <SplashScreen fullScreen={isRootPath} />;
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
      if (session) {
        fetchAll();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session) {
        fetchAll();
      }
    });

    return () => subscription.unsubscribe();
  }, [setSession, setUser, setInitialized, fetchAll]);

  if (!isInitialized) {
    const isRootOrLogin = window.location.pathname === '/' || window.location.pathname === '/login';
    return <SplashScreen fullScreen={isRootOrLogin} />;
  }

  return (
    <>
      <BrowserRouter>
        <Suspense fallback={<SplashScreen />}>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/library" element={<Library />} />
              <Route path="/archive" element={<Archive />} />
              <Route path="/mypage/:memberId" element={<MyPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
      <AlertModal />
    </>
  );
}
