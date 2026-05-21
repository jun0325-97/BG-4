import { create } from "zustand";

export type AlertType = "success" | "error" | "info";

interface AlertState {
  isOpen: boolean;
  message: string;
  type: AlertType;
  showAlert: (message: string, type?: AlertType) => void;
  closeAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  isOpen: false,
  message: "",
  type: "success",
  showAlert: (message, type = "success") => {
    set({ isOpen: true, message, type });
    // 자동으로 3초 뒤에 닫히는 기능 추가
    setTimeout(() => {
      set({ isOpen: false });
    }, 2500);
  },
  closeAlert: () => set({ isOpen: false }),
}));
