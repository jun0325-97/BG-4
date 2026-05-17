// src/pages/Library/Library.tsx

import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, X, Users, Clock, Image as ImageIcon } from "lucide-react";
import { BOARD_GAMES, MEMBERS } from "../../mocks/dummyData";
import { BoardGame } from "../../types";
import "./Library.scss";

const ITEMS_PER_PAGE = 2;

export default function Library() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedGame, setSelectedGame] = useState<BoardGame | null>(null);
  
  // 💡 URL에서 쿼리 파라미터 읽어오기 (예: ?owner=red)
  const [searchParams] = useSearchParams();
  const ownerFilter = searchParams.get("owner");

  // 1. 검색어 및 URL 필터에 맞게 데이터 필터링
  const filteredGames = BOARD_GAMES.filter((game) => {
    const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // owner 쿼리가 있다면 해당 멤버가 가진 게임만, 없으면 모두 통과
    const matchesOwner = ownerFilter ? game.ownerId === MEMBERS.find(m => m.color === ownerFilter)?.id : true;
    
    return matchesSearch && matchesOwner;
  });

  // 2. 전체 페이지 수 계산 (예: 4개 / 2 = 2페이지)
  const totalPages = Math.ceil(filteredGames.length / ITEMS_PER_PAGE) || 1;

  // 3. 현재 페이지에 보여줄 데이터만 싹둑 자르기 (slice)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentGames = filteredGames.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  // 검색어를 칠 때마다 무조건 1페이지로 돌아가게 하는 함수
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="library-container">
      <h1 className="page-title">보드게임 책장</h1>

      {/* 검색창 영역 */}
      <div className="search-bar">
        <Search className="search-icon" size={20} />
        <input
          type="text"
          placeholder="어떤 게임을 찾으시나요?"
          value={searchTerm}
          onChange={handleSearch}
        />
      </div>

      {/* 현재 필터 상태 표시 */}
      {ownerFilter && (
        <div className="filter-badge">
          <span>{MEMBERS.find(m => m.color === ownerFilter)?.name} 님의 책장 구경중 👀</span>
        </div>
      )}

      {/* 보드게임 리스트 */}
      <div className="game-list">
        {/* currentGames 배열에 데이터가 있을 때만 map을 돌리고, 없으면 empty-state를 보여주기! */}
        {currentGames.length > 0 ? (
          currentGames.map((game) => {
            const owner = MEMBERS.find((m) => m.id === game.ownerId);
            return (
              <div 
                key={game.id} 
                className="game-card" 
                onClick={() => setSelectedGame(game)} // 💡 클릭 이벤트 연결!
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
                  <span className="game-genre">{game.genre}</span>
                  <div className="game-meta-inline">
                    <span className="meta-item">
                      <Users size={12} /> {game.minPlayers}-{game.maxPlayers}인
                    </span>
                    <span className="meta-item">
                      <Clock size={12} /> {game.playTimeMinutes}분
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
          <div className="empty-state">검색 결과가 없습니다 🥲</div>
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
              {/* <span className="badge">{selectedGame.genre}</span> */}
              <button className="close-btn" onClick={() => setSelectedGame(null)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="detail-item">
                <Users size={20} />
                <span>
                  {selectedGame.minPlayers} ~ {selectedGame.maxPlayers} 명 추천
                </span>
              </div>
              <div className="detail-item">
                <Clock size={20} />
                <span>약 {selectedGame.playTimeMinutes} 분 소요</span>
              </div>
              <div className="detail-item">
                <span>📦 소유자: </span>
                <strong>
                  {MEMBERS.find((m) => m.id === selectedGame.ownerId)?.name || "알 수 없음"}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
