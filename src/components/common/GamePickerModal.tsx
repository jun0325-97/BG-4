// src/components/common/GamePickerModal.tsx

import { useState, useEffect, useRef } from "react";
import { X, Shuffle } from "lucide-react";
import { useStore } from "../../store/useStore";
import "./GamePickerModal.scss";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const PLAYER_OPTIONS = [2, 3, 4, 5, 6];
const SLOT_DURATION = 2200; // 슬롯 1개 기준 총 시간 (ms)
const RESULT_COUNT = 1;

export default function GamePickerModal({ isOpen, onClose }: Props) {
  const { boardGames } = useStore();
  const [playerCount, setPlayerCount] = useState(4);
  const [phase, setPhase] = useState<"idle" | "spinning" | "done">("idle");
  const [slots, setSlots] = useState<string[]>([""]);
  const [results, setResults] = useState<typeof boardGames>([]);
  const [currentSlot, setCurrentSlot] = useState(0); // 현재 스피닝 중인 슬롯 인덱스

  const spinTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const eligibleGames = boardGames.filter(
    (g) => g.minPlayers <= playerCount && g.maxPlayers >= playerCount
  );

  const clearTimers = () => {
    spinTimersRef.current.forEach(clearTimeout);
    spinTimersRef.current = [];
  };

  // 슬롯머신 롤링 텍스트 훅
  function useSlotRoller(slotIdx: number, active: boolean, allGames: string[]) {
    const [display, setDisplay] = useState("?");
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
      if (!active || allGames.length === 0) return;

      let speed = 60;
      let elapsed = 0;
      const totalDuration = SLOT_DURATION;

      const tick = () => {
        setDisplay(allGames[Math.floor(Math.random() * allGames.length)]);
      };

      const run = () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
          tick();
          elapsed += speed;
          // 후반부로 갈수록 속도 늘리기 (느려지는 효과)
          if (elapsed > totalDuration * 0.5) speed = 120;
          if (elapsed > totalDuration * 0.75) speed = 220;
          if (elapsed > totalDuration * 0.88) speed = 380;
          if (elapsed >= totalDuration) {
            if (intervalRef.current) clearInterval(intervalRef.current);
          }
        }, speed);
      };

      run();
      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }, [active, slotIdx, allGames.join(",")]);

    return display;
  }

  const gameNames = eligibleGames.map((g) => g.name);

  const slot0Active = phase === "spinning" && currentSlot === 0;

  const roll0 = useSlotRoller(0, slot0Active, gameNames);

  const rollingDisplays = [roll0];

  const handleSpin = () => {
    if (eligibleGames.length === 0) return;
    if (phase === "spinning") return;

    clearTimers();
    setPhase("spinning");
    setSlots([""]);
    setCurrentSlot(0);

    // 결과 미리 뽑기
    const shuffled = [...eligibleGames].sort(() => Math.random() - 0.5);
    const picked = shuffled.slice(0, Math.min(RESULT_COUNT, shuffled.length));
    setResults(picked);

    // 슬롯 0 완료 → done
    const t0 = setTimeout(() => {
      setSlots([picked[0]?.name ?? ""]);
      setPhase("done");
    }, SLOT_DURATION);

    spinTimersRef.current = [t0];
  };

  const handleReset = () => {
    clearTimers();
    setPhase("idle");
    setSlots([""]);
    setResults([]);
    setCurrentSlot(0);
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="picker-overlay" onClick={handleClose}>
      <div className="picker-modal" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="picker-header">
          <span className="picker-title">🎲 오늘 뭐 할까?</span>
          <button className="picker-close" onClick={handleClose}>
            <X size={22} />
          </button>
        </div>

        {/* 인원 선택 */}
        <div className="picker-player-section">
          <div className="picker-player-btns">
            {PLAYER_OPTIONS.map((n) => (
              <button
                key={n}
                className={`player-btn ${playerCount === n ? "active" : ""}`}
                onClick={() => {
                  setPlayerCount(n);
                  handleReset();
                }}
                disabled={phase === "spinning"}
              >
                {n}인
              </button>
            ))}
          </div>
          <p className="eligible-count">
            {eligibleGames.length > 0
              ? `${eligibleGames.length}개 게임 중 랜덤 선택`
              : "해당 인원의 게임이 없습니다"}
          </p>
        </div>

        {/* 슬롯머신 영역 */}
        <div className="slot-machine">
          {[0].map((i) => {
            const isActive = phase === "spinning" && currentSlot === i;
            const isDone = slots[i] !== "";
            const resultGame = results[i];

            return (
              <div
                key={i}
                className={`slot-reel ${isActive ? "spinning" : ""} ${isDone ? "locked" : ""}`}
              >
                <div className={`slot-highlight ${isActive ? "active" : ""}`} />
                {isDone ? (
                  <div className="slot-result">
                    {resultGame?.imageUrl && (
                      <img src={resultGame.imageUrl} alt="" className="slot-img" />
                    )}
                    <span className="slot-name">{slots[i]}</span>
                    {resultGame && (
                      <span className="slot-meta">
                        {resultGame.minPlayers === resultGame.maxPlayers
                          ? `${resultGame.minPlayers}인`
                          : `${resultGame.minPlayers}~${resultGame.maxPlayers}인`}
                        {" · "}
                        {resultGame.playTimeMinutes >= 120
                          ? `${resultGame.playTimeMinutes}분+`
                          : `${resultGame.playTimeMinutes}분`}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="slot-rolling">
                    <span className={isActive ? "rolling-text" : "slot-placeholder"}>
                      {isActive ? rollingDisplays[i] : "?"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 버튼 */}
        <div className="picker-actions">
          {phase === "done" ? (
            <button className="spin-btn retry" onClick={handleReset}>
              <Shuffle size={18} /> 다시 뽑기
            </button>
          ) : (
            <button
              className="spin-btn"
              onClick={handleSpin}
              disabled={phase === "spinning" || eligibleGames.length === 0}
            >
              {phase === "spinning" ? (
                "뽑는 중..."
              ) : (
                <>
                  <Shuffle size={18} /> 뽑기!
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
