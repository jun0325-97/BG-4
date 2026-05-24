import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import { useAuthStore } from "../../store/useAuthStore";
import { useStore } from "../../store/useStore";
import "./Login.scss";

export default function Login() {
  const navigate = useNavigate();
  const { setSession, setUser } = useAuthStore();

  // 이메일 대신 아이디(영문 이름) 입력으로 변경
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoginSuccess, setIsLoginSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Supabase는 이메일 기반이므로, 입력받은 아이디 뒤에 가상의 도메인을 붙여서 처리합니다.
    const fakeEmail = `${username.trim().toLowerCase()}@crew.com`;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: fakeEmail,
      password,
    });

    if (error) {
      setError("아이디나 비밀번호가 올바르지 않습니다.");
      setLoading(false);
    } else if (data.session && data.user) {
      // 1. 패널 애니메이션을 위해 먼저 상태 변경
      setIsLoginSuccess(true);

      // 2. Auth 상태를 전역 저장소에 업데이트 (이때 App.tsx에서 onAuthStateChange 이벤트를 통해 fetchAll을 호출할 수 있지만,
      // 여기서 명시적으로 대기하기 위해 직접 호출)
      setSession(data.session);
      setUser(data.user);

      // 패널이 슬라이드 다운되는 애니메이션 최소 시간 확보 (0.6초) + 병렬 데이터 로딩
      await Promise.all([
        new Promise(resolve => setTimeout(resolve, 600)),
        useStore.getState().fetchAll()
      ]);

      // 3. 모든 데이터가 다 준비되면 대시보드로 이동
      navigate("/");
    }
  };

  return (
    <div className="login-container">
      {/* 로그인 성공 시 패널 뒤에 나타나는 로딩 텍스트 */}
      {isLoginSuccess && (
        <div className="success-loading-text">
          Loading...
        </div>
      )}

      <div className={`login-box ${isLoginSuccess ? 'slide-down' : ''}`}>
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

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">ID</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name"
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="******"
              required
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <div className="button-group">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "Processing..." : "Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
