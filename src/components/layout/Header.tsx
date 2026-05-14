// src/components/layout/Header.tsx

import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, ChevronDown, ChevronUp } from "lucide-react"; // 아이콘 추가
import { MEMBERS } from "../../mocks/dummyData"; // 친구 목록 가져오기
import "./Header.scss";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  // 💡 마이페이지 하위 메뉴 열림 상태
  const [isMyPageOpen, setIsMyPageOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (isMenuOpen) setIsMyPageOpen(false); // 전체 메뉴 닫을 때 하위 메뉴도 초기화
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsMyPageOpen(false);
  };

  return (
    <header className="global-header">
      <div className="logo">
        <Link to="/" onClick={closeMenu}>
          🎲 SPIEL CREW
        </Link>
      </div>

      <button
        className="hamburger-btn"
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {/* 네비게이션 링크들: 'open' 클래스로 애니메이션 제어 */}
      <nav className={`nav-links ${isMenuOpen ? "open" : ""}`}>
        <Link to="/" onClick={closeMenu}>
          Dashboard
        </Link>
        <Link to="/library" onClick={closeMenu}>
          Library
        </Link>
        <Link to="/archive" onClick={closeMenu}>
          Archive
        </Link>

        {/* 💡 My Page를 버튼으로 변경하고 하위 메뉴 추가 */}
        <div className="mypage-menu-container">
          <button
            className="mypage-toggle-btn"
            onClick={() => setIsMyPageOpen(!isMyPageOpen)}
          >
            My Page{" "}
            {isMyPageOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {/* 하위 메뉴 (토글) */}
          <div className={`submenu ${isMyPageOpen ? "show" : ""}`}>
            {MEMBERS.map((member) => (
              <Link
                key={member.id}
                to={`/mypage/${member.color}`}
                onClick={closeMenu}
                className="submenu-link"
              >
                <span
                  className="dot"
                  style={{ backgroundColor: member.color }}
                ></span>
                {member.name}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {isMenuOpen && <div className="overlay" onClick={closeMenu}></div>}
    </header>
  );
}
