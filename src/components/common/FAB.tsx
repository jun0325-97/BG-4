import { Plus } from "lucide-react";
import "./FAB.scss";

export default function FAB() {
  const handleClick = () => {
    // 나중에 모달이나 바텀 시트를 여는 로직이 들어갈 곳이야!
    alert("새로운 기록 추가 / 새로운 게임 등록 모달 오픈 예정!");
  };

  return (
    <button
      className="global-fab"
      onClick={handleClick}
      aria-label="추가 메뉴 열기"
    >
      <Plus size={32} />
    </button>
  );
}
