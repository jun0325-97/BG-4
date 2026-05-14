// src/components/common/FAB.tsx

import { useState } from "react";
import { Plus } from "lucide-react";
import BottomSheet from "./BottomSheet";
import "./FAB.scss";

export default function FAB() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="global-fab"
        onClick={() => setIsOpen(true)}
        aria-label="추가 메뉴 열기"
      >
        <Plus size={32} />
      </button>

      <BottomSheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="무엇을 추가할까요?"
      >
        <div className="fab-menu">
          <button
            className="fab-menu__item"
            onClick={() => {
              setIsOpen(false);
              // TODO: 기록 추가 모달 열기
            }}
          >
            <span className="fab-menu__icon">📝</span>
            <div className="fab-menu__text">
              <strong>기록 추가</strong>
              <span>오늘 모임을 기록해요</span>
            </div>
          </button>

          <button
            className="fab-menu__item"
            onClick={() => {
              setIsOpen(false);
              // TODO: 게임 등록 모달 열기
            }}
          >
            <span className="fab-menu__icon">🎲</span>
            <div className="fab-menu__text">
              <strong>게임 등록</strong>
              <span>새 보드게임을 추가해요</span>
            </div>
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
