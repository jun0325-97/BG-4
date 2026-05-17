// src/pages/MyPage/MyPage.tsx

import { useParams, Navigate, useNavigate } from "react-router-dom";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { MEMBERS } from "../../mocks/dummyData";
import { getTitleByRank } from "../../utils/getTitleByRank";
import "./MyPage.scss";

// 💡 서버(백엔드)가 복잡한 전적을 계산해서 아래처럼 '요약본'을 준다고 가정!
const MOCK_STATS: Record<string, any> = {
  red: {
    playTime: 1200,
    nemesis: "가영",
    favoriteGame: "스플렌더",
    genreTitle: "엔진빌딩 깎는 노인",
    radar: [
      { genre: "엔진빌딩", win: 80 },
      { genre: "마피아", win: 30 },
      { genre: "전략", win: 60 },
      { genre: "협력", win: 40 },
      { genre: "파티", win: 50 },
    ],
  },
  blue: {
    playTime: 950,
    nemesis: "한솔",
    favoriteGame: "테라포밍 마스",
    genreTitle: "전략적 암살자",
    radar: [
      { genre: "엔진빌딩", win: 40 },
      { genre: "마피아", win: 50 },
      { genre: "전략", win: 90 },
      { genre: "협력", win: 30 },
      { genre: "파티", win: 60 },
    ],
  },
  green: {
    playTime: 820,
    nemesis: "영준",
    favoriteGame: "팬데믹",
    genreTitle: "평화주의자",
    radar: [
      { genre: "엔진빌딩", win: 50 },
      { genre: "마피아", win: 20 },
      { genre: "전략", win: 40 },
      { genre: "협력", win: 90 },
      { genre: "파티", win: 80 },
    ],
  },
  yellow: {
    playTime: 1040,
    nemesis: "윤혁",
    favoriteGame: "아발론",
    genreTitle: "입만 산 마피아",
    radar: [
      { genre: "엔진빌딩", win: 30 },
      { genre: "마피아", win: 85 },
      { genre: "전략", win: 50 },
      { genre: "협력", win: 40 },
      { genre: "파티", win: 90 },
    ],
  },
};

// 차트 색상을 멤버 고유색에 맞추기 위한 매핑
const THEME_COLORS = {
  red: "#ff5757",
  blue: "#5271ff",
  green: "#7ed957",
  yellow: "#ffde59",
};

export default function MyPage() {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const member = MEMBERS.find((m) => m.color === memberId);

  if (!member) return <Navigate to="/" replace />;

  const sortedMembers = [...MEMBERS].sort((a, b) => b.winRate - a.winRate);
  const rank = sortedMembers.findIndex((m) => m.id === member.id) + 1;
  const { emoji, title } = getTitleByRank(rank);

  // 현재 멤버의 통계 데이터 꺼내오기
  const stats = MOCK_STATS[member.color];
  const chartColor = THEME_COLORS[member.color as keyof typeof THEME_COLORS];

  return (
    <div className="mypage-container">
      <header className="mypage-header" data-color={member.color}>
        <div className="profile-icon">{emoji}</div>
        <h1 className="name">{member.name}</h1>
        <p className="title">{title}</p>
        {/* 장르 기반 서브 타이틀 추가 */}
        <p className="sub-title">"{stats.genreTitle}"</p>
      </header>

      {/* 기본 & 추가 스탯 영역 */}
      <section className="stats-section">
        <div className="stat-box">
          <span className="label">종합 승률</span>
          <span className="value">{member.winRate}%</span>
        </div>
        <div className="stat-box">
          <span className="label">플레이 횟수</span>
          <span className="value">12회</span>
        </div>
      </section>

      <section className="stats-section">
        <div className="stat-box">
          <span className="label">누적 플레이</span>
          <span className="value">{stats.playTime}분</span>
        </div>
        <div className="stat-box">
          <span className="label">나의 천적</span>
          <span className="value">{stats.nemesis}</span>
        </div>
      </section>

      {/* 💡 새로 추가된: 최애 게임 영역 */}
      <section className="stats-section single-box">
        <div className="stat-box full-width">
          <span className="label">가장 많이 플레이한 최애 게임</span>
          <span className="value highlight">🎲 {stats.favoriteGame}</span>
        </div>
      </section>

      {/* 장르별 승률 레이더 차트 */}
      <section className="chart-section">
        <h2 className="section-title">장르별 승률 분석</h2>
        <div className="radar-wrapper">
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={stats.radar}>
              <PolarGrid stroke="#eeeeee" />
              <PolarAngleAxis
                dataKey="genre"
                tick={{ fill: "#666", fontSize: 12, fontWeight: 700 }}
              />
              {/* 테마 색상으로 차트 채우기! */}
              <Radar
                name={member.name}
                dataKey="win"
                stroke={chartColor}
                fill={chartColor}
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 💡 새로 추가된: 내 책장 보기 버튼 */}
      <section className="action-section">
        <button 
          className="library-link-btn"
          onClick={() => navigate(`/library?owner=${member.color}`)}
        >
          {member.name} 님이 보유한 보드게임 보기 📚
        </button>
      </section>
    </div>
  );
}
