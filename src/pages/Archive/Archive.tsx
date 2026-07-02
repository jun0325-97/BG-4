// src/pages/Archive/Archive.tsx

import { useState, useMemo, useRef, useEffect } from "react";
import { useStore } from "../../store/useStore";
import { Clock, Edit2, X, ChevronLeft, ChevronRight } from "lucide-react";
import RecordRegistrationModal from "../../components/common/RecordRegistrationModal";
import { GatheringRecord } from "../../types";
import "./Archive.scss";

// ── 날짜 포맷 헬퍼 ────────────────────────────────────────────
function formatDate(dateString: string) {
  const [, month, day] = dateString.split("-");
  return { month: parseInt(month, 10), day: parseInt(day, 10) };
}

function getDayOfWeek(dateString: string) {
  const date = new Date(dateString);
  return ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
}

// ── 월 히트맵 ────────────────────────────────────────────────
interface MonthHeatmapProps {
  records: GatheringRecord[];
  selectedYear: string;
  activeMonth: string | null;
  onMonthClick: (month: string) => void;
}

function MonthHeatmap({ records, selectedYear, activeMonth, onMonthClick }: MonthHeatmapProps) {
  const monthCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (let m = 1; m <= 12; m++) {
      const key = `${selectedYear}-${String(m).padStart(2, "0")}`;
      counts[key] = 0;
    }
    records.forEach((rec) => {
      if (rec.date.startsWith(selectedYear)) {
        const key = rec.date.slice(0, 7);
        if (counts[key] !== undefined) counts[key]++;
      }
    });
    return counts;
  }, [records, selectedYear]);

  const maxCount = Math.max(...Object.values(monthCounts), 1);
  const MONTH_NAMES = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

  return (
    <div className="month-heatmap">
      {MONTH_NAMES.map((label, i) => {
        const key = `${selectedYear}-${String(i + 1).padStart(2, "0")}`;
        const count = monthCounts[key] || 0;
        const intensity = count === 0 ? 0 : Math.ceil((count / maxCount) * 4);
        const isActive = activeMonth === key;
        const hasData = count > 0;

        return (
          <button
            key={key}
            className={`heatmap-cell ${isActive ? "heatmap-cell--active" : ""} ${!hasData ? "heatmap-cell--empty" : ""}`}
            data-intensity={intensity}
            onClick={() => hasData && onMonthClick(key)}
            disabled={!hasData}
            aria-label={`${label} ${count}회`}
          >
            <span className="heatmap-cell__month">{label}</span>
            {count > 0 && (
              <span className="heatmap-cell__dot" data-intensity={intensity} />
            )}
            {count > 0 && (
              <span className="heatmap-cell__count">{count}회</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── 게임 결과 태그 ──────────────────────────────────────────
function ResultTags({
  log,
  members,
}: {
  log: GatheringRecord["playLogs"][0];
  members: { id: string; name: string; color: string }[];
}) {
  const RANK_EMOJI: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

  if (log.resultType === "winner_only") {
    const participantIds = log.participatingMembers || log.results.map((r) => r.memberId);
    
    // 승자가 맨 앞에 오도록 정렬
    const sortedParticipantIds = [...participantIds].sort((a, b) => {
      const aIsWinner = log.results.find((r) => r.memberId === a)?.isWinner === true;
      const bIsWinner = log.results.find((r) => r.memberId === b)?.isWinner === true;
      if (aIsWinner && !bIsWinner) return -1;
      if (!aIsWinner && bIsWinner) return 1;
      return 0;
    });

    return (
      <div className="results-grid">
        {sortedParticipantIds.map((memberId) => {
          const member = members.find((m) => m.id === memberId);
          const res = log.results.find((r) => r.memberId === memberId);
          const isWinner = res?.isWinner === true;
          return (
            <div
              key={memberId}
              className={`player-result-tag ${isWinner ? 'player-result-tag--winner' : 'player-result-tag--loser'}`}
              data-color={isWinner ? member?.color : undefined}
            >
              {isWinner && <span className="result-rank-emoji">👑</span>}
              <span className="player-name">{member?.name}</span>
            </div>
          );
        })}
      </div>
    );
  }

  if (log.results && log.results.length > 0) {
    // 등수 순 정렬 (ranked), 없으면 원래 순서
    const sorted = log.resultType === "ranked"
      ? [...log.results].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
      : log.results;
    return (
      <div className="results-grid">
        {sorted.map((res) => {
          const member = members.find((m) => m.id === res.memberId);
          return (
            <div
              key={res.memberId}
              className="player-result-tag"
              data-color={member?.color}
              data-rank={res.rank}
            >
              {res.rank && <span className="result-rank-emoji">{RANK_EMOJI[res.rank] ?? `${res.rank}등`}</span>}
              <span className="player-name">{member?.name}</span>
            </div>
          );
        })}
      </div>
    );
  }

  const participantIds = log.participatingMembers || members.map((m) => m.id);
  return (
    <div className="results-grid">
      {participantIds.map((memberId) => {
        const member = members.find((m) => m.id === memberId);
        return (
          <div key={memberId} className="player-result-tag" data-color={member?.color}>
            <span className="player-name">{member?.name}</span>
            <span style={{ fontSize: "0.85rem" }}>🤝</span>
          </div>
        );
      })}
    </div>
  );
}

// ── 타임라인 카드 ─────────────────────────────────────────────
interface TimelineCardProps {
  record: GatheringRecord;
  members: { id: string; name: string; color: string }[];
  boardGames: { id: string; name: string; imageUrl?: string }[];
  isFirst: boolean;
  isLast: boolean;
  isOverallFirst?: boolean;
  onEdit: (record: GatheringRecord) => void;
  onPhotoClick: (photos: string[], index: number) => void;
}

function TimelineCard({ record, members, boardGames, isFirst, isLast, isOverallFirst, onEdit, onPhotoClick }: TimelineCardProps) {
  const [isOpen, setIsOpen] = useState(!!isOverallFirst);
  
  // 카드 헤더 날짜: 연도 포함
  const [year] = record.date.split("-");
  const { month, day } = formatDate(record.date);
  const dow = getDayOfWeek(record.date);

  // 다중 사진 지원: photoUrls 우선, 없으면 photoUrl fallback
  const photos: string[] = record.photoUrls?.length
    ? record.photoUrls
    : record.photoUrl
    ? [record.photoUrl]
    : [];

  return (
    <div className={`timeline-item ${isFirst ? "timeline-item--first" : ""} ${isLast ? "timeline-item--last" : ""}`}>
      <div className="timeline-card">
        {/* 카드 헤더: 이모지 + 날짜 + 게임수 + 수정버튼 */}
        <div className="timeline-card__header">
          <span className="timeline-card__emoji">{record.emoji || "🎲"}</span>
          <div className="timeline-card__meta">
            <span className="timeline-card__date">{year}년 {month}월 {day}일 ({dow})</span>
            <span className="timeline-card__games-count">{record.playLogs.length}게임</span>
          </div>
          <button
            className="timeline-card__edit-btn"
            onClick={() => onEdit(record)}
            title="기록 수정"
            aria-label="기록 수정"
          >
            <Edit2 size={14} />
          </button>
        </div>

        {/* 메모 */}
        {record.memo && (
          <p className="timeline-card__memo">{record.memo}</p>
        )}

        {/* 사진 갤러리 */}
        {photos.length > 0 && (
          <div className={`timeline-card__photos timeline-card__photos--${photos.length}`}>
            {photos.map((url, i) => (
              <div
                key={i}
                className="timeline-card__photo-wrap"
                onClick={() => onPhotoClick(photos, i)}
              >
                <img src={url} alt={`모임 인증샷 ${i + 1}`} loading="lazy" />
                <div className="timeline-card__photo-overlay">
                  <span>🔍</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 로그 토글 버튼 */}
        {record.playLogs.length > 0 && (
          <button
            className="timeline-card__toggle-btn"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? (
              <>게임 기록 접기 <span>▲</span></>
            ) : (
              <>게임 기록 {record.playLogs.length}개 <span>▼</span></>
            )}
          </button>
        )}

        {/* 게임 로그 목록 */}
        {isOpen && (
          <div className="timeline-card__logs">
          {record.playLogs.map((log, idx) => {
            const game = boardGames.find((g) => g.id === log.gameId);
            return (
              <div key={log.id} className="log-entry">
                <div className="log-entry__header">
                  <div className="log-entry__thumb">
                    {game?.imageUrl ? (
                      <img src={game.imageUrl} alt={game.name} loading="lazy" />
                    ) : (
                      <span>🎲</span>
                    )}
                  </div>
                  <div className="log-entry__info">
                    <span className="log-entry__num">GAME {idx + 1}</span>
                    <span className="log-entry__name">{game?.name || "알 수 없는 게임"}</span>
                  </div>
                  <div className="log-entry__duration">
                    <Clock size={12} />
                    <span>{log.durationMinutes}분</span>
                  </div>
                </div>
                <ResultTags log={log} members={members} />
              </div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}

// ── 라이트박스 ────────────────────────────────────────────────
interface LightboxProps {
  photos: string[];
  initialIndex: number;
  onClose: () => void;
}

function Lightbox({ photos, initialIndex, onClose }: LightboxProps) {
  const [current, setCurrent] = useState(initialIndex);

  const prev = () => setCurrent((c) => (c > 0 ? c - 1 : photos.length - 1));
  const next = () => setCurrent((c) => (c < photos.length - 1 ? c + 1 : 0));

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="photo-lightbox" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose} aria-label="닫기">
        <X size={24} />
      </button>

      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
        <img src={photos[current]} alt={`사진 ${current + 1}`} className="lightbox-img" />
      </div>

      {photos.length > 1 && (
        <>
          <button className="lightbox-nav lightbox-nav--prev" onClick={(e) => { e.stopPropagation(); prev(); }}>
            <ChevronLeft size={28} />
          </button>
          <button className="lightbox-nav lightbox-nav--next" onClick={(e) => { e.stopPropagation(); next(); }}>
            <ChevronRight size={28} />
          </button>
          <div className="lightbox-dots">
            {photos.map((_, i) => (
              <span
                key={i}
                className={`lightbox-dot ${i === current ? "lightbox-dot--active" : ""}`}
                onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── 메인 페이지 ────────────────────────────────────────────────
export default function Archive() {
  const {
    records: GATHERING_RECORDS,
    members: MEMBERS,
    boardGames: BOARD_GAMES,
  } = useStore();

  // 연도 탭 목록 — 실제 기록 있는 연도만, 항상 오름차순
  const years = useMemo(() => {
    return Array.from(
      new Set(GATHERING_RECORDS.map((rec) => rec.date.split("-")[0]))
    ).sort((a, b) => a.localeCompare(b));
  }, [GATHERING_RECORDS]);

  const [selectedYear, setSelectedYear] = useState(years[years.length - 1] || "");
  // 진입 시 가장 최신 모임 월을 자동 활성화
  const latestMonth = GATHERING_RECORDS.length > 0
    ? [...GATHERING_RECORDS].sort((a, b) => b.date.localeCompare(a.date))[0].date.slice(0, 7)
    : null;
  const [activeMonth, setActiveMonth] = useState<string | null>(latestMonth);
  const [editingRecord, setEditingRecord] = useState<GatheringRecord | null>(null);
  const [lightbox, setLightbox] = useState<{ photos: string[]; index: number } | null>(null);

  useEffect(() => {
    if (years.length > 0 && (!selectedYear || !years.includes(selectedYear))) {
      setSelectedYear(years[years.length - 1]);
    }
  }, [years, selectedYear]);

  const filteredRecords = useMemo(() => {
    return GATHERING_RECORDS.filter((rec) =>
      rec.date.startsWith(selectedYear)
    ).sort((a, b) => b.date.localeCompare(a.date));
  }, [GATHERING_RECORDS, selectedYear]);

  const monthRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleMonthClick = (month: string) => {
    setActiveMonth(month);
    const el = monthRefs.current[month];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const groupedByMonth = useMemo(() => {
    const groups: { month: string; label: string; records: GatheringRecord[] }[] = [];
    const monthMap = new Map<string, GatheringRecord[]>();

    filteredRecords.forEach((rec) => {
      const key = rec.date.slice(0, 7);
      if (!monthMap.has(key)) monthMap.set(key, []);
      monthMap.get(key)!.push(rec);
    });

    monthMap.forEach((recs, key) => {
      const [, month] = key.split("-");
      groups.push({
        month: key,
        label: `${parseInt(month, 10)}월`,
        records: recs,
      });
    });

    return groups.sort((a, b) => b.month.localeCompare(a.month));
  }, [filteredRecords]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const month = entry.target.getAttribute("data-month");
            if (month) setActiveMonth(month);
          }
        });
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );

    Object.entries(monthRefs.current).forEach(([, el]) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [groupedByMonth]);

  return (
    <div className="archive-container">
      <h1 className="page-title">게임 다이어리</h1>

      {/* ── 연도 탭: 2개 이상 연도일 때만 표시 ── */}
      {years.length > 1 && (
        <div className="year-tabs">
          {years.map((year) => (
            <button
              key={year}
              className={`year-tab ${selectedYear === year ? "active" : ""}`}
              onClick={() => {
                setSelectedYear(year);
                setActiveMonth(null);
              }}
            >
              {year}
            </button>
          ))}
        </div>
      )}

      {filteredRecords.length === 0 ? (
        <div className="archive-empty">
          <span className="archive-empty__icon">🎲</span>
          <p>아직 기록이 없어요</p>
          <p className="archive-empty__sub">첫 모임을 기록해보세요!</p>
        </div>
      ) : (
        <>
          {/* ── 월별 히트맵 ── */}
          <MonthHeatmap
            records={GATHERING_RECORDS}
            selectedYear={selectedYear}
            activeMonth={activeMonth}
            onMonthClick={handleMonthClick}
          />

          {/* ── 타임라인 피드 ── */}
          <div className="timeline-feed">
            {groupedByMonth.map((group, groupIndex) => (
              <div
                key={group.month}
                className="timeline-month-group"
                data-month={group.month}
                ref={(el) => { monthRefs.current[group.month] = el; }}
              >
                <div className="timeline-month-label">
                  <span>{group.label}</span>
                </div>

                {group.records.map((record, idx) => (
                  <TimelineCard
                    key={record.id}
                    record={record}
                    members={MEMBERS}
                    boardGames={BOARD_GAMES}
                    isFirst={idx === 0}
                    isLast={idx === group.records.length - 1}
                    isOverallFirst={groupIndex === 0 && idx === 0}
                    onEdit={setEditingRecord}
                    onPhotoClick={(photos, index) => setLightbox({ photos, index })}
                  />
                ))}
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── 수정 모달 ── */}
      {editingRecord && (
        <RecordRegistrationModal
          isOpen={true}
          onClose={() => setEditingRecord(null)}
          editRecord={editingRecord}
        />
      )}

      {/* ── 라이트박스 ── */}
      {lightbox && (
        <Lightbox
          photos={lightbox.photos}
          initialIndex={lightbox.index}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
