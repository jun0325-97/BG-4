import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import React, { useEffect, Suspense } from "react";
import Layout from "./components/layout/Layout";
import AlertModal from "./components/common/AlertModal";
import { useAuthStore } from "./store/useAuthStore";
import { useStore } from "./store/useStore";
import { supabase } from "./utils/supabase";
import "./pages/Login/Login.scss";

// --- Code Splitting (React.lazy) ---
const Dashboard = React.lazy(() => import("./pages/Dashboard/Dashboard"));
const Library = React.lazy(() => import("./pages/Library/Library"));
const Archive = React.lazy(() => import("./pages/Archive/Archive"));
const MyPage = React.lazy(() => import("./pages/MyPage/MyPage"));
const Vote = React.lazy(() => import("./pages/Vote/Vote"));
const Login = React.lazy(() => import("./pages/Login/Login"));

import LoadingScreen from "./components/common/LoadingScreen";
import DashboardSkeleton from "./pages/Dashboard/components/DashboardSkeleton/DashboardSkeleton";

// 라우트 코드 청크(lazy import)를 불러오는 동안 보여줄 화면.
// 대시보드는 주사위 스피너 대신 스켈레톤을 보여준다.
function RouteFallback() {
  const location = useLocation();
  if (location.pathname === "/") {
    return <DashboardSkeleton />;
  }
  return <LoadingScreen />;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isInitialized } = useAuthStore();
  const { isLoading, isInitialFetched } = useStore();
  const location = useLocation();
  const isDashboardRoute = location.pathname === "/";

  if (!isInitialized) {
    return isDashboardRoute ? <DashboardSkeleton /> : <LoadingScreen />;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // 대시보드는 자체 스켈레톤 UI로 로딩을 표현하므로 여기서 막지 않는다.
  if (!isDashboardRoute && isLoading && !isInitialFetched) {
    return <LoadingScreen />;
  }

  return <>{children}</>;
}

export default function App() {
  const { setSession, setUser, setInitialized } = useAuthStore();
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

  return (
    <>
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/library" element={<Library />} />
              <Route path="/archive" element={<Archive />} />
              <Route path="/vote" element={<Vote />} />
              <Route path="/mypage/:memberId" element={<MyPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
      <AlertModal />
    </>
  );
}
