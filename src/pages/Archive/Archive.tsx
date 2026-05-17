// src/pages/Archive/Archive.tsx

import { useState } from "react";
import { useStore } from "../../store/useStore"; // ⭕ 새 코드: Store 불러오기!
import { Calendar, ChevronDown, ChevronUp, Trophy, Clock } from "lucide-react";
import "./Archive.scss";

export default function Archive() {
  // 1. 데이터에서 존재하는 연도들만 뽑아서 중복 제거 후 내림차순 정렬 (2026, 2025...)
const { records: GATHERING_RECORDS, members: MEMBERS, boardGames: BOARD_GAMES } = useStore();
  const years = Array.from(
    new Set(GATHERING_RECORDS.map((rec) => rec.date.split("-")[0]))
  ).sort((a, b) => b.localeCompare(a));

  const [selectedYear, setSelectedYear] = useState(years[0] || "");
  const [openRecordId, setOpenRecordId] = useState<string | null>(null);

  // 현재 선택된 연도의 기록들만 필터링
  const filteredRecords = GATHERING_RECORDS.filter((rec) =>
    rec.date.startsWith(selectedYear)
  ).sort((a, b) => b.date.localeCompare(a.date));

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
              setOpenRecordId(null); // 연도 바꿀 때 열려있던 아코디언 닫기
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
            {/* 아코디언 헤더 (항상 보이는 부분) */}
            <div
              className="record-header"
              onClick={() => toggleAccordion(record.id)}
            >
              <div className="date-info">
                <Calendar size={16} />
                <span>{record.date}</span>
              </div>
              <div className="icon-wrapper">
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
                        {log.results.map((res) => {
                          const member = MEMBERS.find(
                            (m) => m.id === res.memberId
                          );
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
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
