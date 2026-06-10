import { useMemo } from "react";
import { useStore } from "../../store/useStore";
import "./Dashboard.scss";
import CrewStats from "./components/CrewStats/CrewStats";
import RaceTrack from "./components/RaceTrack/RaceTrack";
import MemberCards from "./components/MemberCards/MemberCards";
import { getDynamicMembers } from "../../utils/calculateWinRates";

export default function Dashboard() {
  const { members, records } = useStore();

  const dynamicMembers = useMemo(() => {
    return getDynamicMembers(members, records);
  }, [members, records]);

  return (
    <div className="dashboard-container">
      <section className="stats-section">
        <CrewStats />
      </section>

      <section className="race-section">
        <RaceTrack members={dynamicMembers} />
      </section>

      <section className="member-section">
        <MemberCards members={dynamicMembers} />
      </section>
    </div>
  );
}
