// src/components/common/GameRegistrationModal.tsx

import { useState } from "react";
import { X, Image as ImageIcon } from "lucide-react";
import { MEMBERS } from "../../mocks/dummyData";
import { GameResultType, GAME_GENRES } from "../../types";
import "./GameRegistrationModal.scss";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function GameRegistrationModal({ isOpen, onClose }: Props) {
  const [name, setName] = useState("");
  const [genre, setGenre] = useState<string>(GAME_GENRES[0]);
  const [minPlayers, setMinPlayers] = useState("");
  const [maxPlayers, setMaxPlayers] = useState("");
  const [playTime, setPlayTime] = useState("");
  const [ownerId, setOwnerId] = useState(MEMBERS[0].id);
  const [resultType, setResultType] = useState<GameResultType>("unknown");
  // 💡 썸네일 이미지 URL을 받을 상태 추가!
  const [imageUrl, setImageUrl] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`'${name}' 등록 완료! 🎲 다음 게임을 계속 등록해주세요.`);

    setName("");
    setGenre("");
    setMinPlayers("");
    setMaxPlayers("");
    setPlayTime("");
    setOwnerId(MEMBERS[0].id);
    setResultType("unknown");
    setImageUrl(""); // 💡 폼 초기화 시 이미지도 같이 비워주기
  };

  return (
    // 💡 overlay 자체가 이제 화면 전체를 덮는 캔버스가 될 거야
    <div className="fullscreen-modal-overlay">
      {/* 모달 전용 상단 헤더 (고정) */}
      <header className="modal-header">
        <h2 className="modal-title">새로운 게임 등록</h2>
        <button className="close-btn" onClick={onClose}>
          <X size={28} />
        </button>
      </header>

      {/* 스크롤이 가능한 폼 영역 */}
      <div className="modal-body">
        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-group image-input-group">
            <label>게임 표지 이미지 (선택)</label>
            <div className="image-preview-box" onClick={() => document.getElementById("game-image-upload")?.click()}>
              {imageUrl ? (
                <img src={imageUrl} alt="미리보기" className="preview-img" />
              ) : (
                <div className="empty-preview">
                  <ImageIcon size={40} />
                  <span>
                    클릭하여 사진첩에서
                    <br />
                    이미지를 업로드하세요
                  </span>
                </div>
              )}
            </div>
            <input
              id="game-image-upload"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const localUrl = URL.createObjectURL(file);
                  setImageUrl(localUrl);
                }
              }}
              style={{ display: "none" }}
            />
          </div>

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
            {/* 💡 input 대신 select로 변경! */}
            <select value={genre} onChange={(e) => setGenre(e.target.value)}>
              {GAME_GENRES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row triple-row">
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
