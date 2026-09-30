import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useAnimation } from "framer-motion";
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

// 포디움 높이 (px) [1등, 2등, 3등, 4등]
const PODIUM_HEIGHTS = [140, 110, 85, 65];
// 시상대 렌더링 순서: 3등, 1등, 2등, 4등 (왼쪽부터)
const DISPLAY_ORDER = [2, 0, 1, 3];

interface RankingPodiumProps {
  members: Member[];
}

export default function RankingPodium({ members }: RankingPodiumProps) {
  const navigate = useNavigate();
  const [confettiFired, setConfettiFired] = useState(false);
  const [is2ndCelebrating, setIs2ndCelebrating] = useState(false);
  
  const sorted = [...members].sort((a, b) => b.winRate - a.winRate);

  const ctrl1 = useAnimation();
  const ctrl2 = useAnimation();
  const ctrl3 = useAnimation();
  const ctrl4 = useAnimation();
  const controls = { 1: ctrl1, 2: ctrl2, 3: ctrl3, 4: ctrl4 };

  useEffect(() => {
    let isMounted = true;
    const runSequence = async () => {
      await new Promise(r => setTimeout(r, 200));
      if (!isMounted) return;

      // 공통 통통 튀며 걸어오는 애니메이션
      const walkAnim = (targetX: number, targetY: number) => ({
        x: targetX,
        y: [0, -30, 0, -30, targetY],
        rotate: [0, 15, -15, 15, 0],
        opacity: 1,
        transition: {
          x: { type: "spring", stiffness: 120, damping: 15 } as any,
          y: { duration: 0.6, times: [0, 0.25, 0.5, 0.75, 1] },
          rotate: { duration: 0.6, times: [0, 0.25, 0.5, 0.75, 1] }
        }
      });

      // 4등 등장
      if (sorted[3]) {
        controls[4].start(walkAnim(0, 0));
        await new Promise(r => setTimeout(r, 300));
      }
      
      // 3등 등장
      if (sorted[2]) {
        controls[3].start(walkAnim(0, 0));
        await new Promise(r => setTimeout(r, 300));
      }

      // 2등 등장 -> 1등 자리로 (X는 좀 더 우측으로, Y는 높이차 고려해 좀 더 아래로)
      if (sorted[1]) {
        controls[2].start(walkAnim(-62, -4));
        await new Promise(r => setTimeout(r, 650)); 
        if (isMounted) setIs2ndCelebrating(true); 
        await new Promise(r => setTimeout(r, 1400));
      }

      // 1등 맹렬히 돌진하며 2등 걷어차기
      if (sorted[0]) {
        if (isMounted) setIs2ndCelebrating(false);
        
        // 1등 돌진
        controls[1].start({ 
          x: 0, 
          y: [0, -10, 0],
          rotate: [25, 25, 0], 
          opacity: 1, 
          transition: { 
            x: { type: "spring", stiffness: 600, damping: 25 } as any,
            y: { duration: 0.3 },
            rotate: { duration: 0.3 }
          } 
        });
        
        // 충돌 순간 (약 120ms 후) 2등 차여서 날아감
        setTimeout(() => {
          if (sorted[1] && isMounted) {
            controls[2].start({
              x: 0,
              y: [-30, -120, 0], 
              rotate: [0, 360], 
              transition: {
                x: { type: "spring", stiffness: 150, damping: 15 } as any,
                y: { duration: 0.5, times: [0, 0.4, 1], ease: ["easeOut", "easeIn"] },
                rotate: { duration: 0.5, ease: "linear" }
              }
            });
          }
        }, 120);
        
        await new Promise(r => setTimeout(r, 450));
        if (!isMounted) return;
        
        if (!confettiFired) {
          setConfettiFired(true);
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { x: 0.5, y: 0.45 },
            colors: ["#ffd700", "#ff6b6b", "#4ecdc4", "#ffeaa7", "#c7b8ea", "#a8e6cf"],
          });
        }

        // 둥실둥실 디폴트 아이들(Idle) 인터랙션 시작
        [1, 2, 3, 4].forEach((rank) => {
          controls[rank as 1|2|3|4].start({
            y: [0, -5, 0],
            rotate: [0, 2, -2, 0],
            transition: {
              duration: 2.5 + Math.random() * 0.5, // 각자 약간씩 다르게
              ease: "easeInOut",
              repeat: Infinity,
              delay: Math.random() * 0.5
            }
          });
        });
      }
    };

    runSequence();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="podium-card">
      <div className="podium-card__header">
        <span className="podium-card__title">🏆 크루 랭킹</span>
        <span className="podium-card__sub">승률 기준</span>
      </div>

      <div className="podium-stage">
        {DISPLAY_ORDER.map((rankIdx) => {
          const player = sorted[rankIdx];
          if (!player) return null;

          const rank = rankIdx + 1;
          const height = PODIUM_HEIGHTS[rankIdx];
          const isFirst = rank === 1;
          const isSecond = rank === 2;

          return (
            <div
              key={player.id}
              className={`podium-slot${isFirst ? " podium-slot--first" : ""}`}
            >
              <motion.div
                className={`podium-char${isSecond && is2ndCelebrating ? " podium-char--celebrate" : ""}`}
                initial={{ x: -400, y: 0, opacity: 0 }}
                animate={controls[rank as 1|2|3|4]}
                onClick={() => navigate(`/mypage/${player.color}`)}
                style={{ cursor: "pointer" }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
              >
                {/* 퍼센티지: 머리 위로 뱃지 원복 (게이지는 수치가 낮을 때 비어보이므로 직관적인 타이포그라피 뱃지 유지) */}
                <div className="podium-char__rate" data-color={player.color}>
                  <span className="rate-label">WIN</span>
                  <span className="rate-value">{player.winRate}%</span>
                </div>
                
                <div className="podium-char__img-wrap">
                  <img
                    src={CHARACTER_IMAGES[player.color]}
                    alt={player.name}
                    className="podium-char__img"
                  />
                </div>

                {/* 닉네임: 발 아래에 유지 */}
                <div className="podium-char__info">
                  <span className="podium-char__name">{player.name}</span>
                </div>
              </motion.div>

              <div
                className="podium-block"
                data-color={player.color}
                style={{ height }}
              >
                <div className="podium-block__front">
                  <span className="podium-block__rank">{rank}</span>
                </div>
                <div className="podium-block__side" />
                <div className="podium-block__top" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
