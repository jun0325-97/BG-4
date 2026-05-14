// src/components/common/BottomSheet.tsx

import { useEffect } from "react";
import "./BottomSheet.scss";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
}: BottomSheetProps) {
  // 열렸을 때 body 스크롤 막기
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* 뒷배경 어둡게 */}
      <div className="bottom-sheet-overlay" onClick={onClose} />

      {/* 시트 본체 */}
      <div className="bottom-sheet">
        {/* 상단 핸들 바 */}
        <div className="bottom-sheet__handle" />

        {/* 헤더 */}
        {title && (
          <div className="bottom-sheet__header">
            <h3 className="bottom-sheet__title">{title}</h3>
            <button
              className="bottom-sheet__close"
              onClick={onClose}
              aria-label="닫기"
            >
              ✕
            </button>
          </div>
        )}

        {/* 내용 */}
        <div className="bottom-sheet__body">{children}</div>
      </div>
    </>
  );
}
