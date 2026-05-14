// src/components/common/GameRegistrationModal.tsx

import { useState } from "react";
import { X } from "lucide-react";
import { MEMBERS } from "../../mocks/dummyData";
import { GameResultType } from "../../types";
import "./GameRegistrationModal.scss";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function GameRegistrationModal({ isOpen, onClose }: Props) {
  const [name, setName] = useState("");
  const [genre, setGenre] = useState("");
  const [minPlayers, setMinPlayers] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("");
  const [playTime, setPlayTime] = useState("");
  const [ownerId, setOwnerId] = useState(MEMBERS[0].id);

  // 💡 1. 초기값을 "unknown"으로 변경! (유저가 고민할 필요 없이 쾌속 등록 가능)
  const [resultType, setResultType] = useState<GameResultType>("unknown");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    alert(`'${name}' 등록 완료! 🎲 다음 게임을 계속 등록해주세요.`);

    // 💡 2. 초기화할 때도 "unknown"으로 되돌려놓기
    setName("");
    setGenre("");
    setMinPlayers("");
    setMaxPlayers("");
    setPlayTime("");
    setOwnerId(MEMBERS[0].id);
    setResultType("unknown");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        <h2 className="modal-title">새로운 게임 등록</h2>

        <form onSubmit={handleSubmit} className="registration-form">
          {/* ... (게임 이름, 장르, 인원수, 플레이 타임, 소유자 입력 폼은 기존과 완전히 동일) ... */}

          <div className="form-group">
            <label>게임 이름</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="예: 스플렌더"
            />
          </div>

          <div className="form-group">
            <label>장르</label>
            <input
              type="text"
              required
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="예: 엔진빌딩"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>최소 인원</label>
              <input
                type="number"
                required
                min="1"
                value={minPlayers}
                onChange={(e) => setMinPlayers(e.target.value)}
                placeholder="2"
              />
            </div>
            <div className="form-group">
              <label>최대 인원</label>
              <input
                type="number"
                required
                min="1"
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(e.target.value)}
                placeholder="4"
              />
            </div>
            <div className="form-group">
              <label>플레이 타임(분)</label>
              <input
                type="number"
                required
                min="1"
                step="5"
                value={playTime}
                onChange={(e) => setPlayTime(e.target.value)}
                placeholder="30"
              />
            </div>
          </div>

          <div className="form-group">
            <label>소유자</label>
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
            >
              {MEMBERS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>결과 기록 방식</label>
            <select
              value={resultType}
              onChange={(e) => setResultType(e.target.value as GameResultType)}
            >
              {/* 💡 3. 가장 위에 "나중에 결정" 옵션 추가 */}
              <option value="unknown">
                🤔 아직 안 해봐서 몰라요 (나중에 결정)
              </option>
              <option value="ranked">점수/순위 기록 (예: 스플렌더)</option>
              <option value="winner_only">1등만 기록 (예: 아발론)</option>
              <option value="no_result">승패 없음 (예: 머더미스터리)</option>
            </select>
          </div>

          <button type="submit" className="submit-btn">
            등록하기
          </button>
        </form>
      </div>
    </div>
  );
}
