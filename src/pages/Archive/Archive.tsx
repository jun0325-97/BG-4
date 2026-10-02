// src/pages/Archive/Archive.tsx

import { useState, useMemo, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useStore } from "../../store/useStore";
import { Edit2, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import RecordRegistrationModal from "../../components/common/RecordRegistrationModal";
import { GatheringRecord } from "../../types";
import PageTransition from "../../components/common/PageTransition";
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
  const scrollRef = useRef<HTMLDivElement>(null);

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

  // 활성화된 월 탭으로 자동 가로 스크롤 (화면 튀는 현상 방지)
  useEffect(() => {
    if (activeMonth && scrollRef.current) {
      const container = scrollRef.current;
      const activeEl = container.querySelector(".month-pill--active") as HTMLElement;
      if (activeEl) {
        // scrollIntoView는 세로 스크롤(전체 페이지)까지 끌어올리므로
        // 컨테이너 내부의 가로(scrollLeft)만 변경하여 중앙에 맞춤
        const containerWidth = container.clientWidth;
        const elOffset = activeEl.offsetLeft;
        const elWidth = activeEl.offsetWidth;
        
        container.scrollTo({
          left: elOffset - containerWidth / 2 + elWidth / 2,
          behavior: "smooth"
        });
      }
    }
  }, [activeMonth, selectedYear]);


  const MONTH_NAMES = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];

  return (
    <div className="month-scroller" ref={scrollRef}>
      {MONTH_NAMES.map((label, i) => {
        const key = `${selectedYear}-${String(i + 1).padStart(2, "0")}`;
        const count = monthCounts[key] || 0;
        const isActive = activeMonth === key;
        const hasData = count > 0;

        return (
          <button
            key={key}
            className={`month-pill ${isActive ? "month-pill--active" : ""} ${!hasData ? "month-pill--empty" : ""}`}
            onClick={() => hasData && onMonthClick(key)}
            disabled={!hasData}
            aria-label={`${label} ${count}회`}
          >
            <span className="month-pill__label">{label}</span>
            {hasData && <span className="month-pill__dot" />}
          </button>
        );
      })}
    </div>
  );
}

// ── 승자 계산 헬퍼 ──────────────────────────────────────────
function getWinners(
  log: GatheringRecord["playLogs"][0],
  members: { id: string; name: string; color: string }[]
) {
  if (log.resultType === "winner_only") {
    return log.results
      .filter((r) => r.isWinner)
      .map((r) => members.find((m) => m.id === r.memberId))
      .filter((m): m is NonNullable<typeof m> => !!m);
  }
  if (log.resultType === "ranked") {
    return log.results
      .filter((r) => r.rank === 1)
      .map((r) => members.find((m) => m.id === r.memberId))
      .filter((m): m is NonNullable<typeof m> => !!m);
  }
  return [];
}

// ── 타임라인 카드 ─────────────────────────────────────────────
interface TimelineCardProps {
  record: GatheringRecord;
  members: { id: string; name: string; color: string }[];
  boardGames: { id: string; name: string; imageUrl?: string; genre?: string }[];
  isLast: boolean;
  isOverallFirst?: boolean;
  isTarget?: boolean;
  onEdit: (record: GatheringRecord) => void;
  onPhotoClick: (photos: string[], index: number) => void;
}

function TimelineCard({ record, members, boardGames, isLast, isOverallFirst, isTarget, onEdit, onPhotoClick }: TimelineCardProps) {
  const [isOpen, setIsOpen] = useState(!!isOverallFirst || !!isTarget);
  
  useEffect(() => {
    if (isTarget) {
      setIsOpen(true);
    }
  }, [isTarget]);

  // 카드 헤더 날짜: 연도 포함
  const { month, day } = formatDate(record.date);
  const dow = getDayOfWeek(record.date);

  // 다중 사진 지원: photoUrls 우선, 없으면 photoUrl fallback
  const photos: string[] = record.photoUrls?.length
    ? record.photoUrls
    : record.photoUrl
    ? [record.photoUrl]
    : [];

  return (
    <div 
      id={`record-${record.id}`}
      className={`timeline-item ${isLast ? "timeline-item--last" : ""} ${isTarget ? "timeline-item--target" : ""}`}
    >
      {/* ── 리얼 타임라인 축 (왼쪽) ── */}
      <div className="timeline-axis">
        <div className="timeline-axis__node">
          <span className="node-emoji">{record.emoji || "🎲"}</span>
        </div>
        <div className="timeline-axis__date">
          <span className="date-main">{month}.{day}</span>
          <span className="date-dow">{dow}</span>
        </div>
        <div className="timeline-axis__line" />
      </div>

      {/* ── 오른쪽 카드 ── */}
      <div className={`timeline-card ${isTarget ? "timeline-card--target-highlight" : ""}`}>
        {/* 카드 헤더: 게임 수 + 수정버튼 */}
        <div 
          className="timeline-card__header"
          onClick={() => setIsOpen(!isOpen)}
          style={{ cursor: "pointer", userSelect: "none" }}
        >
          <span className="timeline-card__games-count" style={{ display: "inline-flex", alignItems: "center" }}>
            총 {record.playLogs.length}게임 플레이
            <span style={{ marginLeft: "4px", display: "inline-flex", alignItems: "center", opacity: 0.6, position: "relative", top: "-1px" }}>
              {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </span>
          </span>
          <button
            className="timeline-card__edit-btn"
            onClick={(e) => { e.stopPropagation(); onEdit(record); }}
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
                onClick={(e) => { e.stopPropagation(); onPhotoClick(photos, i); }}
              >
                <img src={url} alt={`모임 인증샷 ${i + 1}`} loading="lazy" />
                <div className="timeline-card__photo-overlay">
                  <span>🔍</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 컴팩트 리스트 형태의 게임 로그 목록 */}
        {isOpen && (
          <div className="timeline-card__logs">
          {record.playLogs.map((log, idx) => {
            const game = boardGames.find((g) => g.id === log.gameId);
            const winners = getWinners(log, members);
            
            let participantIds = log.participatingMembers || log.results.map(r => r.memberId);
            if (!participantIds || participantIds.length === 0) {
              participantIds = members.map(m => m.id);
            }

            return (
              <div key={log.id} className="log-row">
                <span className="log-row__index">{idx + 1}</span>
                
                <div className="log-row__thumb">
                  {game?.imageUrl ? (
                    <img src={game.imageUrl} alt={game.name} loading="lazy" />
                  ) : (
                    <span>🎲</span>
                  )}
                </div>

                <div className="log-row__info">
                  <div className="log-row__game-title">
                    <span className="name">{game?.name || "알 수 없는 게임"}</span>
                    <span className="duration">{log.durationMinutes}분</span>
                  </div>
                  
                  <div className="log-row__result">
                    {log.resultType === "no_result" || (winners.length === 0 && game?.genre === "협력") ? (
                      <span className="no-result">🤝 {game?.genre === "협력" ? "협력 게임" : "친선 (승패 없음)"}</span>
                    ) : winners.length > 0 ? (
                      <div className="winners">
                        {winners.map((w) => (
                          <div key={w.id} className="winner-badge" data-color={w.color}>
                            <span className="crown">👑</span>
                            <span className="winner-name">{w.name} 승리</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="no-result">결과 미상</span>
                    )}
                  </div>
                </div>
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
  const [searchParams] = useSearchParams();
  const targetId = searchParams.get("id");

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

  // 딥링크 targetId가 포함되어 넘어왔을 경우 처리
  useEffect(() => {
    if (!targetId || GATHERING_RECORDS.length === 0) return;
    const targetRec = GATHERING_RECORDS.find((rec) => rec.id === targetId);
    if (targetRec) {
      const year = targetRec.date.split("-")[0];
      const monthKey = targetRec.date.slice(0, 7);
      setSelectedYear(year);
      setActiveMonth(monthKey);

      const timer = setTimeout(() => {
        const el = document.getElementById(`record-${targetId}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [targetId, GATHERING_RECORDS]);

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
    <PageTransition>
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
                    isLast={idx === group.records.length - 1}
                    isOverallFirst={groupIndex === 0 && idx === 0}
                    isTarget={record.id === targetId}
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
    </PageTransition>
  );
}
