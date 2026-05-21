// src/pages/MyPage/MyPage.tsx

import { useParams, Navigate, useNavigate } from "react-router-dom";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { useStore } from "../../store/useStore";
import { getTitleByRank } from "../../utils/getTitleByRank";
import "./MyPage.scss";



// 실제 데이터 기반 통계 계산 헬퍼
function calculateMemberStats(memberId: string, records: any[], boardGames: any[], members: any[]) {
  const GENRE_MAPPING: Record<string, string> = {
    "전략/수싸움": "전략",
    "엔진/덱빌딩": "설계",
    "마피아/블러핑": "심리",
    "테마/머더미스터리": "심리",
    "방탈출/추리": "논리",
    "퍼즐/타일놓기": "논리",
    "파티/순발력": "감각",
    "카드게임": "감각",
  };

  const stats = {
    전략: { plays: 0, wins: 0 },
    설계: { plays: 0, wins: 0 },
    심리: { plays: 0, wins: 0 },
    논리: { plays: 0, wins: 0 },
    감각: { plays: 0, wins: 0 },
  };

  let totalPlays = 0;
  let totalPlayTime = 0;
  const gamePlayCounts: Record<string, number> = {};

  records.forEach((rec) => {
    rec.playLogs.forEach((log: any) => {
      const participants = log.participatingMembers || members.map((m: any) => m.id);
      if (!participants.includes(memberId)) return;

      const game = boardGames.find((g: any) => g.id === log.gameId);
      if (!game) return;

      if (log.resultType === "no_result") return;

      totalPlays++;
      totalPlayTime += log.durationMinutes;
      gamePlayCounts[game.name] = (gamePlayCounts[game.name] || 0) + 1;

      const category = GENRE_MAPPING[game.genre];
      if (!category) return;

      const myResult = log.results.find((r: any) => r.memberId === memberId);
      let winValue = 0; // 💡 부분 승점 (0.0 ~ 1.0)

      if (log.resultType === "ranked") {
        const myRank = myResult?.rank;
        if (myRank) {
          const n = participants.length;
          if (n <= 1) {
            winValue = 1.0; // 혼자 했으면 무조건 1점
          } else {
            // 공식: (참여 인원 수 - 내 등수) / (참여 인원 수 - 1)
            // ex) 4명 중 1등: 3/3 = 1.0
            // ex) 4명 중 2등: 2/3 = 0.66
            // ex) 4명 중 4등: 0/3 = 0.0
            const safeRank = Math.min(myRank, n); 
            winValue = Math.max(0, (n - safeRank) / (n - 1));
          }
        }
      } else if (log.resultType === "winner_only") {
        winValue = myResult?.isWinner === true ? 1.0 : 0.0;
      }

      const c = category as keyof typeof stats;
      stats[c].plays++;
      stats[c].wins += winValue; // 💡 단순 1,0이 아닌 소수점 점수 누적
    });
  });

  const radar = Object.keys(stats).map((category) => {
    const s = stats[category as keyof typeof stats];
    // 💡 보정 승률: (승리 + 1) / (참여 + 2) * 100
    const score = Math.round(((s.wins + 1) / (s.plays + 2)) * 100);
    return { genre: category, win: score };
  });

  let favoriteGame = "아직 없음";
  let maxCount = 0;
  Object.entries(gamePlayCounts).forEach(([name, count]) => {
    if (count > maxCount) {
      maxCount = count;
      favoriteGame = name;
    }
  });

  // TODO: 천적 및 타이틀 계산 로직 추가
  return {
    radar,
    playTime: totalPlayTime,
    totalPlays,
    favoriteGame,
    nemesis: "비밀",
    genreTitle: "보드게임 탐험가",
  };
}

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
  const { members, records, boardGames } = useStore();
  const member = members.find((m) => m.color === memberId);

  if (!member) return <Navigate to="/" replace />;

  const sortedMembers = [...members].sort((a, b) => b.winRate - a.winRate);
  const rank = sortedMembers.findIndex((m) => m.id === member.id) + 1;
  const { emoji, title } = getTitleByRank(rank);

  // 현재 멤버의 실제 통계 데이터 연산
  const stats = calculateMemberStats(member.id, records, boardGames, members);
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
          <span className="value">{stats.totalPlays}회</span>
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
