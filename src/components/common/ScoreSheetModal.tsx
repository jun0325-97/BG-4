// src/components/common/ScoreSheetModal.tsx

import { useState, useMemo } from "react";
import { X, Plus, Trash2, Check, RefreshCw, Sparkles } from "lucide-react";
import { useStore } from "../../store/useStore";
import { useAlertStore } from "../../store/useAlertStore";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";
import { playSuccessChime, triggerHaptic } from "../../utils/soundEffects";
import { PlayLog, PlayerResult } from "../../types";
import "./ScoreSheetModal.scss";

interface ScoreSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGameName?: string;
}

// 지원되는 전용 종이 점수지 템플릿
interface ScoreItemDef {
  id: string;
  label: string;
  icon: string;
  multiplier?: number;
  hint?: string;
}

interface GameTemplate {
  name: string;
  description: string;
  items: ScoreItemDef[];
  customCompute?: (values: Record<string, number>) => number;
}

const TEMPLATES: Record<string, GameTemplate> = {
  cascadia: {
    name: "캐스캐디아",
    description: "야생동물 카드 점수 + 서식지 타일 + 보너스 점수지",
    items: [
      { id: "bear", label: "곰", icon: "🐻", hint: "야생동물 카드 곰 점수" },
      { id: "elk", label: "엘크", icon: "🦌", hint: "야생동물 카드 엘크 점수" },
      { id: "salmon", label: "연어", icon: "🐟", hint: "야생동물 카드 연어 점수" },
      { id: "hawk", label: "매", icon: "🦅", hint: "야생동물 카드 매 점수" },
      { id: "fox", label: "여우", icon: "🦊", hint: "야생동물 카드 여우 점수" },
      { id: "mountains", label: "산악 서식지", icon: "⛰️", hint: "가장 큰 인접 산악 크기" },
      { id: "forests", label: "숲 서식지", icon: "🌲", hint: "가장 큰 인접 숲 크기" },
      { id: "prairies", label: "초원 서식지", icon: "🌾", hint: "가장 큰 인접 초원 크기" },
      { id: "wetlands", label: "습지 서식지", icon: "🌿", hint: "가장 큰 인접 습지 크기" },
      { id: "rivers", label: "강 서식지", icon: "🌊", hint: "가장 큰 인접 강 크기" },
      { id: "majority", label: "서식지 다수 보너스", icon: "🥇", hint: "각 서식지 1/2등 보너스 합" },
      { id: "nature", label: "솔방울 토큰", icon: "🌰", hint: "남은 자연 토큰 (개당 1점)" },
    ],
  },
  orleans: {
    name: "오를레앙",
    description: "발전 트랙 배수 + 교역소/시민 + 상품 + 주화 점수지",
    items: [
      { id: "trading_stations", label: "교역소 개수", icon: "🏛️", hint: "건설한 교역소 수" },
      { id: "citizens", label: "시민 타일 개수", icon: "👥", hint: "획득한 시민 타일 수" },
      { id: "dev_status", label: "발전 트랙 배수", icon: "⭐", hint: "발전 트랙 위치 승수 (1~6)" },
      { id: "brocade", label: "비단 (5점)", icon: "🧣", multiplier: 5, hint: "개당 5점" },
      { id: "wool", label: "양모 (4점)", icon: "🧶", multiplier: 4, hint: "개당 4점" },
      { id: "wine", label: "포도주 (3점)", icon: "🍷", multiplier: 3, hint: "개당 3점" },
      { id: "cheese", label: "치즈 (2점)", icon: "🧀", multiplier: 2, hint: "개당 2점" },
      { id: "grain", label: "곡물 (1점)", icon: "🌾", multiplier: 1, hint: "개당 1점" },
      { id: "coins", label: "주화 (1코인 1점)", icon: "💰", hint: "남은 주화 총합" },
    ],
    customCompute: (vals) => {
      const stations = vals["trading_stations"] || 0;
      const citizens = vals["citizens"] || 0;
      const dev = vals["dev_status"] || 1;
      const brocade = (vals["brocade"] || 0) * 5;
      const wool = (vals["wool"] || 0) * 4;
      const wine = (vals["wine"] || 0) * 3;
      const cheese = (vals["cheese"] || 0) * 2;
      const grain = (vals["grain"] || 0) * 1;
      const coins = vals["coins"] || 0;
      return (stations + citizens) * dev + brocade + wool + wine + cheese + grain + coins;
    },
  },
  wingspan: {
    name: "윙스팬",
    description: "새 카드 + 보너스 카드 + 라운드 목표 + 알/먹이 점수지",
    items: [
      { id: "birds", label: "새 카드 점수", icon: "🐦", hint: "보호구역 새 카드 승점 합" },
      { id: "bonus", label: "보너스 카드", icon: "🎯", hint: "달성한 보너스 카드 점수" },
      { id: "goals", label: "라운드 목표", icon: "🏆", hint: "1~4라운드 목표 점수 합" },
      { id: "eggs", label: "알 개수 (1점)", icon: "🥚", hint: "새 둥지에 놓인 알 (개당 1점)" },
      { id: "food", label: "보관한 먹이 (1점)", icon: "🌾", hint: "새 카드 위 먹이 (개당 1점)" },
      { id: "tucked", label: "삼킨 카드 (1점)", icon: "🃏", hint: "새 카드 밑 삼킨 카드 (장당 1점)" },
    ],
  },
  splendor: {
    name: "스플렌더",
    description: "개발 카드 점수 + 귀족 타일 점수",
    items: [
      { id: "cards", label: "개발 카드 승점", icon: "💎", hint: "구매한 1~3단계 카드 승점 합" },
      { id: "nobles", label: "귀족 타일 승점", icon: "👑", hint: "방문한 귀족 승점 합 (개당 3점)" },
    ],
  },
  custom: {
    name: "범용 자유 점수판",
    description: "모든 게임에서 자유롭게 항목을 추가해 계산하는 점수지",
    items: [
      { id: "base", label: "기본 점수", icon: "🎲" },
      { id: "bonus", label: "보너스 / 목표", icon: "⭐" },
      { id: "penalty", label: "감점 (마이너스 가능)", icon: "⚠️" },
    ],
  },
};

export default function ScoreSheetModal({ isOpen, onClose, initialGameName }: ScoreSheetModalProps) {
  const { members, boardGames, records, updateRecord } = useStore();
  const { showAlert } = useAlertStore();
  const navigate = useNavigate();

  // 1. 초기 템플릿 키 결정
  const defaultTemplateKey = useMemo(() => {
    if (initialGameName) {
      if (initialGameName.includes("캐스캐디아")) return "cascadia";
      if (initialGameName.includes("오를레앙")) return "orleans";
      if (initialGameName.includes("윙스팬")) return "wingspan";
      if (initialGameName.includes("스플렌더")) return "splendor";
    }
    return "cascadia";
  }, [initialGameName]);

  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>(defaultTemplateKey);
  const [selectedGameId, setSelectedGameId] = useState<string>(() => {
    const matched = boardGames.find((g) => g.name.includes("캐스캐디아"));
    return matched?.id ?? (boardGames[0]?.id || "");
  });

  // 참여 멤버 (기본 4인)
  const [participatingMemberIds, setParticipatingMemberIds] = useState<string[]>(
    members.map((m) => m.id)
  );

  // 자유 템플릿 커스텀 항목 리스트
  const [customItems, setCustomItems] = useState<ScoreItemDef[]>([
    { id: "c1", label: "라운드 1", icon: "1️⃣" },
    { id: "c2", label: "라운드 2", icon: "2️⃣" },
    { id: "c3", label: "보너스 점수", icon: "⭐" },
  ]);

  // 점수 입력 데이터 구조: memberId -> itemId -> number
  const [scores, setScores] = useState<Record<string, Record<string, number>>>({});

  // 모임 기록 연결 선택 (저장 시 반영할 gathering_record)
  const sortedRecords = useMemo(
    () => [...records].sort((a, b) => b.date.localeCompare(a.date)),
    [records]
  );
  const [targetRecordId, setTargetRecordId] = useState<string>(sortedRecords[0]?.id || "");
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const currentTemplate = TEMPLATES[selectedTemplateKey] || TEMPLATES.custom;
  const activeItems = selectedTemplateKey === "custom" ? customItems : currentTemplate.items;

  // ── 각 멤버별 총점 및 순위 계산 ──────────────────────────────────
  const playerTotals = participatingMemberIds.map((memberId) => {
    const memberScores = scores[memberId] || {};
    let total = 0;

    if (currentTemplate.customCompute) {
      total = currentTemplate.customCompute(memberScores);
    } else {
      activeItems.forEach((item) => {
        const val = memberScores[item.id] || 0;
        const multiplier = item.multiplier || 1;
        total += val * multiplier;
      });
    }

    const member = members.find((m) => m.id === memberId);
    return {
      memberId,
      name: member?.name || "",
      color: member?.color || "yellow",
      total,
    };
  });

  // 총점 내림차순 정렬 후 등수 산출
  const rankedResults = [...playerTotals].sort((a, b) => b.total - a.total);
  const ranksMap: Record<string, number> = {};
  rankedResults.forEach((p, idx) => {
    ranksMap[p.memberId] = idx + 1;
  });

  // 점수 입력 핸들러
  const handleScoreChange = (memberId: string, itemId: string, valueStr: string) => {
    const val = valueStr === "" ? 0 : Number(valueStr);
    setScores((prev) => ({
      ...prev,
      [memberId]: {
        ...(prev[memberId] || {}),
        [itemId]: isNaN(val) ? 0 : val,
      },
    }));
  };

  // 점수 초기화
  const handleResetScores = () => {
    setScores({});
    triggerHaptic(20);
  };

  // 멤버 참여 토글
  const toggleMember = (id: string) => {
    setParticipatingMemberIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev;
        return prev.filter((mId) => mId !== id);
      }
      return [...prev, id];
    });
  };

  // 커스텀 항목 추가
  const addCustomItem = () => {
    const newId = `c_${Date.now()}`;
    setCustomItems((prev) => [
      ...prev,
      { id: newId, label: `항목 ${prev.length + 1}`, icon: "📝" },
    ]);
  };

  // 커스텀 항목 삭제
  const removeCustomItem = (id: string) => {
    setCustomItems((prev) => prev.filter((item) => item.id !== id));
  };

  // ── 점수 계산 결과를 모임 기록에 저장 ──────────────────────────────
  const handleSaveToRecord = async () => {
    if (!targetRecordId) {
      showAlert("결과를 추가할 모임 날짜를 선택해 주세요.", "error");
      return;
    }

    const targetRec = records.find((r) => r.id === targetRecordId);
    if (!targetRec) return;

    // 게임 ID 매칭
    let matchedGame = boardGames.find((g) => g.id === selectedGameId);
    if (!matchedGame) {
      matchedGame = boardGames.find((g) => g.name.includes(currentTemplate.name)) || boardGames[0];
    }
    const finalGameId = matchedGame?.id;
    if (!finalGameId) {
      showAlert("라이브러리에 등록된 게임을 선택해 주세요.", "error");
      return;
    }

    setIsSaving(true);
    try {
      const results: PlayerResult[] = playerTotals.map((p) => ({
        memberId: p.memberId,
        score: p.total,
        rank: ranksMap[p.memberId],
        isWinner: ranksMap[p.memberId] === 1,
      }));

      const newLog: PlayLog = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        gameId: finalGameId,
        resultType: "ranked",
        durationMinutes: 45,
        participatingMembers: participatingMemberIds,
        results,
      };

      await updateRecord({
        ...targetRec,
        playLogs: [...targetRec.playLogs, newLog],
      });

      playSuccessChime();
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
      });

      showAlert(`'${matchedGame.name}' 점수와 순위가 모임 기록에 등록되었습니다!`, "success");
      onClose();
      navigate(`/archive?id=${targetRecordId}`);
    } catch (err: any) {
      showAlert(`저장 실패: ${err.message}`, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="scoresheet-overlay" onClick={onClose}>
      <div className="scoresheet-modal" onClick={(e) => e.stopPropagation()}>
        {/* 모달 헤더 */}
        <div className="scoresheet-header">
          <div className="header-title-box">
            <span className="header-badge">🧮 LIVE SCORE SHEET</span>
            <h2 className="header-title">실시간 종이 점수 계산기</h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="닫기">
            <X size={22} />
          </button>
        </div>

        <div className="scoresheet-body">
          {/* 1. 게임 템플릿 선택 탭 */}
          <div className="template-selector">
            <span className="section-label">게임 점수지 선택</span>
            <div className="template-chips">
              {Object.entries(TEMPLATES).map(([key, tpl]) => (
                <button
                  key={key}
                  className={`template-chip ${selectedTemplateKey === key ? "active" : ""}`}
                  onClick={() => {
                    setSelectedTemplateKey(key);
                    const matched = boardGames.find((g) => g.name.includes(tpl.name));
                    if (matched) setSelectedGameId(matched.id);
                  }}
                >
                  {tpl.name}
                </button>
              ))}
            </div>
            <p className="template-desc">{currentTemplate.description}</p>
          </div>

          {/* 2. 참여자 토글 칩 */}
          <div className="members-selector">
            <span className="section-label">참여 멤버 선택</span>
            <div className="members-chips">
              {members.map((m) => {
                const isSelected = participatingMemberIds.includes(m.id);
                return (
                  <button
                    key={m.id}
                    className={`member-chip ${isSelected ? "selected" : ""}`}
                    data-color={m.color}
                    onClick={() => toggleMember(m.id)}
                  >
                    <span className="dot" data-color={m.color} />
                    <span>{m.name}</span>
                    {isSelected && <Check size={12} className="check-icon" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. 종이 점수표 테이블 */}
          <div className="sheet-table-wrapper">
            <table className="sheet-table">
              <thead>
                <tr>
                  <th className="th-item">점수 항목</th>
                  {participatingMemberIds.map((mId) => {
                    const m = members.find((x) => x.id === mId);
                    const rank = ranksMap[mId];
                    return (
                      <th key={mId} className="th-player" data-color={m?.color}>
                        <div className="player-th-inner">
                          <span className="p-name">{m?.name}</span>
                          <span className={`p-rank-badge rank-${rank}`}>
                            {rank === 1 ? "👑 1위" : `${rank}위`}
                          </span>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {activeItems.map((item) => (
                  <tr key={item.id}>
                    <td className="td-label">
                      <div className="item-label-wrap" title={item.hint}>
                        <span className="item-icon">{item.icon}</span>
                        <div className="label-text">
                          <span className="name">{item.label}</span>
                          {item.hint && <span className="hint">{item.hint}</span>}
                        </div>
                        {selectedTemplateKey === "custom" && activeItems.length > 1 && (
                          <button
                            type="button"
                            className="btn-del-item"
                            onClick={() => removeCustomItem(item.id)}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                    {participatingMemberIds.map((mId) => (
                      <td key={mId} className="td-input">
                        <input
                          type="number"
                          inputMode="numeric"
                          className="score-cell-input"
                          placeholder="0"
                          value={scores[mId]?.[item.id] ?? ""}
                          onChange={(e) => handleScoreChange(mId, item.id, e.target.value)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}

                {/* 커스텀 템플릿일 때 항목 추가 버튼 행 */}
                {selectedTemplateKey === "custom" && (
                  <tr>
                    <td colSpan={participatingMemberIds.length + 1} className="td-add-custom">
                      <button type="button" className="add-item-btn" onClick={addCustomItem}>
                        <Plus size={14} /> 항목 추가하기
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>

              {/* 총점 요약 푸터 행 */}
              <tfoot>
                <tr className="tfoot-total-row">
                  <td className="td-total-label">
                    <span className="sum-title">🏆 최종 총점</span>
                  </td>
                  {participatingMemberIds.map((mId) => {
                    const totalObj = playerTotals.find((p) => p.memberId === mId);
                    const is1st = ranksMap[mId] === 1;
                    return (
                      <td key={mId} className={`td-total-val ${is1st ? "is-winner" : ""}`}>
                        <span className="total-number">{totalObj?.total || 0}점</span>
                      </td>
                    );
                  })}
                </tr>
              </tfoot>
            </table>
          </div>

          {/* 4. 초기화 & 기록 연동 영역 */}
          <div className="sheet-save-section">
            <div className="save-options-header">
              <span className="section-label">기록 추가 대상 모임 선택</span>
              <button className="reset-btn" onClick={handleResetScores} type="button">
                <RefreshCw size={13} /> 초기화
              </button>
            </div>

            <div className="save-controls">
              <select
                className="target-record-select"
                value={targetRecordId}
                onChange={(e) => setTargetRecordId(e.target.value)}
              >
                {sortedRecords.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.emoji || "🎲"} {r.date} 모임 (기존 {r.playLogs.length}게임)
                  </option>
                ))}
              </select>

              <button
                type="button"
                className="btn-commit-record"
                onClick={handleSaveToRecord}
                disabled={isSaving}
              >
                <Sparkles size={16} />
                <span>{isSaving ? "저장 중..." : "이 점수로 모임 기록에 추가"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
