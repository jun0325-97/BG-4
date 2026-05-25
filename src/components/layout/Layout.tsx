// src/components/layout/Layout.tsx

import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import FAB from "../common/FAB";
import BottomSheet from "../common/BottomSheet";
import GameRegistrationModal from "../common/GameRegistrationModal";
import RecordRegistrationModal from "../common/RecordRegistrationModal";
import { Gamepad2, PenLine } from "lucide-react";

export default function Layout() {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const handleOpenGameModal = () => {
    setIsBottomSheetOpen(false);
    setIsGameModalOpen(true);
  };

  const handleOpenRecordModal = () => {
    setIsBottomSheetOpen(false);
    setIsRecordModalOpen(true);
  };

  return (
    <div className="layout-wrapper">
      <Header />

      <main className="main-content">
        <Outlet />
      </main>

      <FAB onClick={() => setIsBottomSheetOpen(true)} />

      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
      >
        <div className="bottom-sheet-menu">
          <button className="menu-item" onClick={handleOpenRecordModal}>
            <PenLine size={20} />
            <span>새로운 기록 추가</span>
          </button>

          <button className="menu-item" onClick={handleOpenGameModal}>
            <Gamepad2 size={20} />
            <span>새로운 게임 등록</span>
          </button>
        </div>
      </BottomSheet>

      <GameRegistrationModal
        isOpen={isGameModalOpen}
        onClose={() => setIsGameModalOpen(false)}
      />

      <RecordRegistrationModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
      />
    </div>
  );
}