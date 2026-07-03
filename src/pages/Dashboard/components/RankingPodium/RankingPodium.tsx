import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { Member } from "../../../../types";
import "./RankingPodium.scss";

import imgRed from "../../../../assets/images/img-red-2.png";
import imgBlue from "../../../../assets/images/img-blue-2.png";
import imgGreen from "../../../../assets/images/img-green-2.png";
import imgYellow from "../../../../assets/images/img-yellow-2.png";

const CHARACTER_IMAGES: Record<string, string> = {
  red: imgRed,
  blue: imgBlue,
  green: imgGreen,
  yellow: imgYellow,
};

const TILE_SIZE = 40;

// The winding S-curve path on a 7x5 grid with gaps between rows
// Start at top-right (6,0) [Back], end at bottom-left (0,4) [Front]
const PATH = [
  [6, 0], [5, 0], [4, 0], [3, 0], [2, 0], [1, 0], [0, 0], // Back row (R -> L)
  [0, 1],                                                 // Down on the left
  [0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], // Middle row (L -> R)
  [6, 3],                                                 // Down on the right
  [6, 4], [5, 4], [4, 4], [3, 4], [2, 4], [1, 4], [0, 4]  // Front row (R -> L)
];

// 특수 칸 설정 (바닥에 그려질 아이콘과 고유 색상)
const SPECIAL_TILES: Record<number, { icon: string; color: string }> = {
  5: { icon: "❓", color: "#ffcccc" },     // 찬스
  11: { icon: "🗝️", color: "#fce38a" },   // 황금열쇠
  16: { icon: "🌴", color: "#eaffcf" },   // 무인도
};

const MEMBER_OFFSETS: Record<string, { x: number; y: number }> = {
  red: { x: -8, y: -8 },
  blue: { x: 8, y: -8 },
  green: { x: -8, y: 8 },
  yellow: { x: 8, y: 8 },
};

interface RankingPodiumProps {
  members: Member[];
}

export default function RankingPodium({ members }: RankingPodiumProps) {
  const [animate, setAnimate] = useState(false);
  const [arrivedIds, setArrivedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 200);
    return () => clearTimeout(timer);
  }, []);

  // Prepare members with their target path index
  const sorted = [...members].sort((a, b) => b.winRate - a.winRate);
  const players = sorted.map((member, sortedIndex) => {
    // Determine how many tiles they advance based on winRate (0 to 20)
    let targetIndex = Math.round((member.winRate / 100) * (PATH.length - 1));
    targetIndex = Math.max(0, Math.min(targetIndex, PATH.length - 1));

    const rank = sortedIndex + 1;
    const isLast = sortedIndex === sorted.length - 1;

    // 순위별로 이동 속도에 차이를 둠 (1등이 가장 빠르고 꼴찌가 가장 느림)
    const baseSpeeds = [0.26, 0.31, 0.35, 0.40];
    const tileSpeed = baseSpeeds[Math.min(sortedIndex, baseSpeeds.length - 1)];

    const pathSlice = PATH.slice(0, targetIndex + 1);
    const offset = MEMBER_OFFSETS[member.color] || { x: 0, y: 0 };

    // Create keyframes for the sliding animation
    const xKeyframes = pathSlice.map((p, i) => 
      p[0] * TILE_SIZE + (i === pathSlice.length - 1 ? offset.x : 0)
    );
    const yKeyframes = pathSlice.map((p, i) => 
      p[1] * TILE_SIZE + (i === pathSlice.length - 1 ? offset.y : 0)
    );

    const finalX = xKeyframes[xKeyframes.length - 1];
    const finalY = yKeyframes[yKeyframes.length - 1];

    // For z-index in isometric view, lower Y + X means it's further "back"
    // So z-index should be X + Y. We use the grid coordinate.
    const zIndex = pathSlice[pathSlice.length - 1][0] + pathSlice[pathSlice.length - 1][1];

    return {
      ...member,
      targetIndex,
      xKeyframes,
      yKeyframes,
      finalX,
      finalY,
      pathLength: pathSlice.length,
      zIndex,
      rank,
      isLast,
      tileSpeed,
    };
  });

  return (
    <div className="ranking-podium card theme-day">
      <div className="podium-header">
        <div className="title-wrapper">
          <span className="grand-prix-logo">☀️ BMS Grand Prix</span>
        </div>
      </div>

      <div className="isometric-scene">
        <div className="isometric-board">
          {/* Draw the track tiles */}
          {PATH.map((coord, idx) => {
            const isStart = idx === 0;
            const isEnd = idx === PATH.length - 1;
            const special = SPECIAL_TILES[idx];
            
            // 톤다운된 모노톤(연한 그레이/화이트) 두 가지 색상 교차
            const tileColors = ["#ffffff", "#f5f6fa"];
            const defaultColor = tileColors[idx % tileColors.length];
            const tileColor = isStart 
              ? "#dcdde1" 
              : isEnd 
              ? "#f39c12" 
              : special 
              ? special.color 
              : defaultColor;

            return (
              <div
                key={idx}
                className={`board-tile ${isStart ? "tile-start" : ""} ${isEnd ? "tile-end" : ""} ${special ? "tile-special" : ""}`}
                style={{
                  left: coord[0] * TILE_SIZE,
                  top: coord[1] * TILE_SIZE,
                  width: TILE_SIZE,
                  height: TILE_SIZE,
                  "--tile-bg": tileColor,
                } as any}
              >
                <div className="tile-inner">
                  {isStart && <span className="tile-label">START</span>}
                  {isEnd && <span className="tile-label">FINISH</span>}
                  {special && <span className="tile-icon">{special.icon}</span>}
                </div>
              </div>
            );
          })}

          {/* Draw the players */}
          {players.map((player) => {
            const hasArrived = arrivedIds.has(player.id);
            const idleClass =
              player.rank === 1 ? "car--bounce" :
              player.rank === 2 ? "car--wobble" :
              player.rank === 3 ? "car--float" :
              "car--shake";

            return (
              <motion.div
                key={player.id}
                className="meeple-wrapper"
                style={{ zIndex: player.zIndex + 10, transformStyle: "preserve-3d" }} // Added preserve-3d to fix flat rendering
                initial={{
                  x: player.xKeyframes[0],
                  y: player.yKeyframes[0],
                  z: 10, // 타일(translateZ: 6px)보다 높은 위치에 띄움
                }}
                animate={
                  animate
                    ? {
                        x: player.xKeyframes,
                        y: player.yKeyframes,
                        z: 10,
                      }
                    : {}
                }
                transition={{
                  duration: player.pathLength * player.tileSpeed, // 각자 다른 속도로 이동
                  ease: "linear",
                }}
                onAnimationComplete={() => {
                  setArrivedIds((prev) => {
                    const next = new Set(prev);
                    next.add(player.id);
                    
                    // 1등 도착 시 폭죽 발사
                    if (player.rank === 1 && !prev.has(player.id)) {
                      confetti({
                        particleCount: 150,
                        spread: 80,
                        origin: { y: 0.6 },
                        colors: ['#f39c12', '#e74c3c', '#3498db', '#2ecc71', '#9b59b6']
                      });
                    }
                    return next;
                  });
                }}
              >
                {/* This inner div is rotated to stand up to the camera */}
                <div className="meeple-sprite">
                  {/* 정적 오프셋 래퍼: 이미지가 타일 중앙 위에 정확히 위치하도록 위로 올림 */}
                  <div className="meeple-offset-wrapper">
                    {/* 도착 후 대기(Idle) 애니메이션 래퍼 */}
                    <div className={`meeple-idle-wrapper ${hasArrived ? idleClass : ""}`}>
                      {/* 레이스 중 폴짝거리는 애니메이션 래퍼 */}
                      <motion.div
                        animate={animate && !hasArrived ? { y: [0, -15, 0] } : { y: 0 }}
                        transition={{
                          repeat: player.pathLength > 1 ? player.pathLength : 0,
                          duration: player.tileSpeed, // 이동 속도에 맞춰 폴짝임
                          ease: "easeInOut",
                        }}
                        className="meeple-img-container"
                      >
                        <img
                          src={CHARACTER_IMAGES[player.color]}
                          alt={player.name}
                          className="meeple-img"
                        />
                        <div className="meeple-label" data-color={player.color}>
                          <span className="name">{player.name}</span>
                          <span className="rate">{player.winRate}%</span>
                        </div>

                        {/* 꼴찌 연기 파티클 (도착 후) */}
                        {player.isLast && hasArrived && (
                          <span className="smoke-container" aria-hidden="true">
                            <span className="smoke smoke--1">💦</span>
                            <span className="smoke smoke--2">💦</span>
                            <span className="smoke smoke--3">💦</span>
                          </span>
                        )}
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
