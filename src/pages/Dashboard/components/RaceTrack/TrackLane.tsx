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

// ★ 캐릭터 CSS transition 과 반드시 동일하게 맞춤
const CAR_TRANSITION_MS = 2000;
const INITIAL_DELAY_MS = 200;

export default function TrackLane({
  member,
  rank,
  isLast,
  animate,
}: TrackLaneProps) {
  const [carPosition, setCarPosition] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    if (!animate) return;

    // 순위별로 20ms씩 엇박 출발 — 경주 출발선 느낌
    const delay = INITIAL_DELAY_MS + (rank - 1) * 20;

    const startTimer = setTimeout(() => {
      setIsMoving(true);
      setCarPosition(member.winRate);

      // CSS transition 이 끝나는 시점에 맞춰 idle 전환
      const endTimer = setTimeout(() => {
        setIsMoving(false);
        setArrived(true);
      }, CAR_TRANSITION_MS);

      return () => clearTimeout(endTimer);
    }, delay);

    return () => clearTimeout(startTimer);
  }, [animate, member.winRate, rank]);

  const idleClass =
    rank === 1 ? "car--bounce" :
    rank === 2 ? "car--wobble" :
    rank === 3 ? "car--float" :
    "car--shake";

  const carClass = [
    "car",
    isMoving ? "car--moving" : "",
    arrived ? idleClass : "",
  ]
    .filter(Boolean)
    .join(" ");

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
      <div
        className={`lane-track ${isMoving ? "lane-track--active" : ""}`}
        style={{ "--fill": `${carPosition}%` } as React.CSSProperties}
      >
        <div
          className={carClass}
          style={{ left: `${carPosition}%` }}
          title={`${member.winRate}%`}
        >
          {/* 보드게임 미플(Meeple) 이미지 */}
          <div className="meeple-wrapper" data-color={member.color}>
            <img
              src={CHARACTER_IMAGES[member.color]}
              alt={member.name}
              className="meeple-img"
            />
          </div>

          {/* 꼴찌 연기 파티클 */}
          {isLast && arrived && (
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
