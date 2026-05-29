import { create } from "zustand";

export type AlertType = "success" | "error" | "info";

interface AlertState {
  isOpen: boolean;
  message: string;
  type: AlertType;
  showAlert: (message: string, type?: AlertType) => void;
  closeAlert: () => void;

  // confirm 모달 상태
  isConfirmOpen: boolean;
  confirmMessage: string;
  onConfirmAction: (() => void) | null;
  showConfirm: (message: string, onConfirm: () => void) => void;
  closeConfirm: () => void;
  executeConfirm: () => void;
}

export const useAlertStore = create<AlertState>((set, get) => ({
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

  // confirm 모달
  isConfirmOpen: false,
  confirmMessage: "",
  onConfirmAction: null,
  showConfirm: (message, onConfirm) => {
    set({ isConfirmOpen: true, confirmMessage: message, onConfirmAction: onConfirm });
  },
  closeConfirm: () => {
    set({ isConfirmOpen: false, confirmMessage: "", onConfirmAction: null });
  },
  executeConfirm: () => {
    const action = get().onConfirmAction;
    set({ isConfirmOpen: false, confirmMessage: "", onConfirmAction: null });
    if (action) action();
  },
}));
