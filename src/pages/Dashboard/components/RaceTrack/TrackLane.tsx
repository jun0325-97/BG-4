// src/pages/Dashboard/components/RaceTrack/TrackLane.tsx

import { useEffect, useState } from "react";
import "./TrackLane.scss";
import { Member } from "../../../../types";

interface TrackLaneProps {
  member: Member;
  rank: number;
  isLast: boolean; // 꼴찌 여부
  animate: boolean; // 부모가 "출발!" 신호를 줄 때 true로 바뀜
}

const CAR_EMOJI: Record<string, string> = {
  red: "🚗",
  blue: "🚙",
  green: "🚕",
  yellow: "🚌",
};

export default function TrackLane({
  member,
  rank,
  isLast,
  animate,
}: TrackLaneProps) {
  // animate가 false면 0%, true면 실제 winRate 위치로
  const [carPosition, setCarPosition] = useState(0);

  useEffect(() => {
    if (animate) {
      // 약간의 딜레이 후 실제 위치로 이동 (rank마다 살짝 다르게 → 순차 출발 느낌)
      const timer = setTimeout(() => {
        setCarPosition(member.winRate);
      }, rank * 120); // 1등이 먼저 출발, 꼴찌가 마지막 출발

      return () => clearTimeout(timer);
    }
  }, [animate, member.winRate, rank]);

  return (
    <div
      className={`track-lane ${rank === 1 ? "is-first" : ""} ${
        isLast ? "is-last" : ""
      }`}
    >
      {/* 왼쪽: 순위 + 이름 */}
      <div className="lane-info">
        <span className="rank">{rank === 1 ? "👑" : `#${rank}`}</span>
        <span className="member-name" data-color={member.color}>
          {member.name}
        </span>
      </div>

      {/* 가운데: 트랙 */}
      <div className="lane-track">
        <div
          className={`car ${rank === 1 ? "car--bounce" : ""} ${
            isLast ? "car--smoke" : ""
          }`}
          style={{ left: `${carPosition}%` }}
          title={`${member.winRate}%`}
        >
          {CAR_EMOJI[member.color]}

          {/* 꼴찌 연기 파티클 */}
          {isLast && (
            <span className="smoke-container" aria-hidden="true">
              <span className="smoke smoke--1">💨</span>
              <span className="smoke smoke--2">💨</span>
              <span className="smoke smoke--3">💨</span>
            </span>
          )}
        </div>
      </div>

      {/* 오른쪽: 승률 */}
      <div className="lane-stat">
        <span className="win-rate">{member.winRate}%</span>
      </div>
    </div>
  );
}
