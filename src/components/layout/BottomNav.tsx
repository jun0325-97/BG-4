// src/components/layout/BottomNav.tsx

import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Home, BookOpen, Archive, User, Plus, LogOut } from "lucide-react";
import { useStore } from "../../store/useStore";
import { useAuthStore } from "../../store/useAuthStore";
import { supabase } from "../../utils/supabase";
import { getKoreanName } from "../../utils/getKoreanName";
import "./BottomNav.scss";

interface BottomNavProps {
  onFabClick: () => void;
}

const NAV_ITEMS = [
  { to: "/", label: "홈", icon: Home },
  { to: "/library", label: "게임 보관함", icon: BookOpen },
];

export default function BottomNav({ onFabClick }: BottomNavProps) {
  const [isMyPageOpen, setIsMyPageOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const myPageBtnRef = useRef<HTMLButtonElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { members } = useStore();
  const { user, clearAuth } = useAuthStore();

  const currentUsername = user?.email?.split("@")[0] || "";
  const currentKoreanName = getKoreanName(currentUsername);

  // 본인이 최상단에 오도록 정렬
  const sortedMembers = [...members].sort((a, b) => {
    if (a.name === currentKoreanName) return -1;
    if (b.name === currentKoreanName) return 1;
    return 0;
  });

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearAuth();
    navigate("/login");
  };

  const isMyPageActive = location.pathname.startsWith("/mypage");

  // 팝업 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target as Node) &&
        myPageBtnRef.current &&
        !myPageBtnRef.current.contains(e.target as Node)
      ) {
        setIsMyPageOpen(false);
      }
    };
    if (isMyPageOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMyPageOpen]);

  return (
    <>
      {/* 마이페이지 멤버 선택 팝업 */}
      {isMyPageOpen && (
        <div className="mypage-popup" ref={popupRef}>
          <div className="mypage-popup__members">
            {sortedMembers.map((member) => (
              <button
                key={member.id}
                className="mypage-popup__member-btn"
                data-color={member.color}
                onClick={() => {
                  navigate(`/mypage/${member.color}`);
                  setIsMyPageOpen(false);
                }}
              >
                <span className="member-dot" data-color={member.color} />
                <span className="member-name">
                  {member.name}
                  {member.name === currentKoreanName && (
                    <span className="member-me-badge">나</span>
                  )}
                </span>
              </button>
            ))}
          </div>
          <div className="mypage-popup__footer">
            <button className="mypage-popup__logout-btn" onClick={handleLogout}>
              <LogOut size={14} />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      )}

      {/* 바텀 탭바 */}
      <nav className="bottom-nav">
        {/* 왼쪽 그룹 */}
        <div className="bottom-nav__group">
          {NAV_ITEMS.slice(0, 2).map(({ to, label, icon: Icon }) => {
            const isActive =
              to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={`bottom-nav__tab ${isActive ? "active" : ""}`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>

        {/* 중앙 FAB */}
        <div className="bottom-nav__fab-wrapper">
          <button
            className="bottom-nav__fab"
            onClick={onFabClick}
            aria-label="기록 추가"
          >
            <Plus size={26} strokeWidth={2.5} />
          </button>
        </div>

        {/* 오른쪽 그룹 */}
        <div className="bottom-nav__group">
          <Link
            to="/archive"
            className={`bottom-nav__tab ${location.pathname.startsWith("/archive") ? "active" : ""}`}
          >
            <Archive size={22} strokeWidth={location.pathname.startsWith("/archive") ? 2.5 : 2} />
            <span>모임 기록</span>
          </Link>

          <button
            ref={myPageBtnRef}
            className={`bottom-nav__tab ${isMyPageActive || isMyPageOpen ? "active" : ""}`}
            onClick={() => setIsMyPageOpen((prev) => !prev)}
            aria-label="마이 페이지"
          >
            <User size={22} strokeWidth={isMyPageActive || isMyPageOpen ? 2.5 : 2} />
            <span>마이 페이지</span>
          </button>
        </div>
      </nav>
    </>
  );
}
