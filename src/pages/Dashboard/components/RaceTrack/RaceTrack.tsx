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

  // 컴포넌트 마운트 직후엔 false, 잠깐 후에 true → 애니메이션 트리거
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // 브라우저가 첫 프레임 그린 직후에 출발 신호
    const timer = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="race-track-wrapper">
      <div className="track-header">
        <h2 className="track-title">🏁 현재 순위</h2>
        <span className="track-subtitle">누적 승률 기준</span>
      </div>

      <div className="finish-line-label">🏆 결승선</div>

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
  );
}
