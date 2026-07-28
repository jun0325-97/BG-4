// src/components/common/QuickPlayLogModal.tsx

import { useState, useMemo, useRef, useEffect } from "react";
import { X, Search, Check, Trophy } from "lucide-react";
import { useStore } from "../../store/useStore";
import { useAlertStore } from "../../store/useAlertStore";
import { PlayLog, PlayerResult } from "../../types";
import "./QuickPlayLogModal.scss";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function formatDateLabel(dateStr: string) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dow = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
  return `${month}월 ${day}일 (${dow})`;
}

export default function QuickPlayLogModal({ isOpen, onClose }: Props) {
  const { records, members, boardGames, updateRecord } = useStore();
  const { showAlert } = useAlertStore();

  // ── 모든 훅을 얼리 리턴 이전에 선언 (Rules of Hooks) ──────
  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => b.date.localeCompare(a.date)),
    [records]
  );

  const sortedGames = useMemo(
    () => [...boardGames].sort((a, b) => a.name.localeCompare(b.name, "ko")),
    [boardGames]
  );

  const [selectedRecordId, setSelectedRecordId] = useState<string>("");
  const [gameSearch, setGameSearch] = useState("");
  const [selectedGameId, setSelectedGameId] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [participatingIds, setParticipatingIds] = useState<string[]>(
    members.map((m) => m.id)
  );
  const [results, setResults] = useState<PlayerResult[]>([]);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 모달 열릴 때마다 상태 초기화
  useEffect(() => {
    if (!isOpen) return;
    const latest = sortedRecords[0];
    setSelectedRecordId(latest?.id ?? "");
    setGameSearch("");
    setSelectedGameId("");
    setIsSearchOpen(false);
    setParticipatingIds(members.map((m) => m.id));
    setResults([]);
    setDurationMinutes(60);
  }, [isOpen]);

  // 검색창 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 검색 필터링 — 훅 이전에 놓는 것이 안전하므로 조건 없이 항상 실행
  const filteredGames = useMemo(() => {
    const q = gameSearch.trim().toLowerCase();
    if (!q) return sortedGames;
    return sortedGames.filter((g) => g.name.toLowerCase().includes(q));
  }, [sortedGames, gameSearch]);

  // ── 얼리 리턴 (훅 선언 이후) ──────────────────────────────
  if (!isOpen) return null;

  if (sortedRecords.length === 0) {
    return (
      <div className="quick-modal-overlay" onClick={onClose}>
        <div className="quick-modal" onClick={(e) => e.stopPropagation()}>
          <div className="quick-modal-header">
            <span className="quick-modal-title">🏆 게임 결과 추가</span>
            <button className="quick-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </div>
          <div className="quick-modal-body">
            <p className="quick-empty">먼저 모임 기록을 하나 이상 추가해 주세요.</p>
          </div>
        </div>
      </div>
    );
  }

  // ── 파생 값 ────────────────────────────────────────────────
  const selectedRecord = sortedRecords.find((r) => r.id === selectedRecordId);
  const selectedGame = boardGames.find((g) => g.id === selectedGameId);
  const participatingMembers = members.filter((m) => participatingIds.includes(m.id));

  // ── 핸들러 ─────────────────────────────────────────────────
  const handleSelectGame = (id: string, name: string) => {
    setSelectedGameId(id);
    setGameSearch(name);
    setIsSearchOpen(false);
    setResults([]);

    // 선택된 게임의 기본 플레이 시간 자동 반영
    const game = boardGames.find((g) => g.id === id);
    if (game && game.playTimeMinutes) {
      setDurationMinutes(game.playTimeMinutes);
    }
  };

  const handleToggleMember = (id: string) => {
    setParticipatingIds((prev) =>
      prev.includes(id)
        ? prev.length <= 1 ? prev : prev.filter((x) => x !== id)
        : [...prev, id]
    );
    setResults((prev) => prev.filter((r) => r.memberId !== id));
  };

  const handleResultChange = (
    memberId: string,
    field: "rank" | "isWinner",
    value: number | boolean
  ) => {
    setResults((prev) => {
      const existing = prev.find((r) => r.memberId === memberId);
      if (existing) {
        return prev.map((r) =>
          r.memberId === memberId ? { ...r, [field]: value } : r
        );
      }
      return [...prev, { memberId, [field]: value }];
    });
  };

  const handleSubmit = async () => {
    if (!selectedRecord) { showAlert("모임을 선택해 주세요.", "error"); return; }
    if (!selectedGameId) { showAlert("게임을 선택해 주세요.", "error"); return; }
    if (participatingIds.length === 0) { showAlert("참여 멤버를 최소 1명 이상 선택해 주세요.", "error"); return; }

    setIsSubmitting(true);
    try {
      const newLog: PlayLog = {
        id: `log-${Date.now()}-${Math.random()}`,
        gameId: selectedGameId,
        resultType: selectedGame?.resultType ?? "no_result",
        durationMinutes,
        participatingMembers: participatingIds,
        results,
      };
      await updateRecord({
        ...selectedRecord,
        playLogs: [...selectedRecord.playLogs, newLog],
      });
      showAlert("게임 결과가 추가되었습니다! 🎉", "success");
      onClose();
    } catch (err: any) {
      showAlert(`저장 실패: ${err.message}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="quick-modal-overlay" onClick={onClose}>
      <div className="quick-modal" onClick={(e) => e.stopPropagation()}>
        {/* 헤더 */}
        <div className="quick-modal-header">
          <span className="quick-modal-title">🏆 게임 결과 추가</span>
          <button className="quick-close-btn" onClick={onClose} aria-label="닫기">
            <X size={20} />
          </button>
        </div>

        <div className="quick-modal-body">
          {/* 1. 날짜 선택 */}
          <div className="qm-section">
            <label className="qm-label">날짜 선택</label>
            <select
              className="qm-select"
              value={selectedRecordId}
              onChange={(e) => setSelectedRecordId(e.target.value)}
            >
              {sortedRecords.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.emoji || "🎲"} {formatDateLabel(r.date)}
                </option>
              ))}
            </select>
          </div>

          {/* 2. 게임 검색 선택 */}
          <div className="qm-section">
            <label className="qm-label">게임 선택</label>
            <div className="qm-game-search-wrap" ref={searchRef}>
              <div className="qm-search-input-row">
                <Search size={15} className="qm-search-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="qm-search-input"
                  placeholder="게임 이름으로 검색..."
                  value={gameSearch}
                  onChange={(e) => {
                    setGameSearch(e.target.value);
                    setSelectedGameId("");
                    setIsSearchOpen(true);
                    setResults([]);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                />
                {gameSearch && (
                  <button
                    className="qm-search-clear"
                    onClick={() => {
                      setGameSearch("");
                      setSelectedGameId("");
                      setIsSearchOpen(false);
                      setResults([]);
                      searchInputRef.current?.focus();
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {isSearchOpen && filteredGames.length > 0 && (
                <ul className="qm-game-list">
                  {filteredGames.map((game) => (
                    <li
                      key={game.id}
                      className={`qm-game-item ${selectedGameId === game.id ? "selected" : ""}`}
                      onClick={() => handleSelectGame(game.id, game.name)}
                    >
                      {game.imageUrl ? (
                        <img src={game.imageUrl} alt={game.name} className="qm-game-thumb" />
                      ) : (
                        <span className="qm-game-thumb-placeholder">🎲</span>
                      )}
                      <div className="qm-game-info">
                        <span className="qm-game-name">{game.name}</span>
                        <span className="qm-game-meta">{game.genre}</span>
                      </div>
                      {selectedGameId === game.id && (
                        <Check size={16} className="qm-game-check" />
                      )}
                    </li>
                  ))}
                </ul>
              )}

              {isSearchOpen && gameSearch && filteredGames.length === 0 && (
                <div className="qm-game-empty">검색 결과가 없습니다</div>
              )}
            </div>
          </div>

          {/* 3. 참여 멤버 */}
          <div className="qm-section">
            <label className="qm-label">참여 멤버</label>
            <div className="qm-member-chips">
              {members.map((m) => {
                const active = participatingIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    className={`qm-member-chip ${active ? "active" : ""}`}
                    data-color={m.color}
                    onClick={() => handleToggleMember(m.id)}
                  >
                    {active && <Check size={12} />}
                    {m.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. 게임 결과 입력 (게임 선택 후) */}
          {selectedGame && (
            <div className="qm-section">
              <label className="qm-label">게임 결과</label>
              {selectedGame.resultType === "no_result" && (
                <p className="qm-no-result-hint">이 게임은 승패 기록이 없는 게임이에요 (참여만 기록)</p>
              )}
              {selectedGame.resultType !== "no_result" && (
                <div className="qm-results-list">
                  {participatingMembers.map((member) => {
                    const res = results.find((r) => r.memberId === member.id);
                    return (
                      <div key={member.id} className="qm-result-row" data-color={member.color}>
                        <span className="qm-member-name">{member.name}</span>
                        {selectedGame.resultType === "winner_only" && (
                          <button
                            type="button"
                            className={`qm-winner-btn ${res?.isWinner ? "won" : ""}`}
                            onClick={() =>
                              handleResultChange(member.id, "isWinner", !(res?.isWinner ?? false))
                            }
                          >
                            <Trophy size={14} />
                            {res?.isWinner ? "우승!" : "패배"}
                          </button>
                        )}
                        {selectedGame.resultType === "ranked" && (
                          <div className="qm-rank-input-wrap">
                            <input
                              type="number"
                              className="qm-rank-input"
                              placeholder="등수"
                              min={1}
                              max={participatingMembers.length}
                              value={res?.rank ?? ""}
                              onChange={(e) =>
                                handleResultChange(
                                  member.id,
                                  "rank",
                                  e.target.value ? Number(e.target.value) : (undefined as any)
                                )
                              }
                            />
                            <span className="qm-rank-unit">등</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 5. 플레이 시간 */}
          <div className="qm-section qm-section--duration">
            <label className="qm-label">플레이 시간</label>
            <div className="qm-duration-row">
              <input
                type="number"
                className="qm-duration-input"
                min={1}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
              />
              <span className="qm-duration-unit">분</span>
            </div>
          </div>
        </div>

        {/* 하단 제출 */}
        <div className="quick-modal-footer">
          <button
            className="qm-submit-btn"
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedGameId}
          >
            {isSubmitting ? "저장 중..." : "결과 저장"}
          </button>
        </div>
      </div>
    </div>
  );
}
