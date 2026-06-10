import { useState, useEffect, useMemo } from "react";
import { Check } from "lucide-react";
import { useStore } from "../../store/useStore";
import { useAuthStore } from "../../store/useAuthStore";
import { supabase } from "../../utils/supabase";
import { getKoreanName } from "../../utils/getKoreanName";
import { GAME_GENRES } from "../../types";
import "./Vote.scss";

interface VoteSession {
  id: string;
  meeting_date: string;
  created_by: string;
  created_at: string;
}

interface VoteEntry {
  id: string;
  vote_id: string;
  member_id: string;
  game_id: string;
}

export default function Vote() {
  const { members, boardGames } = useStore();
  const { user } = useAuthStore();

  const [activeVote, setActiveVote] = useState<VoteSession | null>(null);
  const [voteEntries, setVoteEntries] = useState<VoteEntry[]>([]);
  const [meetingDate, setMeetingDate] = useState("");
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const [genreFilter, setGenreFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUsername = user?.email?.split("@")[0] || "";
  const currentKoreanName = getKoreanName(currentUsername);
  const currentMember = members.find((m) => m.name === currentKoreanName);

  // ── 활성 투표 세션 조회 ──
  useEffect(() => {
    fetchActiveVote();
  }, []);

  const fetchActiveVote = async () => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split("T")[0];

      const { data: votes, error } = await supabase
        .from("game_votes")
        .select("*")
        .gte("meeting_date", today)
        .order("created_at", { ascending: false })
        .limit(1);

      if (error) throw error;

      if (votes && votes.length > 0) {
        setActiveVote(votes[0]);

        const { data: entries, error: entriesError } = await supabase
          .from("game_vote_entries")
          .select("*")
          .eq("vote_id", votes[0].id);

        if (entriesError) throw entriesError;
        setVoteEntries(entries || []);
      } else {
        setActiveVote(null);
        setVoteEntries([]);
      }
    } catch (err) {
      console.error("Failed to fetch votes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── 투표 세션 생성 ──
  const handleCreateVote = async () => {
    if (!meetingDate || !currentMember) return;

    try {
      const voteId = `vote-${Date.now()}`;
      const { error } = await supabase.from("game_votes").insert({
        id: voteId,
        meeting_date: meetingDate,
        created_by: currentMember.id,
      });

      if (error) throw error;
      await fetchActiveVote();
    } catch (err) {
      console.error("Failed to create vote:", err);
    }
  };

  // ── 게임 선택 토글 ──
  const toggleGame = (gameId: string) => {
    setSelectedGames((prev) => {
      if (prev.includes(gameId)) return prev.filter((id) => id !== gameId);
      if (prev.length >= 5) return prev;
      return [...prev, gameId];
    });
  };

  // ── 투표 제출 ──
  const handleSubmitVote = async () => {
    if (!activeVote || !currentMember || selectedGames.length === 0) return;

    setIsSubmitting(true);
    try {
      const entries = selectedGames.map((gameId) => ({
        id: `ve-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        vote_id: activeVote.id,
        member_id: currentMember.id,
        game_id: gameId,
      }));

      const { error } = await supabase
        .from("game_vote_entries")
        .insert(entries);
      if (error) throw error;

      setSelectedGames([]);
      await fetchActiveVote();
    } catch (err) {
      console.error("Failed to submit vote:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── 계산 값들 ──
  const hasVoted = currentMember
    ? voteEntries.some((e) => e.member_id === currentMember.id)
    : false;

  const votedMemberIds = [...new Set(voteEntries.map((e) => e.member_id))];
  const allVoted = votedMemberIds.length === members.length;

  const voteResults = useMemo(() => {
    if (!allVoted) return [];

    const countMap: Record<string, number> = {};
    const voterMap: Record<string, string[]> = {};

    voteEntries.forEach((entry) => {
      countMap[entry.game_id] = (countMap[entry.game_id] || 0) + 1;
      if (!voterMap[entry.game_id]) voterMap[entry.game_id] = [];
      const member = members.find((m) => m.id === entry.member_id);
      if (member) voterMap[entry.game_id].push(member.name);
    });

    return Object.entries(countMap)
      .map(([gameId, count]) => ({
        gameId,
        count,
        voters: voterMap[gameId] || [],
        game: boardGames.find((g) => g.id === gameId),
      }))
      .sort((a, b) => b.count - a.count);
  }, [allVoted, voteEntries, members, boardGames]);

  // ── 장르 필터 ──
  const genres = useMemo(() => {
    const genreSet = new Set(boardGames.map((g) => g.genre));
    return ["all", ...GAME_GENRES.filter((g) => genreSet.has(g))];
  }, [boardGames]);

  const filteredGames = useMemo(() => {
    const filtered =
      genreFilter === "all"
        ? boardGames
        : boardGames.filter((g) => g.genre === genreFilter);
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, [boardGames, genreFilter]);

  // ── D-Day ──
  const dDay = activeVote
    ? Math.ceil(
        (new Date(activeVote.meeting_date).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null;

  if (isLoading) {
    return (
      <div className="vote-container">
        <p className="vote-loading">투표 정보를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="vote-container">
      {/* ── 투표 없을 때: 날짜 설정 ── */}
      {!activeVote && (
        <div className="vote-setup">
          <div className="setup-icon">🗳️</div>
          <h2>다음 모임 투표</h2>
          <p className="setup-desc">
            다음 모임 날짜를 설정하고
            <br />
            하고 싶은 게임에 투표해보세요!
          </p>
          <div className="setup-form">
            <input
              type="date"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
            />
            <button
              className="setup-btn"
              onClick={handleCreateVote}
              disabled={!meetingDate}
            >
              투표 열기
            </button>
          </div>
        </div>
      )}

      {/* ── 투표 진행 중 ── */}
      {activeVote && (
        <>
          {/* 헤더 */}
          <div className="vote-header">
            <div className="vote-header-info">
              <span className="vote-dday">
                D{dDay !== null && dDay > 0 ? `-${dDay}` : "-Day"}
              </span>
              <div className="vote-date-info">
                <h2>다음 모임 투표</h2>
                <span className="vote-date">
                  {activeVote.meeting_date.replace(/-/g, ".")}
                </span>
              </div>
            </div>
          </div>

          {/* 멤버 투표 상태 */}
          <div className="vote-status">
            {members.map((m) => {
              const voted = votedMemberIds.includes(m.id);
              return (
                <div
                  key={m.id}
                  className={`status-chip ${voted ? "voted" : ""}`}
                >
                  <span className="status-name">{m.name}</span>
                  {voted ? (
                    <Check size={14} />
                  ) : (
                    <span className="status-pending">⏳</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* 게임 선택 UI */}
          {!hasVoted && !allVoted && (
            <div className="vote-selection">
              <div className="selection-header">
                <h3>하고 싶은 게임을 골라주세요</h3>
                <span className="selection-count">
                  {selectedGames.length}/5
                </span>
              </div>

              <div className="genre-filter">
                {genres.map((genre) => (
                  <button
                    key={genre}
                    className={`genre-chip ${genreFilter === genre ? "active" : ""}`}
                    onClick={() => setGenreFilter(genre)}
                  >
                    {genre === "all" ? "전체" : genre}
                  </button>
                ))}
              </div>

              <div className="game-list">
                {filteredGames.map((game) => {
                  const isSelected = selectedGames.includes(game.id);
                  const isDisabled = !isSelected && selectedGames.length >= 5;
                  return (
                    <button
                      key={game.id}
                      className={`game-chip ${isSelected ? "selected" : ""} ${isDisabled ? "disabled" : ""}`}
                      onClick={() => !isDisabled && toggleGame(game.id)}
                      disabled={isDisabled}
                    >
                      <span className="game-chip-name">{game.name}</span>
                      {isSelected && (
                        <Check size={16} className="check-icon" />
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                className="submit-vote-btn"
                onClick={handleSubmitVote}
                disabled={selectedGames.length === 0 || isSubmitting}
              >
                {isSubmitting
                  ? "제출 중..."
                  : `투표 완료 (${selectedGames.length}개 선택)`}
              </button>
            </div>
          )}

          {/* 투표 완료 대기 */}
          {hasVoted && !allVoted && (
            <div className="vote-waiting">
              <div className="waiting-icon">⏳</div>
              <p>투표를 완료했습니다!</p>
              <p className="waiting-sub">
                다른 멤버들의 투표를 기다리는 중...
              </p>
            </div>
          )}

          {/* 투표 결과 */}
          {allVoted && (
            <div className="vote-results">
              <h3 className="results-title">🎉 투표 결과</h3>
              <div className="results-list">
                {voteResults.map((result, idx) => (
                  <div key={result.gameId} className="result-item">
                    <span className="result-rank">
                      {idx === 0
                        ? "🥇"
                        : idx === 1
                          ? "🥈"
                          : idx === 2
                            ? "🥉"
                            : `${idx + 1}`}
                    </span>
                    <div className="result-info">
                      <span className="result-game">
                        {result.game?.name || "알 수 없는 게임"}
                      </span>
                      <span className="result-voters">
                        {result.voters.join(", ")}
                      </span>
                    </div>
                    <span className="result-count">{result.count}표</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
