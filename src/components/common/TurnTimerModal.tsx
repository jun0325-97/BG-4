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
import { useStore } from "../../store/useStore";
import {
  playTurnPassSound,
  playWarningBeep,
  playBuzzerSound,
  triggerHaptic,
} from "../../utils/soundEffects";
import "./TurnTimerModal.scss";

import imgRed from "../../assets/images/img-red-1.png";
import imgBlue from "../../assets/images/img-blue-1.png";
import imgGreen from "../../assets/images/img-green-1.png";
import imgYellow from "../../assets/images/img-yellow-1.png";

const CHARACTER_IMAGES: Record<string, string> = {
  red: imgRed,
  blue: imgBlue,
  green: imgGreen,
  yellow: imgYellow,
};

interface TurnTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TURN_PRESETS = [30, 45, 60, 90, 120, 180];

export default function TurnTimerModal({ isOpen, onClose }: TurnTimerModalProps) {
  const { members } = useStore();

  const [isMuted, setIsMuted] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [turnLimitSec, setTurnLimitSec] = useState<number>(60);
  const [turnRemainingSec, setTurnRemainingSec] = useState<number>(60);
  const [currentMemberIndex, setCurrentMemberIndex] = useState<number>(0);
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

  const currentMember = members[currentMemberIndex] || members[0];

  // ── 다음 턴 넘기기 ────────────────────────────────────────────
  const handleNextTurn = () => {
    playTurnPassSound(isMuted);
    setCurrentMemberIndex((prev) => (prev + 1) % members.length);
    setTurnRemainingSec(turnLimitSec);
    setIsTimeOut(false);
  };

  // ── 턴 타이머 리셋 ───────────────────────────────────────────
  const handleReset = () => {
    triggerHaptic(20);
    setIsRunning(false);
    setTurnRemainingSec(turnLimitSec);
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
                }}
              >
                {sec >= 60 ? `${sec / 60}분` : `${sec}초`}
              </button>
            ))}
          </div>

          {/* 메인 인터랙티브 링 영역 (탭하면 턴 넘김) */}
          <div
            className={`timer-tap-area ${isUrgent ? "urgent-pulse" : ""} ${isTimeOut ? "timeout-shake" : ""}`}
            onClick={isRunning ? handleNextTurn : () => setIsRunning(true)}
            data-color={currentMember.color}
          >
            <div className="circular-progress">
              <svg viewBox="0 0 120 120" className="progress-ring">
                <circle className="progress-ring__bg" cx="60" cy="60" r="52" />
                <circle
                  className="progress-ring__bar"
                  cx="60"
                  cy="60"
                  r="52"
                  strokeDasharray={326.7}
                  strokeDashoffset={326.7 * (1 - progressPercent / 100)}
                  data-color={currentMember.color}
                />
              </svg>

              <div className="timer-inner-content">
                <div className="member-avatar-wrap" data-color={currentMember.color}>
                  <img
                    src={CHARACTER_IMAGES[currentMember.color]}
                    alt={currentMember.name}
                    className="member-avatar"
                  />
                </div>

                <span className="member-name-label">{currentMember.name}의 턴!</span>
                <div className={`countdown-number ${isUrgent ? "urgent" : ""}`}>
                  {isTimeOut ? "타임오버!" : formatTime(turnRemainingSec)}
                </div>

                <span className="tap-hint">
                  {isRunning ? "화면 탭 시 다음 사람으로 턴 넘김 ➔" : "탭하여 타이머 시작 ▶"}
                </span>
              </div>
            </div>
          </div>

          {/* 하단 제어 버튼 */}
          <div className="timer-controls">
            <button className="control-btn" onClick={handleReset} title="리셋">
              <RotateCcw size={18} />
            </button>

            <button
              className={`control-btn play-btn ${isRunning ? "pause" : "play"}`}
              onClick={() => setIsRunning(!isRunning)}
            >
              {isRunning ? <Pause size={24} /> : <Play size={24} className="play-icon-offset" />}
            </button>

            <button className="control-btn" onClick={handleNextTurn} title="다음 턴 넘기기">
              <FastForward size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
