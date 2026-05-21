// src/pages/Archive/Archive.tsx

import { useState, useMemo } from "react";
import { useStore } from "../../store/useStore";
import { ChevronDown, ChevronUp, Trophy, Clock, Edit2 } from "lucide-react";
import RecordRegistrationModal from "../../components/common/RecordRegistrationModal";
import { GatheringRecord } from "../../types";
import "./Archive.scss";

// 날짜를 보기 좋게 변환하는 헬퍼 함수
function formatRecordTitle(dateString: string, emoji?: string) {
  const parts = dateString.split("-");
  if (parts.length === 3) {
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    const title = `${month}월 ${day}일의 모임 기록`;
    return emoji ? `${emoji} ${title}` : `🎲 ${title}`;
  }
  return dateString;
}

export default function Archive() {
  const { records: GATHERING_RECORDS, members: MEMBERS, boardGames: BOARD_GAMES } = useStore();
  
  // 1. 데이터에서 존재하는 연도들만 뽑아서 중복 제거 후 내림차순 정렬
  const years = useMemo(() => {
    return Array.from(
      new Set(GATHERING_RECORDS.map((rec) => rec.date.split("-")[0]))
    ).sort((a, b) => b.localeCompare(a));
  }, [GATHERING_RECORDS]);

  const [selectedYear, setSelectedYear] = useState(years[0] || "");
  const [openRecordId, setOpenRecordId] = useState<string | null>(null);
  const [editingRecord, setEditingRecord] = useState<GatheringRecord | null>(null);

  // 현재 선택된 연도의 기록들만 필터링 (최적화)
  const filteredRecords = useMemo(() => {
    return GATHERING_RECORDS.filter((rec) =>
      rec.date.startsWith(selectedYear)
    ).sort((a, b) => b.date.localeCompare(a.date));
  }, [GATHERING_RECORDS, selectedYear]);

  const toggleAccordion = (id: string) => {
    setOpenRecordId(openRecordId === id ? null : id);
  };

  return (
    <div className="archive-container">
      <h1 className="page-title">모임 기록고</h1>

      {/* 연도별 탭 */}
      <div className="year-tabs">
        {years.map((year) => (
          <button
            key={year}
            className={`year-tab ${selectedYear === year ? "active" : ""}`}
            onClick={() => {
              setSelectedYear(year);
              setOpenRecordId(null);
            }}
          >
            {year}
          </button>
        ))}
      </div>

      {/* 기록 리스트 (아코디언) */}
      <div className="record-list">
        {filteredRecords.map((record) => (
          <div
            key={record.id}
            className={`record-card ${
              openRecordId === record.id ? "open" : ""
            }`}
          >
            {/* 아코디언 헤더 */}
            <div
              className="record-header"
              onClick={() => toggleAccordion(record.id)}
            >
              <div className="date-info" style={{ fontWeight: 800, fontSize: "1.05rem" }}>
                <span>{formatRecordTitle(record.date, record.emoji)}</span>
              </div>
              <div className="icon-wrapper">
                <button 
                  className="edit-btn" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingRecord(record);
                  }}
                  title="기록 수정"
                >
                  <Edit2 size={16} />
                </button>
                {openRecordId === record.id ? <ChevronUp /> : <ChevronDown />}
              </div>
            </div>

            {/* 아코디언 내용 (클릭 시 펼쳐지는 상세 정보) */}
            {openRecordId === record.id && (
              <div className="record-detail">
                {record.photoUrl && (
                  <div className="record-photo">
                    <img src={record.photoUrl} alt="모임 인증샷" />
                  </div>
                )}
                {record.memo && (
                  <div className="record-memo">
                    <p>"{record.memo}"</p>
                  </div>
                )}
                {record.playLogs.map((log, index) => {
                  const game = BOARD_GAMES.find((g) => g.id === log.gameId);
                  return (
                    <div key={log.id} className="game-log-item">
                      <div className="game-info">
                        <div className="log-thumbnail">
                          {game?.imageUrl ? (
                            <img src={game.imageUrl} alt="" />
                          ) : (
                            "🎲"
                          )}
                        </div>
                        <div>
                          <span className="game-num">GAME {index + 1}</span>
                          <h4 className="game-name">{game?.name}</h4>
                        </div>
                        <div className="duration">
                          <Clock size={14} /> {log.durationMinutes}분
                        </div>
                      </div>

                      <div className="results-grid">
                        {log.results && log.results.length > 0 ? (
                          log.results.map((res) => {
                            const member = MEMBERS.find((m) => m.id === res.memberId);
                            return (
                              <div
                                key={res.memberId}
                                className="player-result-tag"
                                data-color={member?.color}
                              >
                                <span className="player-name">
                                  {member?.name}
                                </span>
                                {log.resultType === "ranked" && (
                                  <span className="score">{res.score}점</span>
                                )}
                                {res.isWinner && (
                                  <Trophy size={14} className="winner-crown" />
                                )}
                                {res.rank && (
                                  <span className="rank-badge">{res.rank}등</span>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          (log.participatingMembers || MEMBERS.map(m=>m.id)).map((memberId) => {
                            const member = MEMBERS.find((m) => m.id === memberId);
                            return (
                              <div
                                key={memberId}
                                className="player-result-tag"
                                data-color={member?.color}
                              >
                                <span className="player-name">
                                  {member?.name}
                                </span>
                                <span className="no-result-text" style={{ fontSize: '0.8rem', color: '#666', marginLeft: '4px' }}>참여 🤝</span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {editingRecord && (
        <RecordRegistrationModal
          isOpen={true}
          onClose={() => setEditingRecord(null)}
          editRecord={editingRecord}
        />
      )}
    </div>
  );
}
