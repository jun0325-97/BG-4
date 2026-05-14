// src/components/layout/Layout.tsx

import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import FAB from "../common/FAB";
import BottomSheet from "../common/BottomSheet";
import GameRegistrationModal from "../common/GameRegistrationModal"; // 방금 만든 모달!
import { Plus, Gamepad2, PenLine } from "lucide-react"; // 아이콘들

export default function Layout() {
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [isGameModalOpen, setIsGameModalOpen] = useState(false);

  // 💡 바텀시트에서 '게임 등록'을 눌렀을 때 실행될 함수
  const handleOpenGameModal = () => {
    setIsBottomSheetOpen(false); // 바텀시트는 닫고
    setIsGameModalOpen(true); // 게임 등록 모달은 열기!
  };

  return (
    <div className="layout-wrapper">
      <Header />

      <main className="main-content">
        {/* 실제 페이지 내용이 갈아끼워지는 자리 */}
        <Outlet />
      </main>

      {/* 1. 우측 하단 FAB 버튼 */}
      <FAB onClick={() => setIsBottomSheetOpen(true)} />

      {/* 2. 메뉴 선택 바텀시트 */}
      <BottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
      >
        <div className="bottom-sheet-menu">
          <button
            className="menu-item"
            onClick={() => alert("기록 추가 폼은 다음 스텝에서!")}
          >
            <PenLine size={20} />
            <span>새로운 기록 추가</span>
          </button>
          <button className="menu-item" onClick={handleOpenGameModal}>
            <Gamepad2 size={20} />
            <span>새로운 게임 등록</span>
          </button>
        </div>
      </BottomSheet>

      {/* 3. 실제 게임 등록 모달 (연속 등록 모드 지원) */}
      <GameRegistrationModal
        isOpen={isGameModalOpen}
        onClose={() => setIsGameModalOpen(false)}
      />
    </div>
  );
}
