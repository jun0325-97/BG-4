// src/components/layout/Layout.tsx

import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import BottomNav from "./BottomNav";
import BottomSheet from "../common/BottomSheet";
import GameRegistrationModal from "../common/GameRegistrationModal";
import RecordRegistrationModal from "../common/RecordRegistrationModal";
import QuickPlayLogModal from "../common/QuickPlayLogModal";
import ScoreSheetModal from "../common/ScoreSheetModal";
import TurnTimerModal from "../common/TurnTimerModal";
import { Gamepad2, PenLine, Trophy } from "lucide-react";

export default function Layout() {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isQuickPlayLogOpen, setIsQuickPlayLogOpen] = useState(false);
  const [isScoreSheetOpen, setIsScoreSheetOpen] = useState(false);
  const [isTurnTimerOpen, setIsTurnTimerOpen] = useState(false);

  const handleOpenGameModal = () => {
    setIsBottomSheetOpen(false);
    setIsGameModalOpen(true);
  };

  const handleOpenRecordModal = () => {
    setIsBottomSheetOpen(false);
    setIsRecordModalOpen(true);
  };

  const handleOpenQuickPlayLog = () => {
    setIsBottomSheetOpen(false);
    setIsQuickPlayLogOpen(true);
  };

  const handleOpenScoreSheet = () => {
    setIsScoreSheetOpen(true);
  };

  const handleOpenTurnTimer = () => {
    setIsTurnTimerOpen(true);
  };

  return (
    <div className="layout-wrapper">
      <Header
        onOpenScoreSheet={handleOpenScoreSheet}
        onOpenTurnTimer={handleOpenTurnTimer}
      />

      <main className="main-content">
        <Outlet />
      </main>

      <BottomNav onFabClick={() => setIsBottomSheetOpen(true)} />

      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
      >
        <div className="bottom-sheet-menu">
          <button className="menu-item" onClick={handleOpenRecordModal}>
            <PenLine size={20} />
            <div className="menu-item-text">
              <span>새로운 모임 기록</span>
              <small>날짜, 사진, 플레이 로그 전체 등록</small>
            </div>
          </button>

          <button className="menu-item" onClick={handleOpenQuickPlayLog}>
            <Trophy size={20} />
            <div className="menu-item-text">
              <span>게임 결과 추가</span>
              <small>최근 모임에 빠른 1판 결과 추가</small>
            </div>
          </button>

          <button className="menu-item" onClick={handleOpenGameModal}>
            <Gamepad2 size={20} />
            <div className="menu-item-text">
              <span>새로운 게임 등록</span>
              <small>보드게임 책장에 신규 타이틀 추가</small>
            </div>
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

      <QuickPlayLogModal
        isOpen={isQuickPlayLogOpen}
        onClose={() => setIsQuickPlayLogOpen(false)}
      />

      <ScoreSheetModal
        isOpen={isScoreSheetOpen}
        onClose={() => setIsScoreSheetOpen(false)}
      />

      <TurnTimerModal
        isOpen={isTurnTimerOpen}
        onClose={() => setIsTurnTimerOpen(false)}
      />
    </div>
  );
}