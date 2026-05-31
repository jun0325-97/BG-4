import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown, ChevronUp, LogOut } from "lucide-react";
import { useStore } from "../../store/useStore";
import { useAuthStore } from "../../store/useAuthStore";
import { supabase } from "../../utils/supabase";
import { getKoreanName } from "../../utils/getKoreanName";
import "./Header.scss";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMyPageOpen, setIsMyPageOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY <= 50) {
        setIsVisible(true);
      } else if (currentScrollY < lastScrollY.current) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 50) {
        // 메뉴가 열려있을 때는 헤더를 숨기지 않음
        if (!isMenuOpen) setIsVisible(false);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMenuOpen]);

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
    <>
      <header className={`global-header ${isVisible ? "visible" : "hidden"}`}>
        <div className="logo">
          <Link to="/" onClick={closeMenu}>
            <span className="logo-bms">BMS</span><span className="logo-crew"> Crew</span>
          </Link>
        </div>

        <button
          className="hamburger-btn"
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <Menu size={28} />
        </button>
      </header>

      <nav className={`nav-links ${isMenuOpen ? "open" : ""}`}>
        <button className="close-btn" onClick={closeMenu} aria-label="Close menu">
          <X size={28} />
        </button>

        <Link to="/" onClick={closeMenu}>
          Dashboard
        </Link>
        <Link to="/library" onClick={closeMenu}>
          Library
        </Link>
        <Link to="/archive" onClick={closeMenu}>
          Diary
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
                  data-color={member.color}
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
    </>
  );
}
