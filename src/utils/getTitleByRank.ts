// src/utils/getTitleByRank.ts

interface RankTitle {
  emoji: string;
  title: string;
}

const RANK_TITLES: Record<number, RankTitle> = {
  1: { emoji: "👑", title: "이 판 제가 먹겠습니다" },
  2: { emoji: "😤", title: "2등도 내 탓이오" },
  3: { emoji: "🫠", title: "나 요즘 좀 힘들어" },
  4: { emoji: "🤙", title: "져도 돼 어차피 추억" },
};

export function getTitleByRank(rank: number): RankTitle {
  return RANK_TITLES[rank] ?? { emoji: "🎲", title: "순위 집계 중" };
}
