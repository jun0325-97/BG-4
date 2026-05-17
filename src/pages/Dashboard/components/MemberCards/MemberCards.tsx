// src/pages/Dashboard/components/MemberCards/MemberCards.tsx

import { useNavigate } from "react-router-dom";
import { Member } from "../../../../types";
import { getTitleByRank } from "../../../../utils/getTitleByRank";
import "./MemberCards.scss";

import imgRed from "../../../../assets/images/img-red-1.png";
import imgBlue from "../../../../assets/images/img-blue-1.png";
import imgGreen from "../../../../assets/images/img-green-1.png";
import imgYellow from "../../../../assets/images/img-yellow-1.png";

const CHARACTER_IMAGES: Record<string, string> = {
  red: imgRed,
  blue: imgBlue,
  green: imgGreen,
  yellow: imgYellow,
};

interface MemberCardsProps {
  members: Member[];
}

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
          {/* 보드게임 미플(Meeple)처럼 이미지 렌더링 */}
          <div className="member-card__meeple" data-color={member.color}>
            <img
              src={CHARACTER_IMAGES[member.color]}
              alt={member.name}
              className="meeple-img"
            />
          </div>
          <span className="member-card__name">{member.name}</span>
          
          {/* 🌟 기존 승률 텍스트 자리에 칭호를 뱃지 형태로 예쁘게 삽입! */}
          <span className="member-card__rate">
            {member.emoji} {member.title}
          </span>
        </button>
      ))}
    </div>
  );
}
