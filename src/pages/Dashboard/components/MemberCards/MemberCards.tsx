// src/pages/Dashboard/components/MemberCards/MemberCards.tsx

import { useNavigate } from "react-router-dom";
import { Member } from "../../../../types";
import { getTitleByRank } from "../../../../utils/getTitleByRank";
import "./MemberCards.scss";

interface MemberCardsProps {
  members: Member[];
}

const MEMBER_EMOJI: Record<string, string> = {
  red: "🔴",
  blue: "🔵",
  green: "🟢",
  yellow: "🟡",
};

export default function MemberCards({ members }: MemberCardsProps) {
  const navigate = useNavigate();

  // 승률 기준 내림차순 정렬 → rank 부여
  const ranked = [...members]
    .sort((a, b) => b.winRate - a.winRate)
    .map((member, index) => ({
      ...member,
      rank: index + 1,
      ...getTitleByRank(index + 1),
    }));

  return (
    <div className="member-cards">
      {ranked.map((member) => (
        <button
          key={member.id}
          className="member-card"
          data-color={member.color}
          onClick={() => navigate(`/mypage/${member.color}`)}
        >
          <span className="member-card__emoji">
            {MEMBER_EMOJI[member.color]}
          </span>
          <span className="member-card__name">{member.name}</span>
          <span className="member-card__title">
            {member.emoji} {member.title}
          </span>
          <span className="member-card__rate">{member.winRate}% 승률</span>
        </button>
      ))}
    </div>
  );
}
