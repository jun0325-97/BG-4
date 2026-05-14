// src/components/layout/Header.tsx

import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react"; // 귀여운 아이콘 라이브러리 사용
import "./Header.scss";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  return (
    <header className="global-header">
      <div className="logo">
        <Link to="/" onClick={closeMenu}>
          🎲 SPIEL CREW
        </Link>
      </div>

      {/* 모바일 햄버거 버튼 */}
      <button
        className="hamburger-btn"
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {/* 네비게이션 링크들 */}
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
        <Link to="/mypage" onClick={closeMenu}>
          My Page
        </Link>
      </nav>

      {/* 모바일에서 메뉴 열렸을 때 뒷배경 어둡게 처리 */}
      {isMenuOpen && <div className="overlay" onClick={closeMenu}></div>}
    </header>
  );
}
