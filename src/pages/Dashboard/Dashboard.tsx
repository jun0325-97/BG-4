import { useMemo } from "react";
import { useStore } from "../../store/useStore";
import "./Dashboard.scss";
import CrewStats from "./components/CrewStats/CrewStats";
import RankingPodium from "./components/RankingPodium/RankingPodium";
import RecentGatherings from "./components/RecentGatherings/RecentGatherings";
import MemberCards from "./components/MemberCards/MemberCards";
import DashboardSkeleton from "./components/DashboardSkeleton/DashboardSkeleton";
import VoteBanner from "../../components/common/VoteBanner";
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
      <section className="vote-banner-section">
        <VoteBanner />
      </section>

      <section className="stats-section">
        <CrewStats />
      </section>

      <section className="race-section">
        <RankingPodium members={dynamicMembers} />
      </section>

      <RecentGatherings />

      <section className="member-section">
        <MemberCards members={dynamicMembers} />
      </section>
    </div>
  );
}
