// src/pages/Dashboard/components/CrewStats/CrewStats.tsx

import { useMemo } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay } from "swiper/modules";
import "swiper/css";
import { useStore } from "../../../../store/useStore";
import "./CrewStats.scss";

function formatPlayTime(minutes: number): string {
  if (minutes === 0) return "0분";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

interface SlideData {
  id: string;
  icon: string;
  label: string;
  value: string;
  sub: string;
  theme: "red" | "blue" | "green" | "yellow" | "purple" | "gold";
}

export default function CrewStats() {
  const { records, boardGames, members } = useStore();

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    let totalGatherings = records.length;
    let totalPlays = 0;
    let totalMinutes = 0;
    let thisMonthGatherings = 0;
    const gamePlayCounts: Record<string, number> = {};
    const monthlyWins: Record<string, number> = {};
    members.forEach((m) => { monthlyWins[m.id] = 0; });

    records.forEach((rec) => {
      const isThisMonth = rec.date.startsWith(currentMonth);
      if (isThisMonth) thisMonthGatherings++;

      rec.playLogs.forEach((log) => {
        totalPlays++;
        totalMinutes += log.durationMinutes;

        const game = boardGames.find((g) => g.id === log.gameId);
        if (game) {
          gamePlayCounts[game.name] = (gamePlayCounts[game.name] || 0) + 1;
        }

        if (isThisMonth && log.resultType !== "no_result") {
          const participants = log.participatingMembers || members.map((m) => m.id);
          participants.forEach((memberId) => {
            const res = log.results.find((r) => r.memberId === memberId);
            if (log.resultType === "ranked" && res?.rank === 1) {
              monthlyWins[memberId] = (monthlyWins[memberId] || 0) + 1;
            } else if (log.resultType === "winner_only" && res?.isWinner) {
              monthlyWins[memberId] = (monthlyWins[memberId] || 0) + 1;
            }
          });
        }
      });
    });

    let mostPlayedGame = "";
    let maxGameCount = 0;
    Object.entries(gamePlayCounts).forEach(([name, count]) => {
      if (count > maxGameCount) { maxGameCount = count; mostPlayedGame = name; }
    });

    let mvpMemberId = "";
    let mvpWins = 0;
    Object.entries(monthlyWins).forEach(([id, wins]) => {
      if (wins > mvpWins) { mvpWins = wins; mvpMemberId = id; }
    });
    const mvpMember = members.find((m) => m.id === mvpMemberId);

    return {
      totalGatherings,
      totalPlays,
      totalTime: formatPlayTime(totalMinutes),
      thisMonthGatherings,
      mostPlayedGame,
      mostPlayedCount: maxGameCount,
      mvpMember: mvpMember && mvpWins > 0 ? mvpMember : null,
      mvpWins,
    };
  }, [records, boardGames, members]);

  const slides: SlideData[] = [
    ...(stats.mvpMember
      ? [{
          id: "mvp",
          icon: "🏆",
          label: "이번 달 MVP",
          value: stats.mvpMember.name,
          sub: `${stats.mvpWins}승으로 이번 달 1위!`,
          theme: (stats.mvpMember.color === "yellow" ? "gold" : stats.mvpMember.color) as SlideData["theme"],
        }]
      : []),
    {
      id: "meets",
      icon: "🔥",
      label: "TOTAL MEETS",
      value: `${stats.totalGatherings}회`,
      sub: "지금까지 함께한 모임",
      theme: "red",
    },
    {
      id: "games",
      icon: "🎲",
      label: "GAMES PLAYED",
      value: `${stats.totalPlays}판`,
      sub: "총 플레이한 게임 수",
      theme: "blue",
    },
    {
      id: "time",
      icon: "⏳",
      label: "PLAY TIME",
      value: stats.totalTime,
      sub: "크루가 쏟아부은 시간",
      theme: "purple",
    },
    {
      id: "month",
      icon: "📅",
      label: "THIS MONTH",
      value: `${stats.thisMonthGatherings}회`,
      sub: "이번 달 모임 횟수",
      theme: "green",
    },
    ...(stats.mostPlayedGame
      ? [{
          id: "bestpick",
          icon: "🚀",
          label: "BEST PICK",
          value: stats.mostPlayedGame,
          sub: `총 ${stats.mostPlayedCount}회 플레이`,
          theme: "yellow" as SlideData["theme"],
        }]
      : []),
  ];

  if (slides.length === 0) return null;

  // Swiper loop 버그 및 경고 방지: 슬라이드 개수가 적을 때 직접 복제본을 만들어 제공
  const swiperSlides = slides.length > 0 && slides.length <= 4 
    ? [...slides, ...slides] 
    : slides;

  return (
    <section className="crew-highlight">
      <Swiper
        modules={[Autoplay]}
        slidesPerView={1.22}
        spaceBetween={12}
        centeredSlides={true}
        grabCursor={true}
        loop={true}
        speed={600}
        touchRatio={1.1}
        resistanceRatio={0.85}
        watchSlidesProgress={true}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        className="crew-highlight__swiper"
      >
        {swiperSlides.map((slide, index) => (
          <SwiperSlide key={`${slide.id}-${index}`}>
            <div className={`hl-card hl-card--${slide.theme}`}>
              {/* 배경 워터마크 이모지 */}
              <span className="hl-card__watermark" aria-hidden="true">
                {slide.icon}
              </span>
              {/* 컨텐츠 */}
              <div className="hl-card__body">
                <span className="hl-card__label">{slide.label}</span>
                <p className="hl-card__value">{slide.value}</p>
                <span className="hl-card__sub">{slide.sub}</span>
              </div>
              {/* 아이콘 뱃지 */}
              <div className="hl-card__icon-badge">{slide.icon}</div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
