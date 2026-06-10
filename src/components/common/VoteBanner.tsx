import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { useStore } from "../../store/useStore";
import { supabase } from "../../utils/supabase";
import "../../pages/Vote/Vote.scss";

export default function VoteBanner() {
  const { members } = useStore();
  const [status, setStatus] = useState<{
    active: boolean;
    date: string;
    votedCount: number;
    totalMembers: number;
    allVoted: boolean;
  } | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];

        const { data: votes } = await supabase
          .from("game_votes")
          .select("*")
          .gte("meeting_date", today)
          .order("created_at", { ascending: false })
          .limit(1);

        if (!votes || votes.length === 0) {
          setStatus({ active: false, date: "", votedCount: 0, totalMembers: members.length, allVoted: false });
          return;
        }

        const vote = votes[0];
        const { data: entries } = await supabase
          .from("game_vote_entries")
          .select("member_id")
          .eq("vote_id", vote.id);

        const votedIds = new Set((entries || []).map((e: any) => e.member_id));
        const votedCount = votedIds.size;

        setStatus({
          active: true,
          date: vote.meeting_date,
          votedCount,
          totalMembers: members.length,
          allVoted: votedCount >= members.length,
        });
      } catch (err) {
        console.error("VoteBanner fetch error:", err);
      }
    };

    if (members.length > 0) fetchStatus();
  }, [members]);

  if (!status) return null;

  return (
    <Link to="/vote" className="vote-banner">
      <span className="banner-icon">
        {!status.active ? "📅" : status.allVoted ? "🎉" : "🗳️"}
      </span>
      <div className="banner-content">
        <div className="banner-title">
          {!status.active
            ? "다음 모임을 설정해보세요"
            : status.allVoted
              ? "투표 완료! 결과를 확인하세요"
              : "투표 진행 중!"}
        </div>
        <div className="banner-sub">
          {!status.active
            ? "게임 사전 투표로 모임을 준비하세요"
            : status.allVoted
              ? `${status.date.replace(/-/g, ".")} 모임`
              : `${status.votedCount}/${status.totalMembers}명 완료 · ${status.date.replace(/-/g, ".")}`}
        </div>
      </div>
      <ChevronRight size={18} className="banner-arrow" />
    </Link>
  );
}
