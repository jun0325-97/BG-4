import { create } from "zustand";
import { Session, User } from "@supabase/supabase-js";

interface AuthState {
  session: Session | null;
  user: User | null;
  isInitialized: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setInitialized: (val: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  isInitialized: false,
  setSession: (session) => set({ session }),
  setUser: (user) => set({ user }),
  setInitialized: (val) => set({ isInitialized: val }),
  clearAuth: () => set({ session: null, user: null }),
}));
