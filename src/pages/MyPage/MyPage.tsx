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

import imgRed from "../../assets/images/img-red-1.png";
import imgBlue from "../../assets/images/img-blue-1.png";
import imgGreen from "../../assets/images/img-green-1.png";
import imgYellow from "../../assets/images/img-yellow-1.png";

const CHARACTER_IMAGES: Record<string, string> = {
  red: imgRed,
  blue: imgBlue,
  green: imgGreen,
  yellow: imgYellow,
};



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
  let totalRatedPlays = 0;
  let totalPlayTime = 0;
  let totalOverallWins = 0;
  const gamePlayCounts: Record<string, number> = {};
  
  let currentStreak = 0;
  let maxStreak = 0;

  // 기록을 날짜순으로 오름차순 정렬하여 연승 계산
  const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date));

  sortedRecords.forEach((rec) => {
    rec.playLogs.forEach((log: any) => {
      const participants = log.participatingMembers || members.map((m: any) => m.id);
      if (!participants.includes(memberId)) return;

      const game = boardGames.find((g: any) => g.id === log.gameId);
      if (!game) return;

      // 누적 플레이 타임과 총 플레이 횟수는 승패 결과 유무와 무관하게 모든 게임을 집계
      totalPlays++;
      totalPlayTime += log.durationMinutes;
      gamePlayCounts[game.name] = (gamePlayCounts[game.name] || 0) + 1;

      // 승률 및 천적 계산은 승패가 있는 게임만
      if (log.resultType === "no_result") return;

      totalRatedPlays++;

      const myResult = log.results.find((r: any) => r.memberId === memberId);
      let winValue = 0;

      if (log.resultType === "ranked") {
        const myRank = myResult?.rank;
        if (myRank) {
          const n = participants.length;
          if (n <= 1) {
            winValue = 1.0;
          } else {
            const safeRank = Math.min(myRank, n);
            winValue = Math.max(0, (n - safeRank) / (n - 1));
          }

          // 연승 로직: 1등이면 연승 추가, 아니면 초기화
          if (myRank === 1) {
            currentStreak++;
            if (currentStreak > maxStreak) maxStreak = currentStreak;
          } else {
            currentStreak = 0;
          }
        }
      } else if (log.resultType === "winner_only") {
        winValue = myResult?.isWinner === true ? 1.0 : 0.0;

        // 연승 로직: 승리 시 연승 추가, 아니면 초기화
        if (myResult?.isWinner === true) {
          currentStreak++;
          if (currentStreak > maxStreak) maxStreak = currentStreak;
        } else if (myResult?.isWinner === false) {
          currentStreak = 0;
        }
      }

      totalOverallWins += winValue;

      const category = GENRE_MAPPING[game.genre];
      if (category) {
        const c = category as keyof typeof stats;
        stats[c].plays++;
        stats[c].wins += winValue;
      }
    });
  });

  let bestGenre = "";
  let highestScore = -1;

  const radar = Object.keys(stats).map((category) => {
    const s = stats[category as keyof typeof stats];
    const score = s.plays === 0 ? 0 : Math.round((s.wins / s.plays) * 100);

    if (s.plays > 0 && score > highestScore) {
      highestScore = score;
      bestGenre = category;
    }

    return { genre: category, win: score };
  });

  const overallWinRate = totalRatedPlays === 0 ? 0 : Math.round((totalOverallWins / totalRatedPlays) * 100);

  const GENRE_TITLES: Record<string, string> = {
    전략: "전략적 천재",
    설계: "빌드 깎는 장인",
    심리: "마스터 마인드",
    논리: "명탐정",
    감각: "타고난 감각의 소유자",
  };
  const genreTitle = bestGenre ? GENRE_TITLES[bestGenre] : "보드게임 탐험가";

  let favoriteGame = "아직 없음";
  let maxCount = 0;
  Object.entries(gamePlayCounts).forEach(([name, count]) => {
    if (count > maxCount) {
      maxCount = count;
      favoriteGame = name;
    }
  });

  return {
    radar,
    overallWinRate,
    playTime: totalPlayTime,
    totalPlays,
    favoriteGame,
    maxStreak, // 천적 대신 최대 연승 기록
    genreTitle,
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
  const { title } = getTitleByRank(rank);

  // 현재 멤버의 실제 통계 데이터 연산
  const stats = calculateMemberStats(member.id, records, boardGames, members);
  const chartColor = THEME_COLORS[member.color as keyof typeof THEME_COLORS];

  return (
    <div className="mypage-container">
      {/* 💡 세련된 가로형 프로필 헤더 */}
      <header className="mypage-header-sleek" data-color={member.color}>
        <div className="avatar-area">
          <img src={CHARACTER_IMAGES[member.color]} alt={member.name} className="character-img" />
        </div>
        
        <div className="info-area">
          <span className="title">{title}</span>
          <h1 className="name">{member.name}</h1>
        </div>
      </header>

      {/* 기본 & 추가 스탯 영역 그룹화 */}
      <div className="stats-grid">
        <div className="stat-box">
          <span className="label">종합 승률</span>
          <span className="value highlight-win">{stats.overallWinRate}%</span>
        </div>
        <div className="stat-box">
          <span className="label">총 플레이</span>
          <span className="value">{stats.totalPlays}회</span>
        </div>
        <div className="stat-box">
          <span className="label">최대 연승</span>
          <span className="value nemesis-value">{stats.maxStreak}연승</span>
        </div>
        <div className="stat-box">
          <span className="label">누적 시간</span>
          <span className="value">{stats.playTime}분</span>
        </div>
      </div>

      <div className="stat-box full-width">
        <span className="label">가장 많이 플레이한 최애 게임</span>
        <span className="value highlight-game">🎲 {stats.favoriteGame}</span>
      </div>

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
          {member.name}님이 보유한 보드게임 보기
        </button>
      </section>
    </div>
  );
}
