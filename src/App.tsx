import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
const Login = React.lazy(() => import("./pages/Login/Login"));

import LoadingScreen from "./components/common/LoadingScreen";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isInitialized } = useAuthStore();

  const { isLoading, isInitialFetched } = useStore();

  if (!isInitialized || (session && isLoading && !isInitialFetched)) {
    return <LoadingScreen />;
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
    return <LoadingScreen />;
  }

  return (
    <>
      <BrowserRouter>
        <Suspense fallback={<LoadingScreen />}>
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
