import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Sparkles, KeyRound, ChevronRight, ArrowLeft } from "lucide-react";
import { supabase } from "../../utils/supabase";
import { useAuthStore } from "../../store/useAuthStore";
import { useStore } from "../../store/useStore";
import "./Login.scss";

import imgRed from "../../assets/images/img-red-2.png";
import imgBlue from "../../assets/images/img-blue-2.png";
import imgGreen from "../../assets/images/img-green-2.png";
import imgYellow from "../../assets/images/img-yellow-2.png";

interface ProfileItem {
  id: string;
  name: string;
  role: string;
  color: string;
  bgColor: string;
  glowColor: string;
  image?: string;
}

const CREW_PROFILES: ProfileItem[] = [
  {
    id: "youngjun",
    name: "영준",
    role: "Red Crew",
    color: "#fd5a46",
    bgColor: "rgba(253, 90, 70, 0.1)",
    glowColor: "rgba(253, 90, 70, 0.22)",
    image: imgRed,
  },
  {
    id: "gayoung",
    name: "가영",
    role: "Blue Crew",
    color: "#058cd7",
    bgColor: "rgba(5, 140, 215, 0.1)",
    glowColor: "rgba(5, 140, 215, 0.22)",
    image: imgBlue,
  },
  {
    id: "yoonhyuk",
    name: "윤혁",
    role: "Green Crew",
    color: "#00995e",
    bgColor: "rgba(0, 153, 94, 0.1)",
    glowColor: "rgba(0, 153, 94, 0.22)",
    image: imgGreen,
  },
  {
    id: "hansol",
    name: "한솔",
    role: "Yellow Crew",
    color: "#e69b00",
    bgColor: "rgba(255, 197, 103, 0.16)",
    glowColor: "rgba(255, 197, 103, 0.28)",
    image: imgYellow,
  },
];

const GUEST_PROFILE: ProfileItem = {
  id: "guest",
  name: "게스트",
  role: "Guest Mode",
  color: "#6366f1",
  bgColor: "rgba(99, 102, 241, 0.1)",
  glowColor: "rgba(99, 102, 241, 0.2)",
};

const ALL_PROFILES = [...CREW_PROFILES, GUEST_PROFILE];

export default function Login() {
  const navigate = useNavigate();
  const { setSession, setUser } = useAuthStore();

  // 기본 디폴트 선택값 없음 (요구사항)
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  // 수동 로그인 모드 (비상용/직접 입력용)
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualUsername, setManualUsername] = useState("");
  const [manualPassword, setManualPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoginSuccess, setIsLoginSuccess] = useState(false);

  const selectedProfile = ALL_PROFILES.find((p) => p.id === selectedProfileId);

  // 공통 로그인 실행 로직
  const executeLogin = async (username: string, passwordInput: string = "123456") => {
    setLoading(true);
    setError(null);

    const fakeEmail = `${username.trim().toLowerCase()}@crew.com`;

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password: passwordInput,
    });

    if (authError) {
      setError("로그인에 실패했습니다. 아이디 또는 비밀번호를 확인해주세요.");
      setLoading(false);
      return;
    }

    if (data.session && data.user) {
      setIsLoginSuccess(true);
      setSession(data.session);
      setUser(data.user);

      await Promise.all([
        new Promise((resolve) => setTimeout(resolve, 600)),
        useStore.getState().fetchAll(),
      ]);

      navigate("/");
    }
  };

  // 프로필 선택 후 로그인 버튼 클릭
  const handleProfileLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfileId) return;
    await executeLogin(selectedProfileId);
  };

  // 프로필 카드 클릭 시 선택 & 이미 선택된 카드 다시 누르면 바로 로그인
  const handleSelectCard = (id: string) => {
    if (loading) return;
    if (selectedProfileId === id) {
      // 이미 선택된 카드를 다시 터치하면 즉시 로그인
      executeLogin(id);
    } else {
      setSelectedProfileId(id);
      setError(null);
    }
  };

  // 수동 로그인 폼 제출
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeLogin(manualUsername, manualPassword);
  };

  return (
    <div className={`login-container ${loading ? "login-container--loading" : ""}`}>
      {/* 로그인 성공 시 패널 뒤에 나타나는 로딩 텍스트 */}
      {isLoginSuccess && <div className="success-loading-text">Loading...</div>}

      <div className={`login-box ${isLoginSuccess ? "slide-down" : ""}`}>
        {/* BMS Club 로고 타이틀 */}
        <h2 className="animated-title">
          {"BMS Club".split("").map((char, index) => (
            <span
              key={index}
              className={index > 3 ? "club-text" : "bms-text"}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </h2>

        {!isManualMode ? (
          <>
            <div className="login-header-desc">
              <p className="login-subtitle">누구로 접속할까요?</p>
              <p className="login-tip">내 프로필을 선택하면 간편하게 로그인됩니다</p>
            </div>

            <form onSubmit={handleProfileLogin} className="profile-selection-form">
              {/* 4인 크루 2x2 그리드 */}
              <div className="profile-grid" role="radiogroup" aria-label="크루 프로필 선택">
                {CREW_PROFILES.map((profile) => {
                  const isChecked = selectedProfileId === profile.id;
                  return (
                    <button
                      key={profile.id}
                      type="button"
                      role="radio"
                      aria-checked={isChecked}
                      className={`profile-card ${isChecked ? "profile-card--selected" : ""}`}
                      style={
                        {
                          "--profile-color": profile.color,
                          "--profile-bg": profile.bgColor,
                          "--profile-glow": profile.glowColor,
                        } as React.CSSProperties
                      }
                      onClick={() => handleSelectCard(profile.id)}
                      disabled={loading}
                    >
                      {/* 라디오 체크 인디케이터 */}
                      <span className={`profile-radio ${isChecked ? "checked" : ""}`}>
                        {isChecked && <Check size={13} strokeWidth={3} />}
                      </span>

                      {/* 아바타 이미지 */}
                      <div className="profile-avatar-wrap">
                        <img
                          src={profile.image}
                          alt={profile.name}
                          className="profile-avatar-img"
                        />
                      </div>

                      {/* 이름 & 역할 */}
                      <span className="profile-name">{profile.name}</span>
                      <span className="profile-role">{profile.role}</span>
                    </button>
                  );
                })}
              </div>

              {/* 게스트 프로필 카드 */}
              <div className="guest-section">
                <button
                  type="button"
                  role="radio"
                  aria-checked={selectedProfileId === GUEST_PROFILE.id}
                  className={`guest-card ${selectedProfileId === GUEST_PROFILE.id ? "guest-card--selected" : ""}`}
                  style={
                    {
                      "--profile-color": GUEST_PROFILE.color,
                      "--profile-bg": GUEST_PROFILE.bgColor,
                      "--profile-glow": GUEST_PROFILE.glowColor,
                    } as React.CSSProperties
                  }
                  onClick={() => handleSelectCard(GUEST_PROFILE.id)}
                  disabled={loading}
                >
                  <div className="guest-card__left">
                    <div className="guest-avatar-icon">
                      <Sparkles size={18} />
                    </div>
                    <div className="guest-info">
                      <span className="guest-name">게스트 (Guest)</span>
                      <span className="guest-desc">기록 둘러보기 및 방문자 모드</span>
                    </div>
                  </div>

                  <span className={`profile-radio ${selectedProfileId === GUEST_PROFILE.id ? "checked" : ""}`}>
                    {selectedProfileId === GUEST_PROFILE.id && <Check size={13} strokeWidth={3} />}
                  </span>
                </button>
              </div>

              {error && <p className="error-message">{error}</p>}

              {/* 하단 로그인 액션 버튼 */}
              <div className="button-group">
                <button
                  type="submit"
                  disabled={!selectedProfileId || loading}
                  className={`btn-primary login-cta-btn ${selectedProfileId ? "ready" : ""}`}
                  style={
                    selectedProfile
                      ? ({
                          "--btn-active-color": selectedProfile.color,
                          "--btn-active-glow": selectedProfile.glowColor,
                        } as React.CSSProperties)
                      : undefined
                  }
                >
                  {loading ? (
                    <span>로그인 중...</span>
                  ) : selectedProfile ? (
                    <span className="btn-content">
                      <strong>{selectedProfile.name}</strong>(으)로 시작하기
                      <ChevronRight size={18} />
                    </span>
                  ) : (
                    <span>프로필을 선택해주세요</span>
                  )}
                </button>
              </div>

              {/* 수동 로그인 모드 전환 버튼 */}
              <div className="manual-toggle-wrap">
                <button
                  type="button"
                  className="manual-toggle-btn"
                  onClick={() => {
                    setIsManualMode(true);
                    setError(null);
                  }}
                >
                  <KeyRound size={13} />
                  <span>아이디 / 비밀번호 직접 입력</span>
                </button>
              </div>
            </form>
          </>
        ) : (
          /* 직접 입력 모드 */
          <form onSubmit={handleManualSubmit} className="manual-login-form">
            <div className="manual-header">
              <button
                type="button"
                className="manual-back-btn"
                onClick={() => {
                  setIsManualMode(false);
                  setError(null);
                }}
              >
                <ArrowLeft size={16} />
                <span>프로필 선택으로 돌아가기</span>
              </button>
            </div>

            <div className="input-group">
              <label htmlFor="manual-username">아이디 (영문)</label>
              <input
                id="manual-username"
                type="text"
                value={manualUsername}
                onChange={(e) => setManualUsername(e.target.value)}
                placeholder="예: youngjun"
                required
                autoFocus
              />
            </div>

            <div className="input-group">
              <label htmlFor="manual-password">비밀번호</label>
              <input
                id="manual-password"
                type="password"
                value={manualPassword}
                onChange={(e) => setManualPassword(e.target.value)}
                placeholder="******"
                required
              />
            </div>

            {error && <p className="error-message">{error}</p>}

            <div className="button-group">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "처리중..." : "로그인"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
