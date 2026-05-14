// src/pages/Dashboard/Dashboard.tsx

import "./Dashboard.scss";
import { MEMBERS } from "../../mocks/dummyData";
import RaceTrack from "./components/RaceTrack/RaceTrack";
import MemberCards from "./components/MemberCards/MemberCards";

export default function Dashboard() {
  return (
    <div className="dashboard-container">
      <section className="race-section">
        <RaceTrack members={MEMBERS} />
      </section>

      <section className="member-section">
        <MemberCards members={MEMBERS} />
      </section>
    </div>
  );
}
