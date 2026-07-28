// src/pages/MyPage/MyPage.tsx

import { useState, useMemo } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { useStore } from "../../store/useStore";
import { useAuthStore } from "../../store/useAuthStore";
import { getTitleByRank } from "../../utils/getTitleByRank";
import { getKoreanName } from "../../utils/getKoreanName";
import { getDynamicMembers } from "../../utils/calculateWinRates";
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

  const userCatGameCounts: Record<string, Record<string, number>> = {
    전략: {},
    설계: {},
    심리: {},
    논리: {},
    감각: {},
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
      let isWon = false;

      if (log.resultType === "ranked") {
        const myRank = myResult?.rank;
        if (myRank && myRank > 0) {
          const n = participants.length;
          if (n <= 1) {
            winValue = 1.0;
          } else {
            const safeRank = Math.min(myRank, n);
            winValue = Math.max(0, (n - safeRank) / (n - 1));
          }

          if (myRank === 1) {
            isWon = true;
          }
        }
      } else if (log.resultType === "winner_only") {
        if (myResult?.isWinner === true) {
          winValue = 1.0;
          isWon = true;
        }
      }

      // 💡 연승 로직: 승리 시 연승 +1, 승리가 아닌 모든 경우(패배/2등 이하/결과 미입력 등) 0으로 초기화
      if (isWon) {
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else {
        currentStreak = 0;
      }

      totalOverallWins += winValue;

      const category = GENRE_MAPPING[game.genre];
      if (category) {
        const c = category as keyof typeof stats;
        stats[c].plays++;
        stats[c].wins += winValue;
        userCatGameCounts[c][game.name] = (userCatGameCounts[c][game.name] || 0) + 1;
      }
    });
  });

  const GENRE_EMOJIS: Record<string, string> = {
    전략: "♟️",
    설계: "⚙️",
    심리: "🎭",
    논리: "🔍",
    감각: "⚡",
  };

  let bestGenre = "";
  let highestScore = -1;

  // 레이더 차트 데이터 — 축 라벨에 이모지 포함
  const radar = Object.keys(stats).map((category) => {
    const s = stats[category as keyof typeof stats];
    const score = s.plays === 0 ? 0 : Math.round((s.wins / s.plays) * 100);

    if (s.plays > 0 && score > 0 && score > highestScore) {
      highestScore = score;
      bestGenre = category;
    }

    const emoji = GENRE_EMOJIS[category] || "";
    return { genre: `${emoji} ${category}`, win: score };
  });

  // 장르별 세부 정보 및 대표 게임 구성 (승률 높은 순서 정렬)
  const genreDetails = Object.keys(stats).map((cat) => {
    const s = stats[cat as keyof typeof stats];
    const score = s.plays === 0 ? 0 : Math.round((s.wins / s.plays) * 100);

    // 1. 유저가 플레이했던 해당 장르 게임 (판수 순)
    const userPlayed = Object.entries(userCatGameCounts[cat] || {})
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name);

    // 2. 크루 보유 라이브러리 게임
    const libraryGames = boardGames
      .filter((g) => GENRE_MAPPING[g.genre] === cat)
      .map((g) => g.name);

    // 중복 제거 및 조합 (최대 2개)
    const gameSet = new Set<string>();
    userPlayed.forEach((n) => gameSet.add(n));
    libraryGames.forEach((n) => gameSet.add(n));

    return {
      category: cat,
      plays: s.plays,
      score,
      games: Array.from(gameSet).slice(0, 2),
      hasUserPlayed: userPlayed.length > 0,
    };
  }).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.plays - a.plays;
  });

  const overallWinRate = totalRatedPlays === 0 ? 0 : Math.round((totalOverallWins / totalRatedPlays) * 100);

  const GENRE_TITLES: Record<string, string> = {
    전략: "전략적 천재",
    설계: "빌드 장인",
    심리: "멘탈 브레이커",
    논리: "논리 깡패",
    감각: "감각 괴물",
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
    genreDetails,
    overallWinRate,
    playTime: totalPlayTime,
    totalPlays,
    favoriteGame,
    maxStreak, // 최대 연승 기록
    genreTitle,
  };
}

// ── 특별 뱃지 계산 (전체 멤버 비교 기반) ─────────────────────────
interface SpecialBadge {
  key: string;
  label: string;
}

function calculateSpecialBadges(
  memberId: string,
  members: any[],
  boardGames: any[]
): SpecialBadge[] {
  const badges: SpecialBadge[] = [];

  // ── 1. 게임 대주주: 보유 게임 수 최다 ─────────────
  const ownedCounts = members.map((m) => ({
    id: m.id,
    count: boardGames.filter((g) => g.ownerId === m.id).length,
  }));
  const maxOwned = Math.max(...ownedCounts.map((x) => x.count));
  if (maxOwned > 0) {
    const topOwners = ownedCounts.filter((x) => x.count === maxOwned);
    if (topOwners.length === 1 && topOwners[0].id === memberId) {
      badges.push({ key: "game-tycoon", label: "게임 대주주" });
    }
  }

  // ── 2. 맞짱 전문가: 2인 전용 게임(min=max=2) 보유 최다 ─
  const duelCounts = members.map((m) => ({
    id: m.id,
    count: boardGames.filter(
      (g) => g.ownerId === m.id && g.minPlayers === 2 && g.maxPlayers === 2
    ).length,
  }));
  const maxDuel = Math.max(...duelCounts.map((x) => x.count));
  if (maxDuel > 0) {
    const topDuel = duelCounts.filter((x) => x.count === maxDuel);
    if (topDuel.length === 1 && topDuel[0].id === memberId) {
      badges.push({ key: "duel-expert", label: "맞짱 러버" });
    }
  }

  return badges;
}

// 차트 색상을 멤버 고유색에 맞추기 위한 매핑
const THEME_COLORS = {
  red: "#ff5757",
  blue: "#5271ff",
  green: "#7ed957",
  yellow: "#ffde59",
};

export default function MyPage() {
  const [isEditingFavorite, setIsEditingFavorite] = useState(false);
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const { members, records, boardGames, updateMemberFavoriteGame } = useStore();
  const { user } = useAuthStore();
  const member = members.find((m) => m.color === memberId);

  const stats = useMemo(
    () => member ? calculateMemberStats(member.id, records, boardGames, members) : null,
    [member?.id, records, boardGames, members]
  );

  const dynamicMembers = useMemo(() => getDynamicMembers(members, records), [members, records]);

  const specialBadges = useMemo(
    () => member ? calculateSpecialBadges(member.id, members, boardGames) : [],
    [member?.id, members, boardGames]
  );

  if (!member || !stats) return <Navigate to="/" replace />;

  const sortedMembers = [...dynamicMembers].sort((a, b) => b.winRate - a.winRate);
  const rank = sortedMembers.findIndex((m) => m.id === member.id) + 1;
  const { title } = getTitleByRank(rank);
  const chartColor = THEME_COLORS[member.color as keyof typeof THEME_COLORS];

  const currentUsername = user?.email?.split("@")[0] || "";
  const currentKoreanName = getKoreanName(currentUsername);
  const isMe = member.name === currentKoreanName;

  const favoriteGameObj = member.favoriteGameId
    ? boardGames.find((g) => g.id === member.favoriteGameId)
    : null;
  const favoriteGameName = favoriteGameObj ? favoriteGameObj.name : "아직 설정되지 않음";

  const handleFavoriteChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value === "" ? null : e.target.value;
    try {
      await updateMemberFavoriteGame(member.id, newId);
      setIsEditingFavorite(false);
    } catch (err) {
      console.error(err);
      alert("최애 게임 저장에 실패했습니다. DB에 favorite_game_id 컬럼이 있는지 확인해주세요.");
    }
  };

  return (
    <div className="mypage-container">
      {/* 💡 세련된 가로형 프로필 헤더 */}
      <header className="mypage-header-sleek" data-color={member.color}>
        <div className="avatar-area">
          <img src={CHARACTER_IMAGES[member.color]} alt={member.name} className="character-img" />
        </div>

        <div className="info-area">
          <div className="badges-row">
            <span className="title" data-color={member.color}>{title}</span>
            {stats.genreTitle && (
              <span className="genre-title" data-color={member.color}>{stats.genreTitle}</span>
            )}
            {specialBadges.map((badge) => (
              <span key={badge.key} className="special-badge" data-color={member.color}>
                {badge.label}
              </span>
            ))}
          </div>
          <h1 className="name">{member.name}</h1>
        </div>
      </header>

      {/* 🌟 장르별 승률 레이더 차트 */}
      <section className="chart-section">
        <h2 className="section-title">장르별 승률 분석</h2>
        {stats.totalPlays === 0 ? (
          <div className="chart-empty">
            <span className="chart-empty__icon">🎲</span>
            <p className="chart-empty__text">아직 플레이 기록이 없어요</p>
            <p className="chart-empty__sub">게임을 플레이하면 장르별 승률을 분석해드릴게요!</p>
          </div>
        ) : (
          <>
            <div className="radar-wrapper">
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={stats.radar}>
                  <PolarGrid stroke="#eeeeee" />
                  <PolarAngleAxis
                    dataKey="genre"
                    tick={{ fill: "#1a1a1a", fontSize: 13, fontWeight: 900 }}
                  />
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

            {/* 🌟 승률 순위별 장르 콤팩트 요약 리스트 */}
            <div className="genre-rank-list">
              {stats.genreDetails.map((item, index) => (
                <div key={item.category} className="genre-rank-row">
                  <div className="genre-label-wrap">
                    <span className="rank-num">{index + 1}.</span>
                    <span className="cat-name">{item.category}</span>
                    <span className="score-val">
                      {item.plays > 0 ? `${item.score}%` : "-"}
                    </span>
                  </div>

                  <div className="game-tags-row">
                    {item.games.map((gName, gIdx) => (
                      <span key={gIdx} className={`game-chip ${item.hasUserPlayed ? "played" : "preset"}`}>
                        {gName}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* 기본 & 추가 스탯 영역 그룹화 */}
      <div className="stats-grid">
        <div className="stat-box">
          <span className="label">종합 승률</span>
          <span className="value highlight-win">{stats.overallWinRate}%</span>
        </div>
        <div className="stat-box">
          <span className="label">최대 연승</span>
          <span className="value nemesis-value">{stats.maxStreak}연승</span>
        </div>
      </div>

      <div className="stat-box full-width favorite-game-card">
        <div className="favorite-game-header">
          <span className="label">최애 게임</span>
          {isMe && (
            <button
              className="edit-favorite-btn"
              onClick={() => setIsEditingFavorite(!isEditingFavorite)}
              aria-label="최애 게임 설정"
            >
              <Settings size={14} />
            </button>
          )}
        </div>

        {isEditingFavorite ? (
          <select
            value={member.favoriteGameId || ""}
            onChange={handleFavoriteChange}
            className="favorite-game-select"
            autoFocus
            onBlur={() => setIsEditingFavorite(false)}
          >
            <option value="">선택하지 않음</option>
            {[...boardGames].sort((a, b) => a.name.localeCompare(b.name, 'ko')).map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        ) : (
          <div className="favorite-game-display">
            {favoriteGameObj?.imageUrl && (
              <img
                src={favoriteGameObj.imageUrl}
                alt={favoriteGameName}
                className="favorite-game-thumb"
              />
            )}
            <span className="value highlight-game">
              {member.favoriteGameId ? ` ${favoriteGameName}` : "선택하지 않음"}
            </span>
          </div>
        )}
      </div>



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
