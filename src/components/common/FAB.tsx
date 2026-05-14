// src/components/common/FAB.tsx

import { Plus } from "lucide-react";
import "./FAB.scss";

// 💡 외부(Layout)에서 클릭 이벤트를 받을 수 있도록 타입 정의!
interface FABProps {
  onClick: () => void;
}

export default function FAB({ onClick }: FABProps) {
  return (
    <button
      className="global-fab"
      onClick={onClick} // Layout이 시키는 대로 작동!
      aria-label="추가 메뉴 열기"
    >
      <Plus size={32} />
    </button>
  );
}
