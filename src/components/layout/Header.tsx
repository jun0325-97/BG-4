import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, ChevronUp, LogOut } from "lucide-react";
import { useStore } from "../../store/useStore";
import { useAuthStore } from "../../store/useAuthStore";
import { supabase } from "../../utils/supabase";
import "./Header.scss";

const getKoreanName = (username: string) => {
  switch (username.toLowerCase()) {
    case "hansol": return "한솔";
    case "yoonhyuk": return "윤혁";
    case "gayoung": return "가영";
    case "youngjun": return "영준";
    default: return "";
  }
};

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMyPageOpen, setIsMyPageOpen] = useState(false);

  const { user, clearAuth } = useAuthStore();
  const { members } = useStore();
  const navigate = useNavigate();

  const currentUsername = user?.email?.split("@")[0] || "";
  const currentKoreanName = getKoreanName(currentUsername);

  // 본인이 가장 위에 오도록 정렬
  const sortedMembers = [...members].sort((a, b) => {
    if (a.name === currentKoreanName) return -1;
    if (b.name === currentKoreanName) return 1;
    return 0;
  });

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    if (isMenuOpen) setIsMyPageOpen(false);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setIsMyPageOpen(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearAuth();
    navigate("/login");
  };

  return (
    <header className="global-header">
      <div className="logo">
        <Link to="/" onClick={closeMenu}>
          🎲 보미새
        </Link>
      </div>

      <button
        className="hamburger-btn"
        onClick={toggleMenu}
        aria-label="Toggle menu"
      >
        {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

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

        <div className="mypage-menu-container">
          <button
            className="mypage-toggle-btn"
            onClick={() => setIsMyPageOpen(!isMyPageOpen)}
          >
            My Page{" "}
            {isMyPageOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          <div className={`submenu ${isMyPageOpen ? "show" : ""}`}>
            {sortedMembers.map((member) => (
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
                {member.name} {member.name === currentKoreanName && "(나)"}
              </Link>
            ))}
          </div>
        </div>
        
        {/* 메뉴 최하단 영역으로 분리된 로그아웃 버튼 */}
        <div className="nav-bottom-actions">
          <button onClick={handleLogout} className="global-logout-btn">
            <LogOut size={16} /> 로그아웃
          </button>
        </div>
      </nav>

      {isMenuOpen && <div className="overlay" onClick={closeMenu}></div>}
    </header>
  );
}
