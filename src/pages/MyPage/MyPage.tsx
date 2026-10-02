// src/pages/MyPage/MyPage.tsx

import { useState, useMemo } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { Settings, ChevronRight } from "lucide-react";
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
import PageTransition from "../../components/common/PageTransition";
import CountUp from "../../components/common/CountUp";
import ScrollReveal from "../../components/common/ScrollReveal";
import { motion } from "framer-motion";
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
    감각: "🔔",
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
    전략: "♟️ 전략적 천재",
    설계: "⚙️ 빌드 장인",
    심리: "🎭 멘탈 브레이커",
    논리: "🔍 논리 깡패",
    감각: "🔔 감각 괴물",
  };
  const genreTitle = bestGenre ? GENRE_TITLES[bestGenre] : "🧭 보드게임 탐험가";

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

// ── 특별 뱃지 계산 (전체 멤버 비교 기반, 단독 1위만 부여) ─────────────────────────
interface SpecialBadge {
  key: string;
  emoji: string;
  label: string;
  tooltip: string;
}

function calculateSpecialBadges(
  memberId: string,
  members: any[],
  boardGames: any[],
  records: any[]
): SpecialBadge[] {
  const badges: SpecialBadge[] = [];
  
  if (members.length === 0 || records.length === 0) return badges;

  const memberStats: Record<string, {
    rank1: number, rank2: number, rank3: number, rank4: number,
    totalPlays: number, shortPlays: number, shortWins: number,
    longPlays: number, longWins: number, partyPlays: number,
    partyWins: number, strategyPlays: number, strategyWins: number,
    firstGameWins: number, gameWins: Record<string, number>
  }> = {};

  const playerStates: Record<string, {
    currentStreak: number, lastRank: number,
    streakBreaks: number, closerWins: number, underdogWins: number, giantKiller: number
  }> = {};

  members.forEach(m => {
    memberStats[m.id] = { rank1: 0, rank2: 0, rank3: 0, rank4: 0, totalPlays: 0, shortPlays: 0, shortWins: 0, longPlays: 0, longWins: 0, partyPlays: 0, partyWins: 0, strategyPlays: 0, strategyWins: 0, firstGameWins: 0, gameWins: {} };
    playerStates[m.id] = { currentStreak: 0, lastRank: 0, streakBreaks: 0, closerWins: 0, underdogWins: 0, giantKiller: 0 };
  });

  const GENRE_MAPPING: Record<string, string> = {
    "전략/수싸움": "전략", "엔진/덱빌딩": "설계", "마피아/블러핑": "심리",
    "테마/머더미스터리": "심리", "방탈출/추리": "논리", "퍼즐/타일놓기": "논리",
    "파티/순발력": "감각", "카드게임": "감각",
  };

  const sortedRecords = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // 전체 1위(보겜의 왕) 찾기 (자이언트 킬러 계산용 - 공식 승률 기반)
  const maxOverallRate = Math.max(...members.map(m => m.winRate || 0));
  const theKing = members.find(m => (m.winRate || 0) === maxOverallRate)?.id;

  sortedRecords.forEach(rec => {
    const dailyLogs = rec.playLogs.filter((log: any) => log.resultType !== "no_result");
    
    dailyLogs.forEach((log: any, index: number) => {
      const game = boardGames.find(g => g.id === log.gameId);
      if (!game) return;

      const duration = log.durationMinutes || 0;
      const cat = GENRE_MAPPING[game.genre];
      const isParty = cat === "감각";
      const isStrategy = cat === "전략" || cat === "논리";
      const isLastGameOfDay = (index === dailyLogs.length - 1);
      const isFirstGameOfDay = (index === 0);

      let anyOtherPlayerHadStreak = false;
      let theKingPlayed = false;
      let theKingWon = false;

      members.forEach(m => {
        if (playerStates[m.id].currentStreak >= 2) anyOtherPlayerHadStreak = true;
      });

      const participants = log.participatingMembers || members.map((m: any) => m.id);
      if (theKing && participants.includes(theKing)) theKingPlayed = true;

      participants.forEach((pid: string) => {
        if (!memberStats[pid]) return;
        const stat = memberStats[pid];
        stat.totalPlays++;
        
        const myResult = log.results.find((r: any) => r.memberId === pid);
        let isWin = false;
        let rank = 4;

        if (log.resultType === "ranked" && myResult?.rank) {
          rank = myResult.rank;
          if (rank === 1) { stat.rank1++; isWin = true; }
          else if (rank === 2) stat.rank2++;
          else if (rank === 3) stat.rank3++;
          else if (rank >= 4) stat.rank4++;
        } else if (log.resultType === "winner_only") {
          if (myResult?.isWinner) { stat.rank1++; isWin = true; rank = 1; }
          else { stat.rank4++; rank = 4; }
        }

        if (pid === theKing && isWin) theKingWon = true;

        if (isWin) {
          if (!stat.gameWins[game.id]) stat.gameWins[game.id] = 0;
          stat.gameWins[game.id]++;
        }

        if (duration <= 30) { stat.shortPlays++; if (isWin) stat.shortWins++; }
        if (duration >= 60) { stat.longPlays++; if (isWin) stat.longWins++; }
        if (isParty) { stat.partyPlays++; if (isWin) stat.partyWins++; }
        if (isStrategy) { stat.strategyPlays++; if (isWin) stat.strategyWins++; }

        const pState = playerStates[pid];
        if (isWin) {
          if (anyOtherPlayerHadStreak && pState.currentStreak < 2) pState.streakBreaks++;
          if (pState.lastRank === 4) pState.underdogWins++;
          if (isLastGameOfDay) pState.closerWins++;
          if (isFirstGameOfDay) stat.firstGameWins++;
          pState.currentStreak++;
        } else {
          pState.currentStreak = 0;
        }
        pState.lastRank = rank;
      });

      if (theKingPlayed && !theKingWon) {
        participants.forEach((pid: string) => {
          const res = log.results.find((r:any) => r.memberId === pid);
          if (res && (res.rank === 1 || res.isWinner) && pid !== theKing) {
            playerStates[pid].giantKiller++;
          }
        });
      }
    });
  });

  const getWinRate = (wins: number, plays: number) => plays >= 3 ? wins / plays : -1;
  const myStat = memberStats[memberId];
  if (!myStat || myStat.totalPlays === 0) return badges;

  // 동점자 발생 시 공식 종합 승률이 가장 '낮은' 사람에게 우선권을 주는 유틸리티
  const getOverallRate = (id: string) => members.find(m => m.id === id)?.winRate || 0;

  const isTop = (scoreMap: { id: string, score: number }[], minVal = 0) => {
    const valid = scoreMap.filter(x => x.score > minVal);
    if (valid.length === 0) return false;
    const maxScore = Math.max(...valid.map(x => x.score));
    const topPlayers = valid.filter(x => x.score === maxScore);
    // 동점 시 승률 오름차순 정렬 (승률 낮은 사람이 1순위)
    topPlayers.sort((a, b) => getOverallRate(a.id) - getOverallRate(b.id));
    return topPlayers[0].id === memberId;
  };

  const isBottom = (scoreMap: { id: string, score: number }[]) => {
    if (scoreMap.length === 0) return false;
    const minScore = Math.min(...scoreMap.map(x => x.score));
    const bottomPlayers = scoreMap.filter(x => x.score === minScore);
    // 동점 시 승률 오름차순 정렬 (승률 낮은 사람이 1순위)
    bottomPlayers.sort((a, b) => getOverallRate(a.id) - getOverallRate(b.id));
    return bottomPlayers[0].id === memberId;
  };

  // 1. 콩진호
  if (isTop(members.map(m => ({ id: m.id, score: memberStats[m.id]?.rank2 || 0 })), 1)) {
    badges.push({ key: "kong", emoji: "🥈", label: "콩진호", tooltip: "우승 문턱에서 미끄러진 횟수 크루 1위. 2인자도 아무나 하는 건 아닙니다." });
  }

  // 2. 스위스 (최소 1등 & 최소 4등 - 승률 낮은 자 우선)
  const rank1List = members.map(m => ({ id: m.id, score: memberStats[m.id]?.rank1 || 0 }));
  const rank4List = members.map(m => ({ id: m.id, score: memberStats[m.id]?.rank4 || 0 }));
  let hasSwiss = false;
  if (myStat.totalPlays >= 5 && isBottom(rank1List) && isBottom(rank4List)) {
    hasSwiss = true;
    badges.push({ key: "swiss", emoji: "🕊️", label: "스위스", tooltip: "1등도 가장 안 하고 꼴등도 가장 안 합니다. 완벽한 중립국 포지션." });
  }

  // 3. 주사위가 버린 자 (승률 단독 꼴찌)
  const partyRates = members.map(m => ({ id: m.id, score: getWinRate(memberStats[m.id]?.partyWins||0, memberStats[m.id]?.partyPlays||0) })).filter(x => x.score >= 0);
  if (partyRates.length > 0) {
    const minParty = Math.min(...partyRates.map(x => x.score));
    const bottoms = partyRates.filter(x => x.score === minParty);
    if (minParty < 0.25 && bottoms.length === 1 && bottoms[0].id === memberId) {
      badges.push({ key: "dice-cursed", emoji: "🎲", label: "주사위가 버린 자", tooltip: "파티/주사위 게임 승률 단독 최하위. 주사위 신에게 버림받았습니다." });
    }
  }

  // 4. 후반 캐리형
  if (isTop(members.map(m => ({ id: m.id, score: getWinRate(memberStats[m.id]?.longWins||0, memberStats[m.id]?.longPlays||0) })), 0.29)) {
    badges.push({ key: "late-carry", emoji: "⏱️", label: "후반 캐리형", tooltip: "플레이 타임 60분 이상 장기전 승률 1위. 시간이 지날수록 강해집니다." });
  }

  // 5. 모 아니면 도
  if (isTop(rank1List, 1) && isTop(rank4List, 1)) {
    badges.push({ key: "rollercoaster", emoji: "🎢", label: "모 아니면 도", tooltip: "1등 횟수 1위, 꼴등 횟수도 1위! 중간이 없는 상남자/상여자." });
  }

  // 6. 인간 알파고
  if (isTop(members.map(m => ({ id: m.id, score: getWinRate(memberStats[m.id]?.strategyWins||0, memberStats[m.id]?.strategyPlays||0) })), 0.29)) {
    badges.push({ key: "alphago", emoji: "🤖", label: "인간 알파고", tooltip: "전략/논리 장르 승률 1위. 기계 같은 두뇌의 소유자." });
  }

  // 7. 초반 러쉬형
  if (isTop(members.map(m => ({ id: m.id, score: getWinRate(memberStats[m.id]?.shortWins||0, memberStats[m.id]?.shortPlays||0) })), 0.29)) {
    badges.push({ key: "early-rush", emoji: "⚡", label: "초반 러쉬형", tooltip: "30분 이하 단기전 승률 1위. 빠른 눈치로 초반 멘탈을 털어버립니다." });
  }

  // 8. 모임의 예능캐
  if (isTop(partyRates, 0.29)) {
    badges.push({ key: "entertainer", emoji: "🎭", label: "모임의 예능캐", tooltip: "파티 게임 승률 1위. 복잡한 룰보다 텐션으로 승부합니다." });
  }

  // 9. 막타 장인
  if (isTop(members.map(m => ({ id: m.id, score: playerStates[m.id].closerWins })), 0)) {
    badges.push({ key: "closer", emoji: "🌙", label: "막타 장인", tooltip: "그날 모임의 '마지막 게임' 1등 횟수 1위. 집에 가기 전 집중력 최고조." });
  }

  // 10. 고춧가루 부대
  if (isTop(members.map(m => ({ id: m.id, score: playerStates[m.id].streakBreaks })), 0)) {
    badges.push({ key: "streak-breaker", emoji: "🌶️", label: "고춧가루 부대", tooltip: "남의 연승을 뺏어온 횟수 1위. 누군가 잘 나가는 꼴을 못 봅니다." });
  }

  // 11. 언더독
  if (isTop(members.map(m => ({ id: m.id, score: playerStates[m.id].underdogWins })), 0)) {
    badges.push({ key: "underdog", emoji: "🔥", label: "언더독", tooltip: "꼴찌 직후 바로 1등으로 역전한 횟수 1위. 무서운 반전 매력." });
  }

  // 12. 낭만 합격 (스위스 제외 1등 단독 꼴찌)
  if (!hasSwiss && myStat.totalPlays >= 5 && isBottom(rank1List)) {
    badges.push({ key: "romanticist", emoji: "💖", label: "낭만 합격", tooltip: "1등 횟수 최하위. 승리 따위는 세속적인 욕심일 뿐인 진정한 낭만파." });
  }

  // 👑 신규 1. 조커 (한 우물 장인)
  let bestGameScore = 0;
  Object.values(myStat.gameWins).forEach(wins => { if (wins > bestGameScore) bestGameScore = wins; });
  let isJoker = false;
  if (bestGameScore >= 3) { // 한 게임에서 최소 3번은 1등 해야 인정
    const maxWinsInThatGame = Math.max(...members.map(m => {
       let hw = 0;
       Object.keys(myStat.gameWins).forEach(gId => {
         if (myStat.gameWins[gId] === bestGameScore) {
           const theirWin = memberStats[m.id]?.gameWins[gId] || 0;
           if(theirWin > hw) hw = theirWin;
         }
       });
       return hw;
    }));
    // 내가 그 게임에서 단독 1위여야 함 (동점일 경우 승률 낮은 사람 우선)
    let topGameMasters = members.filter(m => {
       let hw = 0;
       Object.keys(myStat.gameWins).forEach(gId => {
         if (myStat.gameWins[gId] === bestGameScore) {
           const theirWin = memberStats[m.id]?.gameWins[gId] || 0;
           if(theirWin > hw) hw = theirWin;
         }
       });
       return hw === maxWinsInThatGame;
    });
    if (topGameMasters.length > 1) {
       topGameMasters.sort((a, b) => getOverallRate(a.id) - getOverallRate(b.id));
    }
    if (topGameMasters.length > 0 && topGameMasters[0].id === memberId) {
       isJoker = true;
       badges.push({ key: "joker", emoji: "🃏", label: "히든 조커", tooltip: "특정 게임 하나에서만큼은 1등 횟수 1위입니다. 한 우물 장인." });
    }
  }

  // 👑 신규 2. 자이언트 킬러
  if (theKing !== memberId && isTop(members.map(m => ({ id: m.id, score: playerStates[m.id].giantKiller })), 0)) {
    badges.push({ key: "giant-killer", emoji: "🗡️", label: "자이언트 킬러", tooltip: "크루 종합 승률 1위를 상대로 가장 많이 1등을 뺏어온 1등 담당 일진." });
  }

  // 👑 신규 3. 첫 판의 지배자 (퍼스트 블러드)
  if (isTop(members.map(m => ({ id: m.id, score: memberStats[m.id].firstGameWins })), 0)) {
    badges.push({ key: "first-blood", emoji: "⏱️", label: "첫 판의 지배자", tooltip: "모임의 그날 '첫 게임' 1등 횟수 1위. 시작부터 기선을 제압합니다." });
  }

  // 👑 신규 4. 다크호스
  // 종합 승률은 꼴찌인데 특정 장르 1개에서 1등인 사람
  const minOfficialRate = Math.min(...members.map(m => m.winRate || 0));
  const isBottomWinRate = (members.find(m => m.id === memberId)?.winRate || 0) === minOfficialRate;
  
  if (isBottomWinRate && (isTop(partyRates, 0.25) || isTop(members.map(m => ({ id: m.id, score: getWinRate(memberStats[m.id]?.strategyWins||0, memberStats[m.id]?.strategyPlays||0) })), 0.25))) {
    badges.push({ key: "dark-horse", emoji: "🌪️", label: "다크호스", tooltip: "종합 승률은 낮지만 특정 장르에서만큼은 1위! 방심하면 당합니다." });
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
    () => member ? calculateSpecialBadges(member.id, dynamicMembers, boardGames, records) : [],
    [member?.id, dynamicMembers, boardGames, records]
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
    <PageTransition>
      <div className="mypage-container">
      {/* 🍏 1단계: 애플 카드 스타일 프로필 헤더 */}
      <header className="mypage-header-apple" data-color={member.color}>
        <div className="header-top">
          <motion.div
            className="avatar-area"
            whileTap={{ scale: 0.85, y: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <img src={CHARACTER_IMAGES[member.color]} alt={member.name} className="character-img" />
          </motion.div>

          <div className="info-area">
            <div className="badges-row">
              <span className="title" data-color={member.color}>{title}</span>
              {stats.genreTitle && (
                <span className="genre-title" data-color={member.color}>{stats.genreTitle}</span>
              )}
              {/* 임시 비활성화: 언제든 다시 기능 살릴 수 있도록 주석 처리만 해둠
              {specialBadges.map((badge) => (
                <div key={badge.key} className="special-badge-wrap">
                  <span className="special-badge" data-color={member.color}>
                    {badge.emoji} {badge.label}
                  </span>
                  <div className="special-badge-tooltip">{badge.tooltip}</div>
                </div>
              ))}
              */}
            </div>
            <h1 className="name">{member.name}</h1>
          </div>
        </div>

        {/* 헤더 내부에 통합된 깔끔한 스탯 스트립 */}
        <div className="header-stats-strip">
          <div className="stat-item">
            <span className="stat-label">종합 승률</span>
            <div className="stat-value highlight">
              <CountUp end={stats.overallWinRate} suffix="%" />
            </div>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-label">총 플레이</span>
            <div className="stat-value">
              <CountUp end={stats.totalPlays} suffix="판" />
            </div>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-label">최대 연승</span>
            <div className="stat-value nemesis">
              <CountUp end={stats.maxStreak} suffix="연승" />
            </div>
          </div>
        </div>
      </header>

      {/* 🌟 장르별 승률 레이더 차트 (위젯) */}
      <ScrollReveal>
      <section className="chart-section-ios">
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
              <ResponsiveContainer width="100%" aspect={1.3}>
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={stats.radar}>
                  <PolarGrid stroke="#eeeeee" />
                  <PolarAngleAxis
                    dataKey="genre"
                    tick={{ fill: "#1a1a1a", fontSize: 12, fontWeight: 800 }}
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
      </ScrollReveal>

      {/* 기본 스탯 영역은 헤더로 통합되었으므로 삭제됨 (stats-grid) */}

      <ScrollReveal delay={0.1}>
      <div className="ios-widget-card favorite-game-widget">
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
      </ScrollReveal>



      {/* 💡 새로 추가된: 내 책장 보기 버튼 */}
      <ScrollReveal delay={0.2}>
      <section className="action-section-ios">
        <button
          className="library-link-btn"
          onClick={() => navigate(`/library?owner=${member.color}`)}
        >
          <span>{member.name}님이 보유한 보드게임 보기</span>
          <div className="btn-icon">
            <ChevronRight size={18} />
          </div>
        </button>
      </section>
      </ScrollReveal>
      </div>
    </PageTransition>
  );
}
