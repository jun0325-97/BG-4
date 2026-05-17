// src/pages/Dashboard/components/RaceTrack/TrackLane.tsx

import { useEffect, useState } from "react";
import "./TrackLane.scss";
import { Member } from "../../../../types";

import imgRed from "../../../../assets/images/img-red-1.png";
import imgBlue from "../../../../assets/images/img-blue-1.png";
import imgGreen from "../../../../assets/images/img-green-1.png";
import imgYellow from "../../../../assets/images/img-yellow-1.png";

const CHARACTER_IMAGES: Record<string, string> = {
  red: imgRed,
  blue: imgBlue,
  green: imgGreen,
  yellow: imgYellow,
};

interface TrackLaneProps {
  member: Member;
  rank: number;
  isLast: boolean;
  animate: boolean;
}

export default function TrackLane({
  member,
  rank,
  isLast,
  animate,
}: TrackLaneProps) {
  const [carPosition, setCarPosition] = useState(0);

  useEffect(() => {
    if (animate) {
      // 모든 미플이 동시에 출발하도록 rank 딜레이 제거하고 100ms 고정 딜레이 적용!
      const timer = setTimeout(() => {
        setCarPosition(member.winRate);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [animate, member.winRate]);

  return (
    <div
      className={`track-lane ${rank === 1 ? "is-first" : ""} ${
        isLast ? "is-last" : ""
      }`}
      data-color={member.color}
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
          className={`car ${
            rank === 1 ? "car--bounce" :
            rank === 2 ? "car--wobble" :
            rank === 3 ? "car--float" :
            isLast ? "car--smoke" : ""
          }`}
          style={{ left: `${carPosition}%` }}
          title={`${member.winRate}%`}
        >
          {/* 보드게임 미플(Meeple)처럼 이미지 렌더링 */}
          <div className="meeple-wrapper" data-color={member.color}>
            <img
              src={CHARACTER_IMAGES[member.color]}
              alt={member.name}
              className="meeple-img"
            />
          </div>

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
