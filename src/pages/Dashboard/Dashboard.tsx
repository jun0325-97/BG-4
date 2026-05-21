import { useMemo } from "react";
import { useStore } from "../../store/useStore";
import "./Dashboard.scss";
import RaceTrack from "./components/RaceTrack/RaceTrack";
import MemberCards from "./components/MemberCards/MemberCards";
import { PlayLog } from "../../types";

export default function Dashboard() {
  const { members, records } = useStore();

  // 실제 모임 기록을 바탕으로 멤버별 종합 보정 승률 계산
  const dynamicMembers = useMemo(() => {
    // 1. 멤버별 누적 승점/플레이 횟수 초기화
    const stats: Record<string, { plays: number; wins: number }> = {};
    members.forEach(m => {
      stats[m.id] = { plays: 0, wins: 0 };
    });

    // 2. 기록 순회하며 점수 누적 (부분 승점 반영)
    records.forEach(rec => {
      rec.playLogs.forEach((log: PlayLog) => {
        if (log.resultType === "no_result") return; // 협력/기타 승률 제외

        const participants = log.participatingMembers || members.map(m => m.id);
        const n = participants.length;

        participants.forEach(memberId => {
          if (!stats[memberId]) return;

          const res = log.results.find(r => r.memberId === memberId);
          let winValue = 0;

          if (log.resultType === "ranked") {
            const myRank = res?.rank;
            if (myRank) {
              if (n <= 1) {
                winValue = 1.0;
              } else {
                const safeRank = Math.min(myRank, n);
                winValue = Math.max(0, (n - safeRank) / (n - 1));
              }
            }
          } else if (log.resultType === "winner_only") {
            winValue = res?.isWinner ? 1.0 : 0.0;
          }

          stats[memberId].plays += 1;
          stats[memberId].wins += winValue;
        });
      });
    });

    // 3. 멤버 객체에 보정 승률(winRate) 덮어씌우기
    return members.map(m => {
      const s = stats[m.id];
      // 💡 보정 승률: (승점 + 1) / (참여 + 2) * 100
      const calculatedWinRate = Math.round(((s.wins + 1) / (s.plays + 2)) * 100);
      return { ...m, winRate: calculatedWinRate };
    });
  }, [members, records]);

  return (
    <div className="dashboard-container">
      <section className="race-section">
        <RaceTrack members={dynamicMembers} />
      </section>

      <section className="member-section">
        <MemberCards members={dynamicMembers} />
      </section>
    </div>
  );
}
