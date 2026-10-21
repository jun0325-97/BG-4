// src/components/layout/Header.tsx

import { Link } from "react-router-dom";
import { Calculator, Timer } from "lucide-react";
import "./Header.scss";

interface HeaderProps {
  onOpenScoreSheet?: () => void;
  onOpenTurnTimer?: () => void;
}

export default function Header({ onOpenScoreSheet, onOpenTurnTimer }: HeaderProps) {
  return (
    <header className="global-header">
      <div className="logo">
        <Link to="/">
          <span className="logo-bms">BMS</span>
          <span className="logo-crew"> Club</span>
        </Link>
      </div>

      <div className="header-actions">
        <button
          type="button"
          className="header-tool-btn"
          onClick={onOpenScoreSheet}
          title="실시간 종이 점수 계산기"
          aria-label="실시간 종이 점수 계산기"
        >
          <Calculator size={15} />
          <span>점수판</span>
        </button>

        <button
          type="button"
          className="header-tool-btn"
          onClick={onOpenTurnTimer}
          title="스마트 턴 타이머"
          aria-label="스마트 턴 타이머"
        >
          <Timer size={15} />
          <span>타이머</span>
        </button>
      </div>
    </header>
  );
}
