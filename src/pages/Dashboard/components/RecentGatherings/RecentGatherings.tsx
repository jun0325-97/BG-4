// src/pages/Dashboard/components/RecentGatherings/RecentGatherings.tsx

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, ArrowUpRight } from "lucide-react";
import { useStore } from "../../../../store/useStore";
import "./RecentGatherings.scss";

function formatDateParts(dateStr: string) {
  if (!dateStr) return { main: "", dow: "" };
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dow = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()] || "";
  return { main: `${month}월 ${day}일`, dow: dow ? `${dow}요일` : "" };
}

export default function RecentGatherings() {
  const navigate = useNavigate();
  const { records, boardGames } = useStore();

  // 최신 모임 기록 3개 정렬 및 추출
  const recentRecords = useMemo(() => {
    return [...records]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3);
  }, [records]);

  // 카드 이동 핸들러
  const handleCardClick = (id: string) => {
    navigate(`/archive?id=${id}`);
  };

  // 더보기 이동 핸들러
  const handleMoreClick = () => {
    navigate("/archive");
  };

  return (
    <div className="recent-gatherings-container">
      <div className="recent-gatherings-header">
        <div className="title-area">
          <h2 className="section-title">최근 모임 기록</h2>
        </div>

        <button
          className="more-button"
          onClick={handleMoreClick}
          aria-label="모임 기록 전체보기"
        >
          <ChevronRight size={18} className="chevron-icon" />
        </button>
      </div>

      {recentRecords.length === 0 ? (
        <div className="empty-gatherings">
          <p>아직 등록된 모임 기록이 없어요 🎲</p>
          <button onClick={() => navigate("/archive")} className="create-link">
            첫 모임 기록하러 가기
          </button>
        </div>
      ) : (
        <div className="gatherings-grid">
          {recentRecords.map((record) => {
            // 1. 해당 모임에서 열린 중복 없는 게임 목록 (게임 종류)
            const uniqueGameNames = Array.from(
              new Set(
                record.playLogs
                  .map((log) => boardGames.find((bg) => bg.id === log.gameId)?.name)
                  .filter((name): name is string => !!name)
              )
            );

            const { main: dateMain, dow: dateDow } = formatDateParts(record.date);

            return (
              <div
                key={record.id}
                className="gathering-card"
                onClick={() => handleCardClick(record.id)}
              >
                {/* 상단 헤더: 이모지 + 날짜 */}
                <div className="card-top">
                  <div className="emoji-date">
                    <span className="card-emoji">{record.emoji || "🎲"}</span>
                    <div className="date-block">
                      <span className="card-date">{dateMain}</span>
                      {dateDow && <span className="card-dow">{dateDow}</span>}
                    </div>
                  </div>
                  <div className="hover-arrow">
                    <ArrowUpRight size={18} />
                  </div>
                </div>

                {/* 게임 종목 리스트 (중복 제거됨) 및 메모 */}
                <div className="card-main">
                  <div className="game-tags">
                    {uniqueGameNames.length > 0 ? (
                      uniqueGameNames.map((name, idx) => (
                        <span key={idx} className="game-tag">
                          {name}
                        </span>
                      ))
                    ) : (
                      <span className="game-tag opacity-60">기록된 게임 없음</span>
                    )}
                  </div>

                  {record.memo && (
                    <div className="card-memo">
                      <span className="memo-text">{record.memo}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
