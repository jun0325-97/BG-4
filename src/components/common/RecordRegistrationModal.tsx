// src/components/common/RecordRegistrationModal.tsx

import { useState, useMemo } from "react";
import { X, Plus, Trash2, Users, Image as ImageIcon, ArrowUp, ArrowDown } from "lucide-react";
import { useStore } from "../../store/useStore";
import { useAlertStore } from "../../store/useAlertStore";
import { supabase } from "../../utils/supabase";
import { GatheringRecord, PlayLog, PlayerResult, Member } from "../../types";
import imageCompression from "browser-image-compression";
import "./RecordRegistrationModal.scss";

interface RecordRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** 수정 모드: 기존 기록을 넘기면 편집 모달로 동작 */
  editRecord?: GatheringRecord;
}

// 빈 PlayLog 초기값 생성 헬퍼
function emptyLog(members: Member[]): PlayLog {
  return {
    id: `log-${Date.now()}-${Math.random()}`,
    gameId: "",
    resultType: "no_result",
    durationMinutes: 0,
    participatingMembers: members.map((m) => m.id),
    results: [],
  };
}

export default function RecordRegistrationModal({
  isOpen,
  onClose,
  editRecord,
}: RecordRegistrationModalProps) {
  const { members, boardGames, addRecord, updateRecord, deleteRecord } = useStore();
  const { showAlert, showConfirm } = useAlertStore();

  const isEditMode = !!editRecord;

  const sortedBoardGames = useMemo(() => {
    return [...boardGames].sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }, [boardGames]);

  const [date, setDate] = useState(
    editRecord?.date ?? new Date().toISOString().split("T")[0]
  );
  const [emoji, setEmoji] = useState(editRecord?.emoji ?? "🎲");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [memo, setMemo] = useState(editRecord?.memo ?? "");
  const [photoUrl, setPhotoUrl] = useState(editRecord?.photoUrl ?? "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);


  const EMOJI_LIST = [
    '🎲', '🃏', '♟️', '🧩', '🏆', '🎉', '🔥', '⛺', '🍕', '🍻',
    '👻', '🤩', '😎', '🤪', '🤔', '😡', '🤬', '🥳', '😴', '🤯',
    '😭', '😱', '🤫', '👀', '🧠', '👑', '💸', '💎', '⏳', '💡',
    '⚔️', '🛡️', '💣', '🧸', '🍔', '🍟', '🍖', '🍣', '🍰', '☕',
    '🍷', '🍺', '🚗', '✈️', '🏝️', '🏕️', '🌙', '⭐', '🌈', '🌧️',
    '🐶', '🐱', '🦊', '🦁', '🐸', '🦄', '🐲', '👽', '🤖', '👾'
  ];

  // ── 다중 playLogs 상태 ──────────────────────────────────
  const [playLogs, setPlayLogs] = useState<PlayLog[]>(
    editRecord?.playLogs && editRecord.playLogs.length > 0
      ? editRecord.playLogs
      : [emptyLog(members)]
  );
  // 클릭한 로그 인덱스에 대해 참여멤버 피커 열림
  const [openParticipantPicker, setOpenParticipantPicker] = useState<number | null>(null);

  if (!isOpen) return null;

  // ── 게임 선택 변경 ──────────────────────────────────────
  const handleGameChange = (logIndex: number, gameId: string) => {
    const game = boardGames.find((g) => g.id === gameId);
    setPlayLogs((prev) =>
      prev.map((log, i) =>
        i === logIndex
          ? {
            ...log,
            gameId,
            resultType: game?.resultType ?? "no_result",
            durationMinutes: game?.playTimeMinutes ?? 0,
            results: [],
          }
          : log
      )
    );
  };

  // ── 결과 입력 변경 ──────────────────────────────────────
  const handleResultChange = (
    logIndex: number,
    memberId: string,
    field: string,
    value: any
  ) => {
    setPlayLogs((prev) =>
      prev.map((log, i) => {
        if (i !== logIndex) return log;
        const existing = log.results.find((r) => r.memberId === memberId);
        const updatedResults: PlayerResult[] = existing
          ? log.results.map((r) =>
            r.memberId === memberId ? { ...r, [field]: value } : r
          )
          : [...log.results, { memberId, [field]: value }];
        return { ...log, results: updatedResults };
      })
    );
  };

  // ── 게임 추가 ───────────────────────────────────────────
  const handleAddLog = () => {
    setPlayLogs((prev) => [...prev, emptyLog(members)]);
  };

  // ── 게임 삭제 ───────────────────────────────────────────
  const handleRemoveLog = (logIndex: number) => {
    setPlayLogs((prev) => prev.filter((_, i) => i !== logIndex));
  };

  // ── 게임 순서 변경 ───────────────────────────────────────
  const handleMoveLog = (logIndex: number, direction: 'up' | 'down') => {
    setPlayLogs((prev) => {
      const newLogs = [...prev];
      const targetIndex = direction === 'up' ? logIndex - 1 : logIndex + 1;
      
      // 범위 체크
      if (targetIndex < 0 || targetIndex >= newLogs.length) return newLogs;
      
      // 스왑
      const temp = newLogs[logIndex];
      newLogs[logIndex] = newLogs[targetIndex];
      newLogs[targetIndex] = temp;
      
      return newLogs;
    });
  };

  // ── 참여 멤버 토글 ───────────────────────────────────────
  const handleToggleMember = (logIndex: number, memberId: string) => {
    setPlayLogs(prev => prev.map((log, i) => {
      if (i !== logIndex) return log;
      const currentParticipants = log.participatingMembers || members.map(m => m.id);
      let newParticipants;
      if (currentParticipants.includes(memberId)) {
        // 최소 1명은 남겨두기 위함 (선택)
        if (currentParticipants.length <= 1) return log;
        newParticipants = currentParticipants.filter(id => id !== memberId);
      } else {
        newParticipants = [...currentParticipants, memberId];
      }
      return { ...log, participatingMembers: newParticipants };
    }));
  };

  // ── 제출 ────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (playLogs.length === 0) {
      showAlert("게임을 최소 1개 이상 추가해 주세요!", "error");
      return;
    }
    if (playLogs.some((log) => !log.gameId)) {
      showAlert("모든 게임 항목에서 게임을 선택해 주세요!", "error");
      return;
    }

    setIsUploading(true);
    let finalPhotoUrl = photoUrl;

    try {
      if (photoFile) {
        // 1. 이미지 압축 (최대 1MB, 1200px)
        let uploadFile = photoFile;
        try {
          const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 1200,
            useWebWorker: true,
          };
          uploadFile = await imageCompression(photoFile, options);
        } catch (error) {
          console.error("이미지 압축 실패:", error);
          // 압축 실패 시 원본 사용
        }

        const fileExt = photoFile.name.split('.').pop();
        const fileName = `records/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(fileName, uploadFile);

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          throw new Error(`이미지 업로드 실패: ${uploadError.message}`);
        }

        const { data } = supabase.storage.from("images").getPublicUrl(fileName);
        finalPhotoUrl = data.publicUrl;
      }

      // 2. 고아 이미지 정리 로직
      if (isEditMode && editRecord && editRecord.photoUrl && editRecord.photoUrl !== finalPhotoUrl) {
        const parts = editRecord.photoUrl.split('/public/images/');
        if (parts.length > 1) {
          await supabase.storage.from('images').remove([parts[1]]);
        }
      }

      if (isEditMode && editRecord) {
        // 수정 모드
        const updated: GatheringRecord = {
          ...editRecord,
          date,
          emoji,
          memo,
          photoUrl: finalPhotoUrl,
          playLogs,
        };
        await updateRecord(updated);
        showAlert("기록이 수정되었습니다!", "success");
        onClose();
      } else {
        // 신규 추가 모드
        const newRecord: GatheringRecord = {
          id: `r-${Date.now()}`,
          date,
          emoji,
          memo,
          photoUrl: finalPhotoUrl,
          playLogs,
        };
        await addRecord(newRecord);
        showAlert("새로운 기록이 등록되었습니다!", "success");
        // 연속 등록을 위해 폼 초기화
        setDate(new Date().toISOString().split("T")[0]);
        setEmoji("🎲");
        setMemo("");
        setPhotoUrl("");
        setPhotoFile(null);
        setPlayLogs([emptyLog(members)]);
      }
    } catch (err: any) {
      console.error("Record registration error:", err);
      showAlert(`등록/수정 실패: ${err.message}`, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = () => {
    if (!editRecord) return;
    showConfirm("정말 이 모임 기록을 삭제하시겠습니까? 관련 게임 기록도 모두 삭제됩니다.", async () => {
      try {
        await deleteRecord(editRecord.id);
        showAlert("모임 기록이 삭제되었습니다.", "success");
        onClose();
      } catch (err: any) {
        showAlert(`삭제 실패: ${err.message}`, "error");
      }
    });
  };

  return (
    <div className="fullscreen-modal-overlay">
      <div className="modal-header">
        <h2 className="modal-title">{isEditMode ? "모임 기록 수정" : "새 모임 기록 추가"}</h2>
        <button className="close-btn" onClick={onClose}>
          <X size={28} />
        </button>
      </div>

      <div className="modal-body">
        <form onSubmit={handleSubmit} className="record-form">

          {/* 날짜 & 이모지 */}
          <div className="form-group date-emoji-group">
            {/* <label>언제, 어떤 분위기였나요?</label> */}
            <div className="date-emoji-inputs">
              <div className="emoji-picker-container">
                <button
                  type="button"
                  className="emoji-btn"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  {emoji}
                </button>
                {showEmojiPicker && (
                  <div className="emoji-dropdown">
                    {EMOJI_LIST.map(e => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => { setEmoji(e); setShowEmojiPicker(false); }}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* 인증샷 */}
          <div className="form-group photo-upload-group">
            <label>모임 인증샷 (선택)</label>
            <div className="file-upload-wrapper">
              <label htmlFor="photo-upload" className="file-upload-btn">
                <ImageIcon size={14} /> 사진 첨부하기
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/jpeg, image/png, image/webp"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 3 * 1024 * 1024) {
                      showAlert("이미지 용량은 3MB 이하여야 합니다.", "error");
                      return;
                    }
                    setPhotoFile(file);
                    setPhotoUrl(URL.createObjectURL(file));
                  }
                }}
              />
            </div>
            {photoUrl && (
              <div className="photo-preview-wrapper">
                <img
                  src={photoUrl}
                  alt="인증샷 미리보기"
                  className="photo-preview"
                />
                <button type="button" className="remove-photo-btn" onClick={() => { setPhotoFile(null); setPhotoUrl(""); }}>
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* ── 게임 목록 (다중) ── */}
          <div className="play-logs-section">
            <div className="play-logs-header">
              <span className="play-logs-title">플레이한 게임</span>
              <button
                type="button"
                className="add-log-btn"
                onClick={handleAddLog}
              >
                <Plus size={14} /> 게임 추가
              </button>
            </div>

            {playLogs.map((log, logIndex) => {
              const selectedGame = boardGames.find((g) => g.id === log.gameId);
              return (
                <div key={log.id} className="play-log-card">
                  {/* 카드 헤더: 게임 번호 + 참여멤버 피커 + 삭제 */}
                  <div className="log-card-header">
                    <span className="log-num">GAME {logIndex + 1}</span>

                    <div className="header-actions">
                      {/* 폰 타입 참여멤버 피커 */}
                      <div className="participant-picker-wrapper">
                        <button
                          type="button"
                          className="participant-icon-btn"
                          onClick={() => setOpenParticipantPicker(
                            openParticipantPicker === logIndex ? null : logIndex
                          )}
                          title="참여 멤버 편집"
                        >
                          <Users size={15} />
                          <span className="participant-count">
                            {(log.participatingMembers || members.map(x => x.id)).length}
                          </span>
                        </button>

                        {/* 드롭다운 피커 */}
                        {openParticipantPicker === logIndex && (
                          <div className="participant-dropdown">
                            <p className="picker-label">참여 멤버 선택</p>
                            {members.map(m => {
                              const isParticipating = (log.participatingMembers || members.map(x => x.id)).includes(m.id);
                              return (
                                <button
                                  key={m.id}
                                  type="button"
                                  className={`picker-member-btn ${isParticipating ? 'active' : ''}`}
                                  onClick={() => handleToggleMember(logIndex, m.id)}
                                >
                                  {m.name}
                                  {isParticipating && <span className="check">✔</span>}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      {playLogs.length > 1 && (
                        <div className="order-actions">
                          <button
                            type="button"
                            className="move-log-btn"
                            onClick={() => handleMoveLog(logIndex, 'up')}
                            disabled={logIndex === 0}
                            title="위로 이동"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            className="move-log-btn"
                            onClick={() => handleMoveLog(logIndex, 'down')}
                            disabled={logIndex === playLogs.length - 1}
                            title="아래로 이동"
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>
                      )}

                      {playLogs.length > 1 && (
                        <button
                          type="button"
                          className="remove-log-btn"
                          onClick={() => handleRemoveLog(logIndex)}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 게임 선택 */}
                  <div className="form-group">
                    {/* <label>어떤 게임?</label> */}
                    <select
                      value={log.gameId}
                      onChange={(e) => handleGameChange(logIndex, e.target.value)}
                      required
                    >
                      <option value="">-- 보드게임 선택 --</option>
                      {sortedBoardGames.map((game) => (
                        <option key={game.id} value={game.id}>
                          {game.name} ({game.genre})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 멤버별 결과 */}
                  {selectedGame && (
                    <div className="player-results-section">
                      {/* <h3>참여 멤버 기록</h3> */}
                      <div className="player-list">
                        {members
                          .filter(m => (log.participatingMembers || members.map(x => x.id)).includes(m.id))
                          .map((member) => {
                            const res = log.results.find(
                              (r) => r.memberId === member.id
                            );
                            return (
                              <div key={member.id} className="player-row">
                                <span
                                  className="member-name"
                                  style={{ color: `var(--${member.color})` }}
                                >
                                  {member.name}
                                </span>

                                {selectedGame.resultType === "ranked" && (
                                  <div className="inputs-ranked">
                                    <input
                                      type="number"
                                      placeholder="등수"
                                      min="1"
                                      defaultValue={res?.rank ?? ""}
                                      onChange={(e) =>
                                        handleResultChange(
                                          logIndex,
                                          member.id,
                                          "rank",
                                          e.target.value ? Number(e.target.value) : undefined
                                        )
                                      }
                                      required
                                    />
                                    <input
                                      type="number"
                                      placeholder="점수(선택)"
                                      defaultValue={res?.score ?? ""}
                                      onChange={(e) =>
                                        handleResultChange(
                                          logIndex,
                                          member.id,
                                          "score",
                                          e.target.value ? Number(e.target.value) : undefined
                                        )
                                      }
                                    />
                                  </div>
                                )}
                                {selectedGame.resultType === "winner_only" && (
                                  <label className="input-winner">
                                    <input
                                      type="checkbox"
                                      defaultChecked={res?.isWinner ?? false}
                                      onChange={(e) =>
                                        handleResultChange(
                                          logIndex,
                                          member.id,
                                          "isWinner",
                                          e.target.checked
                                        )
                                      }
                                    />
                                    승리 👑
                                  </label>
                                )}
                                {selectedGame.resultType === "no_result" && (
                                  <span className="no-result-text">참여 🤝</span>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* 메모 */}
          <div className="form-group">
            <label>한 줄 메모</label>
            <textarea
              placeholder=""
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
            />
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