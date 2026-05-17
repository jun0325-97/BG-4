// src/components/common/RecordRegistrationModal.tsx

import { useState } from "react";
import { X } from "lucide-react";
import { useStore } from "../../store/useStore"; // 🌟 더미 데이터 대신 Store 불러오기!
import "./RecordRegistrationModal.scss";

interface RecordRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RecordRegistrationModal({
  isOpen,
  onClose,
}: RecordRegistrationModalProps) {
  // 🌟 Store에서 데이터 목록(읽기용)과 추가 함수(쓰기용)를 꺼내와!
  const { members, boardGames, addRecord } = useStore();

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedGameId, setSelectedGameId] = useState("");
  const [memo, setMemo] = useState("");
  const [playerResults, setPlayerResults] = useState<Record<string, any>>({});
  const [photoUrl, setPhotoUrl] = useState("");

  if (!isOpen) return null;

  const selectedGame = boardGames.find((g) => g.id === selectedGameId);

  const handleResultChange = (memberId: string, field: string, value: any) => {
    setPlayerResults((prev) => ({
      ...prev,
      [memberId]: { ...prev[memberId], [field]: value },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGameId || !selectedGame) {
      alert("플레이한 게임을 선택해 주세요! 🎲");
      return;
    }

    // 🌟 Store 규격(Type)에 맞게 데이터를 예쁘게 포장하는 과정
    const newRecord = {
      id: `r-${Date.now()}`, // 겹치지 않게 현재 시간으로 임시 ID 생성
      date,
      memo,
      photoUrl,
      playLogs: [
        {
          id: `log-${Date.now()}`,
          gameId: selectedGameId,
          resultType: selectedGame.resultType,
          durationMinutes: selectedGame.playTimeMinutes,
          results: Object.entries(playerResults).map(([memberId, result]) => ({
            memberId,
            ...result,
          })),
        },
      ],
    };

    // 🌟 포장한 데이터 택배를 중앙 저장소로 전송!
    addRecord(newRecord);
    alert("새로운 기록이 등록되었습니다! 🎉 다음 기록을 계속 등록해주세요.");
    
    // 연속 등록을 위해 폼 초기화 (모달은 닫지 않음)
    setSelectedGameId("");
    setMemo("");
    setPlayerResults({});
    setPhotoUrl("");
    // 날짜는 연속으로 같은 날짜를 등록할 가능성이 높으니 유지
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>새 모임 기록 추가</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body-scroll">
          <form onSubmit={handleSubmit} className="record-form">
          <div className="form-group">
            <label>언제 플레이했나요?</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>

          <div className="form-group">
            <label>모임 인증샷 (선택)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const localUrl = URL.createObjectURL(file);
                  setPhotoUrl(localUrl);
                }
              }}
            />
            {photoUrl && (
              <div style={{ marginTop: "10px" }}>
                <img src={photoUrl} alt="인증샷 미리보기" style={{ maxWidth: "100%", borderRadius: "8px" }} />
              </div>
            )}
          </div>

          <div className="form-group">
            <label>어떤 게임을 했나요?</label>
            <select value={selectedGameId} onChange={(e) => setSelectedGameId(e.target.value)} required>
              <option value="">-- 보드게임 선택 --</option>
              {boardGames.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name} ({game.genre})
                </option>
              ))}
            </select>
          </div>

          {selectedGame && (
            <div className="player-results-section">
              <h3>참여 멤버 기록 입력</h3>
              <div className="player-list">
                {members.map((member) => (
                  <div key={member.id} className="player-row">
                    <span className="member-name" style={{ color: `var(--${member.color})` }}>
                      {member.name}
                    </span>

                    {selectedGame.resultType === "ranked" && (
                      <div className="inputs-ranked">
                        <input type="number" placeholder="등수(숫자)" min="1" onChange={(e) => handleResultChange(member.id, "rank", Number(e.target.value))} />
                        <input type="number" placeholder="점수" onChange={(e) => handleResultChange(member.id, "score", Number(e.target.value))} />
                      </div>
                    )}
                    {selectedGame.resultType === "winner_only" && (
                      <label className="input-winner">
                        <input type="checkbox" onChange={(e) => handleResultChange(member.id, "isWinner", e.target.checked)} /> 승리 👑
                      </label>
                    )}
                    {selectedGame.resultType === "no_result" && <span className="no-result-text">참여 🤝</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label>한 줄 메모 (에피소드)</label>
            <textarea placeholder="예: 한솔의 블러핑에 다들 속아 넘어간 날 😡" value={memo} onChange={(e) => setMemo(e.target.value)} rows={3} />
          </div>

          <button type="submit" className="submit-btn">최종 등록하기</button>
          </form>
        </div>
      </div>
    </div>
  );
}