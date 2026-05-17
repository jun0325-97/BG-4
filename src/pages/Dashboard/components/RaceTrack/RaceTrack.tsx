// src/pages/Dashboard/components/RaceTrack/RaceTrack.tsx

import { useEffect, useState } from "react";
import "./RaceTrack.scss";
import { Member } from "../../../../types";
import TrackLane from "./TrackLane";

interface RaceTrackProps {
  members: Member[];
}

export default function RaceTrack({ members }: RaceTrackProps) {
  const sorted = [...members].sort((a, b) => b.winRate - a.winRate);

  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="race-track-wrapper">
      <div className="track-header">
        <h2 className="track-title">🏁 현재 순위</h2>
        <span className="track-subtitle">누적 승률 기준</span>
      </div>

      <div className="lanes-container">
        <div className="lanes">
          {sorted.map((member, index) => (
            <TrackLane
              key={member.id}
              member={member}
              rank={index + 1}
              isLast={index === sorted.length - 1}
              animate={animate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
