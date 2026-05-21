import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../utils/supabase";
import { useAuthStore } from "../../store/useAuthStore";
import "./Login.scss";

export default function Login() {
  const navigate = useNavigate();
  const { setSession, setUser } = useAuthStore();
  
  // 이메일 대신 아이디(영문 이름) 입력으로 변경
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } else if (data.session && data.user) {
      setSession(data.session);
      setUser(data.user);
      navigate("/");
    }
    
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Boardgame Crew</h2>
        <p>크루 멤버 전용 로그인</p>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">아이디 (이름 영문)</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="예: hansol"
              required
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
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
      </div>
    </div>
  );
}
