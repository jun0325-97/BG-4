import { useMemo } from "react";
import { useStore } from "../../store/useStore";
import "./Dashboard.scss";
import CrewStats from "./components/CrewStats/CrewStats";
import RankingPodium from "./components/RankingPodium/RankingPodium";
import RecentGatherings from "./components/RecentGatherings/RecentGatherings";
import MemberCards from "./components/MemberCards/MemberCards";
import DashboardSkeleton from "./components/DashboardSkeleton/DashboardSkeleton";
import { getDynamicMembers } from "../../utils/calculateWinRates";

export default function Dashboard() {
  const { members, records, isLoading, isInitialFetched } = useStore();

  const dynamicMembers = useMemo(() => {
    return getDynamicMembers(members, records);
  }, [members, records]);

  if (isLoading && !isInitialFetched) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="dashboard-container">
      {/* 🏎️ 히어로: 레이스트랙 랭킹 */}
      <section className="race-section--hero">
        <RankingPodium members={dynamicMembers} />
      </section>

      {/* 📊 크루 통계 슬라이더 */}
      <section className="stats-section">
        <CrewStats />
      </section>

      {/* 📅 최근 모임 기록 */}
      <div style={{ padding: "0 1rem" }}>
        <RecentGatherings />
      </div>

      {/* 👥 멤버 카드 */}
      <section className="member-section">
        <MemberCards members={dynamicMembers} />
      </section>
    </div>
  );
}
