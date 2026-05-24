// src/utils/getTitleByRank.ts

interface RankTitle {
  emoji: string;
  title: string;
}

const RANK_TITLES: Record<number, RankTitle> = {
  1: { emoji: "👑", title: "보겜의 왕" },
  2: { emoji: "🥈", title: "은빛 추격자" },
  3: { emoji: "🥉", title: "평화주의자" },
  4: { emoji: "🌱", title: "수호 요정" },
};

export function getTitleByRank(rank: number): RankTitle {
  return RANK_TITLES[rank] ?? { emoji: "🎲", title: "순위 집계 중" };
}
