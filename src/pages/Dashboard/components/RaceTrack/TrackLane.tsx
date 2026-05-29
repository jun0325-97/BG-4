// src/pages/Dashboard/components/RaceTrack/TrackLane.tsx

import { useEffect, useState } from "react";
import { motion, useAnimation, useMotionValue, useTransform, animate as framerAnimate } from "framer-motion";
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
  animate: boolean; // boolean from parent to start animation
}

const INITIAL_DELAY_MS = 200;

export default function TrackLane({
  member,
  rank,
  isLast,
  animate: shouldAnimate,
}: TrackLaneProps) {
  const [arrived, setArrived] = useState(false);
  const controls = useAnimation(); // 자동차 자체의 모션(y, rotate)을 위한 컨트롤러
  const fillProgress = useMotionValue(0); // 0부터 winRate까지 동기화될 진행도
  const fillPercentage = useTransform(fillProgress, v => `${v}%`); // left와 --fill에 공통 적용될 퍼센트 문자열

  useEffect(() => {
    if (!shouldAnimate) return;

    const delay = INITIAL_DELAY_MS + (rank - 1) * 100;
    
    const runAnimation = async () => {
      await new Promise(r => setTimeout(r, delay));

      // 1. 부유하는 듯한 부드러운 Y축 바운스 (달리는 동안)
      controls.start({
        y: ["-50%", "calc(-50% - 4px)"],
        transition: { 
          duration: 0.5, 
          repeat: Infinity, 
          repeatType: "reverse", 
          ease: "easeInOut" 
        }
      });

      // 2. 부드럽게 앞으로 쏠리기 (Rotate)
      controls.start({
        rotate: 12,
        transition: { duration: 0.4, ease: "easeOut" }
      });

      // 3. 트랙 게이지(--fill)와 자동차 위치(left)를 완벽하게 동기화하며 천천히 전진
      await framerAnimate(fillProgress, member.winRate, {
        type: "spring",
        stiffness: 25, // 값을 낮춰서 훨씬 천천히 부드럽게 감속되도록 조정
        damping: 12,
        mass: 1.5,
        restDelta: 0.01 // 끝까지 완벽하게 정지할 때까지 대기
      });
      
      // 4. 도착 후 바운스 종료 및 자연스러운 정렬
      controls.stop();
      
      await controls.start({
        y: "-50%",
        rotate: 0,
        scale: [1, 1.05, 1], // 가벼운 숨고르기
        transition: {
          duration: 0.8,
          ease: "easeOut"
        }
      });
      
      setArrived(true);
    };

    runAnimation();
  }, [shouldAnimate, member.winRate, rank, controls, fillProgress]);

  const idleClass =
    rank === 1 ? "car--bounce" :
    rank === 2 ? "car--wobble" :
    rank === 3 ? "car--float" :
    "car--shake";

  return (
    <div
      className={`track-lane ${rank === 1 ? "is-first" : ""} ${
        isLast ? "is-last" : ""
      }`}
      data-color={member.color}
    >
      <div className="lane-info">
        <span className="rank">{rank === 1 ? "👑" : `#${rank}`}</span>
        <span className="member-name" data-color={member.color}>
          {member.name}
        </span>
      </div>

      {/* 트랙 전체를 motion.div로 감싸서 --fill CSS 변수를 자연스럽게 애니메이션 */}
      <motion.div
        className={`lane-track ${arrived ? "lane-track--active" : ""}`}
        style={{ "--fill": fillPercentage } as any}
      >
        <motion.div
          className={`car ${arrived ? idleClass : ""}`}
          initial={{ y: "-50%", x: "-50%", rotate: 0 }}
          animate={controls}
          title={`${member.winRate}%`}
          style={{ position: "absolute", zIndex: 5, left: fillPercentage }} // fillPercentage와 완벽 동기화
        >
          <div className="meeple-wrapper" data-color={member.color}>
            <img
              src={CHARACTER_IMAGES[member.color]}
              alt={member.name}
              className="meeple-img"
            />
          </div>

          {isLast && arrived && (
            <span className="smoke-container" aria-hidden="true">
              <span className="smoke smoke--1">💨</span>
              <span className="smoke smoke--2">💨</span>
              <span className="smoke smoke--3">💨</span>
            </span>
          )}
        </motion.div>
      </motion.div>

      <div className="lane-stat">
        <span className="win-rate">{member.winRate}%</span>
      </div>
    </div>
  );
}
