// src/components/common/GameRegistrationModal.tsx

import { useState } from "react";
import { X, Image as ImageIcon, Trash2 } from "lucide-react";
import { useStore } from "../../store/useStore";
import { useAlertStore } from "../../store/useAlertStore";
import { supabase } from "../../utils/supabase";
import { BoardGame, GameResultType, GAME_GENRES } from "../../types";
import "./GameRegistrationModal.scss";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** 수정 모드: 기존 게임을 넘기면 편집 모달로 동작 */
  editGame?: BoardGame;
}

export default function GameRegistrationModal({ isOpen, onClose, editGame }: Props) {
  const { members, addGame, updateGame, deleteGame } = useStore();
  const { showAlert } = useAlertStore();
  const isEditMode = !!editGame;

  const [name, setName] = useState(editGame?.name ?? "");
  const [genre, setGenre] = useState<string>(editGame?.genre ?? GAME_GENRES[0]);
  const [minPlayers, setMinPlayers] = useState(editGame?.minPlayers?.toString() ?? "");
  const [maxPlayers, setMaxPlayers] = useState(editGame?.maxPlayers?.toString() ?? "");
  const [playTime, setPlayTime] = useState(editGame?.playTimeMinutes?.toString() ?? "");
  const [ownerId, setOwnerId] = useState(editGame?.ownerId ?? members[0]?.id ?? "m1");
  const [resultType, setResultType] = useState<GameResultType>(editGame?.resultType ?? "unknown");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState(editGame?.imageUrl ?? "");
  const [description, setDescription] = useState(editGame?.description ?? "");
  const [isUploading, setIsUploading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    let finalImageUrl = imageUrl;

    try {
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(`games/${fileName}`, imageFile);

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          throw new Error(`이미지 업로드 실패: ${uploadError.message}`);
        }

        const { data } = supabase.storage.from("images").getPublicUrl(`games/${fileName}`);
        finalImageUrl = data.publicUrl;
      }

      const gameData: BoardGame = {
        id: editGame?.id ?? `g-${Date.now()}`,
        name,
        genre: genre as any,
        minPlayers: Number(minPlayers),
        maxPlayers: Number(maxPlayers),
        playTimeMinutes: Number(playTime),
        ownerId,
        resultType,
        imageUrl: finalImageUrl || undefined,
        description: description || undefined,
      };

      if (isEditMode && editGame) {
        await updateGame(gameData);
        showAlert(`'${name}' 수정 완료!`, "success");
        onClose();
      } else {
        await addGame(gameData);
        showAlert(`'${name}' 등록 완료!`, "success");
        setName("");
        setGenre(GAME_GENRES[0]);
        setMinPlayers("");
        setMaxPlayers("");
        setPlayTime("");
        setOwnerId(members[0]?.id || "m1");
        setResultType("unknown");
        setImageFile(null);
        setImageUrl("");
        setDescription("");
      }
    } catch (err: any) {
      console.error("Game registration error:", err);
      showAlert(`${isEditMode ? "수정" : "등록"} 실패: ${err.message}`, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!editGame) return;
    if (window.confirm(`정말 '${editGame.name}'을(를) 삭제하시겠습니까?`)) {
      try {
        await deleteGame(editGame.id);
        showAlert("게임이 삭제되었습니다.", "success");
        onClose();
      } catch (err: any) {
        showAlert(`삭제 실패: ${err.message}`, "error");
      }
    }
  };

  return (
    // 💡 overlay 자체가 이제 화면 전체를 덮는 캔버스가 될 거야
    <div className="fullscreen-modal-overlay">
      {/* 모달 전용 상단 헤더 (고정) */}
      <header className="modal-header">
        <h2 className="modal-title">{isEditMode ? "게임 정보 수정" : "새로운 게임 등록"}</h2>
        <button className="close-btn" onClick={onClose}>
          <X size={28} />
        </button>
      </header>

      {/* 스크롤이 가능한 폼 영역 */}
      <div className="modal-body">
        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-group image-input-group">
            <label>게임 표지 이미지 (선택)</label>
            <div className="image-preview-wrapper">
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
              {imageUrl && (
                <button
                  type="button"
                  className="remove-image-btn"
                  onClick={() => {
                    setImageFile(null);
                    setImageUrl("");
                  }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <input
              id="game-image-upload"
              type="file"
              accept="image/jpeg, image/png, image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // 용량 제한 3MB
                  if (file.size > 3 * 1024 * 1024) {
                    showAlert("이미지 용량은 3MB 이하여야 합니다.", "error");
                    return;
                  }
                  setImageFile(file);
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
            <label>게임 한 줄 메모 (선택)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="예: 우주로 떠나는 고도의 심리전"
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
              <label>플레이 타임</label>
              <select
                value={playTime}
                onChange={(e) => setPlayTime(e.target.value)}
                required
              >
                <option value="">- 선택 -</option>
                <option value="15">15분 이하</option>
                <option value="30">30분</option>
                <option value="45">45분</option>
                <option value="60">1시간</option>
                <option value="90">1시간 30분</option>
                <option value="120">2시간 이상</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>소유자</label>
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
            >
              {members.map((m) => (
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

          <div className="modal-actions">
            {isEditMode && (
              <button type="button" className="delete-btn" onClick={handleDelete}>
                <Trash2 size={16} /> 삭제
              </button>
            )}
            <button type="submit" className="submit-btn" disabled={isUploading}>
              {isUploading ? "업로드 중..." : (isEditMode ? "수정 완료" : "등록하기")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
