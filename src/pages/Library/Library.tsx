// src/pages/Library/Library.tsx

import { useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X, Users, Clock, Image as ImageIcon, SlidersHorizontal, Trash2, MessageSquare, User, Pencil, Dices } from "lucide-react";
import { useStore } from "../../store/useStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useAlertStore } from "../../store/useAlertStore";
import { BoardGame } from "../../types";
import GameRegistrationModal from "../../components/common/GameRegistrationModal";
import GamePickerModal from "../../components/common/GamePickerModal";
import "./Library.scss";

const ITEMS_PER_PAGE = 20;

// 인원 표시 헬퍼: min===max면 단일 표시
function formatPlayers(min: number, max: number) {
  return min === max ? `${min}인` : `${min}~${max}인`;
}

// 플레이타임 표시 헬퍼: 120분 이상이면 '이상' 추가
function formatTime(minutes: number) {
  return minutes >= 120 ? `${minutes}분 이상` : `${minutes}분`;
}

const getKoreanName = (username: string) => {
  switch (username.toLowerCase()) {
    case "hansol": return "한솔";
    case "yoonhyuk": return "윤혁";
    case "gayoung": return "가영";
    case "youngjun": return "영준";
    default: return "";
  }
};

export default function Library() {
  const { boardGames, members, records, deleteGame } = useStore();
  const { user } = useAuthStore();
  const { showAlert } = useAlertStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGame, setSelectedGame] = useState<BoardGame | null>(null);
  const [editingGame, setEditingGame] = useState<BoardGame | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false); // 상세 필터 토글 상태
  const [isPickerModalOpen, setIsPickerModalOpen] = useState(false);

  const currentUsername = user?.email?.split("@")[0] || "";
  const currentKoreanName = getKoreanName(currentUsername);
  const currentUser = members.find(m => m.name === currentKoreanName);

  // URL에서 쿼리 파라미터 읽어오기
  const [searchParams] = useSearchParams();
  const ownerFilterUrl = searchParams.get("owner");

  const [filters, setFilters] = useState({
    players: "any",
    time: "any",
    genre: "any",
    owner: ownerFilterUrl || "any",
  });

  // 1. 검색어 및 필터링 (useMemo로 연산 최적화)
  const filteredGames = useMemo(() => {
    return boardGames.filter((game) => {
      if (searchTerm && !game.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;

      if (filters.owner !== "any") {
        const owner = members.find(m => m.color === filters.owner);
        if (owner && game.ownerId !== owner.id) return false;
      }

      if (filters.players !== "any") {
        const pCount = parseInt(filters.players, 10);
        if (pCount < game.minPlayers || pCount > game.maxPlayers) return false;
      }

      if (filters.time !== "any") {
        if (filters.time === "short" && game.playTimeMinutes > 30) return false;
        if (filters.time === "medium" && (game.playTimeMinutes <= 30 || game.playTimeMinutes > 60)) return false;
        if (filters.time === "long" && game.playTimeMinutes <= 60) return false;
      }

      if (filters.genre !== "any" && !game.genre.includes(filters.genre)) return false;

      return true;
    });
  }, [searchTerm, filters, boardGames, members]);

  // 2. 전체 페이지 수 계산
  const totalPages = Math.ceil(filteredGames.length / ITEMS_PER_PAGE) || 1;

  // 3. 현재 페이지 데이터 자르기
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentGames = filteredGames.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const handleDeleteGame = async (gameId: string) => {
    // 이 게임이 플레이 기록에 사용되고 있는지 먼저 확인
    const isInUse = records.some((rec) =>
      rec.playLogs.some((log) => log.gameId === gameId)
    );

    if (isInUse) {
      showAlert(
        "이 게임은 플레이 기록에 사용 중이라 삭제할 수 없습니다. 관련 기록을 먼저 삭제해 주세요.",
        "error"
      );
      return;
    }

    if (window.confirm("정말 이 게임을 라이브러리에서 삭제하시겠습니까?")) {
      try {
        await deleteGame(gameId);
        showAlert("게임이 삭제되었습니다.", "success");
        setSelectedGame(null);
      } catch (err: any) {
        showAlert(`삭제 실패: ${err.message}`, "error");
      }
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="library-container">
      <div className="page-title-row">
        <h1 className="page-title">보드게임 책장</h1>
        <button className="roulette-btn" onClick={() => setIsPickerModalOpen(true)} title="오늘 뭐 할까?">
          <Dices size={24} />
        </button>
      </div>

      {/* 검색창 및 필터 토글 버튼 영역 */}
      <div className="search-filter-header">
        <div className="search-bar">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            placeholder="어떤 게임을 찾으시나요?"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
        <button
          className={`filter-toggle-btn ${isFilterOpen ? "active" : ""}`}
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          aria-label="상세 필터 토글"
        >
          <SlidersHorizontal size={20} />
        </button>
      </div>

      {/* 다중 필터 옵션 영역 (isFilterOpen에 따라 노출) */}
      <div className={`filter-section ${isFilterOpen ? "open" : ""}`}>
        <select value={filters.players} onChange={(e) => { setFilters({ ...filters, players: e.target.value }); setCurrentPage(1); }}>
          <option value="any">인원 (전체)</option>
          <option value="2">2인</option>
          <option value="3">3인</option>
          <option value="4">4인</option>
          <option value="5">5인</option>
          <option value="6">6인 이상</option>
        </select>

        <select value={filters.time} onChange={(e) => { setFilters({ ...filters, time: e.target.value }); setCurrentPage(1); }}>
          <option value="any">시간 (전체)</option>
          <option value="short">30분 이하</option>
          <option value="medium">30~60분</option>
          <option value="long">60분 초과</option>
        </select>

        <select value={filters.genre} onChange={(e) => { setFilters({ ...filters, genre: e.target.value }); setCurrentPage(1); }}>
          <option value="any">장르 (전체)</option>
          <option value="엔진/덱빌딩">엔진/덱빌딩</option>
          <option value="마피아/블러핑">마피아/블러핑</option>
          <option value="전략/수싸움">전략/수싸움</option>
          <option value="협력">협력</option>
          <option value="파티">파티</option>
        </select>

        <select value={filters.owner} onChange={(e) => { setFilters({ ...filters, owner: e.target.value }); setCurrentPage(1); }}>
          <option value="any">소유자 (전체)</option>
          {members.map(m => (
            <option key={m.id} value={m.color}>{m.name} 님</option>
          ))}
        </select>
      </div>

      {/* 보드게임 리스트 */}
      <div className="game-list">
        {/* currentGames 배열에 데이터가 있을 때만 map을 돌리고, 없으면 empty-state를 보여주기! */}
        {currentGames.length > 0 ? (
          currentGames.map((game) => {
            const owner = members.find((m) => m.id === game.ownerId);
            return (
              <div
                key={game.id}
                className="game-card"
                onClick={() => setSelectedGame(game)}
              >
                {/* 썸네일 영역 */}
                <div className="game-thumbnail">
                  {game.imageUrl ? (
                    <img src={game.imageUrl} alt={game.name} />
                  ) : (
                    <div className="no-image">
                      <ImageIcon size={20} />
                    </div>
                  )}
                </div>

                <div className="game-info">
                  <h3 className="game-name">{game.name}</h3>
                  <div className="game-meta-inline">
                    <span className="meta-item">
                      <Users size={12} /> {formatPlayers(game.minPlayers, game.maxPlayers)}
                    </span>
                    <span className="meta-item">
                      <Clock size={12} /> {formatTime(game.playTimeMinutes)}
                    </span>
                  </div>
                </div>

                <div className="game-owner">
                  <span className="owner-badge" data-color={owner?.color}>
                    {owner?.name}
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">검색 결과가 없습니다.</div>
        )}
      </div>

      {/* 페이지네이션 버튼들 */}
      {totalPages > 1 && (
        <div className="pagination">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              className={`page-btn ${currentPage === page ? "active" : ""}`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
        </div>
      )}

      {/* 상세 정보 모달창 (선택된 게임이 있을 때만 렌더링) */}
      {selectedGame && (
        <div className="modal-overlay" onClick={() => setSelectedGame(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedGame.name}</h2>
              <button className="close-btn" onClick={() => setSelectedGame(null)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              {selectedGame.imageUrl && (
                <div className="modal-thumbnail">
                  <img src={selectedGame.imageUrl} alt={selectedGame.name} />
                </div>
              )}

              <div className="modal-info-list">
                <div className="modal-genre-badge">
                  <span className="badge">{selectedGame.genre}</span>
                  {currentUser && currentUser.id === selectedGame.ownerId && (
                    <div className="modal-genre-actions">
                      <button
                        className="modal-icon-btn"
                        onClick={() => { setEditingGame(selectedGame); setSelectedGame(null); }}
                        title="수정"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="modal-icon-btn delete"
                        onClick={() => handleDeleteGame(selectedGame.id)}
                        title="삭제"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="detail-item">
                  <Users size={20} />
                  <span>
                    {formatPlayers(selectedGame.minPlayers, selectedGame.maxPlayers)} 추천
                  </span>
                </div>
                <div className="detail-item">
                  <Clock size={20} />
                  <span>약 {formatTime(selectedGame.playTimeMinutes)} 소요</span>
                </div>
                <div className="detail-item">
                  <User size={20} />
                  <span>소유자: </span>
                  <span className="owner-name">
                    {members.find((m) => m.id === selectedGame.ownerId)?.name || "알 수 없음"}
                  </span>
                </div>

                {selectedGame.description && (
                  <div className="detail-item description-item">
                    <MessageSquare size={20} />
                    <span>{selectedGame.description}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 게임 수정 모달 */}
      {editingGame && (
        <GameRegistrationModal
          isOpen={true}
          onClose={() => setEditingGame(null)}
          editGame={editingGame}
        />
      )}

      {/* 오늘 뭐 할까? 모달 */}
      <GamePickerModal
        isOpen={isPickerModalOpen}
        onClose={() => setIsPickerModalOpen(false)}
      />
    </div>
  );
}
