import { useMemo } from "react";
import { useStore } from "../../store/useStore";
import "./Dashboard.scss";
import CrewStats from "./components/CrewStats/CrewStats";
import RankingPodium from "./components/RankingPodium/RankingPodium";
import MemberCards from "./components/MemberCards/MemberCards";
import VoteBanner from "../../components/common/VoteBanner";
import { getDynamicMembers } from "../../utils/calculateWinRates";

export default function Dashboard() {
  const { members, records } = useStore();

  const dynamicMembers = useMemo(() => {
    return getDynamicMembers(members, records);
  }, [members, records]);

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

      <section className="member-section">
        <MemberCards members={dynamicMembers} />
      </section>
    </div>
  );
}
