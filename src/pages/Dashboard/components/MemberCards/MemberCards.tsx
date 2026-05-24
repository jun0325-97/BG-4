// src/pages/Dashboard/components/MemberCards/MemberCards.tsx

import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { useStore } from "../../../../store/useStore";
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
  const { boardGames, records } = useStore();

  // 1. 게임 최다 소유자 찾기
  const gameCounts = boardGames.reduce((acc, game) => {
    if (game.ownerId) {
      acc[game.ownerId] = (acc[game.ownerId] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
  const maxGames = Math.max(...Object.values(gameCounts), 0);
  const topOwners = maxGames > 0
    ? Object.entries(gameCounts).filter(([_, count]) => count === maxGames).map(([id]) => id)
    : [];

  // 승률 기준 내림차순 정렬 → rank 및 여러 라벨 부여
  const ranked = [...members]
    .sort((a, b) => b.winRate - a.winRate)
    .map((member, index) => {
      const rankInfo = getTitleByRank(index + 1);

      const labels: { text: string; type: "rank" | "special" }[] = [];

      // 랭크 라벨
      labels.push({
        text: `${rankInfo.emoji} ${rankInfo.title}`,
        type: "rank",
      });

      // 스페셜 라벨 부여
      if (topOwners.includes(member.id)) {
        labels.push({ text: "💰 게임 대주주", type: "rank" });
      }

      return {
        ...member,
        rank: index + 1,
        labels,
      };
    });

  return (
    <div className="member-cards">
      {ranked.map((member) => (
        <button
          key={member.id}
          className="member-card"
          data-color={member.color}
          onClick={() => navigate(`/mypage/${member.color}`)}
        >
          {/* 오른쪽 위 대각선 화살표 */}
          <ArrowUpRight className="member-card__arrow" strokeWidth={2.5} />

          {/* 보드게임 미플(Meeple)처럼 이미지 렌더링 */}
          {/* <div className="member-card__meeple" data-color={member.color}>
            <img
              src={CHARACTER_IMAGES[member.color]}
              alt={member.name}
              className="meeple-img"
            />
          </div> */}
          <span className="member-card__name">{member.name}</span>

          {/* 여러 개의 라벨을 표시할 수 있는 영역 */}
          <div className="member-card__labels">
            {member.labels.map((label, idx) => (
              <span
                key={idx}
                className={`member-card__label member-card__label--${label.type}`}
              >
                {label.text}
              </span>
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}
