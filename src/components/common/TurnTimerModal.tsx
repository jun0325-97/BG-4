// src/components/common/TurnTimerModal.tsx

import { useState, useEffect } from "react";
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  FastForward,
  Timer,
} from "lucide-react";
import {
  playTurnPassSound,
  playWarningBeep,
  playBuzzerSound,
  triggerHaptic,
} from "../../utils/soundEffects";
import "./TurnTimerModal.scss";

interface TurnTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TURN_PRESETS = [30, 45, 60, 90, 120, 180];

export default function TurnTimerModal({ isOpen, onClose }: TurnTimerModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [turnLimitSec, setTurnLimitSec] = useState<number>(60);
  const [turnRemainingSec, setTurnRemainingSec] = useState<number>(60);
  const [turnNumber, setTurnNumber] = useState<number>(1);
  const [isTimeOut, setIsTimeOut] = useState(false);

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (!isOpen) {
      setIsRunning(false);
      return;
    }
    setTurnRemainingSec(turnLimitSec);
    setIsTimeOut(false);
  }, [isOpen]);

  // ── 턴 타이머 인터벌 ─────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !isRunning) return;

    const timer = setInterval(() => {
      setTurnRemainingSec((prev) => {
        if (prev <= 1) {
          playBuzzerSound(isMuted);
          setIsTimeOut(true);
          return 0;
        }

        // 10초 이하일 때 경고음
        if (prev <= 11 && prev > 1) {
          playWarningBeep(isMuted);
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isRunning, isMuted]);

  if (!isOpen) return null;

  // ── 재생 / 일시정지 토글 ─────────────────────────────────────
  const handleTogglePlay = () => {
    triggerHaptic(15);
    setIsRunning((prev) => !prev);
  };

  // ── 다음 턴 넘기기 (시간 리셋 & 턴 카운트업) ─────────────────
  const handleNextTurn = () => {
    playTurnPassSound(isMuted);
    triggerHaptic(25);
    setTurnNumber((prev) => prev + 1);
    setTurnRemainingSec(turnLimitSec);
    setIsTimeOut(false);
    if (!isRunning) {
      setIsRunning(true);
    }
  };

  // ── 전체 리셋 ───────────────────────────────────────────────
  const handleReset = () => {
    triggerHaptic(20);
    setIsRunning(false);
    setTurnRemainingSec(turnLimitSec);
    setTurnNumber(1);
    setIsTimeOut(false);
  };

  // 초 포맷팅 (mm:ss)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const progressPercent = Math.max(0, (turnRemainingSec / turnLimitSec) * 100);
  const isUrgent = turnRemainingSec <= 10 && turnRemainingSec > 0;
  const isPaused = !isRunning && turnRemainingSec > 0 && turnRemainingSec < turnLimitSec;

  return (
    <div className="turntimer-overlay" onClick={onClose}>
      <div className="turntimer-modal" onClick={(e) => e.stopPropagation()}>
        {/* 상단 컨트롤 바 */}
        <div className="timer-top-bar">
          <div className="timer-title-box">
            <Timer size={18} className="title-icon" />
            <h2 className="title-text">스마트 턴 타이머</h2>
          </div>

          <div className="actions-right">
            <button
              className="icon-btn"
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? "음소거 해제" : "음소거"}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button className="icon-btn close" onClick={onClose} aria-label="닫기">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="turn-timer-content">
          {/* 프리셋 시간 선택 */}
          <div className="preset-row">
            {TURN_PRESETS.map((sec) => (
              <button
                key={sec}
                className={`preset-btn ${turnLimitSec === sec ? "active" : ""}`}
                onClick={() => {
                  setTurnLimitSec(sec);
                  setTurnRemainingSec(sec);
                  setIsRunning(false);
                  setIsTimeOut(false);
                  setTurnNumber(1);
                }}
              >
                {sec >= 60 ? `${sec / 60}분` : `${sec}초`}
              </button>
            ))}
          </div>

          {/* 메인 서클: 탭하여 일시정지 / 계속하기 토글 */}
          <div
            className={`timer-tap-area ${isUrgent ? "urgent-pulse" : ""} ${isTimeOut ? "timeout-shake" : ""}`}
            onClick={handleTogglePlay}
            title={isRunning ? "탭하여 일시정지" : "탭하여 시작"}
          >
            <div className="circular-progress">
              <svg viewBox="0 0 120 120" className="progress-ring">
                <circle className="progress-ring__bg" cx="60" cy="60" r="52" />
                <circle
                  className={`progress-ring__bar ${isUrgent ? "urgent" : ""}`}
                  cx="60"
                  cy="60"
                  r="52"
                  strokeDasharray={326.7}
                  strokeDashoffset={326.7 * (1 - progressPercent / 100)}
                />
              </svg>

              <div className="timer-inner-content">
                {/* 턴 뱃지 */}
                <div className={`turn-badge ${isUrgent ? "urgent" : ""}`}>
                  <span className="turn-label">TURN</span>
                  <span className="turn-number">#{turnNumber}</span>
                </div>

                {/* 카운트다운 숫자 */}
                <div className={`countdown-number ${isUrgent ? "urgent" : ""}`}>
                  {isTimeOut ? "타임오버!" : formatTime(turnRemainingSec)}
                </div>

                {/* 상태 힌트 */}
                <div className="tap-hint">
                  {!isRunning ? (
                    <span className="hint-paused">
                      {isPaused ? "일시정지 중 ⏸" : "탭하여 시작 ▶"}
                    </span>
                  ) : (
                    <span>탭하여 일시정지 ⏸</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── 하단 컨트롤: [일시정지] 와 [다음 턴 넘김] 명확한 분리 ── */}
          <div className="timer-dual-controls">
            {/* 1턴 초기화 리셋 버튼 */}
            <button
              className="control-icon-btn"
              onClick={handleReset}
              title="1턴부터 초기화"
            >
              <RotateCcw size={17} />
            </button>

            {/* 일시정지 / 계속하기 버튼 */}
            <button
              className={`action-btn pause-btn ${!isRunning ? "is-paused" : ""}`}
              onClick={handleTogglePlay}
            >
              {isRunning ? <Pause size={17} /> : <Play size={17} />}
              <span>{isRunning ? "일시정지" : "계속하기"}</span>
            </button>

            {/* 다음 턴 넘김 메인 액션 버튼 */}
            <button
              className="action-btn next-turn-btn"
              onClick={handleNextTurn}
            >
              <FastForward size={18} />
              <span>다음 턴 넘김</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
